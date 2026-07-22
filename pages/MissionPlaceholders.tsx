import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MissionShell from '../components/mission-control/MissionShell.tsx';
import ElmCard from '../design-system/components/ElmCard.tsx';
import EmptyState from '../design-system/components/EmptyState.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useDriverExperience } from '../context/DriverExperienceContext.tsx';
import { useShowcaseOptional } from '../context/ShowcaseContext.tsx';
import { getCompanyDisplayName } from '../utils/companyMap.ts';
import { ELM_VERSION } from '../design-system/tokens.ts';
import { getReleaseIdentity } from '../utils/releaseIdentity.ts';
import {
  isShowcaseGrantPresentAndUnexpired,
} from '../utils/showcaseGrantStorage.ts';

/** Loads — production empty / Showcase fixture list via DriverDataSource */
export const LoadsPage: React.FC = () => {
  const { mode, routePrefix, dataSource } = useDriverExperience();
  const loads = dataSource.getLoads();
  const captureTo = `${routePrefix}/capture` || '/capture';

  return (
    <MissionShell title="Loads" activeNav="loads">
      <div className="space-y-6">
        <header>
          <p className="mc-kicker">Loads</p>
          <h1 className="mc-page-title">Active & history</h1>
          <p className="mc-section-copy">
            {mode === 'showcase'
              ? 'DEMONSTRATION DATA — carrier-specific Showcase loads.'
              : 'Assigned loads will appear here with origin, destination, status, and document readiness.'}
          </p>
        </header>

        {loads.length === 0 ? (
          <EmptyState
            kicker="Active"
            title="No live load list yet"
            chip="Ready for integration"
            description="When the load service is connected, your current haul and recent history will show here. Use Capture for live BOL/POD and expense uploads."
            action={
              <Link
                to={captureTo === '/capture' ? '/capture' : captureTo}
                className="mc-exception-action inline-flex no-underline"
              >
                Open Capture
              </Link>
            }
          />
        ) : (
          <ul className="space-y-3">
            {loads.map((load) => (
              <li key={load.id}>
                <ElmCard variant="default" padding="md">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="mc-kicker">{load.carrierId}</p>
                      <h2 className="mc-section-title">Load #{load.loadNum}</h2>
                      <p className="mc-section-copy">
                        {load.origin} → {load.destination}
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">{load.statusLabel}</p>
                    </div>
                    <span className="mc-capability-chip">{load.disclosure || 'DEMONSTRATION DATA'}</span>
                  </div>
                </ElmCard>
              </li>
            ))}
          </ul>
        )}
      </div>
    </MissionShell>
  );
};

/** Pay — production disconnected / Showcase pay summary */
export const PayPage: React.FC = () => {
  const { mode, dataSource } = useDriverExperience();
  const pay = dataSource.getPaySummary();

  return (
    <MissionShell title="Pay" activeNav="pay">
      <div className="space-y-6 max-w-3xl">
        <header>
          <p className="mc-kicker">Pay</p>
          <h1 className="mc-page-title">Settlement</h1>
          <p className="mc-section-copy">
            {mode === 'showcase'
              ? 'DEMONSTRATION DATA — Showcase settlement preview only.'
              : 'Payroll and settlement services are not connected in this build.'}
          </p>
        </header>

        {mode === 'production' ? (
          <section className="elm-disconnected-panel" aria-label="Settlement unavailable">
            <div className="flex items-start justify-between gap-3 mb-3">
              <p className="mc-kicker mb-0">Production status</p>
              <span className="mc-capability-chip">{pay.disclosure}</span>
            </div>
            <h2>Settlement not connected</h2>
            <p className="mc-section-copy">
              No gross, deduction, or net amounts are calculated or displayed. When payroll is
              connected through the approved architecture, settlement summaries will appear here.
            </p>
          </section>
        ) : (
          <ElmCard variant="muted" padding="md" as="section" aria-label="Settlement summary">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="mc-kicker">{pay.periodLabel}</p>
                <h2 className="mc-section-title">Demonstration settlement</h2>
              </div>
              <span className="mc-capability-chip">{pay.disclosure}</span>
            </div>

            <dl className="mc-meta-grid">
              <div>
                <dt>Gross</dt>
                <dd>{pay.grossLabel}</dd>
              </div>
              <div>
                <dt>Deductions</dt>
                <dd>{pay.deductionsLabel}</dd>
              </div>
              <div>
                <dt>Escrow / savings</dt>
                <dd>—</dd>
              </div>
              <div>
                <dt>Net payout</dt>
                <dd className="mc-earnings-value text-xl">{pay.netLabel}</dd>
              </div>
            </dl>
            <p className="mc-section-copy mt-4">{pay.note}</p>
          </ElmCard>
        )}
      </div>
    </MissionShell>
  );
};

/** More — profile + Showcase entry for verified admins */
export const MorePage: React.FC = () => {
  const { session } = useAuth();
  const { mode, routePrefix } = useDriverExperience();
  const showcase = useShowcaseOptional();
  const navigate = useNavigate();
  const [entering, setEntering] = useState(false);
  const company = getCompanyDisplayName(session?.companyCode);
  const canTryShowcase =
    mode === 'production' &&
    session?.authRole === 'admin' &&
    session?.canSelectAnyDriver &&
    isShowcaseGrantPresentAndUnexpired();

  const enterShowcase = async () => {
    if (!showcase) return;
    setEntering(true);
    const result = await showcase.enterShowcase();
    setEntering(false);
    if (result === 'ok') navigate('/showcase');
    else navigate('/showcase/today'); // guard will show Access Denied if grant invalid
  };

  return (
    <MissionShell title="More" activeNav="more">
      <div className="space-y-6">
        <header>
          <p className="mc-kicker">More</p>
          <h1 className="mc-page-title">Account & support</h1>
          <p className="mc-section-copy">Profile, company context, and system information.</p>
        </header>

        <ElmCard variant="default" padding="md" as="section" aria-label="Profile">
          <p className="mc-kicker mb-2">Profile</p>
          <h2 className="mc-section-title">{session?.driverName || 'Driver'}</h2>
          <dl className="mc-meta-grid mt-4">
            <div>
              <dt>Email</dt>
              <dd className="normal-case font-medium break-all">
                {session?.maskedEmail || '—'}
              </dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{session?.authRole === 'admin' ? 'Admin' : 'Driver'}</dd>
            </div>
            <div>
              <dt>Company</dt>
              <dd>{company || '—'}</dd>
            </div>
            <div>
              <dt>Session</dt>
              <dd>Roster-verified email</dd>
            </div>
          </dl>
        </ElmCard>

        <ElmCard variant="muted" padding="md" as="section" aria-label="Shortcuts">
          <p className="mc-kicker mb-3">Shortcuts</p>
          <ul className="mc-task-list">
            <li>
              <Link to={`${routePrefix}/today` || '/today'} className="mc-task-row mc-task-row-link">
                <div className="min-w-0 flex-1">
                  <p className="mc-task-title">Mission Control</p>
                  <p className="mc-task-detail">Today&apos;s priorities and primary actions</p>
                </div>
                <span aria-hidden className="text-blue-400">
                  ›
                </span>
              </Link>
            </li>
            <li>
              <Link to={`${routePrefix}/capture` || '/capture'} className="mc-task-row mc-task-row-link">
                <div className="min-w-0 flex-1">
                  <p className="mc-task-title">Capture</p>
                  <p className="mc-task-detail">BOL/POD and expense uploads</p>
                </div>
                <span aria-hidden className="text-blue-400">
                  ›
                </span>
              </Link>
            </li>
            {mode === 'showcase' ? (
              <>
                <li>
                  <Link to="/showcase/messages" className="mc-task-row mc-task-row-link">
                    <div className="min-w-0 flex-1">
                      <p className="mc-task-title">Messages</p>
                      <p className="mc-task-detail">FUTURE CAPABILITY</p>
                    </div>
                    <span aria-hidden>›</span>
                  </Link>
                </li>
                <li>
                  <Link to="/showcase/truck" className="mc-task-row mc-task-row-link">
                    <div className="min-w-0 flex-1">
                      <p className="mc-task-title">Truck</p>
                      <p className="mc-task-detail">FUTURE CAPABILITY</p>
                    </div>
                    <span aria-hidden>›</span>
                  </Link>
                </li>
                <li>
                  <Link to="/today" className="mc-task-row mc-task-row-link" onClick={() => showcase?.exitShowcase()}>
                    <div className="min-w-0 flex-1">
                      <p className="mc-task-title">Exit Showcase</p>
                      <p className="mc-task-detail">Return to production Mission Control</p>
                    </div>
                    <span aria-hidden>›</span>
                  </Link>
                </li>
              </>
            ) : null}
          </ul>
        </ElmCard>

        {canTryShowcase ? (
          <ElmCard variant="default" padding="md" as="section" aria-label="Admin Showcase">
            <p className="mc-kicker mb-2">Admin</p>
            <h2 className="mc-section-title">Showcase Mode</h2>
            <p className="mc-section-copy">
              Verified platform admin only. Demonstration fixtures for GLX and BST — NOT CONNECTED TO
              PRODUCTION.
            </p>
            <button
              type="button"
              className="mc-exception-action mt-4"
              disabled={entering}
              onClick={enterShowcase}
            >
              {entering ? 'Verifying…' : 'Enter Showcase'}
            </button>
          </ElmCard>
        ) : null}

        <ElmCard variant="muted" padding="md" as="section" aria-label="System">
          <p className="mc-kicker mb-2">System</p>
          {(() => {
            const release = getReleaseIdentity();
            return (
              <>
                <dl className="mc-meta-grid">
                  <div>
                    <dt>Platform</dt>
                    <dd>ELM CONNECT</dd>
                  </div>
                  <div>
                    <dt>App version</dt>
                    <dd className="font-mono">{ELM_VERSION}</dd>
                  </div>
                  <div>
                    <dt>Release</dt>
                    <dd className="font-mono text-[11px] normal-case tracking-normal">
                      {release.shortSha} · {release.environment}
                    </dd>
                  </div>
                  <div>
                    <dt>Built</dt>
                    <dd className="font-mono text-[11px] normal-case tracking-normal">
                      {release.buildTimestamp}
                    </dd>
                  </div>
                </dl>
                <p className="text-[10px] text-zinc-600 mt-3 normal-case tracking-normal">
                  Non-sensitive build identity for support. Compare Live vs Preview SHA to detect
                  drift.
                </p>
              </>
            );
          })()}
        </ElmCard>
      </div>
    </MissionShell>
  );
};
