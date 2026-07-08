/**
 * Project RARE - Download Engine
 * Encodes canvas + audio timeline into a real MP4 file using WebCodecs + mp4-muxer.
 * Falls back to MediaRecorder/WebM on browsers without WebCodecs support (e.g. Firefox).
 */

import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import type { SubscriptionPlan } from '../context/AuthContext';

export type ResolutionTier = '720p' | '1080p' | '4k';

interface ResolutionSpec {
  width: number;
  height: number;
  videoBitrate: number; // bits per second
  label: string;
}

// Base specs assume a 16:9 source canvas; actual output is scaled to preserve
// the canvas's real aspect ratio (see resolveDimensions below).
const RESOLUTION_SPECS: Record<ResolutionTier, ResolutionSpec> = {
  '720p': { width: 1280, height: 720, videoBitrate: 5_000_000, label: '720p HD' },
  '1080p': { width: 1920, height: 1080, videoBitrate: 8_000_000, label: '1080p Full HD' },
  '4k': { width: 3840, height: 2160, videoBitrate: 20_000_000, label: '4K Ultra HD' },
};

// Which resolutions each subscription plan can export at.
const PLAN_RESOLUTIONS: Record<SubscriptionPlan, ResolutionTier[]> = {
  free: ['720p'],
  pro: ['720p', '1080p'],
  premium: ['720p', '1080p', '4k'],
};

export function getAvailableResolutions(plan: SubscriptionPlan): ResolutionTier[] {
  return PLAN_RESOLUTIONS[plan];
}

export function isResolutionAllowed(plan: SubscriptionPlan, resolution: ResolutionTier): boolean {
  return PLAN_RESOLUTIONS[plan].includes(resolution);
}

export function getResolutionLabel(resolution: ResolutionTier): string {
  return RESOLUTION_SPECS[resolution].label;
}

export interface MultiplexerOptions {
  canvas: HTMLCanvasElement;
  audioBuffer: AudioBuffer | null;
  duration: number; // in seconds
  fps?: number;
  resolution: ResolutionTier;
  plan: SubscriptionPlan;
}

export interface MultiplexerResult {
  blob: Blob;
  extension: 'mp4' | 'webm';
  mimeType: string;
}

function resolveDimensions(canvas: HTMLCanvasElement, tier: ResolutionTier) {
  const spec = RESOLUTION_SPECS[tier];
  const sourceAspect = canvas.width / canvas.height;
  const targetAspect = spec.width / spec.height;

  let width = spec.width;
  let height = spec.height;

  // Fit the target box while preserving the source canvas's actual aspect ratio.
  if (sourceAspect > targetAspect) {
    height = Math.round(spec.width / sourceAspect);
  } else if (sourceAspect < targetAspect) {
    width = Math.round(spec.height * sourceAspect);
  }

  // WebCodecs encoders generally require even dimensions.
  width = width % 2 === 0 ? width : width + 1;
  height = height % 2 === 0 ? height : height + 1;

  return { width, height };
}

function supportsWebCodecsEncoding(): boolean {
  return (
    typeof window !== 'undefined' &&
    'VideoEncoder' in window &&
    'VideoFrame' in window &&
    'AudioEncoder' in window
  );
}

/**
 * Primary path: real MP4 via WebCodecs + mp4-muxer.
 * Captures frames from the canvas at a fixed fps over `duration`, encodes them
 * with VideoEncoder (H.264), encodes the audio buffer with AudioEncoder (AAC),
 * and muxes both into a standards-compliant MP4 container.
 */
async function encodeMp4({
  canvas,
  audioBuffer,
  duration,
  fps = 30,
  resolution,
}: MultiplexerOptions): Promise<Blob> {
  const { width, height } = resolveDimensions(canvas, resolution);
  const spec = RESOLUTION_SPECS[resolution];

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: {
      codec: 'avc',
      width,
      height,
    },
    audio: audioBuffer
      ? {
          codec: 'aac',
          numberOfChannels: audioBuffer.numberOfChannels,
          sampleRate: audioBuffer.sampleRate,
        }
      : undefined,
    fastStart: 'in-memory',
  });

  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => console.error('VideoEncoder error:', e),
  });

  videoEncoder.configure({
    codec: 'avc1.640034', // H.264 High Profile, broadly compatible incl. mobile
    width,
    height,
    bitrate: spec.videoBitrate,
    framerate: fps,
  });

  let audioEncoder: AudioEncoder | null = null;
  if (audioBuffer) {
    audioEncoder = new AudioEncoder({
      output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
      error: (e) => console.error('AudioEncoder error:', e),
    });
    audioEncoder.configure({
      codec: 'mp4a.40.2', // AAC-LC
      numberOfChannels: audioBuffer.numberOfChannels,
      sampleRate: audioBuffer.sampleRate,
      bitrate: 128_000,
    });
  }

  // Render an offscreen canvas at the target resolution so we always encode
  // at the exact dimensions configured above, regardless of the on-screen
  // canvas's actual pixel size.
  const scratch = document.createElement('canvas');
  scratch.width = width;
  scratch.height = height;
  const scratchCtx = scratch.getContext('2d');
  if (!scratchCtx) {
    throw new Error('Could not acquire 2D context for offscreen render target.');
  }

  const totalFrames = Math.ceil(duration * fps);
  const frameDurationUs = 1_000_000 / fps;

  for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
    scratchCtx.drawImage(canvas, 0, 0, width, height);

    const timestampUs = Math.round(frameIndex * frameDurationUs);
    const frame = new VideoFrame(scratch, {
      timestamp: timestampUs,
      duration: Math.round(frameDurationUs),
    });

    // Keyframe roughly every 2 seconds for reasonable seek behavior.
    const keyFrame = frameIndex % (fps * 2) === 0;
    videoEncoder.encode(frame, { keyFrame });
    frame.close();

    // Yield to the event loop periodically so the canvas's own animation
    // (driven by rAF/timers elsewhere in the app) actually advances between
    // frame captures.
    await new Promise((r) => setTimeout(r, 1000 / fps));
  }

  await videoEncoder.flush();
  videoEncoder.close();

  if (audioEncoder && audioBuffer) {
    encodeAudioBufferInto(audioEncoder, audioBuffer, duration);
    await audioEncoder.flush();
    audioEncoder.close();
  }

  muxer.finalize();
  const { buffer } = muxer.target as ArrayBufferTarget;
  return new Blob([buffer], { type: 'video/mp4' });
}

function encodeAudioBufferInto(encoder: AudioEncoder, audioBuffer: AudioBuffer, duration: number) {
  const sampleRate = audioBuffer.sampleRate;
  const channels = audioBuffer.numberOfChannels;
  const totalSamplesNeeded = Math.floor(sampleRate * duration);
  const chunkSize = 1024;

  // Interleave channel data, looping the source buffer if the requested
  // duration is longer than the available audio (matches old loop behavior).
  const interleaved = new Float32Array(totalSamplesNeeded * channels);
  for (let i = 0; i < totalSamplesNeeded; i++) {
    const sourceIndex = i % audioBuffer.length;
    for (let ch = 0; ch < channels; ch++) {
      interleaved[i * channels + ch] = audioBuffer.getChannelData(ch)[sourceIndex];
    }
  }

  for (let offset = 0; offset < totalSamplesNeeded; offset += chunkSize) {
    const length = Math.min(chunkSize, totalSamplesNeeded - offset);
    const chunkData = interleaved.subarray(offset * channels, (offset + length) * channels);

    const audioData = new AudioData({
      format: 'f32',
      sampleRate,
      numberOfFrames: length,
      numberOfChannels: channels,
      timestamp: Math.round((offset / sampleRate) * 1_000_000),
      data: chunkData,
    });

    encoder.encode(audioData);
    audioData.close();
  }
}

/**
 * Fallback path for browsers without WebCodecs (e.g. Firefox as of this writing).
 * Produces WebM via MediaRecorder. Honestly labeled — never forced into a .mp4
 * extension, since MediaRecorder cannot actually produce a valid MP4 container.
 */
async function encodeWebmFallback({
  canvas,
  audioBuffer,
  duration,
  fps = 30,
}: MultiplexerOptions): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const canvasStream = canvas.captureStream(fps);
      const tracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];

      let audioContext: AudioContext | null = null;
      let sourceNode: AudioBufferSourceNode | null = null;

      if (audioBuffer) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioDestination = audioContext.createMediaStreamDestination();
        sourceNode = audioContext.createBufferSource();
        sourceNode.buffer = audioBuffer;
        sourceNode.loop = true;
        sourceNode.connect(audioDestination);
        const audioTracks = audioDestination.stream.getAudioTracks();
        if (audioTracks.length > 0) tracks.push(audioTracks[0]);
      }

      const combinedStream = new MediaStream(tracks);

      const types = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp9',
        'video/webm',
      ];
      let selectedType = '';
      for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
          selectedType = type;
          break;
        }
      }
      if (!selectedType) {
        reject(new Error('No supported video recording format found in this browser.'));
        return;
      }

      const mediaRecorder = new MediaRecorder(combinedStream, { mimeType: selectedType });
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        if (sourceNode && audioContext) {
          try {
            sourceNode.stop();
            sourceNode.disconnect();
            audioContext.close();
          } catch (err) {
            console.error('Error cleaning up audio context:', err);
          }
        }
        resolve(new Blob(chunks, { type: 'video/webm' }));
      };

      if (sourceNode) sourceNode.start(0);
      mediaRecorder.start();

      setTimeout(() => {
        if (mediaRecorder.state !== 'inactive') mediaRecorder.stop();
      }, duration * 1000);
    } catch (error) {
      reject(error);
    }
  });
}

export async function multiplexMediaStream(options: MultiplexerOptions): Promise<MultiplexerResult> {
  if (!isResolutionAllowed(options.plan, options.resolution)) {
    throw new Error(
      `The "${getResolutionLabel(options.resolution)}" export is not available on your current plan.`
    );
  }

  if (supportsWebCodecsEncoding()) {
    const blob = await encodeMp4(options);
    return { blob, extension: 'mp4', mimeType: 'video/mp4' };
  }

  const blob = await encodeWebmFallback(options);
  return { blob, extension: 'webm', mimeType: 'video/webm' };
}

export function triggerFileDownload(result: MultiplexerResult, baseFilename: string = 'RARE_Render') {
  const filename = `${baseFilename}.${result.extension}`;
  const url = window.URL.createObjectURL(result.blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}
