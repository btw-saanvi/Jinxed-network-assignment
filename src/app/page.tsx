'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useGenerateStore } from '@/store/generateStore';
import { createGeneration } from '@/lib/gallery';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

function GenerateForm() {
  const searchParams = useSearchParams();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const {
    prompt,
    model,
    status,
    resultImage,
    tweakOf,
    imageSize,
    guidanceScale,
    numInferenceSteps,
    negativePrompt,
    setPrompt,
    setModel,
    setStatus,
    setResultImage,
    setTweakOf,
    setImageSize,
    setGuidanceScale,
    setNumInferenceSteps,
    setNegativePrompt,
  } = useGenerateStore();

  useEffect(() => {
    const urlPrompt = searchParams.get('prompt');
    const urlModel = searchParams.get('model');
    const urlTweakOf = searchParams.get('tweakOf');
    const urlSettingsStr = searchParams.get('settings');

    if (urlPrompt) setPrompt(urlPrompt);
    if (urlModel) setModel(urlModel);
    if (urlTweakOf) setTweakOf(urlTweakOf);
    
    if (urlSettingsStr) {
      try {
        const urlSettings = JSON.parse(decodeURIComponent(urlSettingsStr));
        if (urlSettings.image_size) setImageSize(urlSettings.image_size);
        if (urlSettings.guidance_scale) setGuidanceScale(urlSettings.guidance_scale);
        if (urlSettings.num_inference_steps) setNumInferenceSteps(urlSettings.num_inference_steps);
        if (urlSettings.negative_prompt) setNegativePrompt(urlSettings.negative_prompt);
      } catch {
        // silently ignore parse failures
      }
    }
  }, [searchParams, setPrompt, setModel, setTweakOf, setImageSize, setGuidanceScale, setNumInferenceSteps, setNegativePrompt]);

  const isGenerating = status === 'pending';

  const handleClearTweak = () => {
    setTweakOf(null);
    window.history.replaceState({}, '', '/');
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt to generate an image.');
      return;
    }

    try {
      setStatus('pending');
      setResultImage(null);

      const settings: Record<string, unknown> = {
        image_size: imageSize,
        guidance_scale: guidanceScale,
      };

      if (negativePrompt.trim()) {
        settings.negative_prompt = negativePrompt.trim();
      }

      if (model === 'fal-ai/flux/dev') {
        settings.num_inference_steps = numInferenceSteps;
      }

      const generationId = await createGeneration(prompt, model, settings, tweakOf);

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model, generationId, settings }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      setResultImage(data.imageUrl);
      setStatus('done');
      toast.success('Image generated successfully!');
    } catch (error: unknown) {
      const err = error as { message?: string };
      setStatus('failed');
      toast.error(err.message || 'An unexpected error occurred.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 p-6 md:p-12 flex flex-col items-center">
      <div className="w-full max-w-3xl space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Generate Image</h1>
          <p className="text-zinc-400">
            Create stunning images from text prompts using advanced AI models.
          </p>
        </div>

        {tweakOf && (
          <div className="bg-blue-950/40 border border-blue-900/50 text-blue-300 px-4 py-3 rounded-lg flex items-center justify-between shadow-lg shadow-blue-900/10">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
              <span className="text-sm font-medium">Tweaking a previous generation</span>
            </div>
            <button 
              onClick={handleClearTweak} 
              className="p-1 hover:bg-blue-900/50 rounded-md transition-colors"
              title="Clear tweak"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="space-y-6 bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
          <div className="space-y-2">
            <label htmlFor="prompt" className="text-sm font-medium">
              Prompt
            </label>
            <Textarea
              id="prompt"
              placeholder="Describe the image you want to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[120px] resize-none bg-zinc-950 border-zinc-800 focus-visible:ring-zinc-700 placeholder:text-zinc-600"
              disabled={isGenerating}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <label htmlFor="model" className="text-sm font-medium">
                Model
              </label>
              <Select
                value={model}
                onValueChange={(v) => v && setModel(v)}
                disabled={isGenerating}
              >
                <SelectTrigger id="model" className="bg-zinc-950 border-zinc-800 focus:ring-zinc-700">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-50">
                  <SelectItem value="fal-ai/flux/schnell">Schnell · Fast</SelectItem>
                  <SelectItem value="fal-ai/flux/dev">Dev · Quality</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full sm:w-auto min-w-[140px] bg-zinc-50 text-zinc-950 hover:bg-zinc-200 font-semibold"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin text-zinc-950" />
                    Generating...
                  </>
                ) : (
                  'Generate'
                )}
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800/50">
            <button
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-300 transition-colors"
            >
              {isAdvancedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Advanced Settings
            </button>

            {isAdvancedOpen && (
              <div className="mt-4 space-y-6 animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Image Size</label>
                    <Select
                      value={imageSize}
                      onValueChange={(v) => v && setImageSize(v)}
                      disabled={isGenerating}
                    >
                      <SelectTrigger className="bg-zinc-950 border-zinc-800 focus:ring-zinc-700">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-50">
                        <SelectItem value="square_hd">Square HD (1:1)</SelectItem>
                        <SelectItem value="landscape_4_3">Landscape (4:3)</SelectItem>
                        <SelectItem value="portrait_4_3">Portrait (3:4)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-zinc-300">Prompt Adherence</label>
                      <span className="text-xs text-zinc-500 font-mono">{guidanceScale}</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" max="20" step="0.1" 
                      value={guidanceScale} 
                      onChange={(e) => setGuidanceScale(parseFloat(e.target.value))}
                      disabled={isGenerating}
                      className="w-full accent-blue-500"
                    />
                  </div>
                  
                  {model === 'fal-ai/flux/dev' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-zinc-300">Steps</label>
                        <span className="text-xs text-zinc-500 font-mono">{numInferenceSteps}</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" max="50" step="1" 
                        value={numInferenceSteps} 
                        onChange={(e) => setNumInferenceSteps(parseInt(e.target.value))}
                        disabled={isGenerating}
                        className="w-full accent-blue-500"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Negative Prompt</label>
                  <Textarea
                    placeholder="Elements to exclude..."
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    className="min-h-[80px] resize-none bg-zinc-950 border-zinc-800 focus-visible:ring-zinc-700 placeholder:text-zinc-700"
                    disabled={isGenerating}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {status === 'done' && resultImage && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-2xl">
              <img
                src={resultImage}
                alt={prompt}
                className="w-full h-auto object-cover max-h-[70vh]"
              />
              <div className="p-4 bg-zinc-900 border-t border-zinc-800">
                <p className="text-zinc-300 text-sm font-medium">{"\""}{prompt}{"\""}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 text-zinc-50 p-6 md:p-12 flex justify-center mt-20">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    }>
      <GenerateForm />
    </Suspense>
  );
}
