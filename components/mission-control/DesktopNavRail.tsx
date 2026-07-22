import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  desktopNavItems,
  isShellNavActive,
  type PrimaryNavId,
  type BottomNavId,
} from './shellNav.tsx';
import { useDriverExperienceOptional } from '../../context/DriverExperienceContext.tsx';

interface DesktopNavRailProps {
  active: PrimaryNavId | BottomNavId;
  routePrefix?: '' | '/showcase';
  onLogout: () => void;
}

/**
 * Persistent desktop navigation rail — enterprise ops shell.
 * Hidden below the desktop breakpoint; mobile keeps BottomNav.
 */
const DesktopNavRail: React.FC<DesktopNavRailProps> = ({
  active,
  routePrefix = '',
  onLogout,
}) => {
  const { pathname } = useLocation();
  const prefix = routePrefix || '';
  const experience = useDriverExperienceOptional();
  const mode = experience?.mode || 'production';
  const items = desktopNavItems(mode);
  const unreadMessages =
    mode === 'showcase'
      ? (experience?.dataSource.getMessages().filter((m) => m.unread).length ?? 0)
      : 0;

  return (
    <aside className="mc-desktop-rail" aria-label="Application">
      <div className="mc-desktop-rail-brand">
        <p className="mc-desktop-rail-kicker">ELM CONNECT</p>
        <p className="mc-desktop-rail-sub">Driver Experience</p>
      </div>

      <nav className="mc-desktop-rail-nav" aria-label="Primary">
        <ul className="mc-desktop-rail-list">
          {items.map((item) => {
            const to = `${prefix}${item.path}`;
            const selected = isShellNavActive(pathname, item, prefix, active);
            const showBadge = item.badgeKey === 'messages' && unreadMessages > 0;
            return (
              <li key={item.id}>
                <NavLink
                  to={to}
                  title={item.label}
                  className={() =>
                    `mc-desktop-rail-item${selected ? ' is-active' : ''}${
                      item.id === 'capture' ? ' mc-desktop-rail-item--capture' : ''
                    }`
                  }
                  aria-current={selected ? 'page' : undefined}
                  aria-label={
                    showBadge ? `${item.label}, ${unreadMessages} unread` : item.label
                  }
                  end={item.path === '/today'}
                >
                  <span className="mc-desktop-rail-icon">{item.icon}</span>
                  <span className="mc-desktop-rail-label">{item.label}</span>
                  {showBadge ? (
                    <span className="mc-nav-badge" aria-hidden>
                      {unreadMessages}
                    </span>
                  ) : null}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mc-desktop-rail-footer">
        {mode === 'showcase' ? (
          <div className="mc-desktop-rail-utils" aria-label="Utilities">
            <NavLink
              to={`${prefix}/search`}
              className="mc-desktop-rail-util"
              title="Search"
              aria-label="Open search"
            >
              Search
            </NavLink>
            <NavLink
              to={`${prefix}/notifications`}
              className="mc-desktop-rail-util"
              title="Notifications"
              aria-label="Open notifications"
            >
              Alerts
            </NavLink>
            <NavLink
              to={`${prefix}/assistant`}
              className="mc-desktop-rail-util"
              title="ELM AI Assistant"
              aria-label="Open assistant"
            >
              Assistant
            </NavLink>
          </div>
        ) : null}
        <button type="button" className="mc-desktop-rail-logout" onClick={onLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
};

export default DesktopNavRail;
