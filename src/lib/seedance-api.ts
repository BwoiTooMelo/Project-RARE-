export type SeedanceModel = 'seedance-2.0-t2v' | 'seedance-2.0-fast-i2v';

export interface SeedanceOptions {
  model: SeedanceModel;
  aspect_ratio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4';
  duration?: number;
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  prompt?: string;
  image_url?: string;
}

export interface SeedanceResponse {
  success: boolean;
  taskId?: string;
  status?: string;
  videoUrl?: string;
  sandbox?: boolean;
  message?: string;
}

const SEEDANCE_API_KEY = import.meta.env.VITE_SEEDANCE_API_KEY || '';
const isSandbox = !SEEDANCE_API_KEY;

export async function generateSeedanceVideo(
  prompt: string,
  options: Partial<SeedanceOptions> = {}
): Promise<SeedanceResponse> {
  const config: SeedanceOptions = {
    model: 'seedance-2.0-t2v',
    aspect_ratio: '9:16',
    duration: 5,
    quality: 'high',
    prompt,
    ...options,
  };

  if (isSandbox) {
    console.log('LOG [AI]: Seedance 2.0 native sandbox generation engaged.');
    return {
      success: true,
      taskId: `sandbox-${Date.now()}`,
      status: 'completed',
      sandbox: true,
      message: 'Sandbox simulation mode - prompt tokens passed to canvas engine.',
    };
  }

  try {
    const response = await fetch('https://api.seedance.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SEEDANCE_API_KEY}`,
      },
      body: JSON.stringify(config),
    });

    const data = await response.json();
    return {
      success: response.ok,
      taskId: data.task_id,
      status: data.status,
      videoUrl: data.video_url,
    };
  } catch (error) {
    console.warn('Seedance API call failed, falling back to sandbox mode');
    return {
      success: true,
      sandbox: true,
      message: 'API unavailable, using sandbox mode',
    };
  }
}

export function parsePromptKeywords(prompt: string): string[] {
  const keywords = [
    'palm tree',
    'beach',
    'ocean',
    'sea',
    'neon',
    'lo-fi',
    'lofi',
    'sunset',
    'sunrise',
    'night',
    'city',
    'forest',
    'mountain',
    'space',
    'galaxy',
    'rain',
    'snow',
    'fire',
    'water',
    'time',
    'retro',
    'cyberpunk',
    'anime',
    'nature',
    'abstract',
    'minimal',
    'dark',
    'light',
    'colorful',
    'gradient',
  ];

  const lowerPrompt = prompt.toLowerCase();
  return keywords.filter((kw) => lowerPrompt.includes(kw));
}

export function getThemeFromKeywords(keywords: string[]): {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  particles: 'mist' | 'stars' | 'rain' | 'none';
  style: 'atmospheric' | 'cinematic' | 'minimal' | 'dynamic';
} {
  if (keywords.includes('neon') || keywords.includes('cyberpunk')) {
    return {
      primaryColor: '#00ffff',
      secondaryColor: '#ff00ff',
      backgroundColor: '#0a0010',
      particles: 'mist',
      style: 'dynamic',
    };
  }
  if (keywords.includes('beach') || keywords.includes('ocean') || keywords.includes('sea')) {
    return {
      primaryColor: '#0077be',
      secondaryColor: '#00d4ff',
      backgroundColor: '#001122',
      particles: 'mist',
      style: 'atmospheric',
    };
  }
  if (keywords.includes('sunset') || keywords.includes('sunrise')) {
    return {
      primaryColor: '#ff6b35',
      secondaryColor: '#f7931e',
      backgroundColor: '#1a0505',
      particles: 'mist',
      style: 'cinematic',
    };
  }
  if (keywords.includes('night') || keywords.includes('dark')) {
    return {
      primaryColor: '#8b5cf6',
      secondaryColor: '#3b0764',
      backgroundColor: '#000000',
      particles: 'stars',
      style: 'cinematic',
    };
  }
  if (keywords.includes('lo-fi') || keywords.includes('lofi')) {
    return {
      primaryColor: '#a855f7',
      secondaryColor: '#ef4444',
      backgroundColor: '#0f0505',
      particles: 'mist',
      style: 'atmospheric',
    };
  }
  if (keywords.includes('space') || keywords.includes('galaxy')) {
    return {
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
      backgroundColor: '#030712',
      particles: 'stars',
      style: 'dynamic',
    };
  }
  return {
    primaryColor: '#00d4ff',
    secondaryColor: '#8b5cf6',
    backgroundColor: '#000000',
    particles: 'mist',
    style: 'minimal',
  };
}
