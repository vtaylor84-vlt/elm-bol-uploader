import React, { useEffect, useState } from 'react';
import { verifyDriverEmail } from '../services/driverLoginService.ts';
import type { DriverSessionProfile } from '../utils/driverSession.ts';
import LoginBrandHero from './terminal/LoginBrandHero.tsx';
import LoginFooter from './terminal/LoginFooter.tsx';
import StatusBadge from '../design-system/components/StatusBadge.tsx';
import GlassCard from '../design-system/components/GlassCard.tsx';
import DesignPrimaryActionButton from '../design-system/components/PrimaryActionButton.tsx';
import { ELM_VERSION } from '../design-system/tokens.ts';

const REMEMBER_EMAIL_KEY = 'elm_login_remember_email';
/** Clear legacy key from earlier design iterations — never reintroduced. */
const LEGACY_CARRIER_MC_KEY = 'elm_login_carrier_mc';

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
    className="text-cyan-400/80 shrink-0 mt-0.5"
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

/**
 * Driver login — email-only verification against the approved roster.
 * Visual Terminal Online badge is application chrome, not a live backend health check.
 */
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
      localStorage.removeItem(LEGACY_CARRIER_MC_KEY);
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
        localStorage.removeItem(LEGACY_CARRIER_MC_KEY);
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
    <GlassCard glowColor="cyan" padding="lg" className="w-full login-card-enter">
      <div className="text-center space-y-1.5 mb-6">
        <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight normal-case">
          Sign in to Driver Workspace
        </h1>
        <p className="text-xs text-zinc-500 normal-case">
          Your work, trips, paperwork, and pay—all in one place.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="driver-email" className="login-field-label">
            Driver email
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
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'login-error' : undefined}
              className="login-input w-full pl-10 min-h-[52px]"
            />
          </div>
        </div>

        <div className="login-options-row pt-0.5">
          <label className="flex items-center gap-2.5 cursor-pointer select-none min-h-[48px]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="login-remember-checkbox w-4 h-4 rounded border border-cyan-500/40 bg-[#0a1628] accent-cyan-500"
            />
            <span className="text-[12px] text-zinc-400 normal-case">Remember my session</span>
          </label>
          <button
            type="button"
            className="text-[12px] text-cyan-400/90 normal-case hover:text-cyan-300 transition-colors min-h-[48px] px-1 self-start sm:self-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 rounded"
            onClick={() =>
              setError('Contact your dispatcher or admin if you need help with your login email.')
            }
          >
            Forgot email?
          </button>
        </div>

        <DesignPrimaryActionButton
          type="submit"
          label={isSubmitting ? 'Verifying driver access…' : 'Connect to Terminal'}
          variant="primary"
          fullWidth
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="mt-1"
          trailing={<span aria-hidden>→</span>}
        />

        {error ? (
          <p id="login-error" className="text-center text-[11px] text-red-400 normal-case" role="alert">
            {error}
          </p>
        ) : null}
      </form>

      <p className="mt-6 flex items-start justify-center gap-2 text-[10px] text-zinc-500 normal-case text-center leading-relaxed border-t border-white/10 pt-4">
        <LockIcon />
        <span>Secure driver access · Roster-verified email</span>
      </p>
    </GlassCard>
  );

  return (
    <div className="terminal-login-root min-h-screen text-zinc-100 font-sans overflow-x-hidden relative flex flex-col bg-[#050811]">
      <div className="login-page-gradient" aria-hidden />

      <div className="hidden lg:flex flex-col min-h-screen relative z-10">
        <header className="max-w-7xl w-full mx-auto px-8 pt-6 flex items-center justify-between">
          <div>
            <p className="text-xl font-extrabold tracking-wider">
              ELM<span className="text-cyan-400 font-semibold">CONNECT</span>
            </p>
            <p className="text-[10px] text-cyan-300/70 font-mono tracking-widest uppercase mt-1">
              Elite Logistics Manager
            </p>
          </div>
          <StatusBadge
            label={`TERMINAL ONLINE ${ELM_VERSION}`}
            tone="online"
            ariaLabel="Application status — visual only, not a live backend health check"
          />
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto px-8 py-10 grid grid-cols-12 gap-10 items-center">
          <div className="col-span-6 space-y-6">
            <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
              Secure driver access
            </p>
            <h2 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-tight normal-case">
              Your work, trips, paperwork, and pay—{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300">
                all in one place
              </span>
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-lg normal-case">
              Sign in with your approved email to open the Driver Workspace. Submit trip paperwork,
              receipts, and continue to payroll trip submission when a trip is ready.
            </p>
            <div className="grid grid-cols-2 gap-3 max-w-md pt-1">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                <span className="text-emerald-400 text-sm" aria-hidden>
                  ✓
                </span>
                <span className="text-xs font-medium text-zinc-200 normal-case">Roster-verified access</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                <span className="text-cyan-400 text-sm" aria-hidden>
                  ✓
                </span>
                <span className="text-xs font-medium text-zinc-200 normal-case">Verified document upload</span>
              </div>
            </div>
            <div className="pt-4 max-w-sm">
              <LoginBrandHero />
            </div>
          </div>
          <div className="col-span-6 max-w-md w-full mx-auto">{loginForm}</div>
        </main>

        <footer className="p-4 text-center text-[11px] text-zinc-600 font-mono z-20">
          © {new Date().getFullYear()} ELM CONNECT · Driver Terminal
        </footer>
      </div>

      <div className="lg:hidden relative z-10 flex flex-col items-center w-full max-w-[400px] mx-auto px-5 pt-6 pb-10 min-h-screen">
        <div className="w-full flex justify-center mb-4">
          <StatusBadge
            label={`TERMINAL ONLINE ${ELM_VERSION}`}
            tone="online"
            ariaLabel="Application status — visual only, not a live backend health check"
          />
        </div>
        <LoginBrandHero />
        <div className="w-full mt-5">{loginForm}</div>
        <LoginFooter />
      </div>
    </div>
  );
};

export default TerminalLogin;
