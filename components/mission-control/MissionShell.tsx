import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import ElmBrandLogo from '../terminal/ElmBrandLogo.tsx';
import LogoutConfirmDialog from '../terminal/LogoutConfirmDialog.tsx';
import { MISSION_SHELL } from '../terminal/terminalLayout.ts';
import BottomNav, { type BottomNavId } from './BottomNav.tsx';
import { useDriverExperienceOptional } from '../../context/DriverExperienceContext.tsx';
import { useShowcaseOptional } from '../../context/ShowcaseContext.tsx';

interface MissionShellProps {
  title: string;
  activeNav: BottomNavId;
  connectionLabel?: string;
  children: React.ReactNode;
}

const MissionShell: React.FC<MissionShellProps> = ({
  title,
  activeNav,
  connectionLabel,
  children,
}) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showLogout, setShowLogout] = useState(false);
  const experience = useDriverExperienceOptional();
  const showcase = useShowcaseOptional();
  const routePrefix = experience?.routePrefix || '';
  const homePath = routePrefix ? `${routePrefix}/today` : '/today';

  const handleLogout = () => {
    showcase?.exitShowcase();
    logout();
    navigate('/login', { replace: true });
  };

  const goHome = () => navigate(homePath);

  return (
    <div className="min-h-screen terminal-app-bg text-zinc-100 mc-app">
      <header className="fixed top-0 left-0 right-0 z-[650] border-b terminal-app-header bg-[#050811]/95 border-cyan-500/15 backdrop-blur-xl">
        <div className={MISSION_SHELL}>
          <div className="flex items-center justify-between gap-3 py-2.5 sm:py-3 min-h-[3rem]">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <button
                type="button"
                onClick={goHome}
                className="min-w-0 text-left rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
                aria-label="ELM CONNECT home"
              >
                <ElmBrandLogo size="sm" subtitle={false} />
              </button>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.35em] text-zinc-500 truncate lg:text-[10px]">
                  {title}
                </p>
                {connectionLabel ? (
                  <p className="text-[10px] text-zinc-500 mt-0.5 truncate">
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle ${
                        connectionLabel.toLowerCase().includes('offline')
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                      aria-hidden
                    />
                    {connectionLabel}
                  </p>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowLogout(true)}
              className="shrink-0 min-h-[44px] px-2.5 py-2 rounded-lg border border-zinc-600/80 bg-zinc-900/60 text-[8px] font-black uppercase tracking-widest text-zinc-200 hover:border-red-500/50 hover:text-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <LogoutConfirmDialog
        open={showLogout}
        onConfirm={handleLogout}
        onCancel={() => setShowLogout(false)}
      />

      <main className={`${MISSION_SHELL} pt-[4.5rem] pb-28`}>{children}</main>
      <BottomNav active={activeNav} routePrefix={routePrefix} />
    </div>
  );
};

export default MissionShell;
