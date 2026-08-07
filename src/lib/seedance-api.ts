export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4';

export interface GenerateOptions {
  aspectRatio?: AspectRatio;
  duration?: number;
  prompt?: string;
}

export interface GenerateResponse {
  success: boolean;
  videoUrl?: string;
  message?: string;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Renamed from generateSeedanceVideo — this now calls a real backend, not a fake sandbox.
export async function generateAIVideo(
  prompt: string,
  options: Partial<GenerateOptions> = {}
): Promise<GenerateResponse> {
  const config = {
    prompt,
    aspectRatio: options.aspectRatio || '9:16',
    duration: options.duration || 5,
  };

  try {
    const submitRes = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });

    const submitData = await submitRes.json();

    if (!submitRes.ok) {
      return { success: false, message: submitData.error || 'Failed to start generation' };
    }

    const { statusUrl, responseUrl } = submitData;

    // Poll for completion — fal.ai renders typically take 30-90 seconds
    const maxAttempts = 40;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await sleep(3000);

      const statusRes = await fetch(
        `/api/generate-status?statusUrl=${encodeURIComponent(statusUrl)}&responseUrl=${encodeURIComponent(responseUrl)}`
      );
      const statusData = await statusRes.json();

      if (statusData.status === 'COMPLETED' && statusData.videoUrl) {
        return { success: true, videoUrl: statusData.videoUrl };
      }

      if (statusData.status === 'FAILED' || statusData.error) {
        return { success: false, message: 'Generation failed' };
      }
    }

    return { success: false, message: 'Generation timed out — try again' };
  } catch (error) {
    return { success: false, message: 'Could not reach the generation service' };
  }
}

// Backward-compatible alias so you don't have to hunt down every old import right away
export const generateSeedanceVideo = generateAIVideo;
