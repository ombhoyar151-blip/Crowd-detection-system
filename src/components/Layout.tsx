import {
  LayoutDashboard,
  Image as ImageIcon,
  Video,
  Webcam,
  History,
  FileText,
  Users,
  Moon,
  Sun,
  LogOut,
  Menu,
  X,
  Activity,
} from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { DEMO_MODE } from '@/lib/config';

export type PageKey =
  | 'dashboard'
  | 'image'
  | 'video'
  | 'webcam'
  | 'history'
  | 'reports';

const NAV: { key: PageKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'image', label: 'Image Detection', icon: ImageIcon },
  { key: 'video', label: 'Video Detection', icon: Video },
  { key: 'webcam', label: 'Live Webcam', icon: Webcam },
  { key: 'history', label: 'History', icon: History },
  { key: 'reports', label: 'Reports', icon: FileText },
];

export function Sidebar({
  current,
  onNavigate,
  mobileOpen,
  onCloseMobile,
}: {
  current: PageKey;
  onNavigate: (key: PageKey) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-300 dark:border-gray-800 dark:bg-gray-900 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-gray-200 px-5 dark:border-gray-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-lg shadow-brand-500/20">
            <Activity size={20} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
              CrowdSense
            </p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
              Detection System
            </p>
          </div>
          <button
            onClick={onCloseMobile}
            className="ml-auto rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-thin">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = current === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`nav-item w-full text-left ${
                  active
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-gray-200 p-3 dark:border-gray-800">
          {DEMO_MODE && (
            <div className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
              Demo mode — connect a backend for live YOLOv8 detection.
            </div>
          )}
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-gray-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            YOLOv8 · FastAPI
          </div>
        </div>
      </aside>
    </>
  );
}

export function Header({
  onMenuClick,
  onLogout,
}: {
  onMenuClick: () => void;
  onLogout: () => void;
}) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-gray-200 bg-white/80 px-4 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/80 lg:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
      >
        <Menu size={20} />
      </button>
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <div className="flex items-center gap-2.5 rounded-lg border border-gray-200 px-3 py-1.5 dark:border-gray-800">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-xs font-semibold text-white">
            {(user?.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-gray-900 dark:text-white">
              {user?.name || 'User'}
            </p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
              {user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="rounded-lg p-2 text-gray-500 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
          aria-label="Log out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

export { NAV };
