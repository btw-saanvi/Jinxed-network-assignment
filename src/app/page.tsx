'use client';

import { Suspense, useEffect } from 'react';
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
import { X, Loader2 } from 'lucide-react';

function GenerateForm() {
  const searchParams = useSearchParams();
  const {
    prompt,
    model,
    status,
    resultImage,
    tweakOf,
    setPrompt,
    setModel,
    setStatus,
    setResultImage,
    setTweakOf,
  } = useGenerateStore();

  useEffect(() => {
    const urlPrompt = searchParams.get('prompt');
    const urlModel = searchParams.get('model');
    const urlTweakOf = searchParams.get('tweakOf');

    if (urlPrompt) setPrompt(urlPrompt);
    if (urlModel) setModel(urlModel);
    if (urlTweakOf) setTweakOf(urlTweakOf);
  }, [searchParams, setPrompt, setModel, setTweakOf]);

  const isGenerating = status === 'pending';

  const handleClearTweak = () => {
    setTweakOf(null);
    // clear the search params from the url
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

      // 1. Call createGeneration() to insert pending DB row
      const generationId = await createGeneration(prompt, model, {}, tweakOf);

      // 2. POST to /api/generate
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model, generationId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      // 3. Handle the response
      setResultImage(data.imageUrl);
      setStatus('done');
      toast.success('Image generated successfully!');
      
      // Optionally clear tweak status on success if desired, but we can leave it
      // so users can repeatedly tweak the same original.
    } catch (error: any) {
      console.error(error);
      setStatus('failed');
      toast.error(error.message || 'An unexpected error occurred.');
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

        <div className="space-y-4 bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
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
                onValueChange={setModel}
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
                <p className="text-zinc-300 text-sm font-medium">"{prompt}"</p>
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
