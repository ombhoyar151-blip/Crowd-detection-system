import { useRef, useState } from 'react';
import { Video as VideoIcon, Play, Square, Sparkles, Trash2 } from 'lucide-react';
import type { DetectionResult } from '@/types';
import { api } from '@/lib/api';
import { UploadZone, FilePreview } from '@/components/UploadZone';
import { DetectionCanvas, ResultMetrics } from '@/components/DetectionCanvas';
import { Button, ProgressBar, EmptyState, Card } from '@/components/ui';

export function VideoDetectionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setResult(null);
    setError('');
    setPreviewUrl(URL.createObjectURL(f));
  };

  const runDetection = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setProgress(0);
    try {
      const r = await api.detectVideo(file, setProgress);
      setResult(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Detection failed');
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) {
      v.pause();
      setPlaying(false);
    } else {
      v.play();
      setPlaying(true);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError('');
    setPlaying(false);
    setPreviewUrl(undefined);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Video Detection
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Upload a video to analyze crowd density across frames.
        </p>
      </div>

      {!file && !result && (
        <UploadZone
          accept="video/*"
          onFile={handleFile}
          label="Drop a video here or click to browse"
          hint="MP4, WebM, MOV up to 100MB"
          icon={<VideoIcon size={26} />}
        />
      )}

      {file && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Input Video
              </h2>
              <button
                onClick={reset}
                className="btn-ghost text-xs text-gray-500"
              >
                <Trash2 size={14} /> Clear
              </button>
            </div>
            <FilePreview file={file} previewUrl={undefined} />
            {previewUrl && (
              <div className="relative mt-4 overflow-hidden rounded-xl border border-gray-200 bg-black dark:border-gray-800">
                <video
                  ref={videoRef}
                  src={previewUrl}
                  className="max-h-80 w-full"
                  onEnded={() => setPlaying(false)}
                  controls={false}
                />
                <button
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 transition hover:bg-black/30"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-lg">
                    {playing ? <Square size={22} /> : <Play size={22} className="ml-0.5" />}
                  </span>
                </button>
              </div>
            )}
            <div className="mt-5">
              <Button
                onClick={runDetection}
                disabled={loading}
                className="w-full py-3"
              >
                {loading ? (
                  <>
                    <Sparkles size={16} className="animate-pulse" />
                    Processing video...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Analyze Video
                  </>
                )}
              </Button>
            </div>
            {loading && (
              <div className="mt-4">
                <ProgressBar value={progress} />
                <p className="mt-1.5 text-center text-xs text-gray-500 dark:text-gray-400">
                  {Math.round(progress)}% — processing video frames
                </p>
              </div>
            )}
            {error && (
              <div className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                {error}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
              Detection Results
            </h2>
            {result ? (
              <div className="space-y-4">
                <DetectionCanvas result={result} />
                <ResultMetrics result={result} />
              </div>
            ) : (
              <EmptyState
                icon={<VideoIcon size={28} />}
                title="No results yet"
                description="Analyze your video to see aggregate crowd metrics."
              />
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
