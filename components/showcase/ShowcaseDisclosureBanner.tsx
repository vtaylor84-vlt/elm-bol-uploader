import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useShowcase } from '../../context/ShowcaseContext.tsx';

const ShowcaseDisclosureBanner: React.FC = () => {
  const { session } = useAuth();
  const { state } = useShowcase();
  const persona = state.personaRole === 'admin' ? 'ADMIN' : 'DRIVER';

  return (
    <div className="showcase-disclosure space-y-2 mb-4" role="status">
      <div className="rounded-xl border border-amber-400/50 bg-amber-500/10 px-3 py-2.5 text-center">
        <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.22em] text-amber-200">
          Showcase Mode · {state.carrierId} · {persona} Persona
        </p>
      </div>
      <p className="text-[11px] text-zinc-500 normal-case text-center">
        Authenticated as {session?.driverName || 'Platform Admin'}
        {session?.maskedEmail ? ` · ${session.maskedEmail}` : ''}
        {' · '}
        NOT CONNECTED TO PRODUCTION
      </p>
    </div>
  );
};

export default ShowcaseDisclosureBanner;
