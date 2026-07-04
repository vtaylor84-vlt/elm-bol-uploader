import React from 'react';

interface WorkflowEditBarProps {
  onBack: () => void;
}

/** Compact floating back control — replaces the heavy sticky edit bar. */
const WorkflowEditBar: React.FC<WorkflowEditBarProps> = ({ onBack }) => (
  <button
    type="button"
    onClick={onBack}
    aria-label="Back to workflow"
    className="fixed top-[4.25rem] sm:top-[4.75rem] left-4 z-[640] w-11 h-11 flex items-center justify-center rounded-full border border-zinc-700/70 bg-[#030308]/80 backdrop-blur-md text-blue-400 shadow-[0_4px_20px_rgba(0,0,0,0.45)] hover:border-blue-500/45 hover:bg-blue-500/10 hover:text-blue-300 transition-all duration-200 active:scale-95"
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </button>
);

export default WorkflowEditBar;
