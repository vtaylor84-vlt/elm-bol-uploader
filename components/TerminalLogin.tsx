import React, { useEffect, useState } from 'react';
import { verifyDriverEmail } from '../services/driverLoginService.ts';
import type { DriverSessionProfile } from '../utils/driverSession.ts';
import LoginBrandHero from './terminal/LoginBrandHero.tsx';

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

const FooterShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden className="text-zinc-500 shrink-0">
    <path
      d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z"
      stroke="currentColor"
      strokeWidth="1.2"
    />
    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
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

  return (
    <div className="terminal-login-root min-h-screen bg-black text-zinc-100 font-sans overflow-x-hidden relative flex flex-col">
      <div className="relative z-10 flex-1 flex flex-col items-center px-5 pt-4 pb-6 max-w-[390px] mx-auto w-full">
        <LoginBrandHero />

        <div className="login-card-enter w-full mt-4 login-reference-card rounded-2xl border border-[#1e3a5f]/80 bg-[#0a0f18]/95 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
          <p className="text-center text-[10px] font-black uppercase tracking-[0.38em] text-[#5eb8e8] mb-5">
            Sign In To Your Account
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="driver-email"
                className="block text-[9px] font-black uppercase tracking-[0.28em] text-zinc-400 mb-2"
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
                  className="terminal-input w-full min-h-[46px] pl-10 pr-4 rounded-lg bg-[#060a12] border border-[#1a2744] focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none text-[14px] text-white placeholder:text-zinc-600 placeholder:normal-case"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
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
                className="text-[12px] text-[#5eb8e8] normal-case hover:text-blue-300 transition-colors"
                onClick={() =>
                  setError('Contact your dispatcher or admin if you need help with your login email.')
                }
              >
                Forgot email?
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="terminal-btn-primary w-full min-h-[46px] rounded-lg font-black uppercase tracking-[0.22em] text-[13px] text-white login-connect-btn disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
            >
              <span>{isSubmitting ? 'Connecting...' : 'Connect'}</span>
              {!isSubmitting && <span aria-hidden className="text-base leading-none">›</span>}
            </button>

            {error ? (
              <p className="text-center text-[11px] text-red-400 normal-case" role="alert">
                {error}
              </p>
            ) : null}
          </form>

          <p className="mt-5 flex items-start justify-center gap-2 text-[10px] text-zinc-500 normal-case text-center leading-relaxed">
            <LockIcon />
            <span>Your connection is protected. All data is encrypted end-to-end.</span>
          </p>
        </div>

        <div className="login-badge-enter w-full mt-3 login-reference-card rounded-2xl border border-[#1e3a5f]/80 bg-[#0a0f18]/90 px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
            <span className="text-[9px] font-black uppercase tracking-[0.26em] text-green-400">
              Terminal Online
            </span>
          </div>
          <p className="text-[10px] text-zinc-600 mt-1">v2.0.0</p>
        </div>

        <footer className="login-badge-enter mt-5 flex items-center justify-center gap-2.5">
          <FooterShield />
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-300">ELM CONNECT</p>
            <p className="text-[11px] text-zinc-500 normal-case">Elite Logistics Manager</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default TerminalLogin;
