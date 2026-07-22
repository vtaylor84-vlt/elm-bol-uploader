import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ElmBrandLogo from '../components/terminal/ElmBrandLogo.tsx';
import ConnectionPulse from '../components/terminal/ConnectionPulse.tsx';
import ElmCard from '../design-system/components/ElmCard.tsx';
import { useAuth } from '../context/AuthContext.tsx';

/** Honest client-side transition steps — no invented backend operations. */
const CONNECT_STEPS = [
  'Verifying driver access…',
  'Connecting securely…',
  'Loading today’s mission…',
] as const;

const ConnectingPage: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!session) {
      navigate('/login', { replace: true });
      return;
    }

    const timers: number[] = [];
    CONNECT_STEPS.forEach((_, i) => {
      timers.push(window.setTimeout(() => setStepIndex(i), i * 520));
    });
    timers.push(
      window.setTimeout(
        () => navigate('/today', { replace: true }),
        CONNECT_STEPS.length * 520 + 380
      )
    );

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [session, navigate]);

  return (
    <div className="min-h-screen bg-[#030308] text-zinc-100 flex items-center justify-center px-6 relative overflow-hidden">
      <div className="terminal-login-grid absolute inset-0 pointer-events-none opacity-30" aria-hidden />

      <div className="relative z-10 w-full max-w-md lg:max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div className="text-center lg:text-left space-y-6">
          <ElmBrandLogo size="lg" align="center" as="h1" />
          <p className="text-[9px] font-black uppercase tracking-[0.45em] text-blue-400/80">
            Driver Terminal
          </p>
          {session?.driverName ? (
            <p className="text-sm text-zinc-400 normal-case hidden lg:block">
              Welcome, <span className="text-white font-semibold">{session.driverName}</span>
            </p>
          ) : null}
        </div>

        <div className="space-y-8 text-center lg:text-left" aria-live="polite" aria-busy="true">
          <ConnectionPulse />
          <ElmCard variant="glass" padding="md">
            <p className="text-[9px] font-black uppercase tracking-[0.35em] text-zinc-500 text-center lg:text-left mb-4">
              Secure connection
            </p>
            <ul className="space-y-2.5">
              {CONNECT_STEPS.map((step, i) => (
                <li
                  key={step}
                  className={`text-[11px] sm:text-xs font-medium tracking-wide normal-case transition-colors duration-300 ${
                    i <= stepIndex ? 'text-cyan-300' : 'text-zinc-600'
                  }`}
                >
                  <span className="font-mono text-[10px] mr-2 opacity-70" aria-hidden>
                    {i <= stepIndex ? '▸' : '·'}
                  </span>
                  {step}
                </li>
              ))}
            </ul>
          </ElmCard>
          {session?.driverName ? (
            <p className="text-sm text-zinc-400 normal-case lg:hidden">
              Welcome, <span className="text-white font-semibold">{session.driverName}</span>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ConnectingPage;
