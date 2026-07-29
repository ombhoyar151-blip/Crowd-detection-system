import { useState } from 'react';
import { Image as ImageIcon, Sparkles, Trash2, Download } from 'lucide-react';
import type { DetectionResult } from '@/types';
import { api } from '@/lib/api';
import { UploadZone, FilePreview } from '@/components/UploadZone';
import { DetectionCanvas, ResultMetrics } from '@/components/DetectionCanvas';
import { Button, ProgressBar, EmptyState, Card } from '@/components/ui';
import { downloadFile, toCSV } from '@/lib/utils';

export function ImageDetectionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      const r = await api.detectImage(file, setProgress);
      setResult(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Detection failed');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError('');
    setPreviewUrl(undefined);
  };

  const exportResult = () => {
    if (!result) return;
    const csv = toCSV([
      {
        id: result.id,
        timestamp: result.timestamp,
        mode: result.mode,
        source: result.sourceName,
        person_count: result.personCount,
        density: result.density,
        confidence: result.confidence.toFixed(4),
        processing_time_ms: Math.round(result.processingTimeMs),
      },
    ]);
    downloadFile(csv, `detection_${result.id.slice(0, 8)}.csv`, 'text/csv');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Image Detection
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Upload an image to detect and count people using YOLOv8.
        </p>
      </div>

      {!file && !result && (
        <UploadZone
          accept="image/*"
          onFile={handleFile}
          label="Drop an image here or click to browse"
          hint="PNG, JPG, WEBP up to 20MB"
          icon={<ImageIcon size={26} />}
        />
      )}

      {file && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Input Image
              </h2>
              <button
                onClick={reset}
                className="btn-ghost text-xs text-gray-500"
              >
                <Trash2 size={14} /> Clear
              </button>
            </div>
            <FilePreview file={file} previewUrl={previewUrl} />
            {previewUrl && (
              <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-80 w-full object-contain bg-gray-50 dark:bg-gray-800"
                />
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
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Run Detection
                  </>
                )}
              </Button>
            </div>
            {loading && (
              <div className="mt-4">
                <ProgressBar value={progress} />
                <p className="mt-1.5 text-center text-xs text-gray-500 dark:text-gray-400">
                  {Math.round(progress)}% — running YOLOv8 inference
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
                <DetectionCanvas result={result} imageUrl={previewUrl} />
                <ResultMetrics result={result} />
                <Button
                  variant="secondary"
                  onClick={exportResult}
                  className="w-full"
                >
                  <Download size={16} /> Export as CSV
                </Button>
              </div>
            ) : (
              <EmptyState
                icon={<ImageIcon size={28} />}
                title="No results yet"
                description="Run detection to see annotated results and metrics."
              />
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
