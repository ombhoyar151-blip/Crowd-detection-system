import type {
  DetectionResult,
  LoginRequest,
  SignupRequest,
  AuthResponse,
  User,
  DashboardStats,
  CrowdDensity,
} from '@/types';
import { API_BASE_URL } from './config';
import { createDemoDetection, getInitialDetections, uuid } from './utils';

const TOKEN_KEY = 'cds_token';
const USER_KEY = 'cds_user';
const HISTORY_KEY = 'cds_history';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...options.headers,
    },
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body.detail || body.message || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function getHistory(): DetectionResult[] {
  const raw = localStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as DetectionResult[];
  } catch {
    return [];
  }
}

function saveHistory(items: DetectionResult[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 200)));
}

if (!API_BASE_URL && getHistory().length === 0) {
  saveHistory(getInitialDetections());
}

function ensureDemoHistory(): DetectionResult[] {
  const items = getHistory();
  if (items.length === 0) {
    const initial = getInitialDetections();
    saveHistory(initial);
    return initial;
  }
  return items;
}

export const api = {
  async login(req: LoginRequest): Promise<AuthResponse> {
    if (!API_BASE_URL) {
      return demoAuth(req.email, req.password);
    }
    return request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  async signup(req: SignupRequest): Promise<AuthResponse> {
    if (!API_BASE_URL) {
      return demoAuth(req.email, req.password, req.name);
    }
    return request<AuthResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  async detectImage(
    file: File,
    onProgress?: (pct: number) => void
  ): Promise<DetectionResult> {
    if (!API_BASE_URL) {
      return simulateDetect('image', file.name, onProgress);
    }
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${API_BASE_URL}/api/detect/image`, {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    });
    if (!res.ok) throw new Error('Detection failed');
    const data = await res.json();
    return data as DetectionResult;
  },

  async detectVideo(
    file: File,
    onProgress?: (pct: number) => void
  ): Promise<DetectionResult> {
    if (!API_BASE_URL) {
      return simulateDetect('video', file.name, onProgress, 1200);
    }
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${API_BASE_URL}/api/detect/video`, {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    });
    if (!res.ok) throw new Error('Detection failed');
    const data = await res.json();
    return data as DetectionResult;
  },

  async detectWebcamFrame(
    onProgress?: (pct: number) => void
  ): Promise<DetectionResult> {
    if (!API_BASE_URL) {
      return simulateDetect('webcam', `webcam_${formatNow()}`, onProgress, 400);
    }
    const form = new FormData();
    form.append('file', webcamFrameBlob());
    const res = await fetch(`${API_BASE_URL}/api/detect/image`, {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    });
    if (!res.ok) throw new Error('Detection failed');
    const data = await res.json();
    return data as DetectionResult;
  },

  async getHistory(): Promise<DetectionResult[]> {
    if (!API_BASE_URL) {
      return ensureDemoHistory();
    }
    return request<DetectionResult[]>('/api/history');
  },

  async deleteDetection(id: string): Promise<void> {
    if (!API_BASE_URL) {
      const items = getHistory().filter((d) => d.id !== id);
      saveHistory(items);
      return;
    }
    await request(`/api/history/${id}`, { method: 'DELETE' });
  },

  async clearHistory(): Promise<void> {
    if (!API_BASE_URL) {
      saveHistory([]);
      return;
    }
    await request('/api/history', { method: 'DELETE' });
  },

  async getDashboardStats(): Promise<DashboardStats> {
    if (!API_BASE_URL) {
      return demoDashboard();
    }
    return request<DashboardStats>('/api/dashboard');
  },

  async reportCSV(): Promise<string> {
    if (!API_BASE_URL) {
      return demoCSV();
    }
    const res = await fetch(`${API_BASE_URL}/api/reports/csv`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Report failed');
    return res.text();
  },

  async reportPDF(): Promise<Blob> {
    if (!API_BASE_URL) {
      throw new Error('PDF reports require a connected backend.');
    }
    const res = await fetch(`${API_BASE_URL}/api/reports/pdf`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Report failed');
    return res.blob();
  },
};

function demoAuth(email: string, _password: string, name?: string): AuthResponse {
  const user: User = {
    id: uuid(),
    email,
    name: name || email.split('@')[0],
    createdAt: new Date().toISOString(),
  };
  const token = `demo.${btoa(email)}.${Date.now()}`;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return { token, user };
}

async function simulateDetect(
  mode: 'image' | 'video' | 'webcam',
  sourceName: string,
  onProgress?: (pct: number) => void,
  delay = 600
): Promise<DetectionResult> {
  const steps = 20;
  for (let i = 1; i <= steps; i++) {
    await sleep(delay / steps);
    onProgress?.((i / steps) * 100);
  }
  const result = createDemoDetection(mode, sourceName);
  const items = [result, ...getHistory()];
  saveHistory(items);
  return result;
}

function demoDashboard(): DashboardStats {
  const items = ensureDemoHistory();
  const totalPersons = items.reduce((s, d) => s + d.personCount, 0);
  const avgConfidence =
    items.reduce((s, d) => s + d.confidence, 0) / items.length;
  const avgProcessingTime =
    items.reduce((s, d) => s + d.processingTimeMs, 0) / items.length;
  const densityBreakdown = { Low: 0, Medium: 0, High: 0 };
  const modeBreakdown = { image: 0, video: 0, webcam: 0 };
  for (const d of items) {
    densityBreakdown[d.density]++;
    modeBreakdown[d.mode]++;
  }
  const sorted = [...items].sort(
    (a, b) => +new Date(a.timestamp) - +new Date(b.timestamp)
  );
  const timeline = sorted.map((d) => ({
    label: new Date(d.timestamp).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    }),
    count: d.personCount,
    density: d.density as CrowdDensity,
  }));
  const recentDetections = [...items]
    .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
    .slice(0, 6);
  return {
    totalDetections: items.length,
    totalPersons,
    avgConfidence,
    avgProcessingTime,
    densityBreakdown,
    modeBreakdown,
    recentDetections,
    timeline,
  };
}

function demoCSV(): string {
  const items = ensureDemoHistory();
  const rows = items.map((d) => ({
    id: d.id,
    timestamp: d.timestamp,
    mode: d.mode,
    source: d.sourceName,
    person_count: d.personCount,
    density: d.density,
    confidence: d.confidence.toFixed(4),
    processing_time_ms: Math.round(d.processingTimeMs),
  }));
  const headers = Object.keys(rows[0] || {
    id: '',
    timestamp: '',
    mode: '',
    source: '',
    person_count: '',
    density: '',
    confidence: '',
    processing_time_ms: '',
  });
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(headers.map((h) => r[h as keyof typeof r]).join(','));
  }
  return lines.join('\n');
}

function webcamFrameBlob(): Blob {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(0, 0, 640, 480);
  ctx.fillStyle = '#555';
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.arc(80 + i * 70, 240 + Math.sin(i) * 60, 22, 0, Math.PI * 2);
    ctx.fill();
  }
  return dataURLtoBlob(canvas.toDataURL('image/jpeg', 0.8));
}

function dataURLtoBlob(dataURL: string): Blob {
  const [meta, b64] = dataURL.split(',');
  const mime = meta.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function formatNow(): string {
  return new Date().toLocaleTimeString().replace(/[: ]/g, '-').slice(0, 19);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
