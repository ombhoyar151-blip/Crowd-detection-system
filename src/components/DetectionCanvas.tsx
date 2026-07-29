import { useEffect, useRef, useState } from 'react';
import { ZoomIn, X } from 'lucide-react';
import type { DetectionResult } from '@/types';
import { densityColor, formatDateTime, formatDuration } from '@/lib/utils';
import { Badge } from './ui';

export function DetectionCanvas({
  result,
  imageUrl,
  className = '',
}: {
  result: DetectionResult;
  imageUrl?: string;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = container.clientWidth;
    const h = Math.round(w * 0.6);
    canvas.width = w;
    canvas.height = h;

    const drawScene = (img?: HTMLImageElement) => {
      ctx.clearRect(0, 0, w, h);
      if (img) {
        const scale = Math.max(w / img.width, h / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      } else {
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, '#1e293b');
        grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        for (let x = 0; x < w; x += 40) {
          for (let y = 0; y < h; y += 40) {
            ctx.fillRect(x, y, 1, 1);
          }
        }
        ctx.fillStyle = 'rgba(148,163,184,0.5)';
        ctx.font = '13px Inter, sans-serif';
        ctx.fillText('Simulated detection view', 16, 28);
      }
      drawBoxes(ctx, w, h, result);
    };

    if (imageUrl) {
      const img = new Image();
      img.onload = () => drawScene(img);
      img.onerror = () => drawScene();
      img.src = imageUrl;
    } else {
      drawScene();
    }
  }, [result, imageUrl]);

  return (
    <>
      <div
        ref={containerRef}
        className={`relative overflow-hidden rounded-xl border border-gray-200 bg-gray-900 dark:border-gray-700 ${className}`}
      >
        <canvas ref={canvasRef} className="block w-full" />
        <button
          onClick={() => setZoom(true)}
          className="absolute right-3 top-3 rounded-lg bg-black/40 p-2 text-white backdrop-blur transition hover:bg-black/60"
          aria-label="Zoom"
        >
          <ZoomIn size={16} />
        </button>
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <Badge className="bg-black/50 text-white backdrop-blur">
            {result.personCount} persons
          </Badge>
          <Badge
            className={`bg-black/50 text-white backdrop-blur ${densityColor(result.density).text}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${densityColor(result.density).dot}`}
            />
            {result.density}
          </Badge>
        </div>
      </div>
      {zoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in"
          onClick={() => setZoom(false)}
        >
          <button className="absolute right-4 top-4 text-white/80 hover:text-white">
            <X size={24} />
          </button>
          <div className="max-h-[90vh] w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <DetectionCanvas result={result} imageUrl={imageUrl} />
          </div>
        </div>
      )}
    </>
  );
}

function drawBoxes(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  result: DetectionResult
) {
  for (const box of result.detections) {
    const x = box.x * w;
    const y = box.y * h;
    const bw = box.width * w;
    const bh = box.height * h;
    const color = densityColor(result.density).hex;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, bw, bh);
    ctx.fillStyle = `${color}33`;
    ctx.fillRect(x, y, bw, bh);
    const label = `${(box.confidence * 100).toFixed(0)}%`;
    ctx.font = '11px JetBrains Mono, monospace';
    const tw = ctx.measureText(label).width + 8;
    ctx.fillStyle = color;
    ctx.fillRect(x, y - 18, tw, 16);
    ctx.fillStyle = '#fff';
    ctx.fillText(label, x + 4, y - 5);
  }
}

export function ResultMetrics({ result }: { result: DetectionResult }) {
  const dc = densityColor(result.density);
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <MetricTile label="Person Count" value={String(result.personCount)} />
      <MetricTile
        label="Density"
        value={result.density}
        colorClass={dc.text}
        dotClass={dc.dot}
      />
      <MetricTile
        label="Confidence"
        value={`${(result.confidence * 100).toFixed(1)}%`}
      />
      <MetricTile
        label="Processing Time"
        value={formatDuration(result.processingTimeMs)}
      />
      <div className="col-span-2 sm:col-span-4 text-xs text-gray-500 dark:text-gray-400">
        {formatDateTime(result.timestamp)} · {result.sourceName}
      </div>
    </div>
  );
}

function MetricTile({
  label,
  value,
  colorClass,
  dotClass,
}: {
  label: string;
  value: string;
  colorClass?: string;
  dotClass?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p
        className={`mt-1 flex items-center gap-1.5 text-lg font-bold ${colorClass || 'text-gray-900 dark:text-white'}`}
      >
        {dotClass && (
          <span className={`h-2 w-2 rounded-full ${dotClass}`} />
        )}
        {value}
      </p>
    </div>
  );
}
