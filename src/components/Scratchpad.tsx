import React, { useRef, useState, useEffect } from "react";
import { Trash2, Edit2, Eraser, X, Grid, Sliders, RefreshCw, Eye } from "lucide-react";

interface ScratchpadProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Scratchpad({ isOpen, onClose }: ScratchpadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState<string>("#2563EB"); // Default to Royal Blue
  const [brushSize, setBrushSize] = useState<number>(3);
  const [isEraser, setIsEraser] = useState<boolean>(false);
  const [isGrid, setIsGrid] = useState<boolean>(true);

  // Resize canvas when opened or container size changes
  useEffect(() => {
    if (!isOpen || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    
    // Set internal resolution matching the client visual size
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Redraw background if grid is enabled
    drawGrid();

    // Set brush attributes
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }

    // ResizeObserver according to responsive design guidelines
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      
      // Keep old drawings by baking them into a temp canvas or just resizing
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d");
      if (tempCtx) {
        tempCtx.drawImage(canvas, 0, 0);
      }

      canvas.width = width;
      canvas.height = height;

      drawGrid();

      const newCtx = canvas.getContext("2d");
      if (newCtx) {
        newCtx.lineCap = "round";
        newCtx.lineJoin = "round";
        newCtx.drawImage(tempCanvas, 0, 0);
      }
    });

    resizeObserver.observe(container);
    return () => {
      resizeObserver.disconnect();
    };
  }, [isOpen, isGrid]);

  const drawGrid = () => {
    const canvas = canvasRef.current;
    if (!canvas || !isGrid) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.strokeStyle = "#F1F5F9";
    ctx.lineWidth = 1;

    const gridSize = 25;
    const w = canvas.width;
    const h = canvas.height;

    // Draw vertical lines
    for (let x = gridSize; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = gridSize; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.restore();
  };

  // Canvas drawing handlers (mouse + touch support)
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);

    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    e.preventDefault(); // prevents dual touch events scrolling
    const pos = getPos(e);

    ctx.lineWidth = brushSize;
    ctx.strokeStyle = isEraser ? "#FFFFFF" : color;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    // Check if Touch Event
    if ("touches" in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  // Utility Actions
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden w-full max-w-2xl h-[520px] flex flex-col animate-scaleUp">
        
        {/* Header toolbar */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-brand-blue animate-pulse" />
            <h3 className="font-display font-extrabold text-xs text-slate-800 uppercase tracking-widest">
              Digital Scribble Scratchpad
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Eraser / Draw selector toggles */}
            <div className="flex bg-slate-200/50 p-0.5 rounded-lg text-xs font-bold leading-none select-none">
              <button
                onClick={() => setIsEraser(false)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition cursor-pointer ${
                  !isEraser ? "bg-white text-brand-blue shadow-xs" : "text-slate-550 hover:text-slate-800"
                }`}
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Draw</span>
              </button>
              <button
                onClick={() => setIsEraser(true)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition cursor-pointer ${
                  isEraser ? "bg-white text-brand-blue shadow-xs" : "text-slate-550 hover:text-slate-800"
                }`}
              >
                <Eraser className="h-3.5 w-3.5" />
                <span>Erase</span>
              </button>
            </div>

            {/* Clear Board */}
            <button
              onClick={clearCanvas}
              title="Clear Scratchpad Screen"
              className="p-2 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            {/* Close modal */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Sub-toolbar controls (Colors & Brush size) */}
        <div className="px-5 py-3 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Preset Palettes */}
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Palette:</span>
            <div className="flex gap-1.5">
              {[
                { hex: "#22C55E", name: "Green" },
                { hex: "#2563EB", name: "Blue" },
                { hex: "#EF4444", name: "Red" },
                { hex: "#0F172A", name: "Slate Black" },
              ].map((c) => (
                <button
                  key={c.hex}
                  onClick={() => {
                    setColor(c.hex);
                    setIsEraser(false);
                  }}
                  style={{ backgroundColor: c.hex }}
                  className={`h-5 w-5 rounded-full border-2 transition-all cursor-pointer ${
                    color === c.hex && !isEraser
                      ? "border-slate-800 scale-110 shadow-xs"
                      : "border-transparent hover:border-slate-300"
                  }`}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Stroke Slider */}
          <div className="flex items-center gap-2">
            <Sliders className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stroke size:</span>
            <input
              type="range"
              min="1"
              max="10"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
              className="w-20 accent-brand-blue cursor-pointer h-1 rounded-lg"
            />
            <span className="font-mono text-[10px] font-bold text-slate-500 w-4">{brushSize}px</span>
          </div>

          {/* Draft Grid background switch */}
          <button
            onClick={() => setIsGrid(!isGrid)}
            className={`flex items-center gap-1 border rounded-lg px-2.5 py-1 transition cursor-pointer font-bold select-none ${
              isGrid ? "bg-slate-100 text-brand-blue border-slate-200" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Grid className="h-3.5 w-3.5" />
            <span>Quadratic Grid Paper</span>
          </button>
        </div>

        {/* Drawing Workspace Canvas */}
        <div 
          ref={containerRef} 
          className="flex-1 bg-white relative overflow-hidden"
          style={{ cursor: isEraser ? "cell" : "crosshair" }}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="absolute top-0 left-0 w-full h-full block"
          />
        </div>

        {/* Scratchpad guidelines footer */}
        <div className="bg-slate-50 border-t border-slate-105 px-5 py-2.5 text-[10px] text-slate-400 font-sans flex items-center justify-between">
          <span>Draw / scribble freeform equations using stylus, finger or pointer.</span>
          <span className="font-mono font-bold text-[9px] text-slate-405">OFFLINE SANDBOX MODE</span>
        </div>

      </div>
    </div>
  );
}
