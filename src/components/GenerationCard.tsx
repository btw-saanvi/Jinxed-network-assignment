'use client';

import { Generation } from '@/types/generation';
import { Loader2, AlertCircle, Trash2, Settings2, Edit2, Copy } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface GenerationCardProps {
  generation: Generation;
  onDelete: (id: string) => void;
}

function getRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
}

export function GenerationCard({ generation, onDelete }: GenerationCardProps) {
  const { id, prompt, status, image_url, model, created_at } = generation;

  const modelBadge = model.includes('schnell') ? 'Flux Schnell' : 'Flux Dev';

  const hasSettings = generation.settings && Object.keys(generation.settings).length > 0;
  const tweakSettingsStr = hasSettings ? encodeURIComponent(JSON.stringify(generation.settings)) : '';
  const tweakUrl = `/?prompt=${encodeURIComponent(prompt)}&model=${encodeURIComponent(model)}&tweakOf=${id}${tweakSettingsStr ? `&settings=${tweakSettingsStr}` : ''}`;

  
  if (status === 'pending') {
    return (
      <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 flex flex-col h-[350px]">
        <div className="flex-1 bg-zinc-800/30 animate-pulse flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
        </div>
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/30">
          <p className="text-zinc-500 text-sm line-clamp-2 font-medium">"{prompt}"</p>
          <div className="mt-3 flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
            <span className="text-sm font-semibold text-blue-500">Generating...</span>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="rounded-xl overflow-hidden border border-red-900/50 bg-red-950/20 flex flex-col h-[350px]">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
          <AlertCircle className="w-10 h-10 text-red-500" />
          <p className="text-red-400 font-semibold text-lg">Generation failed</p>
          <p className="text-red-300/70 text-sm line-clamp-3">"{prompt}"</p>
          <Link href={tweakUrl}>
            <button className="mt-2 px-6 py-2.5 bg-red-950/50 hover:bg-red-900 text-red-400 text-sm font-semibold rounded-lg transition-colors border border-red-900/50 flex items-center gap-2">
              Retry
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const badges: string[] = [];
  
  if (hasSettings) {
    if (generation.settings.image_size && generation.settings.image_size !== 'square_hd') {
      badges.push(generation.settings.image_size);
    }
    if (generation.settings.guidance_scale && generation.settings.guidance_scale !== 7.5) {
      badges.push(`gs: ${generation.settings.guidance_scale}`);
    }
    if (generation.settings.num_inference_steps && generation.settings.num_inference_steps !== 28) {
      badges.push(`steps: ${generation.settings.num_inference_steps}`);
    }
    if (generation.settings.negative_prompt) {
      badges.push('has neg prompt');
    }
  }



  return (
    <div className="group rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 flex flex-col h-[350px] relative">
      <div className="relative flex-1 bg-zinc-950">
        {image_url && (
          <Image
            src={image_url}
            alt={prompt}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            unoptimized={true}
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMyNzI3MmEiLz48L3N2Zz4="
          />
        )}
        <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onDelete(id)}
            className="p-2.5 bg-black/70 hover:bg-red-500/90 text-white rounded-lg backdrop-blur-md transition-all shadow-lg"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="p-4 bg-zinc-900 border-t border-zinc-800 z-10 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-zinc-200 text-sm font-medium line-clamp-2 leading-snug flex-1" title={prompt}>
            {prompt}
          </p>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(prompt);
              import('sonner').then(m => m.toast.success("Copied!"));
            }}
            className="text-zinc-500 hover:text-zinc-300 transition-colors shrink-0 mt-0.5"
            title="Copy Prompt"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
        
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {badges.map((badge, i) => (
              <span key={i} className="text-[10px] font-medium px-1.5 py-0.5 bg-zinc-800/50 border border-zinc-700/50 rounded text-zinc-400">
                {badge}
              </span>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-semibold tracking-wide px-2.5 py-1 bg-zinc-800 rounded-md text-zinc-300">
              {modelBadge}
            </span>
            <span className="text-xs font-medium text-zinc-500">
              {getRelativeTime(created_at)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Link href={`/editor/${id}`}>
              <button className="text-zinc-400 hover:text-white p-2 rounded-md hover:bg-zinc-800 transition-colors flex items-center gap-1.5 text-xs font-medium border border-transparent hover:border-zinc-700">
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </button>
            </Link>
            <Link href={tweakUrl}>
              <button className="text-zinc-400 hover:text-white p-2 rounded-md hover:bg-zinc-800 transition-colors flex items-center gap-1.5 text-xs font-medium border border-transparent hover:border-zinc-700">
                <Settings2 className="w-3.5 h-3.5" />
                Tweak
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
