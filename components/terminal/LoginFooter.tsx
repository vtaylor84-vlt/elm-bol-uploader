import React from 'react';

const LoginFooter: React.FC = () => (
  <footer className="login-badge-enter mt-8 flex flex-col items-center justify-center gap-2 text-zinc-600">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden className="opacity-70">
      <path
        d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
    <div className="text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
        ELM CONNECT
      </p>
      <p className="text-[11px] normal-case text-zinc-600 mt-0.5">Elite Logistics Manager</p>
    </div>
  </footer>
);

export default LoginFooter;
