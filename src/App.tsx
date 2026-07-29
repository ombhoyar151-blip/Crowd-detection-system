import { useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Sidebar, Header, type PageKey } from '@/components/Layout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ImageDetectionPage } from '@/pages/ImageDetectionPage';
import { VideoDetectionPage } from '@/pages/VideoDetectionPage';
import { WebcamDetectionPage } from '@/pages/WebcamDetectionPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { ReportsPage } from '@/pages/ReportsPage';

function AppContent() {
  const { user, logout } = useAuth();
  const [page, setPage] = useState<PageKey>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (!user) {
    return <LoginPage />;
  }

  const navigate = (key: PageKey) => {
    setPage(key);
    setMobileNavOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar
        current={page}
        onNavigate={navigate}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />
      <div className="lg:pl-64">
        <Header
          onMenuClick={() => setMobileNavOpen(true)}
          onLogout={logout}
        />
        <main className="mx-auto max-w-7xl p-4 lg:p-6">
          {page === 'dashboard' && <DashboardPage onNavigate={navigate} />}
          {page === 'image' && <ImageDetectionPage />}
          {page === 'video' && <VideoDetectionPage />}
          {page === 'webcam' && <WebcamDetectionPage />}
          {page === 'history' && <HistoryPage />}
          {page === 'reports' && <ReportsPage />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
