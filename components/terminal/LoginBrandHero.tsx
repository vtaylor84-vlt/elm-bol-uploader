import React from 'react';

/**
 * Brand hero — globe wordmark only (status bar / mock UI cropped via CSS frame).
 */
const LoginBrandHero: React.FC = () => (
  <div className="relative flex flex-col items-center text-center login-hero-enter w-full">
    <div className="login-brand-frame" aria-hidden>
      <img
        src="/assets/elm-connect-login-brand.png"
        alt=""
        className="login-brand-crop w-full pointer-events-none select-none"
      />
    </div>

    <p className="text-[11px] font-semibold uppercase tracking-[0.42em] text-indigo-300/90 mt-1 login-subtitle-enter">
      Driver Terminal
    </p>
    <p className="mt-1.5 text-[13px] text-zinc-500 normal-case tracking-normal login-subtitle-enter">
      Secure. Simple. Connected.
    </p>
  </div>
);

export default LoginBrandHero;
