'use client';

import { useEffect, useRef, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { getGeneration } from '@/lib/gallery';
import { Generation } from '@/types/generation';
import { toast } from 'sonner';
import { Loader2, Type, Download, ChevronLeft, Trash2 } from 'lucide-react';
import * as fabric from 'fabric';
import Link from 'next/link';

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [generation, setGeneration] = useState<Generation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  
  // Tools state
  const [textInput, setTextInput] = useState('');
  const [fontSize, setFontSize] = useState(36);
  const [textColor, setTextColor] = useState('#1a1a2e');
  
  const COLORS = ['#1a1a2e', '#7c3aed', '#3b82f6', '#10b981', '#eab308', '#ef4444', '#ffffff'];

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getGeneration(id);
        if (data.status !== 'done' || !data.image_url) {
          toast.error('Image not ready for editing');
          router.push('/');
          return;
        }
        setGeneration(data);
      } catch {
        toast.error('Failed to load generation');
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id, router]);

  useEffect(() => {
    if (!generation?.image_url || !canvasRef.current || !containerRef.current) return;

    // Initialize Fabric canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      backgroundColor: '#ffffff',
    });
    
    fabricCanvasRef.current = canvas;

    const loadFabricImage = async () => {
      try {
        const imgElement = document.createElement('img');
        imgElement.crossOrigin = 'anonymous';
        imgElement.src = generation.image_url!;
        
        imgElement.onload = () => {
          const FabricImage = ((fabric as unknown as { FabricImage?: new (el: HTMLImageElement) => fabric.Image }).FabricImage || (fabric as unknown as { Image?: new (el: HTMLImageElement) => fabric.Image }).Image) as new (el: HTMLImageElement) => fabric.Image;
          const img = new FabricImage(imgElement);
          
          // Calculate scale to fit canvas
          const canvasWidth = canvas.width || 800;
          const canvasHeight = canvas.height || 600;
          
          // scale to fit within bounds
          const scale = Math.min(
            (canvasWidth * 0.95) / img.width!,
            (canvasHeight * 0.95) / img.height!
          );
          
          img.scale(scale);
          
          // Center the image
          img.set({
            left: (canvasWidth - img.width! * scale) / 2,
            top: (canvasHeight - img.height! * scale) / 2,
            selectable: false,
            evented: false,
          });
          
          canvas.add(img);
          canvas.sendObjectToBack(img);
          canvas.renderAll();
        };
      } catch {
        toast.error('Failed to load image for editing');
      }
    };

    loadFabricImage();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !fabricCanvasRef.current) return;
      
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      
      fabricCanvasRef.current.width = newWidth;
      fabricCanvasRef.current.height = newHeight;
      fabricCanvasRef.current.renderAll();
    };

    window.addEventListener('resize', handleResize);
    
    // Add delete key handler
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Prevent deleting if user is typing in an input field
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }
        
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length) {
          activeObjects.forEach((obj) => canvas.remove(obj));
          canvas.discardActiveObject();
          canvas.renderAll();
          toast.success('Selected overlay deleted.');
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      canvas.dispose();
    };
  }, [generation]);

  const handleAddText = () => {
    if (!fabricCanvasRef.current || !textInput.trim()) return;

    const canvas = fabricCanvasRef.current;
    
    const FabricText = ((fabric as unknown as { IText?: new (t: string, opts?: Record<string, unknown>) => fabric.IText }).IText || (fabric as unknown as { Text?: new (t: string, opts?: Record<string, unknown>) => fabric.Text }).Text) as new (t: string, opts?: Record<string, unknown>) => fabric.IText;
    const text = new FabricText(textInput, {
      left: (canvas.width || 800) / 2,
      top: (canvas.height || 600) / 2,
      fontFamily: 'system-ui, sans-serif',
      fontSize: fontSize,
      fill: textColor,
      originX: 'center',
      originY: 'center',
      transparentCorners: false,
      cornerColor: '#7c3aed',
      cornerStyle: 'circle',
      borderColor: '#7c3aed',
      cornerSize: 10,
    });
    
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    setTextInput('');
    toast.success('Added text overlay to canvas!');
  };

  const handleClearSelected = () => {
    if (!fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length) {
      activeObjects.forEach((obj) => canvas.remove(obj));
      canvas.discardActiveObject();
      canvas.renderAll();
      toast.success('Deleted selection.');
    } else {
      toast.error('Please select an overlay object to delete.');
    }
  };

  const handleExport = () => {
    if (!fabricCanvasRef.current) return;
    
    try {
      const dataUrl = fabricCanvasRef.current.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2 // Export at higher double resolution
      });
      
      const link = document.createElement('a');
      link.download = `genstudio-masterpiece-${generation?.id}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Masterpiece exported successfully as high-res PNG!');
    } catch {
      toast.error('Failed to export. This can happen with cross-origin images.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f0f0f8] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (!generation) return null;

  return (
    <div className="flex flex-col h-screen bg-[#f0f0f8] text-[#1a1a2e] font-sans overflow-hidden">
      {/* Header bar */}
      <div className="border-b border-[#e6e6f2] bg-white px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1 font-bold text-sm">
            <ChevronLeft className="w-4 h-4" />
            Back to Studio
          </Link>
          <div className="h-4 w-px bg-zinc-200"></div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm tracking-tight text-[#1a1a2e]">Canvas Editor</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">High-Res</span>
          </div>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-full font-bold transition-all shadow-md shadow-purple-500/20 hover:shadow-lg text-xs"
        >
          <Download className="w-4 h-4 text-white" />
          Export Masterpiece
        </button>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 bg-[#f0f0f8] relative overflow-hidden flex items-center justify-center p-6 lg:p-12" ref={containerRef}>
          <div className="w-full h-full flex items-center justify-center bg-white rounded-3xl border border-[#e6e6f2] shadow-xl shadow-purple-900/5 overflow-hidden p-6">
            <canvas ref={canvasRef} className="rounded-xl shadow-inner border border-zinc-100" />
          </div>
        </div>

        {/* Tools Sidebar */}
        <div className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-[#e6e6f2] p-6 flex flex-col gap-6 overflow-y-auto shrink-0 z-10 shadow-lg shadow-purple-900/5 justify-between">
          <div className="space-y-6">
            <h2 className="text-md font-extrabold flex items-center gap-2 text-[#1a1a2e]">
              <Type className="w-4.5 h-4.5 text-purple-600" />
              Text Overlays
            </h2>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-zinc-400 tracking-wider block">TEXT OVERLAY CONTENT</label>
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type overlay text here..."
                  className="w-full bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-xl px-4 py-3 text-sm placeholder:text-zinc-400 text-zinc-800"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddText();
                  }}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-zinc-400 tracking-wider block">FONT SIZE PRESETS</label>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-xl px-4 py-3 text-sm text-zinc-800 font-medium"
                >
                  <option value={16}>Tiny (16px)</option>
                  <option value={24}>Small (24px)</option>
                  <option value={36}>Standard (36px)</option>
                  <option value={48}>Large (48px)</option>
                  <option value={72}>Giant (72px)</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-zinc-400 tracking-wider block">PALETTE SWATCHES</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setTextColor(color)}
                      className={`w-7 h-7 rounded-full border transition-all ${textColor === color ? 'ring-2 ring-purple-600 scale-110 shadow-sm' : 'border-zinc-200 hover:border-zinc-300'}`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
              
              <div className="pt-2 space-y-2">
                <button
                  onClick={handleAddText}
                  disabled={!textInput.trim()}
                  className="w-full bg-purple-50 hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed text-purple-700 py-3 rounded-xl font-bold transition-all text-xs border border-purple-100"
                >
                  Add Overlay Object
                </button>
                
                <button
                  onClick={handleClearSelected}
                  className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-3 rounded-xl font-bold transition-all text-xs border border-red-100 flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Selected
                </button>
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t border-[#e6e6f2]">
            <p className="text-[10px] text-zinc-400 text-center leading-relaxed">
              Select any overlay on the canvas to drag, scale, or rotate it. Tap Backspace or click Delete to remove selected overlays.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
