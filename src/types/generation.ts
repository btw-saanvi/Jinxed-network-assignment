export type GenerationStatus = 'pending' | 'done' | 'failed';

export interface Generation {
  id: string;
  prompt: string;
  model: string;
  image_url: string | null;
  status: GenerationStatus;
  settings: Record<string, unknown>;
  tweak_of: string | null;
  created_at: string;
}
