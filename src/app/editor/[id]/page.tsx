'use client';

import { useEffect, useRef, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { getGeneration } from '@/lib/gallery';
import { Generation } from '@/types/generation';
import { toast } from 'sonner';
import { Loader2, Type, Download, ChevronLeft } from 'lucide-react';
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
  const [textColor, setTextColor] = useState('#ffffff');
  
  const COLORS = ['#ffffff', '#000000', '#ef4444', '#3b82f6', '#eab308'];

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getGeneration(id);
        if (data.status !== 'done' || !data.image_url) {
          toast.error('Image not ready for editing');
          router.push('/gallery');
          return;
        }
        setGeneration(data);
      } catch (error) {
        toast.error('Failed to load generation');
        router.push('/gallery');
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
      backgroundColor: '#18181b', // zinc-900
    });
    
    fabricCanvasRef.current = canvas;

    const loadFabricImage = async () => {
      try {
        const imgElement = document.createElement('img');
        imgElement.crossOrigin = 'anonymous';
        imgElement.src = generation.image_url!;
        
        imgElement.onload = () => {
          // @ts-ignore
          const img = new (fabric.FabricImage || fabric.Image)(imgElement);
          
          // Calculate scale to fit canvas
          const canvasWidth = canvas.width || 800;
          const canvasHeight = canvas.height || 600;
          
          // scale to fit within bounds
          const scale = Math.min(
            (canvasWidth * 0.9) / img.width!,
            (canvasHeight * 0.9) / img.height!
          );
          
          img.scale(scale);
          
          // Center the image
          img.set({
            left: (canvasWidth - img.width! * scale) / 2,
            top: (canvasHeight - img.height! * scale) / 2,
            selectable: false, // Background image usually shouldn't be movable, but let's allow it or not? Let's make it fixed background.
            evented: false,
          });
          
          canvas.add(img);
          canvas.sendToBack(img);
          canvas.renderAll();
        };
      } catch (e) {
        console.error('Failed to load image into canvas:', e);
        toast.error('Failed to load image for editing');
      }
    };

    loadFabricImage();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !fabricCanvasRef.current) return;
      
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      
      fabricCanvasRef.current.setWidth(newWidth);
      fabricCanvasRef.current.setHeight(newHeight);
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
    
    // @ts-ignore
    const text = new (fabric.IText || fabric.Text)(textInput, {
      left: (canvas.width || 800) / 2,
      top: (canvas.height || 600) / 2,
      fontFamily: 'sans-serif',
      fontSize: fontSize,
      fill: textColor,
      originX: 'center',
      originY: 'center',
      transparentCorners: false,
      cornerColor: '#3b82f6',
      cornerStyle: 'circle',
      borderColor: '#3b82f6',
      cornerSize: 10,
    });
    
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    setTextInput('');
  };

  const handleExport = () => {
    if (!fabricCanvasRef.current) return;
    
    try {
      const dataUrl = fabricCanvasRef.current.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1 // We can increase this for higher res
      });
      
      const link = document.createElement('a');
      link.download = `genstudio-${generation?.id}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Image exported successfully!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to export. This can happen with cross-origin images.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-50">
        <Loader2 className="w-12 h-12 text-zinc-500 animate-spin" />
      </div>
    );
  }

  if (!generation) return null;

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] bg-zinc-950 text-zinc-50">
      {/* Header bar */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/gallery" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="h-4 w-px bg-zinc-800"></div>
          <h1 className="font-semibold text-lg truncate max-w-sm">Editing Image</h1>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors text-sm"
        >
          <Download className="w-4 h-4" />
          Export PNG
        </button>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 bg-zinc-950 relative overflow-hidden flex items-center justify-center p-4 lg:p-8" ref={containerRef}>
          <canvas ref={canvasRef} className="rounded-lg shadow-2xl border border-zinc-800" />
        </div>

        {/* Tools Sidebar */}
        <div className="w-full lg:w-80 bg-zinc-900 border-t lg:border-t-0 lg:border-l border-zinc-800 p-6 flex flex-col gap-8 overflow-y-auto shrink-0">
          <div>
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Type className="w-5 h-5 text-blue-500" />
              Text Overlay
            </h2>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Content</label>
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Enter text..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-100"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddText();
                  }}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Font Size</label>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-100"
                >
                  <option value={16}>Small (16px)</option>
                  <option value={24}>Medium (24px)</option>
                  <option value={36}>Large (36px)</option>
                  <option value={48}>X-Large (48px)</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Color</label>
                <div className="flex gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setTextColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${textColor === color ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-zinc-700 hover:border-zinc-500'}`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
              
              <button
                onClick={handleAddText}
                disabled={!textInput.trim()}
                className="w-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-md font-medium transition-colors text-sm"
              >
                Add Text
              </button>
            </div>
          </div>
          
          <div className="mt-auto pt-6 border-t border-zinc-800">
            <p className="text-xs text-zinc-500 text-center">
              Select text on canvas to drag, resize, or rotate. Use delete key to remove.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
