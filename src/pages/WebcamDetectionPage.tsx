import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Webcam as WebcamIcon,
  Play,
  Square,
  Camera,
  RefreshCw,
  VideoOff,
} from 'lucide-react';
import type { DetectionResult } from '@/types';
import { api } from '@/lib/api';
import { DetectionCanvas, ResultMetrics } from '@/components/DetectionCanvas';
import { Button, EmptyState, Spinner } from '@/components/ui';
import { formatTime } from '@/lib/utils';

export function WebcamDetectionPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoDetect, setAutoDetect] = useState(false);
  const [liveHistory, setLiveHistory] = useState<DetectionResult[]>([]);
  const autoTimer = useRef<number | null>(null);

  const startCamera = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setActive(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not access webcam. Please grant camera permission.'
      );
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setActive(false);
    setAutoDetect(false);
  }, []);

  const captureAndDetect = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await api.detectWebcamFrame();
      setResult(r);
      setLiveHistory((prev) => [r, ...prev].slice(0, 12));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Detection failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoDetect && active) {
      autoTimer.current = window.setInterval(() => {
        if (!loading) captureAndDetect();
      }, 3000);
    } else if (autoTimer.current) {
      clearInterval(autoTimer.current);
      autoTimer.current = null;
    }
    return () => {
      if (autoTimer.current) clearInterval(autoTimer.current);
    };
  }, [autoDetect, active, loading, captureAndDetect]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Live Webcam Detection
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Use your webcam for real-time person detection and crowd monitoring.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="card relative overflow-hidden p-0">
            <div className="relative aspect-video bg-gray-900">
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                playsInline
                muted
              />
              {!active && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                  <VideoOff size={40} className="mb-3" />
                  <p className="text-sm">Camera is off</p>
                </div>
              )}
              {active && (
                <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
                  </span>
                  LIVE
                </div>
              )}
              {loading && active && (
                <div className="absolute right-3 top-3 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-xs text-white backdrop-blur">
                  <Spinner size={12} /> Detecting...
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {!active ? (
              <Button onClick={startCamera} className="flex-1">
                <Play size={16} /> Start Camera
              </Button>
            ) : (
              <>
                <Button
                  onClick={captureAndDetect}
                  disabled={loading}
                  className="flex-1"
                >
                  <Camera size={16} /> Capture & Detect
                </Button>
                <Button
                  variant={autoDetect ? 'primary' : 'secondary'}
                  onClick={() => setAutoDetect((v) => !v)}
                  disabled={loading}
                >
                  <RefreshCw size={16} className={autoDetect ? 'animate-spin-slow' : ''} />
                  Auto {autoDetect ? 'On' : 'Off'}
                </Button>
                <Button variant="danger" onClick={stopCamera}>
                  <Square size={16} /> Stop
                </Button>
              </>
            )}
          </div>

          {error && (
            <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
              {error}
            </div>
          )}

          {autoDetect && active && (
            <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
              <RefreshCw size={14} className="animate-spin-slow" />
              Auto-detection running every 3 seconds
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
              Latest Detection
            </h2>
            {result ? (
              <div className="space-y-4">
                <DetectionCanvas result={result} />
                <ResultMetrics result={result} />
              </div>
            ) : (
              <EmptyState
                icon={<WebcamIcon size={28} />}
                title="No detection yet"
                description="Start your camera and capture a frame to detect people."
              />
            )}
          </div>

          {liveHistory.length > 0 && (
            <div className="card p-5">
              <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
                Live Session Log
              </h2>
              <div className="space-y-1.5 max-h-64 overflow-y-auto scrollbar-thin">
                {liveHistory.map((d, i) => (
                  <div
                    key={d.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    style={{
                      animation: i === 0 ? 'slideUp 0.3s ease-out' : undefined,
                    }}
                  >
                    <span className="font-mono text-xs text-gray-400">
                      {formatTime(d.timestamp)}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {d.personCount}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      persons
                    </span>
                    <span className="ml-auto text-xs text-gray-400">
                      {(d.confidence * 100).toFixed(0)}% conf
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
