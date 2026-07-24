import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  desktopNavItems,
  isShellNavActive,
  type PrimaryNavId,
  type BottomNavId,
} from './shellNav.tsx';
import { useDriverExperienceOptional } from '../../context/DriverExperienceContext.tsx';
import { ShellIcons } from './ShellIcons.tsx';

interface DesktopNavRailProps {
  active: PrimaryNavId | BottomNavId;
  routePrefix?: '' | '/showcase';
  onLogout: () => void;
}

/**
 * Persistent desktop navigation rail — same five destinations as mobile.
 * Nested capabilities (messages, vehicle, safety) live under More.
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

  return (
    <aside className="mc-desktop-rail" aria-label="Application">
      <div className="mc-desktop-rail-brand">
        <p className="mc-desktop-rail-kicker">ELM CONNECT</p>
        <p className="mc-desktop-rail-sub">Driver Workspace</p>
      </div>

      <nav className="mc-desktop-rail-nav" aria-label="Primary">
        <ul className="mc-desktop-rail-list">
          {items.map((item) => {
            const to = `${prefix}${item.path}`;
            const selected = isShellNavActive(pathname, item, prefix, active);
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
                  aria-label={item.label}
                  end={item.path === '/home'}
                >
                  <span className="mc-desktop-rail-icon">{item.icon}</span>
                  <span className="mc-desktop-rail-label">{item.label}</span>
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
              <span className="mc-desktop-rail-util-icon">
                <ShellIcons.Search />
              </span>
              Search
            </NavLink>
            <NavLink
              to={`${prefix}/notifications`}
              className="mc-desktop-rail-util"
              title="Notifications"
              aria-label="Open notifications"
            >
              <span className="mc-desktop-rail-util-icon">
                <ShellIcons.Notifications />
              </span>
              Notifications
            </NavLink>
            <NavLink
              to={`${prefix}/assistant`}
              className="mc-desktop-rail-util"
              title="ELM AI"
              aria-label="Open ELM AI"
            >
              <span className="mc-desktop-rail-util-icon">
                <ShellIcons.ElmAi />
              </span>
              ELM AI
            </NavLink>
          </div>
        ) : null}
        <button type="button" className="mc-desktop-rail-logout" onClick={onLogout}>
          Sign out
        </button>
      </div>
    </aside>
  );
};

export default DesktopNavRail;
