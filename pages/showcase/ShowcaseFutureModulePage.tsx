import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MissionShell from '../../components/mission-control/MissionShell.tsx';
import ElmCard from '../../design-system/components/ElmCard.tsx';
import { useDriverExperience } from '../../context/DriverExperienceContext.tsx';

type FutureModule =
  | 'messages'
  | 'truck'
  | 'safety'
  | 'home-time'
  | 'benefits'
  | 'documents'
  | 'performance'
  | 'timeline'
  | 'assistant'
  | 'help'
  | 'preferences'
  | 'rewards';

const TITLES: Record<FutureModule, string> = {
  messages: 'Messages',
  truck: 'My vehicle',
  safety: 'Safety',
  'home-time': 'Schedule & availability',
  benefits: 'Benefits',
  documents: 'Documents',
  performance: 'Performance',
  timeline: 'Activity',
  assistant: 'ELM AI',
  help: 'Help',
  preferences: 'Notification preferences',
  rewards: 'Rewards',
};

interface ShowcaseFutureModulePageProps {
  module: FutureModule;
}

/**
 * Presentation-ready Showcase modules with no production equivalent yet.
 * Still consumes DriverDataSource / DriverActionPort.
 */
const ShowcaseFutureModulePage: React.FC<ShowcaseFutureModulePageProps> = ({ module }) => {
  const { dataSource, actions } = useDriverExperience();
  const [status, setStatus] = useState('');

  const run = async (fn?: () => Promise<{ disclosure: string; message: string }>) => {
    if (!fn) return;
    const result = await fn();
    setStatus(`${result.disclosure}: ${result.message}`);
  };

  return (
    <MissionShell title={TITLES[module]} activeNav="more">
      <div className="space-y-6">
        <header>
          <p className="mc-kicker">Showcase</p>
          <h1 className="mc-page-title">{TITLES[module]}</h1>
          <p className="mc-section-copy">Demonstration data · Coming soon / demo module · Not connected to Production</p>
        </header>

        {status ? (
          <p className="text-xs text-amber-300 normal-case" role="status">
            {status}
          </p>
        ) : null}

        {module === 'messages' ? (
          <ul className="space-y-3">
            {dataSource.getMessages().map((m) => (
              <li key={m.id}>
                <ElmCard padding="md">
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="mc-kicker">{m.from}</p>
                      <h2 className="mc-section-title text-base">{m.subject}</h2>
                      <p className="mc-section-copy">{m.preview}</p>
                    </div>
                    <span className="mc-capability-chip">{m.disclosure}</span>
                  </div>
                  <button
                    type="button"
                    className="mc-exception-action mt-3"
                    onClick={() => run(() => actions.acknowledgeMessage!(m.id))}
                  >
                    Simulate acknowledge
                  </button>
                </ElmCard>
              </li>
            ))}
          </ul>
        ) : null}

        {module === 'truck' ? (
          <ElmCard padding="md">
            {(() => {
              const t = dataSource.getTruckStatus();
              return (
                <>
                  <span className="mc-capability-chip">{t.disclosure}</span>
                  <h2 className="mc-section-title mt-2">
                    {t.truckNumber} · {t.trailerNumber}
                  </h2>
                  <p className="mc-section-copy">
                    {t.statusLabel} · Next: {t.nextServiceLabel}
                  </p>
                  <button
                    type="button"
                    className="mc-exception-action mt-4"
                    onClick={() => run(() => actions.requestMaintenance!())}
                  >
                    Simulate maintenance request
                  </button>
                </>
              );
            })()}
          </ElmCard>
        ) : null}

        {module === 'safety' ? (
          <ElmCard padding="md">
            {(() => {
              const s = dataSource.getSafetyStatus();
              return (
                <>
                  <span className="mc-capability-chip">{s.disclosure}</span>
                  <h2 className="mc-section-title mt-2">Status: {s.scoreLabel}</h2>
                  <ul className="mc-section-copy list-disc pl-5">
                    {s.openItems.length
                      ? s.openItems.map((i) => <li key={i}>{i}</li>)
                      : <li>No open demo items</li>}
                  </ul>
                  <button
                    type="button"
                    className="mc-exception-action mt-4"
                    onClick={() => run(() => actions.completeTraining!())}
                  >
                    Simulate training complete
                  </button>
                </>
              );
            })()}
          </ElmCard>
        ) : null}

        {module === 'home-time' ? (
          <ElmCard padding="md">
            {(() => {
              const h = dataSource.getHomeTime();
              return (
                <>
                  <span className="mc-capability-chip">{h.disclosure}</span>
                  <h2 className="mc-section-title mt-2">{h.statusLabel}</h2>
                  <p className="mc-section-copy">Window: {h.requestedWindow}</p>
                  <button
                    type="button"
                    className="mc-exception-action mt-4"
                    onClick={() => run(() => actions.requestHomeTime!())}
                  >
                    Simulate home-time request
                  </button>
                </>
              );
            })()}
          </ElmCard>
        ) : null}

        {module === 'benefits' ? (
          <ul className="space-y-3">
            {dataSource.getBenefits().map((b) => (
              <li key={b.id}>
                <ElmCard padding="md">
                  <span className="mc-capability-chip">{b.disclosure}</span>
                  <h2 className="mc-section-title mt-2">{b.title}</h2>
                  <p className="mc-section-copy">{b.detail}</p>
                </ElmCard>
              </li>
            ))}
          </ul>
        ) : null}

        {module === 'documents' ? (
          <ul className="space-y-3">
            {dataSource.getDocuments().map((d) => (
              <li key={d.id}>
                <ElmCard padding="md">
                  <span className="mc-capability-chip">{d.disclosure}</span>
                  <h2 className="mc-section-title mt-2">{d.title}</h2>
                  <p className="mc-section-copy">{d.statusLabel}</p>
                </ElmCard>
              </li>
            ))}
          </ul>
        ) : null}

        {module === 'performance' ? (
          <ElmCard padding="md">
            {(() => {
              const p = dataSource.getPerformance();
              return (
                <>
                  <span className="mc-capability-chip">{p.disclosure}</span>
                  <dl className="mc-meta-grid mt-3">
                    <div>
                      <dt>On-time</dt>
                      <dd>{p.onTimeLabel}</dd>
                    </div>
                    <div>
                      <dt>Safety</dt>
                      <dd>{p.safetyLabel}</dd>
                    </div>
                  </dl>
                  <p className="mc-section-copy mt-3">{p.note}</p>
                </>
              );
            })()}
          </ElmCard>
        ) : null}

        {module === 'timeline' ? (
          <ul className="space-y-3">
            {dataSource.getTimeline().map((e) => (
              <li key={e.id}>
                <ElmCard padding="md">
                  <p className="mc-kicker">{e.whenLabel}</p>
                  <h2 className="mc-section-title text-base">{e.title}</h2>
                  <p className="mc-section-copy">{e.detail}</p>
                  <span className="mc-capability-chip mt-2 inline-flex">{e.disclosure}</span>
                </ElmCard>
              </li>
            ))}
          </ul>
        ) : null}

        {module === 'assistant' ? (
          <div className="space-y-4">
            {dataSource.getAssistantThread().map((t) => (
              <ElmCard key={t.id} padding="md">
                <p className="mc-kicker">{t.role}</p>
                <p className="mc-section-copy">{t.text}</p>
                <span className="mc-capability-chip mt-2 inline-flex">{t.disclosure}</span>
              </ElmCard>
            ))}
            <button
              type="button"
              className="mc-exception-action"
              onClick={() => run(() => actions.askAssistant!('How do I upload a POD?'))}
            >
              Simulate assistant question
            </button>
          </div>
        ) : null}

        {module === 'help' || module === 'preferences' || module === 'rewards' ? (
          <ElmCard padding="md">
            <p className="mc-section-copy">
              {module === 'help'
                ? 'Showcase help explains demonstration data, Demo controls, and how to exit safely. No production support ticket is created.'
                : module === 'preferences'
                  ? 'Notification preferences are demonstration-only in Showcase.'
                  : 'Rewards is a future capability preview — Coming soon in Production.'}
            </p>
            <span className="mc-capability-chip mt-3 inline-flex">
              {module === 'rewards' ? 'FUTURE CAPABILITY' : 'DEMONSTRATION DATA'}
            </span>
          </ElmCard>
        ) : null}

        <p className="text-center">
          <Link to="/showcase/more" className="text-cyan-400 text-sm">
            Back to More
          </Link>
        </p>
      </div>
    </MissionShell>
  );
};

export default ShowcaseFutureModulePage;
