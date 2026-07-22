import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ElmCard from '../../design-system/components/ElmCard.tsx';
import MissionShell from '../../components/mission-control/MissionShell.tsx';
import { useShowcase } from '../../context/ShowcaseContext.tsx';
import { CARRIER_DEMO_CONFIG, personaFor } from '../../fixtures/showcase/personas.ts';
import { SCENARIO_OPTIONS } from '../../types/showcase.ts';

/** Showcase hub — compact entry into the Driver Workspace destinations. */
const ShowcaseHubPage: React.FC = () => {
  const { state, exitShowcase } = useShowcase();
  const navigate = useNavigate();
  const cfg = CARRIER_DEMO_CONFIG[state.carrierId];
  const persona = personaFor(state.carrierId, state.personaRole);
  const scenario =
    SCENARIO_OPTIONS.find((o) => o.id === state.scenarioId)?.label || state.scenarioId;

  return (
    <MissionShell title="Showcase" activeNav="more">
      <div className="space-y-6">
        <header>
          <p className="mc-kicker">Admin Showcase</p>
          <h1 className="mc-page-title">Driver Workspace preview</h1>
          <p className="mc-section-copy">
            {cfg.displayName} · Viewing as {persona.displayName} · {scenario} · Demonstration data
            only
          </p>
        </header>

        <ElmCard padding="md">
          <p className="mc-section-copy">
            Use Demo controls in the bar above to change carrier, View As persona, and scenario.
            Shared screens reuse production UI with Showcase data adapters — no production writes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <Link
              to="/showcase/home"
              className="mc-exception-action inline-flex justify-center no-underline"
            >
              Open Driver Home
            </Link>
            <button
              type="button"
              className="mc-secondary-action"
              onClick={() => {
                exitShowcase();
                navigate('/home');
              }}
            >
              Exit to production
            </button>
          </div>
        </ElmCard>

        <nav aria-label="Showcase destinations">
          <p className="mc-kicker mb-3">Primary destinations</p>
          <div className="mc-hub-destinations">
            {[
              ['home', 'Home'],
              ['trips', 'Trips'],
              ['capture', 'Capture'],
              ['pay', 'Pay'],
              ['more', 'More'],
            ].map(([path, label]) => (
              <Link key={path} to={`/showcase/${path}`} className="mc-hub-destination">
                {label}
              </Link>
            ))}
          </div>
          <p className="mc-kicker mb-3 mt-6">Also in More</p>
          <div className="mc-hub-destinations mc-hub-destinations--secondary">
            {[
              ['messages', 'Messages'],
              ['equipment', 'My vehicle'],
              ['safety', 'Safety'],
              ['notifications', 'Notifications'],
              ['search', 'Search'],
              ['assistant', 'ELM AI'],
              ['documents', 'Documents'],
              ['timeline', 'Activity'],
            ].map(([path, label]) => (
              <Link key={path} to={`/showcase/${path}`} className="mc-hub-destination is-secondary">
                {label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </MissionShell>
  );
};

export default ShowcaseHubPage;
