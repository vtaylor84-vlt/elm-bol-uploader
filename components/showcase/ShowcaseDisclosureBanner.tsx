import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useShowcase } from '../../context/ShowcaseContext.tsx';

/** Persistent Showcase Mode indicator — one clear label, not scattered "fake" chips. */
const ShowcaseDisclosureBanner: React.FC = () => {
  const { session } = useAuth();
  const { state } = useShowcase();
  const persona = state.personaRole === 'admin' ? 'Admin view' : 'Driver view';

  return (
    <div className="showcase-disclosure space-y-2 mb-4" role="status">
      <div className="rounded-xl border border-amber-400/50 bg-amber-500/10 px-3 py-2.5 text-center">
        <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.18em] text-amber-200">
          Showcase Mode — Demonstration data only. No production records or submissions.
        </p>
      </div>
      <p className="text-[11px] text-zinc-500 normal-case text-center">
        {state.carrierId} · {persona}
        {session?.driverName ? ` · ${session.driverName}` : ''}
      </p>
    </div>
  );
};

export default ShowcaseDisclosureBanner;
