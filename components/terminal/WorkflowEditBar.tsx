import React from 'react';
import { TERMINAL_SHELL } from './terminalLayout.ts';

interface WorkflowEditBarProps {
  onBack: () => void;
  onClose: () => void;
  sticky?: boolean;
}

const WorkflowEditBar: React.FC<WorkflowEditBarProps> = ({
  onBack,
  onClose,
  sticky = false,
}) => {
  const bar = (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border border-blue-500/25 bg-blue-500/5 px-3 py-2.5 sm:px-4 sm:py-3 ${
        sticky ? 'shadow-[0_4px_24px_rgba(0,0,0,0.35)]' : 'mb-4'
      }`}
      role="toolbar"
      aria-label="Edit load assignment"
    >
      <button
        type="button"
        onClick={onBack}
        className="terminal-btn-ghost flex items-center gap-2 px-3 py-2.5 min-h-[44px] text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] text-blue-400 border border-blue-500/30 bg-blue-500/10 rounded-lg"
      >
        <span aria-hidden>←</span>
        Back to Workflow
      </button>
      <button
        type="button"
        onClick={onClose}
        className="terminal-btn-ghost min-w-[44px] min-h-[44px] flex items-center justify-center text-zinc-400 hover:text-white text-xl leading-none border border-zinc-700/80 rounded-lg bg-zinc-900/50"
        aria-label="Close edit mode"
      >
        ×
      </button>
    </div>
  );

  if (sticky) {
    return (
      <div className="fixed top-[3.75rem] sm:top-[4.25rem] left-0 right-0 z-[640] border-b border-blue-500/15 bg-[#030308]/95 backdrop-blur-xl">
        <div className={`${TERMINAL_SHELL} py-2`}>{bar}</div>
      </div>
    );
  }

  return bar;
};

export default WorkflowEditBar;
