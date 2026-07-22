import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import { useShowcase } from '../../context/ShowcaseContext.tsx';
import AccessDeniedPage from '../../pages/AccessDeniedPage.tsx';

/**
 * Server-backed Showcase gate:
 * 1) authenticated
 * 2) authRole admin + canSelectAnyDriver
 * 3) valid showcase grant via enterShowcase → Netlify showcase-access
 */
const ShowcaseProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, isAuthenticated } = useAuth();
  const { enterShowcase, isShowcaseActive } = useShowcase();
  const location = useLocation();
  const [status, setStatus] = useState<'checking' | 'ok' | 'denied'>('checking');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isAuthenticated || !session) {
        if (!cancelled) setStatus('denied');
        return;
      }
      if (session.authRole !== 'admin' || !session.canSelectAnyDriver) {
        if (!cancelled) setStatus('denied');
        return;
      }
      const result = await enterShowcase();
      if (!cancelled) setStatus(result === 'ok' ? 'ok' : 'denied');
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, session, enterShowcase, location.pathname]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-[#050811] text-zinc-300 flex items-center justify-center p-6">
        <p className="text-sm normal-case">Verifying Showcase access…</p>
      </div>
    );
  }

  if (status === 'denied' || !isShowcaseActive) {
    return <AccessDeniedPage />;
  }

  return <>{children}</>;
};

export default ShowcaseProtectedRoute;
