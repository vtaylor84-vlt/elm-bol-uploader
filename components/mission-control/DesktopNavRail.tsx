import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { SHELL_NAV_ITEMS, isShellNavActive, type BottomNavId } from './shellNav.tsx';

interface DesktopNavRailProps {
  active: BottomNavId;
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

  return (
    <aside className="mc-desktop-rail" aria-label="Application">
      <div className="mc-desktop-rail-brand">
        <p className="mc-desktop-rail-kicker">ELM CONNECT</p>
        <p className="mc-desktop-rail-sub">Driver Experience</p>
      </div>

      <nav className="mc-desktop-rail-nav" aria-label="Primary">
        <ul className="mc-desktop-rail-list">
          {SHELL_NAV_ITEMS.map((item) => {
            const to = `${prefix}${item.path}`;
            const selected = isShellNavActive(pathname, item, prefix, active);
            return (
              <li key={item.id}>
                <NavLink
                  to={to}
                  className={() =>
                    `mc-desktop-rail-item${selected ? ' is-active' : ''}${
                      item.id === 'capture' ? ' mc-desktop-rail-item--capture' : ''
                    }`
                  }
                  aria-current={selected ? 'page' : undefined}
                  end={item.path === '/today'}
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
        <button type="button" className="mc-desktop-rail-logout" onClick={onLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
};

export default DesktopNavRail;
