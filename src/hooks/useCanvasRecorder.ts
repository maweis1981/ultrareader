import { useRef, useState, useCallback } from 'react';
import type { Token } from '../types';
import { splitByORP } from '../core/orp';

interface CanvasRecorderConfig {
  width: number;
  height: number;
  fps: number;
  backgroundColor: string;
  textColor: string;
  pivotColor: string;
  fontFamily: string;
  fontSize: number;
  showWatermark: boolean;
}

const DEFAULT_CONFIG: CanvasRecorderConfig = {
  width: 1280,
  height: 720,
  fps: 30,
  backgroundColor: '#0a0a0a',
  textColor: '#ffffff',
  pivotColor: '#ff0000',
  fontFamily: 'Courier New, monospace',
  fontSize: 72,
  showWatermark: true,
};

interface UseCanvasRecorderReturn {
  isRecording: boolean;
  recordedBlob: Blob | null;
  startRecording: () => void;
  stopRecording: () => Promise<void>;
  recordFrame: (token: Token | null, wpm: number, progress: number) => void;
  clearRecording: () => void;
}

export function useCanvasRecorder(
  config: Partial<CanvasRecorderConfig> = {}
): UseCanvasRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const configRef = useRef<CanvasRecorderConfig>({ ...DEFAULT_CONFIG, ...config });

  // Initialize canvas
  const initCanvas = useCallback(() => {
    const cfg = configRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = cfg.width;
    canvas.height = cfg.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvasRef.current = canvas;
    ctxRef.current = ctx;
    return canvas;
  }, []);

  // Draw a frame
  const drawFrame = useCallback((token: Token | null, wpm: number, progress: number) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const cfg = configRef.current;
    if (!canvas || !ctx) return;

    // Clear background
    ctx.fillStyle = cfg.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw progress bar
    const progressBarHeight = 8;
    const progressBarY = canvas.height - 60;
    ctx.fillStyle = '#333333';
    ctx.fillRect(100, progressBarY, canvas.width - 200, progressBarHeight);
    ctx.fillStyle = '#646cff';
    ctx.fillRect(100, progressBarY, (canvas.width - 200) * progress, progressBarHeight);

    // Draw WPM
    ctx.font = `bold 24px ${cfg.fontFamily}`;
    ctx.fillStyle = '#646cff';
    ctx.textAlign = 'center';
    ctx.fillText(`${wpm} WPM`, canvas.width / 2, progressBarY + 40);

    // Draw word
    if (token) {
      const centerY = canvas.height / 2;
      const centerX = canvas.width / 2;

      if (token.type === 'punct') {
        // Draw punctuation centered
        ctx.font = `bold ${cfg.fontSize}px ${cfg.fontFamily}`;
        ctx.fillStyle = '#888888';
        ctx.textAlign = 'center';
        ctx.fillText(token.value === '\n\n' ? '¶' : token.value, centerX, centerY);
      } else {
        // Draw word with ORP
        const { left, pivot, right } = splitByORP(token.value);
        ctx.font = `bold ${cfg.fontSize}px ${cfg.fontFamily}`;

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
        const triangleY = centerY - cfg.fontSize - 10;
        ctx.moveTo(triangleX, triangleY + 15);
        ctx.lineTo(triangleX - 8, triangleY);
        ctx.lineTo(triangleX + 8, triangleY);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      // Draw "Ready to read"
      ctx.font = `32px ${cfg.fontFamily}`;
      ctx.fillStyle = '#444444';
      ctx.textAlign = 'center';
      ctx.fillText('Ready to read', canvas.width / 2, canvas.height / 2);
    }

    // Draw watermark
    if (cfg.showWatermark) {
      ctx.font = `bold 20px ${cfg.fontFamily}`;
      ctx.fillStyle = 'rgba(100, 108, 255, 0.5)';
      ctx.textAlign = 'right';
      ctx.fillText('UltraReader', canvas.width - 30, 40);
    }
  }, []);

  // Start recording
  const startRecording = useCallback(() => {
    const canvas = initCanvas();
    if (!canvas) return;

    chunksRef.current = [];
    setRecordedBlob(null);

    // Create stream from canvas
    const stream = canvas.captureStream(configRef.current.fps);

    // Create MediaRecorder
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';

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
  }, [initCanvas]);

  // Record a frame
  const recordFrame = useCallback((token: Token | null, wpm: number, progress: number) => {
    if (!isRecording) return;
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
    chunksRef.current = [];
  }, []);

  return {
    isRecording,
    recordedBlob,
    startRecording,
    stopRecording,
    recordFrame,
    clearRecording,
  };
}
