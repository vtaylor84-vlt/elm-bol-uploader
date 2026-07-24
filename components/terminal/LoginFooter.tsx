import React from 'react';

/** Login footer — no second logo; copyright only. */
const LoginFooter: React.FC = () => (
  <footer className="login-badge-enter mt-8 text-center text-[11px] text-zinc-600 normal-case">
    © {new Date().getFullYear()} ELM CONNECT · Driver Terminal
  </footer>
);

export default LoginFooter;
