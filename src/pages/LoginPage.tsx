import { useState } from 'react';
import {
  Activity,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function LoginPage() {
  const { login, signup, loading } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    try {
      if (mode === 'login') {
        await login({ email, password });
      } else {
        if (!name.trim()) {
          setError('Please enter your name.');
          return;
        }
        await signup({ email, password, name });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-brand-50/40 to-accent-50/30 p-4 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl shadow-brand-500/10 dark:border-gray-800 dark:bg-gray-900 md:grid-cols-2">
        <div className="relative hidden flex-col justify-between bg-gradient-to-br from-brand-600 via-brand-700 to-accent-700 p-8 text-white md:flex">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                <Activity size={22} />
              </div>
              <span className="text-lg font-bold">CrowdSense</span>
            </div>
            <h1 className="mt-12 text-3xl font-bold leading-tight">
              AI-powered crowd detection & analytics
            </h1>
            <p className="mt-3 text-sm text-white/80">
              Detect, count, and analyze crowd density in real time using
              YOLOv8. Upload images, video, or use your webcam.
            </p>
          </div>
          <div className="space-y-3">
            <FeatureRow text="Real-time person counting" />
            <FeatureRow text="Low / Medium / High density classification" />
            <FeatureRow text="CSV & PDF analytics reports" />
            <FeatureRow text="Detection history & timeline charts" />
          </div>
          <div className="flex items-center gap-2 text-xs text-white/70">
            <ShieldCheck size={14} />
            Secured with JWT authentication
          </div>
        </div>

        <div className="flex flex-col justify-center p-8 sm:p-10">
          <div className="mb-6 flex items-center gap-2.5 md:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white">
              <Activity size={18} />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">
              CrowdSense
            </span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {mode === 'login'
              ? 'Sign in to access your detection dashboard.'
              : 'Start detecting crowds in minutes.'}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="label">Full Name</label>
                <div className="relative">
                  <UserIcon
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    className="input pl-10"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  required
                  className="input pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="password"
                  required
                  className="input pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {mode === 'login'
              ? "Don't have an account? "
              : 'Already have an account? '}
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError('');
              }}
              className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureRow({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-white/90">
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 13l4 4L19 7"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {text}
    </div>
  );
}
