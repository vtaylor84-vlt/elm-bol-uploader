import React from 'react';
import BrandMark from '../brand/BrandMark.tsx';

/**
 * Login brand hero — single canonical ELM CONNECT globe identity.
 */
const LoginBrandHero: React.FC = () => (
  <div className="relative flex flex-col items-center text-center login-hero-enter w-full">
    <BrandMark theme="elm" size="hero" className="login-brand-mark" />
    <p className="text-[11px] font-semibold uppercase tracking-[0.42em] text-indigo-300/90 mt-3 login-subtitle-enter">
      Driver Terminal
    </p>
    <p className="mt-1.5 text-[13px] text-zinc-500 normal-case tracking-normal login-subtitle-enter">
      Secure driver access
    </p>
  </div>
);

export default LoginBrandHero;
