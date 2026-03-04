import {
  AuthResponse,
  BotResponse,
  ScrapedCreatorProfile,
  ScrapeCreatorsResponse,
  SocialPlatform,
  SocialProfilesInput
} from '../types';

// Helper para manejar errores de respuesta HTTP de forma genérica
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorText = await response.text();
    try {
      // Intentamos parsear si el servidor devuelve JSON con el error
      const errorJson = JSON.parse(errorText);
      throw new Error(errorJson.message || `Error ${response.status}: ${response.statusText}`);
    } catch (e: any) {
      // Si falla el parseo o es otro error, mostramos el texto plano o status
      // Nota: e.message preserva el mensaje del throw anterior si fue JSON
      const msg = e.message && e.message.startsWith('Error') ? e.message : `Error ${response.status}: ${errorText || response.statusText}`;
      throw new Error(msg);
    }
  }
  return response.json();
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const cleanString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const extractUsername = (input: string): string => {
  const text = input.trim();
  if (!text) {
    return '';
  }

  if (text.startsWith('@')) {
    return text.slice(1);
  }

  try {
    const normalized = text.startsWith('http') ? text : `https://${text}`;
    const url = new URL(normalized);
    const segments = url.pathname.split('/').filter(Boolean);
    return segments[0] || text;
  } catch {
    return text;
  }
};

const normalizeScrapedProfile = (platform: SocialPlatform, payload: unknown, sourceInput: string): ScrapedCreatorProfile => {
  const candidate = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
  const username = cleanString(candidate.username) || cleanString(candidate.handle) || extractUsername(sourceInput);

  return {
    platform,
    username,
    fullName: cleanString(candidate.fullName) || cleanString(candidate.name),
    biography: cleanString(candidate.biography) || cleanString(candidate.bio) || cleanString(candidate.description),
    followers: toNumber(candidate.followers) ?? toNumber(candidate.followersCount),
    following: toNumber(candidate.following) ?? toNumber(candidate.followingCount),
    posts: toNumber(candidate.posts) ?? toNumber(candidate.postsCount),
    likes: toNumber(candidate.likes) ?? toNumber(candidate.likesCount),
    verified: Boolean(candidate.verified),
    profileUrl: cleanString(candidate.profileUrl) || sourceInput,
    avatarUrl: cleanString(candidate.avatarUrl) || cleanString(candidate.profilePicture),
    raw: payload
  };
};

export const apiService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    // SIMULACIÓN: Login
    // Simulamos un retardo de red
    await new Promise(resolve => setTimeout(resolve, 800));

    if (!email || !password) {
      throw new Error("Por favor, ingresa correo y contraseña.");
    }

    // Retorno exitoso simulado
    return {
      token: "mock-session-token-12345",
      user: {
        id: "user-001",
        name: "Usuario Demo",
        email: email
      }
    };
  },

  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    // SIMULACIÓN: Registro
    await new Promise(resolve => setTimeout(resolve, 800));

    if (!name || !email || !password) {
      throw new Error("Todos los campos son obligatorios.");
    }

    // Retorno exitoso simulado
    return {
      token: "mock-session-token-67890",
      user: {
        id: Date.now().toString(),
        name: name,
        email: email
      }
    };
  },

  sendMessage: async (text: string, sessionId: string, token: string): Promise<BotResponse> => {
    try {
      // URL del webhook real proporcionada
      //const webhookUrl = 'https://garnet-eudiometrical-ayden.ngrok-free.dev/webhook-test/a2b463eb-fbcc-4cfe-8f74-83db8ef3f3b7';
      const webhookUrl ='https://garnet-eudiometrical-ayden.ngrok-free.dev/webhook/a2b463eb-fbcc-4cfe-8f74-83db8ef3f3b7'
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          message: text,
          sessionId: sessionId 
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const rawData = await response.json();
      
      // Manejo robusto: La respuesta puede ser un Objeto o un Array de objetos
      // El usuario reporta que llega como [{"output": "..."}]
      const data = Array.isArray(rawData) ? (rawData[0] || {}) : (rawData || {});

      // Adaptador de respuesta:
      // Priorizamos 'output' como solicita el usuario
      const botMessage = data.output || 
                         data.response || 
                         data.message || 
                         data.text || 
                         data.answer || 
                         data.content ||
                         (typeof rawData === 'object' ? JSON.stringify(rawData) : String(rawData));

      return { response: botMessage };
      
    } catch (error) {
      console.error("Message Error:", error);
      throw error;
    }
  },

  scrapeCreatorsProfiles: async (profiles: SocialProfilesInput): Promise<ScrapeCreatorsResponse> => {
    const entries = (Object.entries(profiles) as Array<[SocialPlatform, string]>)
      .map(([platform, value]) => [platform, value.trim()] as const)
      .filter(([, value]) => value.length > 0);

    if (entries.length === 0) {
      return { profiles: [] };
    }

    const requests = entries.map(async ([platform, profileInput]) => {
      const response = await fetch('/api/scrape-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platform,
          profile: profileInput
        })
      });

      const data = await handleResponse<any>(response);
      const payload = Array.isArray(data) ? data[0] : data;
      return normalizeScrapedProfile(platform, payload, profileInput);
    });

    const scrapedProfiles = await Promise.all(requests);
    return { profiles: scrapedProfiles };
  }
};