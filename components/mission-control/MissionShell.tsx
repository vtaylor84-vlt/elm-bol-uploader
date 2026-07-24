import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import ElmBrandLogo from '../terminal/ElmBrandLogo.tsx';
import BrandMark from '../brand/BrandMark.tsx';
import LogoutConfirmDialog from '../terminal/LogoutConfirmDialog.tsx';
import { MISSION_SHELL } from '../terminal/terminalLayout.ts';
import BottomNav from './BottomNav.tsx';
import type { BottomNavId, PrimaryNavId } from './shellNav.tsx';
import { normalizeActiveNav } from './shellNav.tsx';
import DesktopNavRail from './DesktopNavRail.tsx';
import { ShellIcons } from './ShellIcons.tsx';
import { useDriverExperienceOptional } from '../../context/DriverExperienceContext.tsx';
import { useShowcaseOptional } from '../../context/ShowcaseContext.tsx';
import { useCarrierTheme } from '../../context/CarrierThemeContext.tsx';
import { getCompanyDisplayName } from '../../utils/companyMap.ts';

interface MissionShellProps {
  title: string;
  activeNav: PrimaryNavId | BottomNavId | string;
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
  const { pathname } = useLocation();
  const { logout, session } = useAuth();
  const [showLogout, setShowLogout] = useState(false);
  const experience = useDriverExperienceOptional();
  const showcase = useShowcaseOptional();
  const { theme: brandTheme, label: brandLabel } = useCarrierTheme();
  const routePrefix = experience?.routePrefix || '';
  const homePath = routePrefix ? `${routePrefix}/home` : '/home';
  const company = getCompanyDisplayName(session?.companyCode);
  const modeLabel =
    experience?.mode === 'showcase'
      ? 'Showcase'
      : session?.authRole === 'admin'
        ? 'Admin'
        : 'Driver';
  const navActive = normalizeActiveNav(activeNav);
  const unreadNotifications =
    experience?.mode === 'showcase'
      ? (experience.dataSource.getNotifications?.().filter((n) => n.unread).length ?? 0)
      : 0;
  /** Production chrome: carrier logo only when exactly one authoritative carrier. Showcase keeps ELM. */
  const headerBrandTheme =
    experience?.mode === 'showcase' ? 'elm' : brandTheme;
  const headerBrandLabel =
    experience?.mode === 'showcase' ? 'ELM CONNECT' : brandLabel;

  const handleLogout = () => {
    showcase?.exitShowcase();
    logout();
    navigate('/login', { replace: true });
  };

  const openLogout = () => setShowLogout(true);
  const goHome = () => navigate(homePath);

  return (
    <div className="min-h-screen terminal-app-bg text-zinc-100 mc-app mc-shell">
      <DesktopNavRail active={navActive} routePrefix={routePrefix} onLogout={openLogout} />

      <div className="mc-shell-main">
        <header className="mc-shell-header terminal-app-header">
          <div className={`${MISSION_SHELL} mc-shell-header-inner`}>
            <div className="mc-shell-header-left">
              <button
                type="button"
                onClick={goHome}
                className="mc-shell-brand-btn"
                aria-label={`${headerBrandLabel} home`}
              >
                {headerBrandTheme === 'elm' ? (
                  <ElmBrandLogo size="sm" subtitle={false} />
                ) : (
                  <BrandMark theme={headerBrandTheme} size="sm" />
                )}
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
            <div className="mc-shell-header-utils" aria-label="Global utilities">
              {experience?.mode === 'showcase' ? (
                <>
                  <NavLink
                    to={`${routePrefix}/search`}
                    className="mc-shell-util"
                    aria-label="Search"
                    title="Search"
                  >
                    <ShellIcons.Search />
                  </NavLink>
                  <NavLink
                    to={`${routePrefix}/notifications`}
                    className="mc-shell-util"
                    aria-label={
                      unreadNotifications > 0
                        ? `Notifications, ${unreadNotifications} unread`
                        : 'Notifications'
                    }
                    title="Notifications"
                  >
                    <ShellIcons.Notifications />
                    {unreadNotifications > 0 ? (
                      <span className="mc-nav-badge mc-shell-util-badge" aria-hidden>
                        {unreadNotifications}
                      </span>
                    ) : null}
                  </NavLink>
                  <NavLink
                    to={`${routePrefix}/assistant`}
                    className="mc-shell-util"
                    aria-label="ELM AI"
                    title="ELM AI"
                  >
                    <ShellIcons.ElmAi />
                  </NavLink>
                </>
              ) : (
                <Link to="/more" className="mc-shell-util" aria-label="Help and account" title="More">
                  <ShellIcons.More />
                </Link>
              )}
              <button type="button" onClick={openLogout} className="mc-shell-header-logout">
                Sign out
              </button>
            </div>
          </div>
        </header>

        <LogoutConfirmDialog
          open={showLogout}
          onConfirm={handleLogout}
          onCancel={() => setShowLogout(false)}
        />

        <main className={`${MISSION_SHELL} mc-shell-content`} data-pathname={pathname}>
          {children}
        </main>
        <BottomNav active={navActive} routePrefix={routePrefix as '' | '/showcase'} />
      </div>
    </div>
  );
};

export default MissionShell;
