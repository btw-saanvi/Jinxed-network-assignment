import { create } from 'zustand';
import { GenerationStatus } from '@/types/generation';

interface GenerateState {
  prompt: string;
  model: string;
  status: GenerationStatus | 'idle';
  resultImage: string | null;
  tweakOf: string | null;
  imageSize: string;
  guidanceScale: number;
  numInferenceSteps: number;
  negativePrompt: string;
  setPrompt: (prompt: string) => void;
  setModel: (model: string) => void;
  setStatus: (status: GenerationStatus | 'idle') => void;
  setResultImage: (url: string | null) => void;
  setTweakOf: (id: string | null) => void;
  setImageSize: (size: string) => void;
  setGuidanceScale: (scale: number) => void;
  setNumInferenceSteps: (steps: number) => void;
  setNegativePrompt: (prompt: string) => void;
}

export const useGenerateStore = create<GenerateState>((set) => ({
  prompt: '',
  model: 'fal-ai/flux/schnell',
  status: 'idle',
  resultImage: null,
  tweakOf: null,
  imageSize: 'square_hd',
  guidanceScale: 7.5,
  numInferenceSteps: 28,
  negativePrompt: '',
  setPrompt: (prompt) => set({ prompt }),
  setModel: (model) => set({ model }),
  setStatus: (status) => set({ status }),
  setResultImage: (resultImage) => set({ resultImage }),
  setTweakOf: (tweakOf) => set({ tweakOf }),
  setImageSize: (imageSize) => set({ imageSize }),
  setGuidanceScale: (guidanceScale) => set({ guidanceScale }),
  setNumInferenceSteps: (numInferenceSteps) => set({ numInferenceSteps }),
  setNegativePrompt: (negativePrompt) => set({ negativePrompt }),
}));
