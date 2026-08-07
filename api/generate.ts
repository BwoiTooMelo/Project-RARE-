import type { VercelRequest, VercelResponse } from '@vercel/node';

// Server-side only — never prefix this with VITE_, or it leaks into the browser bundle.
const FAL_KEY = process.env.FAL_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!FAL_KEY) {
    return res.status(500).json({ error: 'Server not configured: missing FAL_KEY' });
  }

  const { prompt, aspectRatio = '9:16', duration = 5 } = req.body || {};

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid prompt' });
  }

  try {
    const submitRes = await fetch('https://queue.fal.run/fal-ai/pika/v2.2/text-to-video', {
      method: 'POST',
      headers: {
        Authorization: `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        aspect_ratio: aspectRatio,
        duration,
      }),
    });

    const data = await submitRes.json();

    if (!submitRes.ok) {
      return res.status(submitRes.status).json({ error: data });
    }

    // fal.ai returns a request_id + status_url you poll for the result
    return res.status(200).json({
      requestId: data.request_id,
      statusUrl: data.status_url,
      responseUrl: data.response_url,
    });
  } catch (err) {
    return res.status(502).json({ error: 'Failed to reach video generation service' });
  }
}
