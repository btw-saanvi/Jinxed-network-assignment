import { create } from 'zustand';
import { GenerationStatus } from '@/types/generation';

interface GenerateState {
  prompt: string;
  model: string;
  status: GenerationStatus | 'idle';
  resultImage: string | null;
  tweakOf: string | null;
  setPrompt: (prompt: string) => void;
  setModel: (model: string) => void;
  setStatus: (status: GenerationStatus | 'idle') => void;
  setResultImage: (url: string | null) => void;
  setTweakOf: (id: string | null) => void;
}

export const useGenerateStore = create<GenerateState>((set) => ({
  prompt: '',
  model: 'fal-ai/flux/schnell',
  status: 'idle',
  resultImage: null,
  tweakOf: null,
  setPrompt: (prompt) => set({ prompt }),
  setModel: (model) => set({ model }),
  setStatus: (status) => set({ status }),
  setResultImage: (resultImage) => set({ resultImage }),
  setTweakOf: (tweakOf) => set({ tweakOf }),
}));
