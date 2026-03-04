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
  if (value && typeof value === 'object') {
    const candidate = value as Record<string, unknown>;
    return toNumber(candidate.count) ?? toNumber(candidate.value);
  }

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

const asObject = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object') {
    return {};
  }
  return value as Record<string, unknown>;
};

const getByPath = (source: Record<string, unknown>, path: string): unknown => {
  return path.split('.').reduce<unknown>((current, segment) => {
    if (!current || typeof current !== 'object') {
      return undefined;
    }
    return (current as Record<string, unknown>)[segment];
  }, source);
};

const pickString = (candidates: Record<string, unknown>[], paths: string[]): string => {
  for (const candidate of candidates) {
    for (const path of paths) {
      const value = cleanString(getByPath(candidate, path));
      if (value) {
        return value;
      }
    }
  }
  return '';
};

const pickNumber = (candidates: Record<string, unknown>[], paths: string[]): number | null => {
  for (const candidate of candidates) {
    for (const path of paths) {
      const value = toNumber(getByPath(candidate, path));
      if (value !== null) {
        return value;
      }
    }
  }
  return null;
};

const pickBoolean = (candidates: Record<string, unknown>[], paths: string[]): boolean => {
  for (const candidate of candidates) {
    for (const path of paths) {
      const value = getByPath(candidate, path);
      if (typeof value === 'boolean') {
        return value;
      }
      if (value === 1 || value === '1' || value === 'true') {
        return true;
      }
      if (value === 0 || value === '0' || value === 'false') {
        return false;
      }
    }
  }
  return false;
};

const normalizeInstagramProfile = (payload: unknown, sourceInput: string): ScrapedCreatorProfile | null => {
  const root = asObject(payload);
  const user = asObject(getByPath(root, 'data.user'));

  if (!Object.keys(user).length) {
    return null;
  }

  const username = cleanString(user.username) || extractUsername(sourceInput);
  const latestNode = asObject(getByPath(user, 'edge_owner_to_timeline_media.edges.0.node'));

  return {
    platform: 'instagram',
    username,
    fullName: cleanString(user.full_name) || cleanString(user.fullName) || cleanString(user.name),
    biography: cleanString(user.biography) || cleanString(getByPath(user, 'biography_with_entities.raw_text')),
    followers: toNumber(getByPath(user, 'edge_followed_by.count')),
    following: toNumber(getByPath(user, 'edge_follow.count')),
    posts: toNumber(getByPath(user, 'edge_owner_to_timeline_media.count')),
    likes: toNumber(getByPath(latestNode, 'edge_liked_by.count')) ?? toNumber(getByPath(latestNode, 'edge_media_preview_like.count')),
    verified: pickBoolean([user], ['is_verified', 'verified']),
    profileUrl: cleanString(user.external_url) || cleanString(user.external_url_linkshimmed) || (username ? `https://www.instagram.com/${username}` : sourceInput),
    avatarUrl: cleanString(user.profile_pic_url_hd) || cleanString(user.profile_pic_url),
    raw: payload
  };
};

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
  if (platform === 'instagram') {
    const instagramProfile = normalizeInstagramProfile(payload, sourceInput);
    if (instagramProfile) {
      return instagramProfile;
    }
  }

  const root = asObject(payload);
  const wrapperData = asObject(root.data);
  const wrapperResult = asObject(root.result);
  const wrapperProfile = asObject(root.profile);
  const wrapperUser = asObject(root.user);
  const nestedDataProfile = asObject(wrapperData.profile);
  const nestedDataUser = asObject(wrapperData.user);
  const nestedResultProfile = asObject(wrapperResult.profile);
  const nestedResultUser = asObject(wrapperResult.user);
  const candidates = [
    root,
    wrapperData,
    wrapperResult,
    wrapperProfile,
    wrapperUser,
    nestedDataProfile,
    nestedDataUser,
    nestedResultProfile,
    nestedResultUser
  ];

  const username = pickString(candidates, [
    'username',
    'handle',
    'user_name',
    'screen_name',
    'user.username',
    'profile.username',
    'profile.handle'
  ]) || extractUsername(sourceInput);

  const inferredProfileUrl = username
    ? {
        instagram: `https://www.instagram.com/${username}`,
        facebook: `https://www.facebook.com/${username}`,
        tiktok: `https://www.tiktok.com/@${username}`,
        x: `https://x.com/${username}`
      }[platform]
    : sourceInput;

  return {
    platform,
    username,
    fullName: pickString(candidates, ['fullName', 'full_name', 'name', 'display_name', 'nickname']),
    biography: pickString(candidates, ['biography', 'bio', 'description', 'about']),
    followers: pickNumber(candidates, [
      'followers',
      'followersCount',
      'followers_count',
      'follower_count',
      'edge_followed_by.count',
      'stats.followers',
      'public_metrics.followers_count',
      'subscribers'
    ]),
    following: pickNumber(candidates, [
      'following',
      'followingCount',
      'following_count',
      'friends_count',
      'edge_follow.count',
      'stats.following',
      'public_metrics.following_count'
    ]),
    posts: pickNumber(candidates, [
      'posts',
      'postsCount',
      'posts_count',
      'media_count',
      'tweet_count',
      'statuses_count',
      'stats.posts',
      'public_metrics.tweet_count'
    ]),
    likes: pickNumber(candidates, [
      'likes',
      'likesCount',
      'likes_count',
      'favourites_count',
      'public_metrics.like_count',
      'stats.likes'
    ]),
    verified: pickBoolean(candidates, ['verified', 'is_verified']),
    profileUrl: pickString(candidates, ['profileUrl', 'profile_url', 'url', 'permalink', 'link']) || inferredProfileUrl,
    avatarUrl: pickString(candidates, [
      'avatarUrl',
      'avatar_url',
      'profilePicture',
      'profile_picture',
      'profile_pic_url',
      'profile_pic_url_hd',
      'profile_image_url',
      'image'
    ]),
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