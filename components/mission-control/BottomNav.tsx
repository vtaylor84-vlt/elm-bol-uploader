import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { SHELL_NAV_ITEMS, isShellNavActive, type BottomNavId } from './shellNav.tsx';

export type { BottomNavId };

interface BottomNavProps {
  active: BottomNavId;
  routePrefix?: '' | '/showcase';
}

/** Mobile / tablet primary navigation. Hidden on desktop shell layouts. */
const BottomNav: React.FC<BottomNavProps> = ({ active, routePrefix = '' }) => {
  const { pathname } = useLocation();
  const prefix = routePrefix || '';

  return (
    <nav className="mc-bottom-nav" aria-label="Primary">
      <ul className="mc-bottom-nav-list">
        {SHELL_NAV_ITEMS.map((item) => {
          const to = `${prefix}${item.path}`;
          const isSelected = isShellNavActive(pathname, item, prefix, active);

          return (
            <li key={item.id}>
              <NavLink
                to={to}
                className={() =>
                  `mc-bottom-nav-item${isSelected ? ' is-active' : ''}${
                    item.id === 'capture' ? ' mc-bottom-nav-item--capture' : ''
                  }`
                }
                aria-current={isSelected ? 'page' : undefined}
                end={item.path === '/today'}
              >
                <span className="mc-bottom-nav-icon">{item.icon}</span>
                <span className="mc-bottom-nav-label">{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default BottomNav;
