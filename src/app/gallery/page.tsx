'use client';

import { useEffect, useState } from 'react';
import { Generation } from '@/types/generation';
import { getGenerations, deleteGeneration } from '@/lib/gallery';
import { GenerationCard } from '@/components/GenerationCard';
import Link from 'next/link';
import { toast } from 'sonner';

export default function GalleryPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchGenerations = async () => {
    try {
      const data = await getGenerations();
      setGenerations(data);
    } catch (error) {
      console.error(error);
      // We don't want to spam toast errors on auto-refresh if it fails silently
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGenerations();

    const intervalId = setInterval(() => {
      fetchGenerations();
    }, 8000);

    return () => clearInterval(intervalId);
  }, []);

  const handleDelete = async (id: string) => {
    setGenerations((prev) => prev.filter((g) => g.id !== id));
    try {
      await deleteGeneration(id);
      toast.success('Generation deleted');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete generation');
      fetchGenerations();
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-12 max-w-7xl mx-auto">
        <div className="mb-10 space-y-2">
          <div className="h-10 w-48 bg-zinc-800 rounded animate-pulse"></div>
          <div className="h-6 w-96 bg-zinc-800/50 rounded animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 flex flex-col h-[350px]">
              <div className="flex-1 bg-zinc-800/30 animate-pulse"></div>
              <div className="p-4 border-t border-zinc-800 space-y-3">
                <div className="h-4 w-3/4 bg-zinc-800 rounded animate-pulse"></div>
                <div className="h-4 w-1/2 bg-zinc-800 rounded animate-pulse"></div>
                <div className="mt-4 flex justify-between">
                  <div className="h-6 w-20 bg-zinc-800 rounded animate-pulse"></div>
                  <div className="h-8 w-16 bg-zinc-800 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (generations.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center gap-6">
        <div className="w-48 h-48 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800 shadow-2xl">
          <svg className="w-24 h-24 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-bold text-white tracking-tight">No generations yet</h2>
          <p className="text-zinc-400 max-w-md text-lg">
            Your gallery is empty. Start creating beautiful images using the text-to-image generator.
          </p>
        </div>
        <Link 
          href="/" 
          className="mt-4 px-8 py-3.5 bg-white text-zinc-950 font-bold rounded-lg hover:bg-zinc-200 transition-colors shadow-xl shadow-white/10"
        >
          Make your first one →
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto">
      <div className="mb-10 space-y-2">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Gallery</h1>
        <p className="text-zinc-400 text-lg">View and manage all your generated images.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {generations.map((generation) => (
          <GenerationCard 
            key={generation.id} 
            generation={generation} 
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
