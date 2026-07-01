import React from 'react';

/** Premium login hero — globe glow behind ELM CONNECT wordmark */
const LoginBrandHero: React.FC = () => (
  <div className="relative flex flex-col items-center text-center login-hero-enter">
    <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-square flex items-center justify-center mb-2">
      <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-3xl login-globe-glow" aria-hidden />
      <div className="absolute inset-[8%] rounded-full border border-blue-500/20 login-orbit-slow" aria-hidden />
      <div className="absolute inset-[18%] rounded-full border border-cyan-400/15 login-orbit-reverse" aria-hidden />

      <svg
        viewBox="0 0 240 240"
        className="relative z-10 w-full h-full drop-shadow-[0_0_48px_rgba(59,130,246,0.45)]"
        aria-hidden
      >
        <defs>
          <radialGradient id="globe-core" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#1e3a5f" />
            <stop offset="55%" stopColor="#0c1929" />
            <stop offset="100%" stopColor="#030308" />
          </radialGradient>
          <linearGradient id="globe-ring" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <circle cx="120" cy="120" r="88" fill="url(#globe-core)" stroke="url(#globe-ring)" strokeWidth="2" />
        <ellipse cx="120" cy="120" rx="88" ry="28" fill="none" stroke="rgba(56,189,248,0.35)" strokeWidth="1.2" />
        <ellipse cx="120" cy="120" rx="28" ry="88" fill="none" stroke="rgba(56,189,248,0.25)" strokeWidth="1" />
        <path
          d="M32 120 Q120 60 208 120 Q120 180 32 120"
          fill="none"
          stroke="rgba(56,189,248,0.2)"
          strokeWidth="1"
        />
        <circle cx="120" cy="120" r="4" fill="#67e8f9" className="login-pulse-dot" />
      </svg>
    </div>

    <h1
      className="text-3xl sm:text-4xl font-black tracking-[0.06em] leading-none login-title-enter"
      aria-label="ELM CONNECT"
    >
      <span className="text-transparent bg-clip-text bg-gradient-to-b from-zinc-50 via-zinc-200 to-zinc-400">
        ELM
      </span>
      <span className="text-transparent bg-clip-text bg-gradient-to-b from-blue-300 via-blue-400 to-blue-600">
        CONNECT
      </span>
    </h1>
    <p className="mt-4 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.5em] text-blue-400/90 login-subtitle-enter">
      Driver Terminal
    </p>
    <p className="mt-2 text-sm text-zinc-500 normal-case tracking-normal login-subtitle-enter">
      Secure. Simple. Connected.
    </p>
  </div>
);

export default LoginBrandHero;
