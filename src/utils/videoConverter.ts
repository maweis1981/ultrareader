import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;
let loaded = false;

export async function loadFFmpeg(onProgress?: (progress: number) => void): Promise<void> {
  if (loaded) return;

  ffmpeg = new FFmpeg();

  ffmpeg.on('progress', ({ progress }) => {
    onProgress?.(progress);
  });

  // Load ffmpeg core from CDN
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  loaded = true;
}

export async function convertWebMToMP4(
  webmBlob: Blob,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  if (!ffmpeg || !loaded) {
    await loadFFmpeg();
  }

  if (!ffmpeg) {
    throw new Error('FFmpeg failed to load');
  }

  // Write input file
  await ffmpeg.writeFile('input.webm', await fetchFile(webmBlob));

  // Set up progress handler
  if (onProgress) {
    ffmpeg.on('progress', ({ progress }) => {
      onProgress(progress);
    });
  }

  // Convert to MP4 with H.264 codec for maximum compatibility
  await ffmpeg.exec([
    '-i', 'input.webm',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    '-pix_fmt', 'yuv420p', // Required for iOS compatibility
    '-movflags', '+faststart', // Enable streaming
    'output.mp4'
  ]);

  // Read output file
  const data = await ffmpeg.readFile('output.mp4');

  // Clean up
  await ffmpeg.deleteFile('input.webm');
  await ffmpeg.deleteFile('output.mp4');

  // Convert to Blob - handle both Uint8Array and string
  if (typeof data === 'string') {
    return new Blob([new TextEncoder().encode(data)], { type: 'video/mp4' });
  }
  // Create a new Uint8Array to ensure it's a proper ArrayBuffer
  const uint8Array = new Uint8Array(data);
  return new Blob([uint8Array], { type: 'video/mp4' });
}

export function isFFmpegLoaded(): boolean {
  return loaded;
}
