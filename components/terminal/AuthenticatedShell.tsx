import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import LogoutConfirmDialog from './LogoutConfirmDialog.tsx';
import ElmBrandLogo from './ElmBrandLogo.tsx';
import { TERMINAL_SHELL } from './terminalLayout.ts';

interface AuthenticatedShellProps {
  title?: string;
  children: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
}

const AuthenticatedShell: React.FC<AuthenticatedShellProps> = ({
  title,
  children,
  showBack,
  onBack,
}) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen terminal-app-bg text-zinc-100 pb-24">
      <header className="fixed top-0 left-0 right-0 z-[650] border-b terminal-app-header bg-[#030308]/95 border-blue-500/15 backdrop-blur-xl">
        <div className={TERMINAL_SHELL}>
          <div className="flex items-center justify-between gap-3 py-2.5 sm:py-3 min-h-[3rem]">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {showBack ? (
                <button
                  type="button"
                  onClick={onBack || (() => navigate('/today'))}
                  className="shrink-0 px-2.5 py-2 rounded-lg border border-zinc-700/80 text-[8px] font-black uppercase tracking-widest text-zinc-300 hover:border-blue-500/40 hover:text-blue-300"
                >
                  Back
                </button>
              ) : null}
              <ElmBrandLogo size="sm" subtitle={false} />
              {title ? (
                <p className="text-[9px] font-black uppercase tracking-[0.35em] text-zinc-500 truncate lg:text-[10px]">
                  {title}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="shrink-0 min-h-[44px] px-2.5 py-2 rounded-lg border border-zinc-600/80 bg-zinc-900/60 text-[8px] font-black uppercase tracking-widest text-zinc-200 hover:border-red-500/50 hover:text-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <LogoutConfirmDialog
        open={showLogoutConfirm}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      <main className={`${TERMINAL_SHELL} pt-[4.25rem]`}>{children}</main>
    </div>
  );
};

export default AuthenticatedShell;
