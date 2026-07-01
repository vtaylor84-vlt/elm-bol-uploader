import React, { useState } from 'react';
import { verifyDriverEmail } from '../services/driverLoginService.ts';
import type { DriverSessionProfile } from '../utils/driverSession.ts';
import ElmBrandLogo from './terminal/ElmBrandLogo.tsx';

interface TerminalLoginProps {
  onLogin: (profile: DriverSessionProfile) => void;
}

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="text-blue-400/80">
    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
    <div className="terminal-login-root min-h-screen bg-[#030308] text-zinc-100 font-sans overflow-hidden relative flex flex-col">
      <div className="terminal-login-grid absolute inset-0 pointer-events-none" aria-hidden />
      <div className="terminal-login-scanlines absolute inset-0 pointer-events-none" aria-hidden />

      <div className="relative z-10 flex justify-end px-5 sm:px-8 pt-5">
        <div className="terminal-connected-badge">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_6px_#22c55e]" />
          <span className="text-[7px] font-black uppercase tracking-[0.2em] text-green-400">
            Terminal Online
          </span>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 sm:px-8 py-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-3">
            <ElmBrandLogo size="lg" align="center" />
            <p className="text-[9px] font-black uppercase tracking-[0.45em] text-blue-400/80">
              Driver Terminal
            </p>
            <p className="text-sm text-zinc-500 normal-case tracking-normal">
              Secure. Simple. Connected.
            </p>
          </div>

          <div className="terminal-login-panel terminal-login-card relative rounded-2xl border border-blue-500/30 bg-zinc-950/90 backdrop-blur-xl p-7 sm:p-9">
            <p className="text-center text-[9px] font-black uppercase tracking-[0.45em] text-blue-400 mb-8">
              Sign In To Your Account
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="driver-email"
                  className="block text-[9px] font-black uppercase tracking-[0.35em] text-zinc-500 mb-3"
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
                    className="terminal-input w-full pl-11 pr-4 py-4 rounded-xl bg-black/70 border border-zinc-800/90 focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm text-white placeholder:text-zinc-600 placeholder:normal-case"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="terminal-btn-primary w-full py-4 rounded-xl font-black uppercase tracking-[0.28em] text-sm text-white disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <span>{isSubmitting ? 'Connecting...' : 'Connect'}</span>
                {!isSubmitting && <span aria-hidden className="text-lg leading-none">›</span>}
              </button>

              {error ? (
                <p className="text-center text-[11px] text-red-400 font-medium normal-case" role="alert">
                  {error}
                </p>
              ) : null}
            </form>

            <p className="mt-8 flex items-start justify-center gap-2 text-[9px] text-zinc-500 normal-case text-center leading-relaxed">
              <ShieldIcon />
              <span>Your connection is protected. All data is encrypted end-to-end.</span>
            </p>
          </div>

          <p className="text-center text-[8px] font-black uppercase tracking-[0.32em] text-zinc-600">
            v2.0.0 · ELM CONNECT
          </p>
        </div>
      </div>
    </div>
  );
};

export default TerminalLogin;
