import React from 'react';

interface WorkflowEditBarProps {
  onBack: () => void;
  onClose: () => void;
}

const WorkflowEditBar: React.FC<WorkflowEditBarProps> = ({ onBack, onClose }) => (
  <div className="flex items-center justify-between gap-3 mb-4 px-1">
    <button
      type="button"
      onClick={onBack}
      className="terminal-btn-ghost flex items-center gap-2 px-3 py-2 text-[8px] font-black uppercase tracking-[0.2em] text-blue-400"
    >
      <span aria-hidden>←</span>
      Back to Workflow
    </button>
    <button
      type="button"
      onClick={onClose}
      className="terminal-btn-ghost w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white text-lg leading-none"
      aria-label="Close edit mode"
    >
      ×
    </button>
  </div>
);

export default WorkflowEditBar;
