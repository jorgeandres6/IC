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

const truncate = (value: string, maxLength: number) => {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength)}\n...[truncado]`;
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

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    json(res, 500, { message: 'Missing GEMINI_API_KEY in server environment.' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? safeParseJson(req.body, {}) : (req.body || {});
    const profile = body?.profile;

    if (!profile || typeof profile !== 'object') {
      json(res, 400, { message: 'Profile payload is required.' });
      return;
    }

    const normalizedProfile = {
      platform: profile.platform,
      username: profile.username,
      fullName: profile.fullName,
      biography: profile.biography,
      followers: profile.followers,
      following: profile.following,
      posts: profile.posts,
      likes: profile.likes,
      verified: profile.verified,
      profileUrl: profile.profileUrl
    };

    const rawProfile = truncate(JSON.stringify(profile.raw || {}, null, 2), 12000);

    const prompt = [
      'Eres un analista de perfiles sociales para usuarios no técnicos.',
      'Analiza el siguiente perfil y responde en español simple y accionable.',
      'Estructura exacta requerida (con encabezados):',
      '1) Resumen del perfil (2-3 líneas).',
      '2) Fortalezas detectadas (máximo 5 bullets).',
      '3) Riesgos o alertas (máximo 5 bullets).',
      '4) Recomendaciones prácticas (máximo 6 bullets).',
      '5) Tipo de actor probable y nivel de influencia (Bajo/Medio/Alto) con breve justificación.',
      'No inventes datos. Si algo falta, dilo explícitamente.',
      '',
      `Perfil normalizado:\n${JSON.stringify(normalizedProfile, null, 2)}`,
      '',
      `Datos completos extraídos:\n${rawProfile}`
    ].join('\n');

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 900
        }
      })
    });

    const rawText = await geminiResponse.text();
    const parsed = safeParseJson(rawText, {});

    if (!geminiResponse.ok) {
      json(res, geminiResponse.status, {
        message: typeof parsed === 'object' && parsed && 'error' in (parsed as Record<string, unknown>)
          ? JSON.stringify((parsed as any).error)
          : rawText || 'Gemini request failed.'
      });
      return;
    }

    const analysis =
      parsed?.candidates?.[0]?.content?.parts?.[0]?.text ||
      parsed?.candidates?.[0]?.output ||
      'No se pudo generar el análisis con Gemini.';

    json(res, 200, { analysis });
  } catch (error: any) {
    console.error('profile-analysis error:', error);
    json(res, 500, { message: error?.message || 'Unexpected server error.' });
  }
}
