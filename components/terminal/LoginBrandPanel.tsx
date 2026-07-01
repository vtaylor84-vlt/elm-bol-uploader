import React from 'react';
import ElmCard from '../../design-system/components/ElmCard.tsx';
import ElmStatusBadge from '../../design-system/components/ElmStatusBadge.tsx';

const SECURITY_ITEMS = [
  'Verified identity',
  'Encrypted connection',
  'Secured session',
  'Ready to connect',
] as const;

interface LoginBrandPanelProps {
  className?: string;
}

/**
 * Desktop login left rail — brand, trust signals, system status.
 * Not a literal recreation of the mockup; same design language.
 */
const LoginBrandPanel: React.FC<LoginBrandPanelProps> = ({ className = '' }) => (
  <aside
    className={[
      'flex flex-col justify-between min-h-full py-8 lg:py-10 xl:py-12',
      className,
    ].join(' ')}
    aria-label="ELM CONNECT platform information"
  >
    <div className="flex justify-end">
      <ElmStatusBadge />
    </div>

    <div className="flex-1 flex flex-col justify-center space-y-8 xl:space-y-10 py-8">
      <div className="relative w-full max-w-[420px] xl:max-w-[480px]">
        <img
          src="/assets/elm-connect-login-brand.png"
          alt=""
          aria-hidden
          className="login-brand-crop-desktop w-full pointer-events-none select-none"
        />
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-black uppercase tracking-[0.42em] text-[#5eb8e8]">
          Driver Terminal
        </p>
        <p className="text-sm xl:text-base text-zinc-400 normal-case leading-relaxed max-w-md">
          Secure. Simple. Connected.
        </p>
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500 pt-2">
          Elite Logistics Manager
        </p>
      </div>

      <ElmCard variant="default" padding="lg" className="max-w-md">
        <p className="text-[10px] font-black uppercase tracking-[0.32em] text-blue-400 mb-4">
          Secure Connection
        </p>
        <ul className="space-y-3">
          {SECURITY_ITEMS.map((item) => (
            <li key={item} className="flex items-center gap-3 text-sm text-zinc-300 normal-case">
              <span
                className="w-5 h-5 rounded-full border border-blue-500/40 bg-blue-500/10 flex items-center justify-center text-[10px] text-blue-400 shrink-0"
                aria-hidden
              >
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </ElmCard>
    </div>

    <footer className="flex items-center gap-3 text-zinc-500 pt-6 border-t border-zinc-800/60">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
        <path
          d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-300">
          ELM CONNECT
        </p>
        <p className="text-[11px] normal-case">Driver Terminal · Enterprise Platform</p>
      </div>
    </footer>
  </aside>
);

export default LoginBrandPanel;
