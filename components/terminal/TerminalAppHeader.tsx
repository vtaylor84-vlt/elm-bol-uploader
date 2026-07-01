import React from 'react';
import ElmBrandLogo from './ElmBrandLogo.tsx';
import { TERMINAL_SHELL } from './terminalLayout.ts';

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
    className={`fixed top-0 left-0 right-0 z-[650] border-b backdrop-blur-xl ${
      solarMode
        ? 'bg-white/95 border-zinc-200 shadow-sm'
        : 'terminal-app-header bg-[#030308]/95 border-blue-500/15'
    }`}
  >
    <div className={TERMINAL_SHELL}>
      <div className="flex items-center justify-between gap-2 py-2.5 sm:py-3 min-h-[3rem] sm:min-h-[3.25rem]">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 overflow-hidden">
          <div className="shrink-0">
            <ElmBrandLogo size="sm" subtitle={false} />
          </div>
          <div className="hidden md:block h-5 w-px bg-zinc-800 shrink-0" aria-hidden />
          <div className="hidden md:block min-w-0">
            <p className="text-[7px] font-black uppercase tracking-[0.35em] text-zinc-600">
              Step {stepIndex + 1} of {stepTotal}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-300 truncate">
              {stepLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <div
            className="flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-full border border-green-500/30 bg-green-500/10"
            title="Connected"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_6px_#22c55e]" />
            <span className="text-[7px] font-black uppercase tracking-widest text-green-400 hidden min-[380px]:inline">
              Connected
            </span>
          </div>

          {isAdmin ? (
            <span
              className="px-1.5 sm:px-2 py-1 rounded-full text-[6px] sm:text-[7px] font-black uppercase tracking-[0.12em] border border-amber-500/50 bg-amber-500/15 text-amber-300 whitespace-nowrap"
              title="Admin upload mode"
            >
              Admin Upload Mode
            </span>
          ) : null}

          {eventType ? (
            <span className="hidden lg:inline px-2 py-1 rounded-full text-[6px] font-black uppercase tracking-widest border border-zinc-700 bg-zinc-900/80 text-zinc-400 whitespace-nowrap">
              {eventType}
            </span>
          ) : null}

          {companyLabel ? (
            <span
              className={`hidden xl:inline px-2 py-1 rounded-full text-[6px] font-black uppercase tracking-widest border whitespace-nowrap ${themeBorderClass} ${themeBgClass} ${themeTextClass}`}
            >
              {companyLabel}
            </span>
          ) : null}

          {maskedEmail ? (
            <span className="hidden 2xl:inline text-[7px] font-mono text-zinc-600 truncate max-w-[120px]">
              {maskedEmail}
            </span>
          ) : null}

          <button
            type="button"
            onClick={onLogoutRequest}
            className={`shrink-0 px-2.5 sm:px-3 py-2 rounded-lg border text-[8px] sm:text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-colors ${
              solarMode
                ? 'border-zinc-300 text-zinc-600 hover:border-red-400 hover:text-red-600'
                : 'border-zinc-600/80 bg-zinc-900/60 text-zinc-200 hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/10'
            }`}
            aria-label="Log out"
          >
            Logout
          </button>

          <button
            type="button"
            onClick={onToggleSolar}
            className="terminal-btn-ghost shrink-0 w-9 h-9 sm:w-auto sm:h-auto sm:px-2.5 sm:py-2 flex items-center justify-center text-[7px] font-black uppercase"
            aria-label={solarMode ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {solarMode ? '🌙' : '☀️'}
          </button>
        </div>
      </div>

      <div className="md:hidden flex items-center justify-between gap-2 pb-2 border-t border-zinc-800/50 pt-1.5">
        <p className="text-[7px] font-black uppercase tracking-[0.28em] text-zinc-500 truncate">
          Step {stepIndex + 1}/{stepTotal} · {stepLabel}
        </p>
        <div className="flex items-center gap-1 shrink-0">
          {eventType ? (
            <span className="px-1.5 py-0.5 rounded text-[6px] font-black uppercase tracking-widest border border-zinc-700 bg-zinc-900/80 text-zinc-500">
              {eventType}
            </span>
          ) : null}
          {companyLabel ? (
            <span
              className={`px-1.5 py-0.5 rounded text-[6px] font-black uppercase tracking-widest border ${themeBorderClass} ${themeBgClass} ${themeTextClass}`}
            >
              {companyLabel.length > 12 ? companyLabel.slice(0, 10) + '…' : companyLabel}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  </header>
);

export default TerminalAppHeader;
