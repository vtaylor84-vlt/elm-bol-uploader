import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ElmCard from '../../design-system/components/ElmCard.tsx';
import MissionShell from '../../components/mission-control/MissionShell.tsx';
import { useShowcase } from '../../context/ShowcaseContext.tsx';
import { CARRIER_DEMO_CONFIG } from '../../fixtures/showcase/personas.ts';

/** Showcase hub — carrier/persona already controlled by Scenario Control Panel. */
const ShowcaseHubPage: React.FC = () => {
  const { state, exitShowcase } = useShowcase();
  const navigate = useNavigate();
  const cfg = CARRIER_DEMO_CONFIG[state.carrierId];

  return (
    <MissionShell title="Showcase" activeNav="more">
      <div className="space-y-6">
        <header>
          <p className="mc-kicker">Admin Showcase</p>
          <h1 className="mc-page-title">Driver Experience preview</h1>
          <p className="mc-section-copy">
            {cfg.displayName} · {state.personaRole} persona · NOT CONNECTED TO PRODUCTION
          </p>
        </header>

        <ElmCard padding="md">
          <p className="mc-section-copy">
            Use the Scenario Control Panel above to switch GLX/BST, driver/admin persona, and
            scenarios. Shared modules reuse production UI with Showcase data adapters.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <Link to="/showcase/today" className="mc-exception-action inline-flex justify-center no-underline">
              Open Mission Control
            </Link>
            <button
              type="button"
              className="min-h-[48px] px-4 rounded-xl border border-white/20 text-sm"
              onClick={() => {
                exitShowcase();
                navigate('/today');
              }}
            >
              Exit to production
            </button>
          </div>
        </ElmCard>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            ['today', 'Today'],
            ['loads', 'Loads'],
            ['capture', 'Capture'],
            ['pay', 'Pay'],
            ['messages', 'Messages'],
            ['truck', 'Truck'],
            ['safety', 'Safety'],
            ['home-time', 'Home Time'],
            ['benefits', 'Benefits'],
            ['documents', 'Documents'],
            ['performance', 'Performance'],
            ['timeline', 'Timeline'],
            ['assistant', 'Assistant'],
            ['more', 'More'],
          ].map(([path, label]) => (
            <Link
              key={path}
              to={`/showcase/${path}`}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center text-xs font-bold uppercase tracking-wide text-zinc-200 no-underline hover:border-cyan-500/40"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </MissionShell>
  );
};

export default ShowcaseHubPage;
