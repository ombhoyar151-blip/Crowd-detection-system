import type { DetectionResult, CrowdDensity, BoundingBox } from '@/types';

export function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function densityForCount(count: number): CrowdDensity {
  if (count <= 5) return 'Low';
  if (count <= 20) return 'Medium';
  return 'High';
}

export function densityColor(density: CrowdDensity): {
  text: string;
  bg: string;
  border: string;
  dot: string;
  hex: string;
} {
  switch (density) {
    case 'Low':
      return {
        text: 'text-emerald-700 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-500/10',
        border: 'border-emerald-200 dark:border-emerald-500/30',
        dot: 'bg-emerald-500',
        hex: '#10b981',
      };
    case 'Medium':
      return {
        text: 'text-amber-700 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-500/10',
        border: 'border-amber-200 dark:border-amber-500/30',
        dot: 'bg-amber-500',
        hex: '#f59e0b',
      };
    case 'High':
      return {
        text: 'text-rose-700 dark:text-rose-400',
        bg: 'bg-rose-50 dark:bg-rose-500/10',
        border: 'border-rose-200 dark:border-rose-500/30',
        dot: 'bg-rose-500',
        hex: '#ef4444',
      };
  }
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateBoxes(
  count: number,
  confidence: number,
  seed: number
): BoundingBox[] {
  const rng = seededRandom(seed);
  const boxes: BoundingBox[] = [];
  for (let i = 0; i < count; i++) {
    const w = 0.05 + rng() * 0.12;
    const h = 0.12 + rng() * 0.2;
    boxes.push({
      x: 0.02 + rng() * (1 - w - 0.04),
      y: 0.1 + rng() * (1 - h - 0.2),
      width: w,
      height: h,
      confidence: Math.min(
        0.99,
        Math.max(0.5, confidence + (rng() - 0.5) * 0.2)
      ),
    });
  }
  return boxes;
}

export function createDemoDetection(
  mode: 'image' | 'video' | 'webcam',
  sourceName: string,
  seed?: number
): DetectionResult {
  const s = seed ?? Math.floor(Math.random() * 1000000);
  const rng = seededRandom(s);
  const personCount = Math.floor(rng() * 35) + 1;
  const confidence = 0.72 + rng() * 0.27;
  const processingTime = 40 + rng() * 360;
  const density = densityForCount(personCount);
  return {
    id: uuid(),
    mode,
    personCount,
    density,
    confidence,
    processingTimeMs: processingTime,
    timestamp: new Date().toISOString(),
    sourceName,
    detections: generateBoxes(personCount, confidence, s),
  };
}

export function getInitialDetections(): DetectionResult[] {
  const now = Date.now();
  const samples: Array<{
    mode: 'image' | 'video' | 'webcam';
    name: string;
    count: number;
    conf: number;
    ms: number;
    minsAgo: number;
  }> = [
    { mode: 'image', name: 'mall_entrance.jpg', count: 3, conf: 0.91, ms: 120, minsAgo: 3 },
    { mode: 'video', name: 'station_platform.mp4', count: 42, conf: 0.84, ms: 8430, minsAgo: 22 },
    { mode: 'webcam', name: 'office_cam_01', count: 7, conf: 0.88, ms: 95, minsAgo: 47 },
    { mode: 'image', name: 'stadium_crowd.jpg', count: 58, conf: 0.79, ms: 210, minsAgo: 95 },
    { mode: 'webcam', name: 'lobby_cam', count: 2, conf: 0.93, ms: 78, minsAgo: 180 },
    { mode: 'video', name: 'park_walkway.mp4', count: 14, conf: 0.86, ms: 6200, minsAgo: 240 },
    { mode: 'image', name: 'crosswalk_noon.jpg', count: 11, conf: 0.82, ms: 145, minsAgo: 320 },
    { mode: 'webcam', name: 'entrance_cam', count: 26, conf: 0.77, ms: 88, minsAgo: 410 },
    { mode: 'image', name: 'beach_aerial.jpg', count: 5, conf: 0.9, ms: 110, minsAgo: 600 },
    { mode: 'video', name: 'festival_ground.mp4', count: 73, conf: 0.74, ms: 11200, minsAgo: 720 },
  ];
  return samples.map((s, i) => {
    const density = densityForCount(s.count);
    const ts = new Date(now - s.minsAgo * 60 * 1000).toISOString();
    return {
      id: uuid(),
      mode: s.mode,
      personCount: s.count,
      density,
      confidence: s.conf,
      processingTimeMs: s.ms,
      timestamp: ts,
      sourceName: s.name,
      detections: generateBoxes(s.count, s.conf, i * 1000 + 7),
    };
  });
}

export function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function toCSV(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number) => {
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','));
  }
  return lines.join('\n');
}
