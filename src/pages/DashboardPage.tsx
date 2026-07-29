import { useEffect, useState } from 'react';
import {
  Users,
  ScanLine,
  Gauge,
  Timer,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import type { DashboardStats } from '@/types';
import { api } from '@/lib/api';
import {
  StatCard,
  Card,
  Spinner,
  EmptyState,
} from '@/components/ui';
import { LineChart, BarChart, DonutChart } from '@/components/Charts';
import { densityColor, formatDuration, formatDateTime } from '@/lib/utils';
import type { PageKey } from '@/components/Layout';

export function DashboardPage({
  onNavigate,
}: {
  onNavigate: (key: PageKey) => void;
}) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getDashboardStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <Spinner size={28} />
      </div>
    );
  }

  if (!stats) {
    return (
      <EmptyState
        icon={<Users size={28} />}
        title="No data yet"
        description="Run a detection to populate your dashboard."
        action={
          <button onClick={() => onNavigate('image')} className="btn-primary">
            Start Detecting <ArrowRight size={16} />
          </button>
        }
      />
    );
  }

  const densityData = [
    { label: 'Low', value: stats.densityBreakdown.Low, color: '#10b981' },
    { label: 'Medium', value: stats.densityBreakdown.Medium, color: '#f59e0b' },
    { label: 'High', value: stats.densityBreakdown.High, color: '#ef4444' },
  ];

  const modeData = [
    { label: 'Image', value: stats.modeBreakdown.image, color: '#1c66f5' },
    { label: 'Video', value: stats.modeBreakdown.video, color: '#06b6d4' },
    { label: 'Webcam', value: stats.modeBreakdown.webcam, color: '#8b5cf6' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Overview of crowd detection activity and analytics.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Detections"
          value={stats.totalDetections}
          icon={<ScanLine size={20} />}
          accent="brand"
        />
        <StatCard
          label="Total Persons Detected"
          value={stats.totalPersons.toLocaleString()}
          icon={<Users size={20} />}
          accent="accent"
        />
        <StatCard
          label="Avg Confidence"
          value={`${(stats.avgConfidence * 100).toFixed(1)}%`}
          icon={<Gauge size={20} />}
          accent="emerald"
        />
        <StatCard
          label="Avg Processing Time"
          value={formatDuration(stats.avgProcessingTime)}
          icon={<Timer size={20} />}
          accent="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Person Count Timeline
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Detection results over time
              </p>
            </div>
            <TrendingUp size={18} className="text-brand-500" />
          </div>
          <LineChart data={stats.timeline.map((t) => ({ label: t.label, value: t.count }))} />
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
            Density Distribution
          </h2>
          <DonutChart data={densityData} />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
            Detections by Mode
          </h2>
          <BarChart data={modeData} />
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Recent Detections
            </h2>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              View all
            </button>
          </div>
          <div className="space-y-2">
            {stats.recentDetections.map((d) => {
              const dc = densityColor(d.density);
              return (
                <div
                  key={d.id}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${dc.bg} ${dc.text}`}
                  >
                    <Users size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {d.sourceName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDateTime(d.timestamp)} · {d.mode}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {d.personCount}
                    </p>
                    <span className={`badge ${dc.bg} ${dc.text} mt-0.5`}>
                      {d.density}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
