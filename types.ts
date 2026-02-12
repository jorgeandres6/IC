
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

export enum AuthMode {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER'
}

export type ModuleId = 'fundamentos' | 'institucional' | 'mapeo' | 'discurso';
