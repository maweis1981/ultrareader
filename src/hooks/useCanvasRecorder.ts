import { useRef, useState, useCallback } from 'react';
import type { Token } from '../types';
import { splitByORP } from '../core/orp';

export type VideoOrientation = 'landscape' | 'portrait';

interface CanvasRecorderConfig {
  orientation: VideoOrientation;
  fps: number;
  backgroundColor: string;
  textColor: string;
  pivotColor: string;
  fontFamily: string;
  showWatermark: boolean;
}

// Video dimensions based on orientation
const DIMENSIONS = {
  landscape: { width: 1280, height: 720 },  // 16:9
  portrait: { width: 720, height: 1280 },   // 9:16 (for TikTok/Reels/Shorts)
};

const DEFAULT_CONFIG: CanvasRecorderConfig = {
  orientation: 'landscape',
  fps: 30,
  backgroundColor: '#0a0a0a',
  textColor: '#ffffff',
  pivotColor: '#ff0000',
  fontFamily: 'Courier New, monospace',
  showWatermark: true,
};

interface RecordingContext {
  articleTitle?: string;
  currentIndex: number;
  totalTokens: number;
}

interface UseCanvasRecorderReturn {
  isRecording: boolean;
  recordedBlob: Blob | null;
  recordedMimeType: string | null;
  orientation: VideoOrientation;
  setOrientation: (orientation: VideoOrientation) => void;
  startRecording: (context?: Partial<RecordingContext>) => void;
  stopRecording: () => Promise<void>;
  recordFrame: (token: Token | null, wpm: number, progress: number, context?: Partial<RecordingContext>) => void;
  clearRecording: () => void;
}

// Get the best supported mime type, preferring MP4
function getBestMimeType(): string | null {
  // Safari only supports MP4, Chrome/Firefox support WebM
  // Prefer MP4 for best compatibility
  const mimeTypes = [
    'video/mp4;codecs=avc1.42E01E', // H.264 Baseline (Safari, Chrome 120+)
    'video/mp4;codecs=avc1',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];

  for (const mimeType of mimeTypes) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }

  return null; // No supported format
}

export function useCanvasRecorder(
  config: Partial<CanvasRecorderConfig> = {}
): UseCanvasRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedMimeType, setRecordedMimeType] = useState<string | null>(null);
  const [orientation, setOrientation] = useState<VideoOrientation>(config.orientation || 'landscape');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const configRef = useRef<CanvasRecorderConfig>({ ...DEFAULT_CONFIG, ...config });
  const contextRef = useRef<RecordingContext>({ currentIndex: 0, totalTokens: 0 });

  // Initialize canvas with current orientation
  const initCanvas = useCallback(() => {
    const dims = DIMENSIONS[orientation];
    const canvas = document.createElement('canvas');
    canvas.width = dims.width;
    canvas.height = dims.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvasRef.current = canvas;
    ctxRef.current = ctx;
    return canvas;
  }, [orientation]);

  // Draw a frame
  const drawFrame = useCallback((token: Token | null, wpm: number, progress: number) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const cfg = configRef.current;
    const context = contextRef.current;
    if (!canvas || !ctx) return;

    const isPortrait = canvas.height > canvas.width;
    const scale = isPortrait ? 0.8 : 1;
    const fontSize = Math.round((isPortrait ? 56 : 72) * scale);
    const smallFontSize = Math.round((isPortrait ? 18 : 24) * scale);
    const tinyFontSize = Math.round((isPortrait ? 14 : 16) * scale);

    // Clear background
    ctx.fillStyle = cfg.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Padding
    const padding = isPortrait ? 40 : 60;
    const contentWidth = canvas.width - padding * 2;

    // === TOP SECTION ===
    // Draw watermark/logo
    if (cfg.showWatermark) {
      ctx.font = `bold ${smallFontSize}px ${cfg.fontFamily}`;
      ctx.fillStyle = 'rgba(100, 108, 255, 0.8)';
      ctx.textAlign = 'left';
      ctx.fillText('UltraReader', padding, padding);
    }

    // Draw article title (if available)
    if (context.articleTitle) {
      ctx.font = `${tinyFontSize}px ${cfg.fontFamily}`;
      ctx.fillStyle = '#a78bfa';
      ctx.textAlign = 'center';
      const titleY = isPortrait ? 100 : 60;
      // Truncate title if too long
      let title = context.articleTitle;
      const maxWidth = contentWidth - 100;
      while (ctx.measureText(title).width > maxWidth && title.length > 10) {
        title = title.slice(0, -4) + '...';
      }
      ctx.fillText(title, canvas.width / 2, titleY);
    }

    // === CENTER SECTION - Main word display ===
    const centerY = canvas.height / 2;
    const centerX = canvas.width / 2;

    if (token) {
      if (token.type === 'punct') {
        // Draw punctuation centered
        ctx.font = `bold ${fontSize}px ${cfg.fontFamily}`;
        ctx.fillStyle = '#888888';
        ctx.textAlign = 'center';
        ctx.fillText(token.value === '\n\n' ? '¶' : token.value, centerX, centerY);
      } else {
        // Draw word with ORP
        const { left, pivot, right } = splitByORP(token.value);
        ctx.font = `bold ${fontSize}px ${cfg.fontFamily}`;

        // Measure text widths
        const leftWidth = ctx.measureText(left).width;
        const pivotWidth = ctx.measureText(pivot).width;

        // Calculate positions (pivot at center)
        const pivotX = centerX - pivotWidth / 2;
        const leftX = pivotX - leftWidth;
        const rightX = pivotX + pivotWidth;

        // Draw left part
        ctx.fillStyle = cfg.textColor;
        ctx.textAlign = 'left';
        ctx.fillText(left, leftX, centerY);

        // Draw pivot (red)
        ctx.fillStyle = cfg.pivotColor;
        ctx.fillText(pivot, pivotX, centerY);

        // Draw right part
        ctx.fillStyle = cfg.textColor;
        ctx.fillText(right, rightX, centerY);

        // Draw pivot indicator (triangle above)
        ctx.fillStyle = cfg.pivotColor;
        ctx.beginPath();
        const triangleX = pivotX + pivotWidth / 2;
        const triangleY = centerY - fontSize - 10;
        ctx.moveTo(triangleX, triangleY + 15);
        ctx.lineTo(triangleX - 8, triangleY);
        ctx.lineTo(triangleX + 8, triangleY);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      // Draw "Ready to read"
      ctx.font = `${Math.round(fontSize * 0.5)}px ${cfg.fontFamily}`;
      ctx.fillStyle = '#444444';
      ctx.textAlign = 'center';
      ctx.fillText('Ready to read', centerX, centerY);
    }

    // === BOTTOM SECTION - HUD ===
    const bottomY = canvas.height - padding;
    const hudY = bottomY - 60;

    // Progress bar
    const progressBarHeight = 8;
    const progressBarY = hudY;
    ctx.fillStyle = '#333333';
    ctx.fillRect(padding, progressBarY, contentWidth, progressBarHeight);
    ctx.fillStyle = '#646cff';
    ctx.fillRect(padding, progressBarY, contentWidth * progress, progressBarHeight);

    // Stats row below progress bar
    const statsY = progressBarY + 35;
    ctx.font = `bold ${smallFontSize}px ${cfg.fontFamily}`;

    // WPM (center)
    ctx.fillStyle = '#646cff';
    ctx.textAlign = 'center';
    ctx.fillText(`${wpm} WPM`, centerX, statsY);

    // Word count (left)
    if (context.totalTokens > 0) {
      ctx.fillStyle = '#666666';
      ctx.textAlign = 'left';
      ctx.fillText(`${context.currentIndex + 1} / ${context.totalTokens}`, padding, statsY);
    }

    // Progress percentage (right)
    ctx.fillStyle = '#666666';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(progress * 100)}%`, canvas.width - padding, statsY);
  }, []);

  // Start recording
  const startRecording = useCallback((context?: Partial<RecordingContext>) => {
    // Check if MediaRecorder is supported
    if (typeof MediaRecorder === 'undefined') {
      console.error('MediaRecorder not supported in this browser');
      return;
    }

    // Update context
    if (context) {
      contextRef.current = { ...contextRef.current, ...context };
    }

    const canvas = initCanvas();
    if (!canvas) return;

    chunksRef.current = [];
    setRecordedBlob(null);
    setRecordedMimeType(null);

    // Create stream from canvas
    const stream = canvas.captureStream(configRef.current.fps);

    // Get best supported mime type (prefer MP4 for Safari compatibility)
    const mimeType = getBestMimeType();
    if (!mimeType) {
      console.error('No supported video format found');
      return;
    }
    console.log('Recording with mime type:', mimeType, 'orientation:', orientation);

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 5000000, // 5 Mbps for good quality
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(100); // Collect data every 100ms
    setIsRecording(true);
  }, [initCanvas, orientation]);

  // Record a frame
  const recordFrame = useCallback((
    token: Token | null,
    wpm: number,
    progress: number,
    context?: Partial<RecordingContext>
  ) => {
    if (!isRecording) return;

    // Update context if provided
    if (context) {
      contextRef.current = { ...contextRef.current, ...context };
    }

    drawFrame(token, wpm, progress);
  }, [isRecording, drawFrame]);

  // Stop recording
  const stopRecording = useCallback(async () => {
    return new Promise<void>((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;
      if (!mediaRecorder || mediaRecorder.state !== 'recording') {
        resolve();
        return;
      }

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType;
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
        setRecordedMimeType(mimeType);
        setIsRecording(false);

        // Cleanup
        canvasRef.current = null;
        ctxRef.current = null;
        mediaRecorderRef.current = null;

        resolve();
      };

      mediaRecorder.stop();
    });
  }, []);

  // Clear recording
  const clearRecording = useCallback(() => {
    setRecordedBlob(null);
    setRecordedMimeType(null);
    chunksRef.current = [];
    contextRef.current = { currentIndex: 0, totalTokens: 0 };
  }, []);

  return {
    isRecording,
    recordedBlob,
    recordedMimeType,
    orientation,
    setOrientation,
    startRecording,
    stopRecording,
    recordFrame,
    clearRecording,
  };
}
