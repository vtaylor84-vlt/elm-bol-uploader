import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

export type BottomNavId = 'today' | 'loads' | 'capture' | 'pay' | 'more';

interface NavItem {
  id: BottomNavId;
  label: string;
  path: string;
  icon: React.ReactNode;
  matchSuffixes?: string[];
}

const IconToday = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.75" />
    <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
);

const IconLoads = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M3 17h13V7H3v10zm13 0h3.5L22 13.5V9h-6v8zM6 19.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm10 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

const IconCapture = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M4 8h3l2-2h6l2 2h3v11H4V8z"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="13" r="3.25" stroke="currentColor" strokeWidth="1.75" />
  </svg>
);

const IconPay = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.75" />
    <path d="M3 10h18M7 14h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
);

const IconMore = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="6" cy="12" r="1.5" fill="currentColor" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <circle cx="18" cy="12" r="1.5" fill="currentColor" />
  </svg>
);

const BASE_ITEMS: NavItem[] = [
  { id: 'today', label: 'Today', path: '/today', icon: <IconToday /> },
  { id: 'loads', label: 'Loads', path: '/loads', icon: <IconLoads /> },
  {
    id: 'capture',
    label: 'Capture',
    path: '/capture',
    icon: <IconCapture />,
    matchSuffixes: ['/capture', '/workspace'],
  },
  { id: 'pay', label: 'Pay', path: '/pay', icon: <IconPay /> },
  { id: 'more', label: 'More', path: '/more', icon: <IconMore /> },
];

interface BottomNavProps {
  active: BottomNavId;
  routePrefix?: '' | '/showcase';
}

const BottomNav: React.FC<BottomNavProps> = ({ active, routePrefix = '' }) => {
  const { pathname } = useLocation();
  const prefix = routePrefix || '';

  return (
    <nav className="mc-bottom-nav" aria-label="Primary">
      <ul className="mc-bottom-nav-list">
        {BASE_ITEMS.map((item) => {
          const to = `${prefix}${item.path}`;
          const suffixes = (item.matchSuffixes || [item.path]).map((s) => `${prefix}${s}`);
          const pathActive = suffixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
          const isSelected = active === item.id || pathActive;

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
