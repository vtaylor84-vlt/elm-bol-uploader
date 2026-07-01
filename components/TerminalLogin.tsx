import React, { useEffect, useState } from 'react';
import { verifyDriverEmail } from '../services/driverLoginService.ts';
import type { DriverSessionProfile } from '../utils/driverSession.ts';
import { writeDriverSession } from '../utils/driverSession.ts';
import ElmBrandLogo from './terminal/ElmBrandLogo.tsx';
import ConnectionPulse from './terminal/ConnectionPulse.tsx';

const PROGRESS_STEPS = [
  'Establishing secure link...',
  'Verifying access...',
  'Syncing profile...',
  'Terminal active.',
] as const;

const BOOT_CHECKLIST = [
  'Establishing link',
  'Verifying identity',
  'Securing session',
  'Welcome, Driver',
] as const;

interface TerminalLoginProps {
  onLogin: (profile: DriverSessionProfile) => void;
}

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="text-blue-400/80">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M5 20c0-3.314 3.134-6 7-6s7 2.686 7 6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const ShieldIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className="text-blue-400 shrink-0">
    <path
      d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TerminalLogin: React.FC<TerminalLoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressIndex, setProgressIndex] = useState(-1);
  const [error, setError] = useState('');
  const [bootProgress, setBootProgress] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setBootProgress((p) => (p >= 87 ? 87 : p + 1));
    }, 80);
    return () => window.clearInterval(timer);
  }, []);

  const runProgressAnimation = async () => {
    for (let i = 0; i < PROGRESS_STEPS.length; i++) {
      setProgressIndex(i);
      await new Promise((r) => window.setTimeout(r, 420));
    }
  };

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
    setProgressIndex(0);

    try {
      const [result] = await Promise.all([
        verifyDriverEmail(trimmed),
        runProgressAnimation(),
      ]);

      if (!result.success || !result.profile) {
        setError(result.error || 'Access denied. Use an approved driver or admin email.');
        setProgressIndex(-1);
        setIsSubmitting(false);
        return;
      }

      writeDriverSession(result.profile);
      setBootProgress(100);
      window.setTimeout(() => onLogin(result.profile!), 300);
    } catch {
      setError('Connection failed. Try again.');
      setProgressIndex(-1);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="terminal-login-root min-h-screen bg-[#030308] text-zinc-100 font-sans overflow-hidden relative flex flex-col">
      <div className="terminal-login-grid absolute inset-0 pointer-events-none" aria-hidden />
      <div className="terminal-login-scanlines absolute inset-0 pointer-events-none" aria-hidden />
      <div className="terminal-login-frame absolute inset-3 sm:inset-5 pointer-events-none" aria-hidden />

      <div className="relative z-10 flex justify-end px-5 sm:px-8 pt-5">
        <div className="terminal-connected-badge">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_6px_#22c55e]" />
          <span className="text-[7px] font-black uppercase tracking-[0.2em] text-green-400">
            Terminal Online
          </span>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col lg:flex-row max-w-6xl mx-auto w-full px-5 sm:px-8 py-4 lg:py-8 gap-10 lg:gap-16 items-center lg:items-stretch">
        <div className="flex-1 flex flex-col justify-center w-full max-w-md mx-auto lg:mx-0 space-y-8">
          <ElmBrandLogo size="lg" align="left" />
          <ConnectionPulse />

          <div className="terminal-glass-panel p-5 space-y-4">
            <div className="flex justify-between items-center gap-2 text-[8px] sm:text-[9px] font-mono uppercase tracking-[0.18em] text-cyan-400/90">
              <span>Initializing secure connection</span>
              <span className="text-cyan-300 tabular-nums font-bold">{bootProgress}%</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-900/90 border border-zinc-800/80 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-400 transition-all duration-300 shadow-[0_0_14px_rgba(56,189,248,0.65)]"
                style={{ width: `${bootProgress}%` }}
              />
            </div>
            <ul className="space-y-2 text-[8px] sm:text-[9px] font-mono uppercase tracking-[0.12em]">
              {BOOT_CHECKLIST.map((label, i) => {
                const done = bootProgress > i * 22;
                return (
                  <li
                    key={label}
                    className={`terminal-status-item flex items-center gap-2.5 ${
                      done ? 'text-cyan-400/95' : 'text-zinc-600'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] border ${
                        done
                          ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400'
                          : 'border-zinc-800 text-zinc-700'
                      }`}
                    >
                      {done ? '✓' : '·'}
                    </span>
                    {label}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center w-full max-w-md mx-auto lg:mx-0">
          <div className="terminal-login-panel terminal-login-card relative rounded-2xl border border-blue-500/30 bg-zinc-950/90 backdrop-blur-xl p-7 sm:p-9">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
              <p className="text-[9px] font-black uppercase tracking-[0.55em] text-zinc-400 shrink-0">
                Driver Access
              </p>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="driver-email"
                  className="block text-[9px] font-black uppercase tracking-[0.4em] text-blue-400/90 mb-3"
                >
                  Email address
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none select-none">
                    <UserIcon />
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
                    className="terminal-input w-full pl-11 pr-4 py-4 rounded-xl bg-black/70 border border-zinc-800/90 focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm text-white placeholder:text-zinc-600 placeholder:normal-case shadow-[inset_0_2px_10px_rgba(0,0,0,0.45)]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="terminal-btn-primary w-full py-4 rounded-xl font-black uppercase tracking-[0.28em] text-sm text-white bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 border border-blue-400/50 shadow-[0_0_36px_rgba(59,130,246,0.4),inset_0_1px_0_rgba(255,255,255,0.12)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <span>{isSubmitting ? 'Connecting...' : 'Connect'}</span>
                {!isSubmitting && (
                  <span aria-hidden className="text-lg leading-none opacity-90">
                    ›
                  </span>
                )}
              </button>

              {error ? (
                <p className="text-center text-[11px] text-red-400 font-medium normal-case px-2" role="alert">
                  {error}
                </p>
              ) : null}

              {progressIndex >= 0 && isSubmitting ? (
                <div className="space-y-2 pt-3 border-t border-zinc-800/80">
                  {PROGRESS_STEPS.map((step, i) => (
                    <p
                      key={step}
                      className={`text-[9px] font-mono uppercase tracking-wide transition-colors ${
                        i <= progressIndex ? 'text-cyan-400' : 'text-zinc-700'
                      }`}
                    >
                      {i <= progressIndex ? '▸ ' : '  '}
                      {step}
                    </p>
                  ))}
                </div>
              ) : null}
            </form>

            <p className="mt-8 flex items-start justify-center gap-2 text-[9px] text-zinc-500 normal-case text-center leading-relaxed max-w-xs mx-auto">
              <ShieldIcon />
              <span>Your connection is protected. All data is encrypted end-to-end.</span>
            </p>
          </div>

          <p className="mt-6 text-center text-[8px] font-black uppercase tracking-[0.45em] text-zinc-600">
            ELM Connect Secure Terminal
          </p>
        </div>
      </div>

      <footer className="relative z-10 py-5 text-center text-[8px] font-black uppercase tracking-[0.32em] text-zinc-600">
        Powered by ELM Connect · Driven by Excellence
      </footer>
    </div>
  );
};

export default TerminalLogin;
