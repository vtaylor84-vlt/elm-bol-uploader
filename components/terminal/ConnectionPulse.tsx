import React from 'react';

/** Animated terminal handshake — energy pulse between connectors */
const ConnectionPulse: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <div
    className={`relative mx-auto flex items-center justify-center ${
      compact ? 'w-32 h-32' : 'w-full max-w-[300px] aspect-square py-4'
    }`}
    aria-hidden
  >
    <div className="absolute inset-0 rounded-full border border-cyan-500/10 terminal-orbit" />
    <div className="absolute inset-[12%] rounded-full border border-blue-500/20 terminal-orbit-reverse" />
    <div className="absolute inset-[24%] rounded-full bg-blue-500/5 blur-xl terminal-glow-pulse" />

    <svg
      viewBox="0 0 200 120"
      className={`relative z-10 w-full h-auto drop-shadow-[0_0_32px_rgba(59,130,246,0.5)] ${
        compact ? 'max-w-[120px]' : ''
      }`}
    >
      <rect x="20" y="45" width="50" height="30" rx="6" fill="#0a0a12" stroke="#3b82f6" strokeWidth="2" />
      <rect x="130" y="45" width="50" height="30" rx="6" fill="#0a0a12" stroke="#3b82f6" strokeWidth="2" />
      <circle cx="45" cy="60" r="8" fill="none" stroke="#22d3ee" strokeWidth="2" className="terminal-pulse-ring" />
      <circle cx="155" cy="60" r="8" fill="none" stroke="#22d3ee" strokeWidth="2" className="terminal-pulse-ring" />
      <path
        d="M70 60 Q100 20 130 60"
        fill="none"
        stroke="#38bdf8"
        strokeWidth="3"
        strokeLinecap="round"
        className="terminal-arc"
        strokeDasharray="80"
      />
      <circle cx="100" cy="38" r="3" fill="#67e8f9" className="terminal-energy-dot" />
      <path
        d="M95 35 L100 25 L105 35"
        fill="none"
        stroke="#67e8f9"
        strokeWidth="2"
        className="terminal-spark"
      />
    </svg>
  </div>
);

export default ConnectionPulse;
