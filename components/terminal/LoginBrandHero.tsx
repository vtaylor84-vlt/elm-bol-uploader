import React from 'react';

/**
 * Brand hero — uses the official ELM CONNECT globe + wordmark asset
 * (matches production marketing / driver terminal reference).
 */
const LoginBrandHero: React.FC = () => (
  <div className="relative flex flex-col items-center text-center login-hero-enter w-full">
    <div className="relative w-full max-w-[300px] mx-auto">
      <img
        src="/assets/elm-connect-login-brand.png"
        alt=""
        aria-hidden
        className="login-brand-crop w-full pointer-events-none select-none"
      />
    </div>

    <p className="text-[11px] font-black uppercase tracking-[0.42em] text-[#5eb8e8] -mt-1 login-subtitle-enter">
      Driver Terminal
    </p>
    <p className="mt-1 text-[13px] text-zinc-400 normal-case tracking-normal login-subtitle-enter">
      Secure. Simple. Connected.
    </p>
  </div>
);

export default LoginBrandHero;
