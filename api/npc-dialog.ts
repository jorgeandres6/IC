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
const MIN_DIALOG_WORDS = 50;
const MAX_DIALOG_WORDS = 100;

const extractGeminiText = (parsed: any): string => {
  const candidates = Array.isArray(parsed?.candidates) ? parsed.candidates : [];
  if (!candidates.length) {
    return typeof parsed?.candidates?.[0]?.output === 'string' ? parsed.candidates[0].output : '';
  }

  const first = candidates[0];
  const parts = Array.isArray(first?.content?.parts) ? first.content.parts : [];
  const joinedParts = parts
    .map((part: any) => (typeof part?.text === 'string' ? part.text : ''))
    .join(' ')
    .trim();

  if (joinedParts) {
    return joinedParts;
  }

  return typeof first?.output === 'string' ? first.output : '';
};

const normalizeDialog = (text: string): string => {
  const compact = text.replace(/\s+/g, ' ').trim();
  if (!compact) {
    return 'Como consultor politico, ayudo al heroe a entender el mapa de poder, las necesidades de la gente y los riesgos de cada decision. Diseno estrategias, mensajes y alianzas para cumplir objetivos sin perder legitimidad. Tambien preparo respuestas ante crisis y conflictos. En la practica, traduzco informacion compleja en acciones concretas para que el heroe decida mejor y comunique con claridad en cada etapa.';
  }
  return compact;
};

const countWords = (text: string): number => {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  return tokens.length;
};

const trimToMaxWords = (text: string, maxWords: number): string => {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  if (tokens.length <= maxWords) {
    return text.trim();
  }
  return tokens.slice(0, maxWords).join(' ').trim();
};

const requestGemini = async (geminiUrl: string, prompt: string) => {
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
        temperature: 0.45
      }
    })
  });

  const rawText = await geminiResponse.text();
  const parsed = safeParseJson(rawText, {});
  return { geminiResponse, rawText, parsed };
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
      'Explica cual es el rol de un consultor politico y como ayuda al heroe.',
      'Responde en espanol claro con una explicacion util y concreta.',
      'Incluye funciones clave, utilidad practica y un ejemplo sencillo del juego.',
      `La respuesta debe tener entre ${MIN_DIALOG_WORDS} y ${MAX_DIALOG_WORDS} palabras.`,
      'No uses markdown, ni listas, ni comillas.'
    ].join('\n');

    const configuredModel = process.env.GEMINI_MODEL?.trim();
    const modelsToTry = configuredModel
      ? [configuredModel, ...DEFAULT_GEMINI_MODELS.filter((model) => model !== configuredModel)]
      : DEFAULT_GEMINI_MODELS;

    let parsed: any = {};
    let lastStatus = 500;
    let lastMessage = 'Gemini request failed.';
    let finalReply = '';

    for (const model of modelsToTry) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

      const { geminiResponse, rawText, parsed: parsedResponse } = await requestGemini(geminiUrl, prompt);
      parsed = parsedResponse;

      if (geminiResponse.ok) {
        const initialReply = normalizeDialog(extractGeminiText(parsed));
        const initialWords = countWords(initialReply);
        if (initialWords >= MIN_DIALOG_WORDS && initialWords <= MAX_DIALOG_WORDS) {
          finalReply = initialReply;
        } else {
          const fixLengthPrompt = [
            'Reescribe el siguiente mensaje para que cumpla una longitud exacta de calidad.',
            `Mensaje base: ${initialReply || 'Soy consultor politico en este mundo y apoyo tus decisiones estrategicas.'}`,
            `Debe tener entre ${MIN_DIALOG_WORDS} y ${MAX_DIALOG_WORDS} palabras.`,
            'Explica rol, tareas y utilidad practica para el heroe.',
            'Una sola respuesta en espanol, sin markdown, sin listas y sin comillas.'
          ].join('\n');

          const fixed = await requestGemini(geminiUrl, fixLengthPrompt);
          if (fixed.geminiResponse.ok) {
            const fixedReply = normalizeDialog(extractGeminiText(fixed.parsed));
            const fixedWords = countWords(fixedReply);
            if (fixedWords >= MIN_DIALOG_WORDS) {
              finalReply = trimToMaxWords(fixedReply, MAX_DIALOG_WORDS);
            }
          }

          if (!finalReply) {
            if (initialWords >= MIN_DIALOG_WORDS) {
              finalReply = trimToMaxWords(initialReply, MAX_DIALOG_WORDS);
            } else {
              finalReply = normalizeDialog('Como consultor politico, te ayudo a leer el entorno, identificar aliados y anticipar conflictos antes de actuar. Transformo datos y opiniones en estrategias claras para que tomes decisiones con menor riesgo. Tambien diseno mensajes que conectan con la poblacion y fortalecen tu legitimidad. En momentos de crisis, preparo escenarios, respuestas y prioridades para mantener el rumbo. Mi rol es convertir incertidumbre en un plan concreto, viable y comunicable para que avances con confianza.');
            }
          }
        }

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

    json(res, 200, {
      message: finalReply || normalizeDialog(extractGeminiText(parsed))
    });
  } catch (error: any) {
    console.error('npc-dialog error:', error);
    json(res, 500, { message: error?.message || 'Unexpected server error.' });
  }
}