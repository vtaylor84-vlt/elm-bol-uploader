import React, { useEffect, useState } from 'react';
import { verifyDriverEmail } from '../services/driverLoginService.ts';
import type { DriverSessionProfile } from '../utils/driverSession.ts';
import { writeDriverSession } from '../utils/driverSession.ts';

const PROGRESS_STEPS = [
  'Establishing secure link...',
  'Verifying access...',
  'Syncing profile...',
  'Terminal active.',
] as const;

interface TerminalLoginProps {
  onLogin: (profile: DriverSessionProfile) => void;
}

const PlugGraphic = () => (
  <div className="relative w-full max-w-[280px] mx-auto aspect-square flex items-center justify-center">
    <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-pulse" />
    <div className="absolute inset-4 rounded-full border border-blue-500/30" />
    <div className="absolute inset-8 rounded-full border border-cyan-400/40 animate-ping opacity-40" />
    <svg viewBox="0 0 200 120" className="w-full h-auto relative z-10 drop-shadow-[0_0_24px_rgba(59,130,246,0.5)]">
      <defs>
        <linearGradient id="plugGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1e3a5f" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1e3a5f" />
        </linearGradient>
      </defs>
      <rect x="20" y="45" width="50" height="30" rx="6" fill="#0a0a12" stroke="#3b82f6" strokeWidth="2" />
      <rect x="130" y="45" width="50" height="30" rx="6" fill="#0a0a12" stroke="#3b82f6" strokeWidth="2" />
      <circle cx="45" cy="60" r="8" fill="none" stroke="#22d3ee" strokeWidth="2" className="animate-pulse" />
      <circle cx="155" cy="60" r="8" fill="none" stroke="#22d3ee" strokeWidth="2" className="animate-pulse" />
      <path
        d="M70 60 Q100 20 130 60"
        fill="none"
        stroke="#38bdf8"
        strokeWidth="3"
        strokeLinecap="round"
        className="terminal-arc"
      />
      <path
        d="M95 35 L100 25 L105 35"
        fill="none"
        stroke="#67e8f9"
        strokeWidth="2"
        className="terminal-spark"
      />
    </svg>
  </div>
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

      <div className="relative z-10 flex-1 flex flex-col lg:flex-row max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 lg:py-12 gap-8 lg:gap-12">
        {/* Left — branding */}
        <div className="flex-1 flex flex-col justify-center space-y-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              <span className="text-white">ELM</span>
              <span className="text-blue-400">CONNECT</span>
            </h1>
            <p className="mt-2 text-[10px] sm:text-xs font-black uppercase tracking-[0.45em] text-zinc-500">
              Elite Logistics Manager
            </p>
          </div>

          <PlugGraphic />

          <div className="space-y-3 max-w-sm">
            <div className="flex justify-between text-[9px] font-mono uppercase tracking-widest text-cyan-500/80">
              <span>Initializing secure connection</span>
              <span>{bootProgress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-300 shadow-[0_0_12px_rgba(56,189,248,0.6)]"
                style={{ width: `${bootProgress}%` }}
              />
            </div>
            <ul className="space-y-1.5 text-[9px] font-mono uppercase tracking-wide text-zinc-600">
              {['Establishing link', 'Verifying identity', 'Securing session', 'Welcome, driver'].map(
                (label, i) => (
                  <li
                    key={label}
                    className={`flex items-center gap-2 ${
                      bootProgress > i * 22 ? 'text-cyan-400/90' : ''
                    }`}
                  >
                    <span>{bootProgress > i * 22 ? '✓' : '·'}</span>
                    {label}
                  </li>
                )
              )}
            </ul>
          </div>
        </div>

        {/* Right — form */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="terminal-login-panel rounded-2xl border border-blue-500/30 bg-zinc-950/80 backdrop-blur-md p-6 sm:p-8 shadow-[0_0_48px_rgba(59,130,246,0.15)]">
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-zinc-500 mb-2">
              Driver Access
            </p>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300 mb-6">
              Plug in to your route
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="driver-email"
                  className="block text-[9px] font-black uppercase tracking-[0.35em] text-zinc-500 mb-2"
                >
                  Email address
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500/60 text-sm">
                    @
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
                    className="w-full pl-10 pr-4 py-4 rounded-xl bg-black/60 border border-zinc-800 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/25 outline-none text-sm text-white placeholder:text-zinc-600 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl font-black uppercase tracking-[0.25em] text-sm bg-gradient-to-r from-blue-600 to-cyan-600 text-white border border-blue-400/40 shadow-[0_0_32px_rgba(59,130,246,0.35)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Connecting...' : 'Plug In'}
                {!isSubmitting && <span aria-hidden>›</span>}
              </button>

              {error ? (
                <p className="text-center text-[11px] text-red-400 font-medium normal-case px-2">
                  {error}
                </p>
              ) : null}

              {progressIndex >= 0 && isSubmitting ? (
                <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                  {PROGRESS_STEPS.map((step, i) => (
                    <p
                      key={step}
                      className={`text-[9px] font-mono uppercase tracking-wide ${
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

            <p className="mt-6 flex items-center justify-center gap-2 text-[9px] text-zinc-600 normal-case">
              <span className="text-blue-500/70">🛡</span>
              Your connection is protected. Bridge login — email verification only.
            </p>
          </div>

          <p className="mt-6 text-center text-[8px] font-black uppercase tracking-[0.4em] text-zinc-700">
            ELM Connect Secure Terminal
          </p>
        </div>
      </div>

      <footer className="relative z-10 py-4 text-center text-[8px] font-black uppercase tracking-[0.35em] text-zinc-700">
        Powered by ELM Connect · Driven by Excellence
      </footer>
    </div>
  );
};

export default TerminalLogin;
