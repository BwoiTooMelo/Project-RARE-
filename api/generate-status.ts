import type { VercelRequest, VercelResponse } from '@vercel/node';

const FAL_KEY = process.env.FAL_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!FAL_KEY) {
    return res.status(500).json({ error: 'Server not configured: missing FAL_KEY' });
  }

  const statusUrl = req.query.statusUrl as string;
  const responseUrl = req.query.responseUrl as string;

  if (!statusUrl) {
    return res.status(400).json({ error: 'Missing statusUrl' });
  }

  try {
    const statusRes = await fetch(statusUrl, {
      headers: { Authorization: `Key ${FAL_KEY}` },
    });
    const statusData = await statusRes.json();

    if (statusData.status === 'COMPLETED' && responseUrl) {
      const resultRes = await fetch(responseUrl, {
        headers: { Authorization: `Key ${FAL_KEY}` },
      });
      const resultData = await resultRes.json();
      return res.status(200).json({
        status: 'COMPLETED',
        videoUrl: resultData.video?.url || resultData.video_url,
      });
    }

    return res.status(200).json({ status: statusData.status || 'IN_PROGRESS' });
  } catch (err) {
    return res.status(502).json({ error: 'Failed to check generation status' });
  }
}
