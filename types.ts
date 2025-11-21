export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  links?: Array<{ title: string; url: string }>;
}

export enum AppMode {
  CONSULTANT = 'CONSULTANT', // AI Suggests styles
  TRY_ON = 'TRY_ON'          // User provides glasses image
}

export interface GenerationConfig {
  prompt: string;
  originalImage: string; // Base64
  glassesImage?: string; // Base64 (optional for try-on)
}