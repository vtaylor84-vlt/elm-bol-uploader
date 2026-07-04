import React, { useEffect, useState } from 'react';
import { verifyDriverEmail } from '../services/driverLoginService.ts';
import type { DriverSessionProfile } from '../utils/driverSession.ts';
import LoginBrandHero from './terminal/LoginBrandHero.tsx';
import LoginFooter from './terminal/LoginFooter.tsx';
import ElmButton from '../design-system/components/ElmButton.tsx';
import ElmStatusBadge from '../design-system/components/ElmStatusBadge.tsx';

const REMEMBER_EMAIL_KEY = 'elm_login_remember_email';

interface TerminalLoginProps {
  onLogin: (profile: DriverSessionProfile) => void;
}

const LockIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden
    className="text-blue-400/70 shrink-0 mt-0.5"
  >
    <rect x="6" y="11" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 11V8a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="text-zinc-500">
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
    document.body.classList.add('elm-login-page');
    return () => document.body.classList.remove('elm-login-page');
  }, []);

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

  return (
    <div className="terminal-login-root min-h-screen text-zinc-100 font-sans overflow-x-hidden relative flex flex-col">
      <div className="login-page-gradient" aria-hidden />

      <div className="relative z-10 flex flex-col items-center w-full max-w-[400px] mx-auto px-5 pt-8 pb-10 sm:pt-12 sm:pb-14 min-h-screen">
        <LoginBrandHero />

        <div className="login-signin-card login-card-enter w-full mt-6 sm:mt-8 p-6 sm:p-8">
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.38em] text-indigo-300/80 mb-6">
            Sign In To Your Account
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="driver-email" className="login-field-label">
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
                  className="login-input w-full pl-10"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none min-h-[44px]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="login-remember-checkbox w-4 h-4 rounded border border-blue-500/40 bg-[#0a1628] accent-blue-500"
                />
                <span className="text-[12px] text-zinc-500 normal-case">Remember me</span>
              </label>
              <button
                type="button"
                className="text-[12px] text-zinc-500 normal-case hover:text-zinc-400 transition-colors min-h-[44px] px-1"
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
              trailing={
                !isSubmitting ? (
                  <span aria-hidden className="text-base leading-none font-normal">
                    ›
                  </span>
                ) : undefined
              }
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

          <p className="mt-6 flex items-start justify-center gap-2 text-[10px] text-zinc-600 normal-case text-center leading-relaxed">
            <LockIcon />
            <span>Your connection is protected. All data is encrypted end-to-end.</span>
          </p>
        </div>

        <div className="login-badge-enter w-full mt-4 flex justify-center">
          <ElmStatusBadge variant="login" className="w-full py-3.5" />
        </div>

        <LoginFooter />
      </div>
    </div>
  );
};

export default TerminalLogin;
