import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';

const AccessDeniedPage: React.FC = () => {
  const { session } = useAuth();
  const isAdmin = session?.authRole === 'admin' && session?.canSelectAnyDriver;

  return (
    <div className="min-h-screen bg-[#050811] text-zinc-100 flex items-center justify-center px-6">
      <div className="max-w-md w-full rounded-2xl border border-rose-500/40 bg-rose-950/30 p-8 space-y-4 text-center">
        <p className="text-[10px] font-mono uppercase tracking-widest text-rose-300">Access denied</p>
        <h1 className="text-xl font-bold normal-case">Showcase Mode unavailable</h1>
        <p className="text-sm text-zinc-400 normal-case leading-relaxed">
          {isAdmin
            ? 'Your admin session is missing a valid server-issued Showcase grant. Sign out and sign in again, then retry. Local environments also need SHOWCASE_GRANT_SECRET configured.'
            : 'Showcase Mode is limited to verified platform administrators. Standard drivers cannot open these routes.'}
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <Link
            to="/today"
            className="min-h-[52px] inline-flex items-center justify-center rounded-xl bg-cyan-600 text-white text-sm font-bold"
          >
            Return to Today
          </Link>
          <Link
            to="/login"
            className="min-h-[48px] inline-flex items-center justify-center text-sm text-cyan-400"
          >
            Sign in again
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccessDeniedPage;
