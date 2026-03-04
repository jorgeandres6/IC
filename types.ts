
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface BotResponse {
  response: string;
}

export type SocialPlatform = 'instagram' | 'facebook' | 'tiktok' | 'x';

export interface SocialProfilesInput {
  instagram: string;
  facebook: string;
  tiktok: string;
  x: string;
}

export interface ScrapedCreatorProfile {
  platform: SocialPlatform;
  username: string;
  fullName: string;
  biography: string;
  followers: number | null;
  following: number | null;
  posts: number | null;
  likes: number | null;
  verified: boolean;
  profileUrl: string;
  avatarUrl: string;
  raw: unknown;
}

export interface ScrapeCreatorsResponse {
  profiles: ScrapedCreatorProfile[];
}

export interface ProfileAnalysisResponse {
  analysis: string;
}

export enum AuthMode {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER'
}

export type ModuleId = 'fundamentos' | 'mapeo' | 'discurso';
