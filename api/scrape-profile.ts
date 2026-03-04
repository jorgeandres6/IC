type SocialPlatform = 'instagram' | 'facebook' | 'tiktok' | 'x';

const SCRAPE_CREATORS_PROFILE_ENDPOINTS: Record<SocialPlatform, string> = {
  instagram: 'https://api.scrapecreators.com/v1/instagram/profile',
  facebook: 'https://api.scrapecreators.com/v1/facebook/profile',
  tiktok: 'https://api.scrapecreators.com/v1/tiktok/profile',
  x: 'https://api.scrapecreators.com/v1/x/profile'
};

const isSocialPlatform = (value: unknown): value is SocialPlatform => {
  return typeof value === 'string' && value in SCRAPE_CREATORS_PROFILE_ENDPOINTS;
};

const json = (res: any, statusCode: number, payload: unknown) => {
  res.status(statusCode).setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(payload));
};

const safeParseJson = (value: string, fallback: unknown) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
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
    const body = typeof req.body === 'string' ? safeParseJson(req.body, {}) : (req.body || {});
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
      ? safeParseJson(rawText || '{}', { message: rawText })
      : { message: rawText };

    if (!response.ok) {
      json(res, response.status, payload);
      return;
    }

    json(res, 200, payload);
  } catch (error: any) {
    console.error('scrape-profile error:', error);
    json(res, 500, { message: error?.message || 'Unexpected server error.' });
  }
}
