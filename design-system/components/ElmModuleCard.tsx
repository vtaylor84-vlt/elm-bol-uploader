import React from 'react';

interface ElmModuleCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  accent?: 'blue' | 'cyan' | 'violet' | 'amber' | 'emerald' | 'rose';
  onClick?: () => void;
  disabled?: boolean;
  badge?: string;
}

const accentMap = {
  blue: 'border-blue-500/25 hover:border-blue-500/50 group-hover:text-blue-300',
  cyan: 'border-cyan-500/25 hover:border-cyan-500/50 group-hover:text-cyan-300',
  violet: 'border-violet-500/25 hover:border-violet-500/50 group-hover:text-violet-300',
  amber: 'border-amber-500/25 hover:border-amber-500/50 group-hover:text-amber-300',
  emerald: 'border-emerald-500/25 hover:border-emerald-500/50 group-hover:text-emerald-300',
  rose: 'border-rose-500/25 hover:border-rose-500/50 group-hover:text-rose-300',
};

const iconBgMap = {
  blue: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  cyan: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
  violet: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
  amber: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  rose: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
};

const ElmModuleCard: React.FC<ElmModuleCardProps> = ({
  title,
  description,
  icon,
  accent = 'blue',
  onClick,
  disabled = false,
  badge,
}) => {
  const Tag = disabled ? 'div' : 'button';
  const interactive = !disabled;

  return (
    <Tag
      type={interactive ? 'button' : undefined}
      onClick={interactive ? onClick : undefined}
      aria-disabled={disabled || undefined}
      className={[
        'elm-module-card group w-full text-left rounded-2xl border bg-zinc-950/70 backdrop-blur-sm',
        'p-5 sm:p-6 lg:p-7 transition-all duration-200',
        accentMap[accent],
        interactive
          ? 'hover:scale-[1.01] hover:shadow-[0_0_32px_rgba(59,130,246,0.12)] active:scale-[0.99] cursor-pointer'
          : 'opacity-55 cursor-not-allowed',
      ].join(' ')}
    >
      <div className="flex items-start gap-4 lg:gap-5">
        <div
          className={`w-12 h-12 lg:w-14 lg:h-14 rounded-xl border flex items-center justify-center text-xl lg:text-2xl shrink-0 ${iconBgMap[accent]}`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg lg:text-xl font-black uppercase tracking-wide text-white transition-colors">
              {title}
            </h2>
            {badge ? (
              <span className="text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-zinc-700 text-zinc-500">
                {badge}
              </span>
            ) : null}
          </div>
          <p className="text-sm text-zinc-400 normal-case mt-2 leading-relaxed">{description}</p>
        </div>
        {interactive ? (
          <span
            className="text-blue-400 text-xl opacity-60 group-hover:opacity-100 shrink-0 mt-1"
            aria-hidden
          >
            ›
          </span>
        ) : null}
      </div>
    </Tag>
  );
};

export default ElmModuleCard;
