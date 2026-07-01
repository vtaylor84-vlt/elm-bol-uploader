import React from 'react';
import ElmBrandLogo from './ElmBrandLogo.tsx';

interface TerminalAppHeaderProps {
  solarMode: boolean;
  stepLabel: string;
  stepIndex: number;
  stepTotal: number;
  isAdmin: boolean;
  maskedEmail?: string;
  eventType?: string;
  companyLabel?: string;
  themeBorderClass: string;
  themeBgClass: string;
  themeTextClass: string;
  onLogoutRequest: () => void;
  onToggleSolar: () => void;
}

const TerminalAppHeader: React.FC<TerminalAppHeaderProps> = ({
  solarMode,
  stepLabel,
  stepIndex,
  stepTotal,
  isAdmin,
  maskedEmail,
  eventType,
  companyLabel,
  themeBorderClass,
  themeBgClass,
  themeTextClass,
  onLogoutRequest,
  onToggleSolar,
}) => (
  <header
    className={`fixed top-0 w-full z-[100] border-b backdrop-blur-xl ${
      solarMode
        ? 'bg-white/95 border-zinc-200 shadow-sm'
        : 'terminal-app-header bg-[#030308]/92 border-blue-500/15'
    }`}
  >
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <ElmBrandLogo size="sm" subtitle={false} />
        <div className="hidden sm:block h-6 w-px bg-zinc-800" aria-hidden />
        <div className="hidden sm:block min-w-0">
          <p className="text-[7px] font-black uppercase tracking-[0.35em] text-zinc-600">
            Step {stepIndex + 1} of {stepTotal}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-300 truncate">
            {stepLabel}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-green-500/30 bg-green-500/10">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_6px_#22c55e]" />
          <span className="text-[7px] font-black uppercase tracking-widest text-green-400">
            Connected
          </span>
        </div>

        {isAdmin ? (
          <span className="hidden sm:inline px-2 py-1 rounded-full text-[6px] font-black uppercase tracking-[0.15em] border border-amber-500/50 bg-amber-500/15 text-amber-300">
            Admin
          </span>
        ) : null}

        {eventType ? (
          <span className="hidden lg:inline px-2 py-1 rounded-full text-[6px] font-black uppercase tracking-widest border border-zinc-700 bg-zinc-900/80 text-zinc-400">
            {eventType}
          </span>
        ) : null}

        {companyLabel ? (
          <span
            className={`hidden lg:inline px-2 py-1 rounded-full text-[6px] font-black uppercase tracking-widest border ${themeBorderClass} ${themeBgClass} ${themeTextClass}`}
          >
            {companyLabel}
          </span>
        ) : null}

        {maskedEmail ? (
          <span className="hidden xl:inline text-[7px] font-mono text-zinc-600 truncate max-w-[100px]">
            {maskedEmail}
          </span>
        ) : null}

        <button
          type="button"
          onClick={onLogoutRequest}
          className="terminal-btn-ghost px-3 py-2 text-[7px] font-black uppercase tracking-widest text-zinc-500 hover:text-red-400"
          aria-label="Log out"
        >
          Logout
        </button>

        <button
          type="button"
          onClick={onToggleSolar}
          className="terminal-btn-ghost px-2.5 py-2 text-[7px] font-black uppercase"
          aria-label={solarMode ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {solarMode ? '🌙' : '☀️'}
        </button>
      </div>
    </div>

    <div className="sm:hidden px-4 pb-2">
      <p className="text-[7px] font-black uppercase tracking-[0.3em] text-zinc-600">
        Step {stepIndex + 1}/{stepTotal} · {stepLabel}
      </p>
    </div>
  </header>
);

export default TerminalAppHeader;
