import { useEffect, useMemo, useState } from 'react';
import {
  History as HistoryIcon,
  Search,
  Trash2,
  Download,
  Filter,
  X,
  Users,
  Image as ImageIcon,
  Video as VideoIcon,
  Webcam,
} from 'lucide-react';
import type { DetectionResult, HistoryFilters, CrowdDensity, DetectionMode } from '@/types';
import { api } from '@/lib/api';
import { Card, Button, EmptyState, Spinner } from '@/components/ui';
import { DetectionCanvas } from '@/components/DetectionCanvas';
import {
  densityColor,
  formatDateTime,
  formatDuration,
  toCSV,
  downloadFile,
} from '@/lib/utils';

const MODE_ICONS = {
  image: ImageIcon,
  video: VideoIcon,
  webcam: Webcam,
};

export function HistoryPage() {
  const [items, setItems] = useState<DetectionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<HistoryFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<DetectionResult | null>(null);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    api
      .getHistory()
      .then((data) => setItems(data))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    return items
      .filter((d) => {
        if (filters.mode && d.mode !== filters.mode) return false;
        if (filters.density && d.density !== filters.density) return false;
        if (filters.minCount != null && d.personCount < filters.minCount)
          return false;
        if (filters.maxCount != null && d.personCount > filters.maxCount)
          return false;
        if (filters.search) {
          const q = filters.search.toLowerCase();
          if (!d.sourceName.toLowerCase().includes(q)) return false;
        }
        if (filters.startDate) {
          if (new Date(d.timestamp) < new Date(filters.startDate)) return false;
        }
        if (filters.endDate) {
          if (new Date(d.timestamp) > new Date(filters.endDate)) return false;
        }
        return true;
      })
      .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
  }, [items, filters]);

  const handleDelete = async (id: string) => {
    await api.deleteDetection(id);
    setItems((prev) => prev.filter((d) => d.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const handleClear = async () => {
    if (!confirm('Delete all detection history? This cannot be undone.')) return;
    await api.clearHistory();
    setItems([]);
    setSelected(null);
  };

  const exportCSV = () => {
    const csv = toCSV(
      filtered.map((d) => ({
        id: d.id,
        timestamp: d.timestamp,
        mode: d.mode,
        source: d.sourceName,
        person_count: d.personCount,
        density: d.density,
        confidence: d.confidence.toFixed(4),
        processing_time_ms: Math.round(d.processingTimeMs),
      }))
    );
    downloadFile(csv, `detection_history_${Date.now()}.csv`, 'text/csv');
  };

  const activeFilterCount = [
    filters.mode,
    filters.density,
    filters.minCount != null ? 'min' : null,
    filters.maxCount != null ? 'max' : null,
    filters.startDate,
    filters.endDate,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Detection History
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Browse, filter, and export all past detections.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={exportCSV} disabled={filtered.length === 0}>
            <Download size={16} /> Export CSV
          </Button>
          <Button
            variant="ghost"
            onClick={() => setShowFilters((v) => !v)}
            className="relative"
          >
            <Filter size={16} /> Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-xs font-semibold text-white">
                {activeFilterCount}
              </span>
            )}
          </Button>
          <Button variant="ghost" onClick={handleClear} disabled={items.length === 0}>
            <Trash2 size={16} className="text-rose-500" />
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card className="p-4 animate-slide-up">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="label">Mode</label>
              <select
                className="input"
                value={filters.mode || ''}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    mode: (e.target.value || undefined) as DetectionMode | undefined,
                  }))
                }
              >
                <option value="">All</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="webcam">Webcam</option>
              </select>
            </div>
            <div>
              <label className="label">Density</label>
              <select
                className="input"
                value={filters.density || ''}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    density: (e.target.value || undefined) as CrowdDensity | undefined,
                  }))
                }
              >
                <option value="">All</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label className="label">Min Count</label>
              <input
                type="number"
                className="input"
                value={filters.minCount ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    minCount: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
              />
            </div>
            <div>
              <label className="label">Max Count</label>
              <input
                type="number"
                className="input"
                value={filters.maxCount ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    maxCount: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
              />
            </div>
            <div>
              <label className="label">From Date</label>
              <input
                type="datetime-local"
                className="input"
                value={filters.startDate || ''}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, startDate: e.target.value || undefined }))
                }
              />
            </div>
            <div>
              <label className="label">To Date</label>
              <input
                type="datetime-local"
                className="input"
                value={filters.endDate || ''}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, endDate: e.target.value || undefined }))
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Search Source</label>
              <input
                className="input"
                placeholder="e.g. mall, station..."
                value={filters.search || ''}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, search: e.target.value || undefined }))
                }
              />
            </div>
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={() => setFilters({})}
              className="mt-3 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              Clear all filters
            </button>
          )}
        </Card>
      )}

      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          className="input pl-10"
          placeholder="Search detections by source name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setFilters((f) => ({ ...f, search: e.target.value || undefined }));
          }}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-gray-400">
          <Spinner size={28} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<HistoryIcon size={28} />}
          title="No detections found"
          description={activeFilterCount > 0 ? 'Try adjusting your filters.' : 'Run a detection to see it here.'}
        />
      ) : (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {filtered.length} of {items.length} detections
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((d) => {
              const dc = densityColor(d.density);
              const Icon = MODE_ICONS[d.mode];
              return (
                <Card
                  key={d.id}
                  className="group cursor-pointer p-4 transition-all duration-200 hover:shadow-md"
                >
                  <div onClick={() => setSelected(d)}>
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${dc.bg} ${dc.text}`}>
                          <Icon size={15} />
                        </div>
                        <span className="text-xs font-medium uppercase text-gray-400">
                          {d.mode}
                        </span>
                      </div>
                      <span className={`badge ${dc.bg} ${dc.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${dc.dot}`} />
                        {d.density}
                      </span>
                    </div>
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {d.sourceName}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {formatDateTime(d.timestamp)}
                    </p>
                    <div className="mt-3 flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <Users size={14} className="text-gray-400" />
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {d.personCount}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {(d.confidence * 100).toFixed(1)}% conf
                      </div>
                      <div className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                        {formatDuration(d.processingTimeMs)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end border-t border-gray-100 pt-3 dark:border-gray-800">
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="rounded-lg p-1.5 text-gray-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto scrollbar-thin"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Detection Details
                </h2>
                <button
                  onClick={() => setSelected(null)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X size={20} />
                </button>
              </div>
              <DetectionCanvas result={selected} />
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <DetailTile label="Persons" value={String(selected.personCount)} />
                <DetailTile label="Density" value={selected.density} />
                <DetailTile
                  label="Confidence"
                  value={`${(selected.confidence * 100).toFixed(1)}%`}
                />
                <DetailTile
                  label="Processing Time"
                  value={formatDuration(selected.processingTimeMs)}
                />
              </div>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                {formatDateTime(selected.timestamp)} · {selected.sourceName}
              </p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}
