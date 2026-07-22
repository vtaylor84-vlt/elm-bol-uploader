import React from 'react';
import GlassCard from '../../design-system/components/GlassCard.tsx';
import RouteMilestoneBar from './RouteMilestoneBar.tsx';
import type { ActiveHaul, CapabilityClass } from '../../types/missionControl.ts';

interface ActiveHaulCardProps {
  haul: ActiveHaul | null;
  dataCapability: CapabilityClass;
}

const ActiveHaulCard: React.FC<ActiveHaulCardProps> = ({ haul, dataCapability }) => {
  if (!haul) {
    return (
      <GlassCard
        glowColor="none"
        padding="md"
        as="section"
        className="mc-section"
        aria-label="Active haul unavailable"
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <p className="mc-kicker mb-0">Active haul</p>
          {dataCapability === 'READY_FOR_INTEGRATION' || dataCapability === 'FUTURE' ? (
            <span className="mc-capability-chip">Not connected</span>
          ) : null}
        </div>
        <h2 className="mc-section-title">No current load available</h2>
        <p className="mc-section-copy">
          There is no assigned load to display right now, or live load connectivity is not yet
          available. Capture remains available for BOL/POD and expense uploads when you have
          documents ready.
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard
      glowColor="cyan"
      padding="md"
      as="section"
      className="mc-section space-y-5"
      aria-label="Active haul"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-white/10">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/30">
              Active haul #{haul.loadNum}
            </span>
            <span className="mc-status-pill">{haul.statusLabel}</span>
            {dataCapability === 'DEMONSTRATION' ? (
              <span className="mc-capability-chip">Sample data</span>
            ) : null}
          </div>
          <h2 className="mc-haul-route text-xl sm:text-2xl font-black tracking-tight">
            <span>{haul.origin}</span>
            <span className="mc-haul-arrow font-light mx-1" aria-hidden>
              ⟶
            </span>
            <span>{haul.destination}</span>
          </h2>
        </div>
        {haul.brokerLabel ? (
          <div className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
            <p className="text-[10px] font-mono uppercase text-zinc-500">Broker / dispatch</p>
            <p className="text-xs font-bold text-white mt-0.5">{haul.brokerLabel}</p>
          </div>
        ) : null}
      </div>

      {haul.milestones?.length ? <RouteMilestoneBar milestones={haul.milestones} /> : null}

      <dl className="mc-meta-grid">
        <div>
          <dt>Next milestone</dt>
          <dd>{haul.nextMilestone}</dd>
        </div>
        <div>
          <dt>Appointment</dt>
          <dd>{haul.appointmentLabel}</dd>
        </div>
        <div>
          <dt>Timing</dt>
          <dd className="text-amber-300">
            {haul.countdownLabel}
            {dataCapability === 'DEMONSTRATION' ? (
              <span className="block text-[10px] font-medium text-zinc-500 normal-case tracking-normal mt-0.5">
                Sample timing — not live ETA
              </span>
            ) : null}
          </dd>
        </div>
        {haul.truckNumber ? (
          <div>
            <dt>Equipment</dt>
            <dd>
              {haul.truckNumber}
              {haul.trailerNumber ? ` · ${haul.trailerNumber}` : ''}
            </dd>
          </div>
        ) : null}
      </dl>

      {(haul.demoCommodity || haul.demoGrossLabel) && dataCapability === 'DEMONSTRATION' ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border border-white/5 bg-black/40 p-3.5 font-mono text-xs">
          <div>
            <span className="text-zinc-500 text-[10px] block uppercase">Commodity</span>
            <span className="text-white font-semibold">{haul.demoCommodity || '—'}</span>
          </div>
          <div>
            <span className="text-zinc-500 text-[10px] block uppercase">Weight / rate</span>
            <span className="text-white font-semibold">{haul.demoWeightLabel || '—'}</span>
          </div>
          <div>
            <span className="text-zinc-500 text-[10px] block uppercase">Temp</span>
            <span className="text-emerald-300 font-semibold">{haul.demoTempLabel || '—'}</span>
          </div>
          <div>
            <span className="text-zinc-500 text-[10px] block uppercase">Gross</span>
            <span className="text-cyan-300 font-bold">{haul.demoGrossLabel || '—'}</span>
          </div>
        </div>
      ) : null}

      {haul.missingDocuments.length > 0 ? (
        <div className="pt-1">
          <p className="mc-kicker mb-2">Missing documents</p>
          <ul className="flex flex-wrap gap-2">
            {haul.missingDocuments.map((doc) => (
              <li key={doc} className="mc-doc-chip">
                {doc}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </GlassCard>
  );
};

export default ActiveHaulCard;
