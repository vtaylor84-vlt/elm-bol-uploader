import React, { useEffect, useState } from 'react';
import { verifyDriverEmail } from '../services/driverLoginService.ts';
import type { DriverSessionProfile } from '../utils/driverSession.ts';
import LoginBrandHero from './terminal/LoginBrandHero.tsx';
import LoginBrandPanel from './terminal/LoginBrandPanel.tsx';
import ElmButton from '../design-system/components/ElmButton.tsx';
import ElmCard from '../design-system/components/ElmCard.tsx';
import ElmStatusBadge from '../design-system/components/ElmStatusBadge.tsx';

const REMEMBER_EMAIL_KEY = 'elm_login_remember_email';

interface TerminalLoginProps {
  onLogin: (profile: DriverSessionProfile) => void;
}

const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className="text-blue-400 shrink-0 mt-0.5">
    <rect x="6" y="11" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 11V8a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="text-zinc-400">
    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const TerminalLogin: React.FC<TerminalLoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_EMAIL_KEY);
      if (saved) {
        setEmail(saved);
        setRememberMe(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError('');
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError('Enter your approved email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await verifyDriverEmail(trimmed);
      if (!result.success || !result.profile) {
        setError(result.error || 'Access denied. Use an approved driver or admin email.');
        setIsSubmitting(false);
        return;
      }

      try {
        if (rememberMe) {
          localStorage.setItem(REMEMBER_EMAIL_KEY, trimmed);
        } else {
          localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }
      } catch {
        /* ignore */
      }

      onLogin(result.profile);
    } catch {
      setError('Connection failed. Try again.');
      setIsSubmitting(false);
    }
  };

  const loginForm = (
    <ElmCard padding="lg" className="w-full login-card-enter">
      <p className="text-center text-[10px] font-black uppercase tracking-[0.38em] text-[#5eb8e8] mb-2">
        Driver Access
      </p>
      <p className="text-center text-[10px] font-black uppercase tracking-[0.38em] text-zinc-500 mb-6 lg:mb-8">
        Sign In To Your Account
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-5">
        <div>
          <label
            htmlFor="driver-email"
            className="elm-field-label"
          >
            Email Address
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <MailIcon />
            </span>
            <input
              id="driver-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              disabled={isSubmitting}
              className="elm-input w-full pl-10"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none min-h-[44px]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="login-remember-checkbox w-4 h-4 rounded border border-blue-500/50 bg-[#0a1628] accent-blue-500"
            />
            <span className="text-[12px] text-zinc-300 normal-case">Remember me</span>
          </label>
          <button
            type="button"
            className="text-[12px] text-[#5eb8e8] normal-case hover:text-blue-300 transition-colors min-h-[44px] px-1"
            onClick={() =>
              setError('Contact your dispatcher or admin if you need help with your login email.')
            }
          >
            Forgot email?
          </button>
        </div>

        <ElmButton
          type="submit"
          variant="primary"
          fullWidth
          disabled={isSubmitting}
          trailing={!isSubmitting ? <span aria-hidden className="text-base leading-none">›</span> : undefined}
          className="login-connect-btn mt-1"
        >
          {isSubmitting ? 'Connecting...' : 'Connect'}
        </ElmButton>

        {error ? (
          <p className="text-center text-[11px] text-red-400 normal-case" role="alert">
            {error}
          </p>
        ) : null}
      </form>

      <p className="mt-5 lg:mt-6 flex items-start justify-center gap-2 text-[10px] text-zinc-500 normal-case text-center leading-relaxed">
        <LockIcon />
        <span>Your connection is protected. All data is encrypted end-to-end.</span>
      </p>
    </ElmCard>
  );

  return (
    <div className="terminal-login-root min-h-screen bg-black text-zinc-100 font-sans overflow-x-hidden relative">
      {/* Desktop: intentional two-column layout */}
      <div className="hidden lg:grid lg:grid-cols-2 min-h-screen max-w-[1440px] mx-auto xl:gap-8">
        <div className="px-8 xl:px-12 border-r border-zinc-800/40">
          <LoginBrandPanel />
        </div>
        <div className="flex flex-col justify-center px-8 xl:px-16 py-12">
          <div className="w-full max-w-md mx-auto">{loginForm}</div>
        </div>
      </div>

      {/* Mobile / tablet: single centered column */}
      <div className="lg:hidden flex flex-col items-center px-5 pt-4 pb-8 max-w-[420px] mx-auto w-full min-h-screen">
        <LoginBrandHero />

        <div className="w-full mt-4">{loginForm}</div>

        <div className="login-badge-enter w-full mt-4">
          <ElmStatusBadge className="w-full" />
        </div>

        <footer className="login-badge-enter mt-6 flex items-center justify-center gap-2.5 text-zinc-500">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
            <path
              d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-300">ELM CONNECT</p>
            <p className="text-[11px] normal-case">Elite Logistics Manager</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default TerminalLogin;
