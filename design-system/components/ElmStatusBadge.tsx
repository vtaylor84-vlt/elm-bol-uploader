import React from 'react';
import { ELM_VERSION } from '../tokens.ts';

type ElmStatusBadgeProps = {
  label?: string;
  showVersion?: boolean;
  className?: string;
};

const ElmStatusBadge: React.FC<ElmStatusBadgeProps> = ({
  label = 'Terminal Online',
  showVersion = true,
  className = '',
}) => (
  <div
    className={[
      'inline-flex flex-col items-center gap-1 rounded-xl border border-green-500/30',
      'bg-green-500/[0.06] px-4 py-2.5',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    role="status"
  >
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" aria-hidden />
      <span className="text-[9px] font-black uppercase tracking-[0.26em] text-green-400">
        {label}
      </span>
    </div>
    {showVersion ? (
      <span className="text-[10px] text-zinc-600 font-mono">{ELM_VERSION}</span>
    ) : null}
  </div>
);

export default ElmStatusBadge;
