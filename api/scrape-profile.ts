import { SCRAPE_CREATORS_PROFILE_ENDPOINTS } from '../services/endpoints';

type SocialPlatform = keyof typeof SCRAPE_CREATORS_PROFILE_ENDPOINTS;

const isSocialPlatform = (value: unknown): value is SocialPlatform => {
  return typeof value === 'string' && value in SCRAPE_CREATORS_PROFILE_ENDPOINTS;
};

const json = (res: any, statusCode: number, payload: unknown) => {
  res.status(statusCode).setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(payload));
};

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    json(res, 405, { message: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.SCRAPE_CREATORS_API_KEY;
  if (!apiKey) {
    json(res, 500, { message: 'Missing SCRAPE_CREATORS_API_KEY in server environment.' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const platform = body?.platform;
    const profile = typeof body?.profile === 'string' ? body.profile.trim() : '';

    if (!isSocialPlatform(platform)) {
      json(res, 400, { message: 'Invalid platform.' });
      return;
    }

    if (!profile) {
      json(res, 400, { message: 'Profile is required.' });
      return;
    }

    const endpoint = SCRAPE_CREATORS_PROFILE_ENDPOINTS[platform];
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        platform,
        profile
      })
    });

    const rawText = await response.text();
    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
      ? JSON.parse(rawText || '{}')
      : { message: rawText };

    if (!response.ok) {
      json(res, response.status, payload);
      return;
    }

    json(res, 200, payload);
  } catch (error: any) {
    json(res, 500, { message: error?.message || 'Unexpected server error.' });
  }
}
