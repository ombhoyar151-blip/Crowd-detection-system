export type DetectionMode = 'image' | 'video' | 'webcam';

export type CrowdDensity = 'Low' | 'Medium' | 'High';

export type Theme = 'light' | 'dark';

export interface DetectionResult {
  id: string;
  mode: DetectionMode;
  personCount: number;
  density: CrowdDensity;
  confidence: number;
  processingTimeMs: number;
  timestamp: string;
  sourceName: string;
  annotatedImage?: string;
  detections: BoundingBox[];
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface HistoryFilters {
  mode?: DetectionMode;
  density?: CrowdDensity;
  minCount?: number;
  maxCount?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface DashboardStats {
  totalDetections: number;
  totalPersons: number;
  avgConfidence: number;
  avgProcessingTime: number;
  densityBreakdown: { Low: number; Medium: number; High: number };
  modeBreakdown: { image: number; video: number; webcam: number };
  recentDetections: DetectionResult[];
  timeline: { label: string; count: number; density: CrowdDensity }[];
}
