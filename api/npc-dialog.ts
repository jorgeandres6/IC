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

const DEFAULT_GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

const normalizeDialog = (text: string): string => {
  const compact = text.replace(/\s+/g, ' ').trim();
  if (!compact) {
    return 'Soy consultor politico: analizo el contexto, los actores y la opinion publica para construir estrategias, mensajes y escenarios de decision. Mi trabajo es ayudarte a anticipar riesgos, definir objetivos realistas y elegir la mejor forma de comunicar cada paso.';
  }
  return compact.slice(0, 900);
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
    const heroName = typeof body?.heroName === 'string' ? body.heroName.trim() : 'heroe';

    const prompt = [
      'Actua como consultor politico en un videojuego.',
      `Habla directamente al ${heroName}.`,
      'Explica brevemente cual es el rol de un consultor politico.',
      'Responde en espanol claro con una explicacion util y concreta.',
      'Entrega entre 4 y 6 oraciones cortas, con ejemplos simples del juego.',
      'Longitud objetivo: entre 350 y 700 caracteres.',
      'No uses markdown, ni listas, ni comillas.'
    ].join('\n');

    const configuredModel = process.env.GEMINI_MODEL?.trim();
    const modelsToTry = configuredModel
      ? [configuredModel, ...DEFAULT_GEMINI_MODELS.filter((model) => model !== configuredModel)]
      : DEFAULT_GEMINI_MODELS;

    let parsed: any = {};
    let lastStatus = 500;
    let lastMessage = 'Gemini request failed.';

    for (const model of modelsToTry) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

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
            maxOutputTokens: 320
          }
        })
      });

      const rawText = await geminiResponse.text();
      parsed = safeParseJson(rawText, {});

      if (geminiResponse.ok) {
        lastStatus = 200;
        lastMessage = '';
        break;
      }

      const apiError = parsed?.error;
      const apiMessage = typeof apiError?.message === 'string'
        ? apiError.message
        : (rawText || 'Gemini request failed.');

      lastStatus = geminiResponse.status;
      lastMessage = apiMessage;

      const isModelUnavailable = geminiResponse.status === 404 && /model|no longer available|not found/i.test(apiMessage);
      if (isModelUnavailable) {
        continue;
      }

      json(res, geminiResponse.status, { message: apiMessage });
      return;
    }

    if (lastStatus !== 200) {
      json(res, lastStatus, { message: lastMessage });
      return;
    }

    const reply =
      parsed?.candidates?.[0]?.content?.parts?.[0]?.text ||
      parsed?.candidates?.[0]?.output ||
      '';

    json(res, 200, {
      message: normalizeDialog(reply)
    });
  } catch (error: any) {
    console.error('npc-dialog error:', error);
    json(res, 500, { message: error?.message || 'Unexpected server error.' });
  }
}