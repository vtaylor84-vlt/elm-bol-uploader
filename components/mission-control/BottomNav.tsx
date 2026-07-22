import React from 'react';
import { NavLink } from 'react-router-dom';

export type BottomNavId = 'today' | 'loads' | 'capture' | 'pay' | 'more';

interface NavItem {
  id: BottomNavId;
  label: string;
  to: string;
  icon: React.ReactNode;
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

const ITEMS: NavItem[] = [
  { id: 'today', label: 'Today', to: '/today', icon: <IconToday /> },
  { id: 'loads', label: 'Loads', to: '/loads', icon: <IconLoads /> },
  { id: 'capture', label: 'Capture', to: '/workspace', icon: <IconCapture /> },
  { id: 'pay', label: 'Pay', to: '/pay', icon: <IconPay /> },
  { id: 'more', label: 'More', to: '/more', icon: <IconMore /> },
];

interface BottomNavProps {
  active: BottomNavId;
}

const BottomNav: React.FC<BottomNavProps> = ({ active }) => (
  <nav className="mc-bottom-nav" aria-label="Primary">
    <ul className="mc-bottom-nav-list">
      {ITEMS.map((item) => (
        <li key={item.id}>
          <NavLink
            to={item.to}
            className={({ isActive }) =>
              `mc-bottom-nav-item${isActive || active === item.id ? ' is-active' : ''}`
            }
            end={item.to === '/today'}
          >
            <span className="mc-bottom-nav-icon">{item.icon}</span>
            <span className="mc-bottom-nav-label">{item.label}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  </nav>
);

export default BottomNav;
