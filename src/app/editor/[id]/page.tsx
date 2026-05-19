'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getGeneration } from '@/lib/gallery';
import { Generation } from '@/types/generation';
import { toast } from 'sonner';
import { Loader2, Type, Download, ChevronLeft, Trash2, Crop, RotateCcw, Check, X } from 'lucide-react';
import { Canvas, FabricImage, IText, Rect } from 'fabric';
import Link from 'next/link';

type Tool = 'text' | 'crop';

export default function EditorPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();

  const [generation, setGeneration] = useState<Generation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);

  // Tools state
  const [activeTool, setActiveTool] = useState<Tool>('text');
  const [textInput, setTextInput] = useState('');
  const [fontSize, setFontSize] = useState(36);
  const [textColor, setTextColor] = useState('#ffffff');
  const [fontStyle, setFontStyle] = useState<'normal' | 'bold' | 'italic'>('normal');

  // Crop state
  const [cropRect, setCropRect] = useState<Rect | null>(null);
  const [isCropActive, setIsCropActive] = useState(false);
  const [baseImageRef, setBaseImageRef] = useState<FabricImage | null>(null);

  const COLORS = ['#ffffff', '#1a1a2e', '#7c3aed', '#3b82f6', '#10b981', '#eab308', '#ef4444', '#f97316'];

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getGeneration(id);
        if (!data.image_url) {
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

    const container = containerRef.current;
    // Use a guaranteed non-zero starting size
    const initWidth = container.clientWidth > 0 ? container.clientWidth : 800;
    const initHeight = container.clientHeight > 0 ? container.clientHeight : 600;

    const canvas = new Canvas(canvasRef.current, {
      width: initWidth,
      height: initHeight,
      backgroundColor: '#1a1a2e',
      selection: true,
    });

    fabricCanvasRef.current = canvas;

    const loadFabricImage = async (cw: number, ch: number) => {
      try {
        const img = await FabricImage.fromURL(generation.image_url!, {
          crossOrigin: 'anonymous',
        });

        const scale = Math.min(
          (cw * 0.9) / (img.width || 1),
          (ch * 0.9) / (img.height || 1)
        );

        img.scale(scale);
        img.set({
          left: (cw - (img.width || 0) * scale) / 2,
          top: (ch - (img.height || 0) * scale) / 2,
          selectable: false,
          evented: false,
          hasBorders: false,
          hasControls: false,
        });

        canvas.add(img);
        canvas.sendObjectToBack(img);
        canvas.renderAll();
        setBaseImageRef(img);
      } catch {
        toast.error('Failed to load image for editing');
      }
    };

    loadFabricImage(initWidth, initHeight);

    // Resize canvas when container resizes
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0 && fabricCanvasRef.current) {
          fabricCanvasRef.current.width = width;
          fabricCanvasRef.current.height = height;
          fabricCanvasRef.current.renderAll();
        }
      }
    });
    resizeObserver.observe(container);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
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
      resizeObserver.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
      canvas.dispose();
    };
  }, [generation]);

  const handleAddText = () => {
    if (!fabricCanvasRef.current || !textInput.trim()) return;
    const canvas = fabricCanvasRef.current;

    const text = new IText(textInput, {
      left: (canvas.width || 800) / 2,
      top: (canvas.height || 600) / 2,
      fontFamily: 'system-ui, sans-serif',
      fontSize: fontSize,
      fill: textColor,
      fontWeight: fontStyle === 'bold' ? 'bold' : 'normal',
      fontStyle: fontStyle === 'italic' ? 'italic' : 'normal',
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
    toast.success('Text overlay added!');
  };

  const handleStartCrop = () => {
    if (!fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;
    const cw = canvas.width || 800;
    const ch = canvas.height || 600;

    // Remove any existing crop rect
    if (cropRect) {
      canvas.remove(cropRect);
    }

    const margin = 40;
    const rect = new Rect({
      left: margin,
      top: margin,
      width: cw - margin * 2,
      height: ch - margin * 2,
      fill: 'transparent',
      stroke: '#7c3aed',
      strokeWidth: 2,
      strokeDashArray: [8, 4],
      cornerColor: '#7c3aed',
      cornerStyle: 'circle',
      cornerSize: 12,
      transparentCorners: false,
      selectable: true,
      hasRotatingPoint: false,
    });

    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
    setCropRect(rect);
    setIsCropActive(true);
    toast.info('Drag the crop rectangle to position, then click Apply Crop.');
  };

  const handleApplyCrop = () => {
    if (!fabricCanvasRef.current || !cropRect || !baseImageRef) {
      toast.error('Nothing to crop.');
      return;
    }

    const canvas = fabricCanvasRef.current;
    const cropBounds = cropRect.getBoundingRect();

    // Export the cropped region
    const dataUrl = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 1,
      left: cropBounds.left,
      top: cropBounds.top,
      width: cropBounds.width,
      height: cropBounds.height,
    });

    // Load cropped image back as new base
    FabricImage.fromURL(dataUrl, {}).then((newImg) => {
      // Remove all objects and restart with cropped image
      canvas.clear();
      canvas.backgroundColor = '#1a1a2e';
      canvas.renderAll();

      const cw = canvas.width || 800;
      const ch = canvas.height || 600;
      const scale = Math.min(cw / (newImg.width || 1), ch / (newImg.height || 1));

      newImg.scale(scale * 0.95);
      newImg.set({
        left: (cw - (newImg.width || 0) * scale * 0.95) / 2,
        top: (ch - (newImg.height || 0) * scale * 0.95) / 2,
        selectable: false,
        evented: false,
        hasBorders: false,
        hasControls: false,
      });

      canvas.add(newImg);
      canvas.sendObjectToBack(newImg);
      canvas.renderAll();
      setBaseImageRef(newImg);
    });

    canvas.remove(cropRect);
    setCropRect(null);
    setIsCropActive(false);
    toast.success('Crop applied!');
  };

  const handleCancelCrop = () => {
    if (!fabricCanvasRef.current || !cropRect) return;
    fabricCanvasRef.current.remove(cropRect);
    fabricCanvasRef.current.renderAll();
    setCropRect(null);
    setIsCropActive(false);
    toast.info('Crop cancelled.');
  };

  const handleResetCanvas = () => {
    if (!fabricCanvasRef.current || !generation?.image_url) return;
    const canvas = fabricCanvasRef.current;
    canvas.clear();
    canvas.backgroundColor = '#1a1a2e';
    canvas.renderAll();
    setCropRect(null);
    setIsCropActive(false);

    FabricImage.fromURL(generation.image_url, { crossOrigin: 'anonymous' }).then((img) => {
      const cw = canvas.width || 800;
      const ch = canvas.height || 600;
      const scale = Math.min((cw * 0.9) / (img.width || 1), (ch * 0.9) / (img.height || 1));
      img.scale(scale);
      img.set({
        left: (cw - (img.width || 0) * scale) / 2,
        top: (ch - (img.height || 0) * scale) / 2,
        selectable: false,
        evented: false,
        hasBorders: false,
        hasControls: false,
      });
      canvas.add(img);
      canvas.sendObjectToBack(img);
      canvas.renderAll();
      setBaseImageRef(img);
      toast.success('Canvas reset to original image.');
    });
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
        multiplier: 2,
      });
      const link = document.createElement('a');
      link.download = `genstudio-edit-${generation?.id || 'image'}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Exported high-res PNG successfully!');
    } catch {
      toast.error('Export failed. Trying direct download...');
      handleDirectDownload();
    }
  };

  const handleDirectDownload = async () => {
    if (!generation?.image_url) return;
    try {
      const response = await fetch(generation.image_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `genstudio-original-${generation.id}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Original image downloaded!');
    } catch {
      toast.error('Download failed. Please right-click the image to save.');
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
    <div className="flex flex-col h-screen bg-[#0f0f1a] text-white font-sans overflow-hidden">
      {/* Header bar */}
      <div className="border-b border-white/10 bg-[#1a1a2e]/90 backdrop-blur-sm px-6 py-3.5 flex items-center justify-between shadow-lg z-10 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 font-bold text-sm">
            <ChevronLeft className="w-4 h-4" />
            Studio
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm tracking-tight text-white">Canvas Editor</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 bg-purple-600/20 text-purple-400 rounded-full border border-purple-500/30">
              Powered by Fabric.js
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDirectDownload}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white px-4 py-2 rounded-full font-bold transition-all text-xs border border-white/10"
          >
            <Download className="w-3.5 h-3.5" />
            Download Original
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-5 py-2 rounded-full font-bold transition-all shadow-md shadow-purple-500/20 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export Edited PNG
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
        {/* Canvas Area */}
        <div className="flex-1 bg-[#0f0f1a] relative overflow-hidden flex items-center justify-center p-4" ref={containerRef}>
          <canvas ref={canvasRef} className="rounded-xl shadow-2xl border border-white/10" />
        </div>

        {/* Tools Sidebar */}
        <div className="w-full lg:w-80 bg-[#1a1a2e] border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col shrink-0 overflow-hidden shadow-2xl">
          {/* Tool Tabs */}
          <div className="flex border-b border-white/10 shrink-0">
            <button
              onClick={() => setActiveTool('text')}
              className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                activeTool === 'text'
                  ? 'bg-purple-600/20 text-purple-400 border-b-2 border-purple-500'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              Text Overlay
            </button>
            <button
              onClick={() => setActiveTool('crop')}
              className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                activeTool === 'crop'
                  ? 'bg-purple-600/20 text-purple-400 border-b-2 border-purple-500'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
              }`}
            >
              <Crop className="w-3.5 h-3.5" />
              Crop
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {activeTool === 'text' && (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 tracking-widest block">TEXT CONTENT</label>
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Type overlay text..."
                    className="w-full bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-xl px-4 py-3 text-sm placeholder:text-zinc-600 text-white"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddText(); }}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 tracking-widest block">FONT SIZE</label>
                  <select
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-xl px-4 py-3 text-sm text-white"
                  >
                    <option value={16} className="bg-[#1a1a2e]">Tiny (16px)</option>
                    <option value={24} className="bg-[#1a1a2e]">Small (24px)</option>
                    <option value={36} className="bg-[#1a1a2e]">Standard (36px)</option>
                    <option value={48} className="bg-[#1a1a2e]">Large (48px)</option>
                    <option value={72} className="bg-[#1a1a2e]">Giant (72px)</option>
                    <option value={96} className="bg-[#1a1a2e]">Huge (96px)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 tracking-widest block">FONT STYLE</label>
                  <div className="flex gap-2">
                    {(['normal', 'bold', 'italic'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setFontStyle(s)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all capitalize ${
                          fontStyle === s
                            ? 'bg-purple-600 border-purple-600 text-white'
                            : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 tracking-widest block">TEXT COLOR</label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setTextColor(color)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          textColor === color
                            ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-[#1a1a2e] scale-110'
                            : 'border-white/20 hover:border-white/50'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                    <label
                      className="w-8 h-8 rounded-full border-2 border-white/20 flex items-center justify-center cursor-pointer hover:border-white/50 transition-all overflow-hidden"
                      title="Custom color"
                    >
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-10 h-10 opacity-0 absolute"
                      />
                      <span className="text-xs text-zinc-400">+</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleAddText}
                    disabled={!textInput.trim()}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition-all text-xs"
                  >
                    Add Text to Canvas
                  </button>
                  <button
                    onClick={handleClearSelected}
                    className="w-full bg-white/5 hover:bg-red-500/20 text-red-400 py-3 rounded-xl font-bold transition-all text-xs border border-white/10 hover:border-red-500/30 flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Selected
                  </button>
                </div>
              </>
            )}

            {activeTool === 'crop' && (
              <div className="space-y-4">
                <div className="p-4 bg-purple-600/10 border border-purple-500/20 rounded-xl space-y-2">
                  <p className="text-xs font-bold text-purple-400">How to Crop</p>
                  <ol className="text-[11px] text-zinc-400 space-y-1.5 list-decimal list-inside leading-relaxed">
                    <li>Click &quot;Start Crop&quot; to draw a selection</li>
                    <li>Drag the handles to resize the crop area</li>
                    <li>Click &quot;Apply Crop&quot; to commit</li>
                  </ol>
                </div>

                {!isCropActive ? (
                  <button
                    onClick={handleStartCrop}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-2"
                  >
                    <Crop className="w-3.5 h-3.5" />
                    Start Crop Selection
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={handleApplyCrop}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-2"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Apply Crop
                    </button>
                    <button
                      onClick={handleCancelCrop}
                      className="w-full bg-white/5 hover:bg-white/10 text-zinc-400 py-3 rounded-xl font-bold transition-all text-xs border border-white/10 flex items-center justify-center gap-2"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                  </div>
                )}

                <div className="pt-2 border-t border-white/10">
                  <button
                    onClick={handleResetCanvas}
                    className="w-full bg-white/5 hover:bg-white/10 text-zinc-400 py-3 rounded-xl font-bold transition-all text-xs border border-white/10 flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset to Original
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom hint */}
          <div className="px-5 py-4 border-t border-white/10 shrink-0">
            <p className="text-[10px] text-zinc-600 text-center leading-relaxed">
              Select objects on the canvas to drag, scale, or rotate. Press Backspace to delete selected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
