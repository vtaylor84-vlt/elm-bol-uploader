import React from 'react';
import { useShowcase } from '../../context/ShowcaseContext.tsx';
import { SCENARIO_OPTIONS } from '../../types/showcase.ts';
import type { CarrierId, ScenarioId, ShowcasePersonaRole } from '../../types/showcase.ts';

const ScenarioControlPanel: React.FC = () => {
  const { state, setCarrier, setPersonaRole, setScenario } = useShowcase();

  return (
    <section
      className="showcase-control-panel rounded-xl border border-amber-500/35 bg-amber-950/25 p-3 sm:p-4 space-y-3"
      aria-label="Scenario control panel"
    >
      <p className="text-[9px] font-black uppercase tracking-[0.28em] text-amber-300">
        Scenario control panel
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="block text-left">
          <span className="text-[10px] font-mono uppercase text-zinc-500">Carrier</span>
          <select
            className="mt-1 w-full min-h-[44px] rounded-lg bg-[#080d1a] border border-white/15 text-sm text-white px-3"
            value={state.carrierId}
            onChange={(e) => setCarrier(e.target.value as CarrierId)}
          >
            <option value="GLX">GLX</option>
            <option value="BST">BST</option>
          </select>
        </label>
        <label className="block text-left">
          <span className="text-[10px] font-mono uppercase text-zinc-500">Persona</span>
          <select
            className="mt-1 w-full min-h-[44px] rounded-lg bg-[#080d1a] border border-white/15 text-sm text-white px-3"
            value={state.personaRole}
            onChange={(e) => setPersonaRole(e.target.value as ShowcasePersonaRole)}
          >
            <option value="driver">Driver</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <label className="block text-left sm:col-span-1">
          <span className="text-[10px] font-mono uppercase text-zinc-500">Scenario</span>
          <select
            className="mt-1 w-full min-h-[44px] rounded-lg bg-[#080d1a] border border-white/15 text-sm text-white px-3"
            value={state.scenarioId}
            onChange={(e) => setScenario(e.target.value as ScenarioId)}
          >
            {SCENARIO_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-[10px] text-zinc-500 normal-case">
        Changes apply immediately across Showcase modules. DEMONSTRATION DATA only.
      </p>
    </section>
  );
};

export default ScenarioControlPanel;
