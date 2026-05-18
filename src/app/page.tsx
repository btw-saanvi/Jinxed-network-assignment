'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useGenerateStore } from '@/store/generateStore';
import { createGeneration, getGenerations, deleteGeneration } from '@/lib/gallery';
import { Generation } from '@/types/generation';
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
import { 
  X, 
  Loader2, 
  Settings, 
  Sparkles, 
  Trash2, 
  Edit2, 
  RefreshCw,
  Image as ImageIcon,
  Flame,
  Trees,
  Laptop
} from 'lucide-react';
import Link from 'next/link';

function GenerateForm() {
  const searchParams = useSearchParams();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(true);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [isGalleryLoading, setIsGalleryLoading] = useState(true);

  // Simulated Authentication States
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

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

  const fetchGallery = async () => {
    try {
      const data = await getGenerations();
      setGenerations(data);
    } catch {
      // silent catch
    } finally {
      setIsGalleryLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
    const interval = setInterval(fetchGallery, 6000);
    return () => clearInterval(interval);
  }, []);

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
        // silent catch
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
      fetchGallery();
    } catch (error: unknown) {
      const err = error as { message?: string };
      setStatus('failed');
      toast.error(err.message || 'An unexpected error occurred.');
    }
  };

  const handleDelete = async (id: string) => {
    setGenerations((prev) => prev.filter((g) => g.id !== id));
    try {
      await deleteGeneration(id);
      toast.success('Generation deleted successfully.');
      fetchGallery();
    } catch {
      toast.error('Failed to delete generation.');
      fetchGallery();
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setTimeout(() => {
      setIsAuthLoading(false);
      setIsAuthModalOpen(false);
      if (authMode === 'login') {
        setUser({ name: 'Saanvi Garg', email: authEmail });
        toast.success(`Welcome back, Saanvi Garg!`);
      } else {
        setUser({ name: authName || 'New User', email: authEmail });
        toast.success(`Account created successfully! Welcome to GenStudio, ${authName || 'New User'}.`);
      }
      setAuthName('');
      setAuthEmail('');
      setAuthPassword('');
    }, 1000);
  };

  const aspectRatios = [
    { label: '1:1', value: 'square_hd' },
    { label: '16:9', value: 'landscape_hd' },
    { label: '9:16', value: 'portrait_hd' },
    { label: '4:3', value: 'landscape_4_3' },
    { label: '3:4', value: 'portrait_4_3' }
  ];

  const suggestions = [
    {
      title: 'Cyberpunk Metropolis',
      prompt: 'A futuristic cyberpunk metropolis at night, glowing neon signs, flying cars weaving through massive skyscrapers, rainy streets reflecting vibrant neon colors, ultra-detailed.',
      icon: <Flame className="w-4 h-4 text-purple-600" />
    },
    {
      title: 'Bioluminescent Forest',
      prompt: 'A mystical bioluminescent forest at twilight, glowing fairy lights floating around ancient massive trees, glowing mushrooms on the mossy ground, soft purple mist, painterly style.',
      icon: <Trees className="w-4 h-4 text-purple-600" />
    },
    {
      title: 'Holographic Workspace',
      prompt: 'A clean minimalist workspace with holographic interfaces floating over a sleek desk, overlooking a futuristic skyline at dusk, realistic render, 8k resolution.',
      icon: <Laptop className="w-4 h-4 text-purple-600" />
    }
  ];

  return (
    <div className="min-h-screen bg-[#f0f0f8] text-[#1a1a2e] font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#e6e6f2] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-purple-500/20">
            G
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-purple-700 to-indigo-600 bg-clip-text text-transparent">
            GenStudio
          </span>
        </div>

        {/* Updated Navbar Center Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-500">
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="hover:text-purple-600 transition-colors"
          >
            Generate
          </button>
          <button 
            onClick={() => document.getElementById('gallery-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="hover:text-purple-600 transition-colors"
          >
            Gallery
          </button>
        </nav>

        {/* Updated Navbar Authentication Options */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex flex-col text-right hidden sm:flex">
                <span className="text-xs font-bold text-[#1a1a2e]">{user.name}</span>
                <span className="text-[10px] text-zinc-400 font-medium">{user.email}</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 font-extrabold text-sm shadow-inner relative group cursor-pointer">
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                
                {/* Profile Dropdown Menu */}
                <div className="absolute right-0 top-full pt-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                  <div className="bg-white border border-[#e6e6f2] shadow-xl shadow-purple-900/5 rounded-xl py-2 w-48 text-left">
                    <div className="px-4 py-2 border-b border-[#e6e6f2]">
                      <p className="text-xs font-bold text-[#1a1a2e]">{user.name}</p>
                      <p className="text-[10px] text-zinc-400 font-medium line-clamp-1">{user.email}</p>
                    </div>
                    <button 
                      onClick={() => {
                        setUser(null);
                        toast.success('Logged out successfully.');
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 font-semibold transition-colors mt-1"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <button 
                onClick={() => {
                  setAuthMode('login');
                  setIsAuthModalOpen(true);
                }}
                className="text-sm font-bold text-zinc-600 hover:text-purple-600 transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={() => {
                  setAuthMode('signup');
                  setIsAuthModalOpen(true);
                }}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-full transition-all shadow-md shadow-purple-500/25 hover:shadow-lg hover:shadow-purple-500/35"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-100 border border-purple-200 text-purple-700 text-xs font-semibold shadow-sm">
            <span>✦ High-Fidelity AI Workspace</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Generative Media <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Studio</span>
          </h1>
          <p className="text-zinc-500 text-sm md:text-base leading-relaxed">
            Formulate detailed prompts, customize generative settings, and construct stunning visual digital assets in real-time.
          </p>
        </section>

        {/* Dynamic Alerts */}
        {tweakOf && (
          <div className="max-w-6xl mx-auto bg-purple-50 border border-purple-100 text-purple-700 px-4 py-3.5 rounded-2xl flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 rounded-full bg-purple-600 animate-ping"></span>
              <span className="text-sm font-semibold">Tweaking settings from a previous generation</span>
            </div>
            <button 
              onClick={handleClearTweak} 
              className="p-1 hover:bg-purple-100 rounded-md transition-colors"
              title="Clear tweak"
            >
              <X className="w-4 h-4 text-purple-600" />
            </button>
          </div>
        )}

        {/* Two-Panel Core Workspace Card */}
        <section className="max-w-6xl mx-auto bg-white rounded-3xl border border-[#e6e6f2] shadow-xl shadow-purple-900/5 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
          {/* Left Panel - Control Form */}
          <div className="p-8 border-b lg:border-b-0 lg:border-r border-[#e6e6f2] flex flex-col gap-6 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-zinc-400">ENTER TEXT PROMPT</span>
              <span className="text-[11px] text-zinc-400">Supports up to 2000 chars</span>
            </div>

            <div className="relative">
              <Textarea
                placeholder="Describe your creative vision in rich, detailed prose... (e.g. 'A bioluminescent glowing jellyfish in deep blue cosmic dust')"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[140px] resize-none bg-zinc-50 border-zinc-200 focus-visible:ring-purple-500 rounded-xl text-zinc-800 placeholder:text-zinc-400 placeholder:italic text-sm p-4"
                disabled={isGenerating}
              />
            </div>

            {/* Advanced Settings Drawer */}
            <div className="space-y-4">
              <button
                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-lg transition-colors border border-purple-100"
              >
                <Settings className="w-3.5 h-3.5" />
                Advanced Settings
              </button>

              {isAdvancedOpen && (
                <div className="p-5 bg-zinc-50/50 rounded-2xl border border-zinc-100 space-y-6 animate-in slide-in-from-top-2 duration-200">
                  {/* Generative Model */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-500">Generative Model</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">Neural Architecture</span>
                    </div>
                    <Select
                      value={model}
                      onValueChange={(v) => v && setModel(v)}
                      disabled={isGenerating}
                    >
                      <SelectTrigger className="bg-white border-zinc-200 focus:ring-purple-500">
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-zinc-200 text-zinc-800">
                        <SelectItem value="black-forest-labs/FLUX.1-schnell">Gemini 2.5 Flash · Image</SelectItem>
                        <SelectItem value="fal-ai/flux/dev">Imagen 3 Ultra · Quality</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Aspect Ratio */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-zinc-500 block">Aspect Ratio</span>
                    <div className="flex flex-wrap gap-2">
                      {aspectRatios.map((item) => {
                        const isSelected = imageSize === item.value;
                        return (
                          <button
                            key={item.value}
                            onClick={() => setImageSize(item.value)}
                            disabled={isGenerating}
                            className={`px-4 py-2 text-xs font-bold rounded-full transition-all border ${
                              isSelected
                                ? 'bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-500/25'
                                : 'bg-white border-zinc-200 hover:bg-zinc-100 text-zinc-600'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Prompt Adherence */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-500">Prompt Adherence</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-zinc-200 text-zinc-700 rounded-full">auto</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" max="20" step="0.1" 
                      value={guidanceScale} 
                      onChange={(e) => setGuidanceScale(parseFloat(e.target.value))}
                      disabled={isGenerating}
                      className="w-full accent-purple-600 cursor-pointer h-1.5 bg-zinc-200 rounded-lg appearance-none"
                    />
                    <p className="text-[11px] text-zinc-400">
                      Model balances fidelity to your prompt automatically
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Big Action Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full mt-2 py-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold rounded-2xl transition-all shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 flex items-center justify-center gap-2 border-none"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  <span>Synthesizing Vision...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>✦ Generate Masterpiece ✦</span>
                </>
              )}
            </Button>
          </div>

          {/* Right Panel - Preview Canvas */}
          <div className="p-8 flex flex-col gap-6 bg-zinc-50/50 justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-zinc-400">STUDIO CANVAS</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">latest</span>
            </div>

            {/* Image Canvas Box */}
            <div className="flex-1 min-h-[300px] flex items-center justify-center bg-white rounded-2xl border border-[#e6e6f2] shadow-sm overflow-hidden p-4 relative group">
              {isGenerating ? (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-8 text-center animate-pulse">
                  <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-sm text-[#1a1a2e]">Rendering Imagery</h3>
                    <p className="text-xs text-zinc-400 max-w-[200px]">Weaving your prompts into digital canvas layers...</p>
                  </div>
                </div>
              ) : resultImage ? (
                <img
                  src={resultImage}
                  alt={prompt}
                  className="w-full h-full object-contain max-h-[400px] rounded-xl transition-all duration-300"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-8 gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#f0f0f8] flex items-center justify-center text-purple-500 shadow-inner">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-[#1a1a2e]">Canvas Idle</h3>
                    <p className="text-xs text-zinc-400 max-w-[200px]">Your generated creations will render in this panel.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Prompt details below */}
            <div className="p-4 bg-white rounded-xl border border-[#e6e6f2]">
              <p className="text-zinc-500 text-xs italic line-clamp-3 leading-relaxed">
                {prompt ? `"${prompt}"` : 'Waiting for prompt inputs to orchestrate canvas...'}
              </p>
            </div>
          </div>
        </section>

        {/* Suggestion Templates */}
        <section className="max-w-6xl mx-auto space-y-4">
          <span className="text-[11px] font-bold tracking-wider text-zinc-400 block">QUICK SUGGESTION TEMPLATES</span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {suggestions.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setPrompt(item.prompt)}
                className="p-5 bg-white hover:bg-purple-50/30 border border-[#e6e6f2] hover:border-purple-200 rounded-2xl text-left transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-purple-900/5 group flex items-start gap-4"
              >
                <div className="p-2.5 bg-purple-50 rounded-xl group-hover:bg-purple-100 transition-colors shrink-0">
                  {item.icon}
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-bold text-xs text-[#1a1a2e] group-hover:text-purple-600 transition-colors">{item.title}</h4>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">{item.prompt}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Live Studio Gallery */}
        <section id="gallery-section" className="max-w-6xl mx-auto space-y-6 pt-6 border-t border-[#e6e6f2]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-wider text-zinc-400">GENERATIVE STUDIO GALLERY</span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-zinc-200 text-zinc-700 rounded-full">
                {generations.length} {generations.length === 1 ? 'generation' : 'generations'}
              </span>
            </div>
            <button 
              onClick={fetchGallery}
              className="p-1.5 hover:bg-zinc-200 rounded-lg transition-colors text-zinc-500 hover:text-zinc-800"
              title="Refresh Gallery"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {isGalleryLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-[#e6e6f2] shadow-sm overflow-hidden h-[300px] animate-pulse" />
              ))}
            </div>
          ) : generations.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-[#e6e6f2] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-[#1a1a2e]">Gallery Empty</h4>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">Create and compile your prompts to build a visual masterpiece gallery.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {generations.map((gen) => {
                const modelLabel = gen.model.includes('schnell') ? 'Gemini 2.5' : 'Imagen 3';
                const hasSettings = gen.settings && Object.keys(gen.settings).length > 0;
                const settingsObj = gen.settings as Record<string, string | number | boolean | undefined>;
                const sizeLabel = settingsObj?.image_size ? String(settingsObj.image_size).replace('_hd', '').toUpperCase() : '1:1';

                const tweakSettingsStr = hasSettings ? encodeURIComponent(JSON.stringify(gen.settings)) : '';
                const tweakUrl = `/?prompt=${encodeURIComponent(gen.prompt)}&model=${encodeURIComponent(gen.model)}&tweakOf=${gen.id}${tweakSettingsStr ? `&settings=${tweakSettingsStr}` : ''}`;

                return (
                  <div key={gen.id} className="group bg-white rounded-2xl border border-[#e6e6f2] shadow-sm hover:shadow-md hover:shadow-purple-900/5 overflow-hidden transition-all duration-300 flex flex-col relative h-[320px]">
                    <div className="relative flex-1 bg-zinc-100 overflow-hidden">
                      {gen.image_url ? (
                        <img
                          src={gen.image_url}
                          alt={gen.prompt}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : gen.status === 'failed' ? (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-red-50/50">
                          <span className="text-xs font-bold text-red-500">Failed</span>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-50">
                          <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                        </div>
                      )}
                      
                      {/* Action buttons hover display overlay */}
                      <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDelete(gen.id)}
                          className="p-2 bg-white hover:bg-red-50 hover:text-red-500 text-zinc-500 rounded-lg shadow-sm transition-all border border-[#e6e6f2]"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 flex flex-col gap-3 justify-between bg-white border-t border-[#e6e6f2]">
                      <p className="text-[#1a1a2e] text-xs font-semibold line-clamp-2 leading-relaxed flex-1">
                        {gen.prompt}
                      </p>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex gap-1.5">
                          <span className="text-[9px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full border border-purple-100">
                            {modelLabel}
                          </span>
                          <span className="text-[9px] font-bold px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-full">
                            {sizeLabel}
                          </span>
                        </div>

                        <div className="flex gap-1.5">
                          <Link href={`/editor/${gen.id}`}>
                            <button className="p-1.5 text-zinc-500 hover:text-purple-600 transition-colors border border-transparent hover:border-zinc-200 rounded-md bg-zinc-50">
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </Link>
                          <Link href={tweakUrl}>
                            <button className="p-1.5 text-zinc-500 hover:text-purple-600 transition-colors border border-transparent hover:border-zinc-200 rounded-md bg-zinc-50">
                              <Settings className="w-3 h-3" />
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e6e6f2] bg-white py-6 px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-400">
          <div>
            <span>GenStudio © 2026. All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-purple-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-purple-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-purple-600 transition-colors">Support</a>
          </div>
        </div>
      </footer>

      {/* Login & Signup Modal Overlay */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#e6e6f2] shadow-2xl shadow-purple-950/20 max-w-md w-full p-8 relative flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button 
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-6 right-6 p-1.5 hover:bg-[#f0f0f8] hover:text-purple-600 rounded-lg text-zinc-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="space-y-1.5 text-center mt-2">
              <h2 className="text-2xl font-extrabold tracking-tight text-[#1a1a2e]">
                {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-xs text-zinc-400">
                {authMode === 'login' 
                  ? 'Access your high-fidelity generative workspace' 
                  : 'Start synthesizing your visual assets in real-time'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 tracking-wider">FULL NAME</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Enter your name" 
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-xl text-sm placeholder:text-zinc-400 text-zinc-800"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 tracking-wider">EMAIL ADDRESS</label>
                <input 
                  type="email" 
                  required
                  placeholder="name@example.com" 
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-xl text-sm placeholder:text-zinc-400 text-zinc-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 tracking-wider">PASSWORD</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••" 
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-xl text-sm placeholder:text-zinc-400 text-zinc-800"
                />
              </div>

              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full mt-2 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold rounded-xl transition-all shadow-md shadow-purple-500/25 flex items-center justify-center gap-2"
              >
                {isAuthLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>{authMode === 'login' ? 'Sign In' : 'Sign Up'}</span>
                )}
              </button>
            </form>

            {/* Toggle footer */}
            <div className="text-center text-xs text-zinc-500">
              {authMode === 'login' ? (
                <span>
                  Don&apos;t have an account?{' '}
                  <button 
                    onClick={() => setAuthMode('signup')}
                    className="text-purple-600 hover:underline font-bold"
                  >
                    Sign Up
                  </button>
                </span>
              ) : (
                <span>
                  Already have an account?{' '}
                  <button 
                    onClick={() => setAuthMode('login')}
                    className="text-purple-600 hover:underline font-bold"
                  >
                    Sign In
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f0f0f8] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    }>
      <GenerateForm />
    </Suspense>
  );
}
