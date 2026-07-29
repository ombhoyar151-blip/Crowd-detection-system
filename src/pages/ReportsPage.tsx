import { useEffect, useState } from 'react';
import {
  FileText,
  Download,
  FileSpreadsheet,
  FileDown,
  Users,
  ScanLine,
  Gauge,
  Timer,
  AlertCircle,
} from 'lucide-react';
import type { DashboardStats, DetectionResult } from '@/types';
import { api } from '@/lib/api';
import { Card, Button, Spinner, StatCard } from '@/components/ui';
import { DonutChart, BarChart } from '@/components/Charts';
import { DEMO_MODE } from '@/lib/config';
import {
  downloadFile,
  toCSV,
  densityColor,
  formatDateTime,
  formatDuration,
} from '@/lib/utils';

export function ReportsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [history, setHistory] = useState<DetectionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [csvLoading, setCsvLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState('');

  useEffect(() => {
    Promise.all([api.getDashboardStats(), api.getHistory()])
      .then(([s, h]) => {
        setStats(s);
        setHistory(h);
      })
      .finally(() => setLoading(false));
  }, []);

  const exportCSV = async () => {
    setCsvLoading(true);
    try {
      const csv = await api.reportCSV();
      downloadFile(csv, `crowdsense_report_${Date.now()}.csv`, 'text/csv');
    } finally {
      setCsvLoading(false);
    }
  };

  const exportPDF = async () => {
    setPdfError('');
    setPdfLoading(true);
    try {
      const blob = await api.reportPDF();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `crowdsense_report_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setPdfError(
        err instanceof Error ? err.message : 'PDF generation failed.'
      );
    } finally {
      setPdfLoading(false);
    }
  };

  const exportLocalCSV = () => {
    const rows = history.map((d) => ({
      id: d.id,
      timestamp: d.timestamp,
      mode: d.mode,
      source: d.sourceName,
      person_count: d.personCount,
      density: d.density,
      confidence: d.confidence.toFixed(4),
      processing_time_ms: Math.round(d.processingTimeMs),
    }));
    downloadFile(toCSV(rows), `crowdsense_report_${Date.now()}.csv`, 'text/csv');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-gray-400">
        <Spinner size={28} />
      </div>
    );
  }

  const densityData = stats
    ? [
        { label: 'Low', value: stats.densityBreakdown.Low, color: '#10b981' },
        {
          label: 'Medium',
          value: stats.densityBreakdown.Medium,
          color: '#f59e0b',
        },
        { label: 'High', value: stats.densityBreakdown.High, color: '#ef4444' },
      ]
    : [];

  const modeData = stats
    ? [
        { label: 'Image', value: stats.modeBreakdown.image, color: '#1c66f5' },
        { label: 'Video', value: stats.modeBreakdown.video, color: '#06b6d4' },
        { label: 'Webcam', value: stats.modeBreakdown.webcam, color: '#8b5cf6' },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Reports
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Export detection analytics as CSV or PDF reports.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Detections"
          value={stats?.totalDetections ?? 0}
          icon={<ScanLine size={20} />}
        />
        <StatCard
          label="Total Persons"
          value={(stats?.totalPersons ?? 0).toLocaleString()}
          icon={<Users size={20} />}
          accent="accent"
        />
        <StatCard
          label="Avg Confidence"
          value={`${((stats?.avgConfidence ?? 0) * 100).toFixed(1)}%`}
          icon={<Gauge size={20} />}
          accent="emerald"
        />
        <StatCard
          label="Avg Processing Time"
          value={formatDuration(stats?.avgProcessingTime ?? 0)}
          icon={<Timer size={20} />}
          accent="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
            Density Distribution
          </h2>
          <DonutChart data={densityData} />
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
            Detections by Mode
          </h2>
          <BarChart data={modeData} />
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            <FileText size={24} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Export Reports
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Download a complete summary of your detection data.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <FileSpreadsheet size={22} className="text-emerald-500" />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  CSV Report
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Spreadsheet-compatible, all detection records
                </p>
              </div>
            </div>
            <Button
              onClick={DEMO_MODE ? exportLocalCSV : exportCSV}
              disabled={csvLoading}
              variant="secondary"
              className="mt-4 w-full"
            >
              {csvLoading ? <Spinner size={16} /> : <Download size={16} />}
              Download CSV
            </Button>
          </div>

          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <FileDown size={22} className="text-rose-500" />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  PDF Report
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Formatted summary with charts and tables
                </p>
              </div>
            </div>
            <Button
              onClick={exportPDF}
              disabled={pdfLoading || DEMO_MODE}
              variant="secondary"
              className="mt-4 w-full"
            >
              {pdfLoading ? <Spinner size={16} /> : <Download size={16} />}
              Download PDF
            </Button>
            {DEMO_MODE && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                <AlertCircle size={12} />
                Requires connected backend
              </p>
            )}
            {pdfError && (
              <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">
                {pdfError}
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
          Recent Records Preview
        </h2>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-400 dark:border-gray-800">
                <th className="pb-2 pr-4 font-medium">Time</th>
                <th className="pb-2 pr-4 font-medium">Source</th>
                <th className="pb-2 pr-4 font-medium">Mode</th>
                <th className="pb-2 pr-4 font-medium">Count</th>
                <th className="pb-2 pr-4 font-medium">Density</th>
                <th className="pb-2 pr-4 font-medium">Confidence</th>
                <th className="pb-2 font-medium">Time (ms)</th>
              </tr>
            </thead>
            <tbody>
              {history.slice(0, 10).map((d) => {
                const dc = densityColor(d.density);
                return (
                  <tr
                    key={d.id}
                    className="border-b border-gray-100 last:border-0 dark:border-gray-800/50"
                  >
                    <td className="py-2.5 pr-4 text-gray-500 dark:text-gray-400">
                      {formatDateTime(d.timestamp)}
                    </td>
                    <td className="py-2.5 pr-4 font-medium text-gray-900 dark:text-white">
                      {d.sourceName}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-500 dark:text-gray-400">
                      {d.mode}
                    </td>
                    <td className="py-2.5 pr-4 font-semibold text-gray-900 dark:text-white">
                      {d.personCount}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className={`badge ${dc.bg} ${dc.text}`}>
                        {d.density}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-gray-500 dark:text-gray-400">
                      {(d.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="py-2.5 text-gray-500 dark:text-gray-400">
                      {formatDuration(d.processingTimeMs)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
