import React, { useState } from 'react';
import { verifyDriverEmail } from '../services/driverLoginService.ts';
import type { DriverSessionProfile } from '../utils/driverSession.ts';
import LoginBrandHero from './terminal/LoginBrandHero.tsx';

interface TerminalLoginProps {
  onLogin: (profile: DriverSessionProfile) => void;
}

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

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="text-blue-400/80">
    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const TerminalLogin: React.FC<TerminalLoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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
      onLogin(result.profile);
    } catch {
      setError('Connection failed. Try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="terminal-login-root min-h-screen bg-[#020208] text-zinc-100 font-sans overflow-hidden relative flex flex-col">
      <div className="terminal-login-grid absolute inset-0 pointer-events-none opacity-80" aria-hidden />
      <div className="terminal-login-scanlines absolute inset-0 pointer-events-none" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 via-transparent to-transparent pointer-events-none" aria-hidden />

      <div className="relative z-10 flex justify-end px-5 sm:px-8 pt-5 sm:pt-6">
        <div className="terminal-connected-badge login-badge-enter">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
          <span className="text-[7px] font-black uppercase tracking-[0.22em] text-green-400">
            Terminal Online
          </span>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 sm:px-8 py-6 sm:py-10">
        <div className="w-full max-w-[420px] space-y-8 sm:space-y-10">
          <LoginBrandHero />

          <div className="login-card-enter terminal-login-panel terminal-login-card relative rounded-2xl border border-blue-500/25 bg-zinc-950/85 backdrop-blur-2xl p-7 sm:p-9 shadow-[0_24px_80px_rgba(0,0,0,0.55),0_0_60px_rgba(59,130,246,0.08)]">
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" aria-hidden />

            <p className="text-center text-[9px] font-black uppercase tracking-[0.48em] text-blue-400/95 mb-8">
              Sign In To Your Account
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="driver-email"
                  className="block text-[9px] font-black uppercase tracking-[0.38em] text-zinc-500 mb-3"
                >
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
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
                    className="terminal-input w-full min-h-[52px] pl-11 pr-4 rounded-xl bg-black/75 border border-zinc-800/90 focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/20 outline-none text-[15px] text-white placeholder:text-zinc-600 placeholder:normal-case shadow-[inset_0_2px_12px_rgba(0,0,0,0.35)]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="terminal-btn-primary w-full min-h-[52px] py-4 rounded-xl font-black uppercase tracking-[0.3em] text-sm text-white bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 border border-blue-400/40 shadow-[0_0_36px_rgba(59,130,246,0.35)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <span>{isSubmitting ? 'Connecting...' : 'Connect'}</span>
                {!isSubmitting && <span aria-hidden className="text-lg leading-none opacity-90">›</span>}
              </button>

              {error ? (
                <p className="text-center text-[12px] text-red-400 font-medium normal-case" role="alert">
                  {error}
                </p>
              ) : null}
            </form>

            <p className="mt-8 flex items-start justify-center gap-2.5 text-[10px] text-zinc-500 normal-case text-center leading-relaxed max-w-sm mx-auto">
              <ShieldIcon />
              <span>Your connection is protected. All data is encrypted end-to-end.</span>
            </p>
          </div>

          <p className="text-center text-[8px] font-black uppercase tracking-[0.35em] text-zinc-600 login-badge-enter">
            v2.0.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default TerminalLogin;
