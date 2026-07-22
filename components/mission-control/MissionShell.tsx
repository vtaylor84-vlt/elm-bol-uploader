import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import ElmBrandLogo from '../terminal/ElmBrandLogo.tsx';
import LogoutConfirmDialog from '../terminal/LogoutConfirmDialog.tsx';
import { MISSION_SHELL } from '../terminal/terminalLayout.ts';
import BottomNav from './BottomNav.tsx';
import type { BottomNavId, PrimaryNavId } from './shellNav.tsx';
import DesktopNavRail from './DesktopNavRail.tsx';
import { useDriverExperienceOptional } from '../../context/DriverExperienceContext.tsx';
import { useShowcaseOptional } from '../../context/ShowcaseContext.tsx';
import { getCompanyDisplayName } from '../../utils/companyMap.ts';

interface MissionShellProps {
  title: string;
  activeNav: PrimaryNavId | BottomNavId;
  connectionLabel?: string;
  children: React.ReactNode;
}

/**
 * Shared application shell for Driver Experience routes.
 * Mobile: top header + bottom nav. Desktop: persistent rail + content canvas.
 */
const MissionShell: React.FC<MissionShellProps> = ({
  title,
  activeNav,
  connectionLabel,
  children,
}) => {
  const navigate = useNavigate();
  const { logout, session } = useAuth();
  const [showLogout, setShowLogout] = useState(false);
  const experience = useDriverExperienceOptional();
  const showcase = useShowcaseOptional();
  const routePrefix = experience?.routePrefix || '';
  const homePath = routePrefix ? `${routePrefix}/today` : '/today';
  const company = getCompanyDisplayName(session?.companyCode);
  const modeLabel =
    experience?.mode === 'showcase'
      ? 'Showcase'
      : session?.authRole === 'admin'
        ? 'Admin'
        : 'Driver';

  const handleLogout = () => {
    showcase?.exitShowcase();
    logout();
    navigate('/login', { replace: true });
  };

  const openLogout = () => setShowLogout(true);
  const goHome = () => navigate(homePath);

  return (
    <div className="min-h-screen terminal-app-bg text-zinc-100 mc-app mc-shell">
      <DesktopNavRail active={activeNav} routePrefix={routePrefix} onLogout={openLogout} />

      <div className="mc-shell-main">
        <header className="mc-shell-header terminal-app-header">
          <div className={`${MISSION_SHELL} mc-shell-header-inner`}>
            <div className="mc-shell-header-left">
              <button
                type="button"
                onClick={goHome}
                className="mc-shell-brand-btn"
                aria-label="ELM CONNECT home"
              >
                <ElmBrandLogo size="sm" subtitle={false} />
              </button>
              <div className="mc-shell-header-meta min-w-0">
                <p className="mc-shell-header-title">{title}</p>
                <p className="mc-shell-header-context truncate">
                  {session?.driverName || 'Driver'}
                  {company ? ` · ${company}` : ''}
                  {` · ${modeLabel}`}
                  {connectionLabel ? ` · ${connectionLabel}` : ''}
                </p>
              </div>
            </div>
            <button type="button" onClick={openLogout} className="mc-shell-header-logout">
              Logout
            </button>
          </div>
        </header>

        <LogoutConfirmDialog
          open={showLogout}
          onConfirm={handleLogout}
          onCancel={() => setShowLogout(false)}
        />

        <main className={`${MISSION_SHELL} mc-shell-content`}>{children}</main>
        <BottomNav
          active={
            (['today', 'loads', 'capture', 'pay', 'more'] as const).includes(
              activeNav as BottomNavId
            )
              ? (activeNav as BottomNavId)
              : 'more'
          }
          routePrefix={routePrefix as '' | '/showcase'}
        />
      </div>
    </div>
  );
};

export default MissionShell;
