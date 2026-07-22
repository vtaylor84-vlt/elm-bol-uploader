import React from 'react';
import { Link } from 'react-router-dom';
import MissionShell from '../components/mission-control/MissionShell.tsx';
import ElmCard from '../design-system/components/ElmCard.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { getCompanyDisplayName } from '../utils/companyMap.ts';
import { ELM_VERSION } from '../design-system/tokens.ts';

/** Loads — structured empty state until verified load services are wired. */
export const LoadsPage: React.FC = () => (
  <MissionShell title="Loads" activeNav="loads">
    <div className="space-y-6">
      <header>
        <p className="mc-kicker">Loads</p>
        <h1 className="mc-page-title">Active & history</h1>
        <p className="mc-section-copy">
          Assigned loads will appear here with origin, destination, status, and document readiness.
        </p>
      </header>

      <ElmCard variant="default" padding="md" as="section" aria-label="Active loads">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="mc-kicker">Active</p>
            <h2 className="mc-section-title">No live load list yet</h2>
          </div>
          <span className="mc-capability-chip">Ready for integration</span>
        </div>
        <p className="mc-section-copy">
          When the load service is connected, your current haul and recent history will show here.
          Use Capture for live BOL/POD and expense uploads.
        </p>
        <Link
          to="/capture"
          className="mc-exception-action mt-5 inline-flex no-underline"
        >
          Open Capture
        </Link>
      </ElmCard>
    </div>
  </MissionShell>
);

/** Pay — trustworthy layout with explicit non-live labeling. */
export const PayPage: React.FC = () => (
  <MissionShell title="Pay" activeNav="pay">
    <div className="space-y-6">
      <header>
        <p className="mc-kicker">Pay</p>
        <h1 className="mc-page-title">Settlement</h1>
        <p className="mc-section-copy">
          Settlement summaries will appear here. No amounts are calculated in this build.
        </p>
      </header>

      <ElmCard variant="muted" padding="md" as="section" aria-label="Settlement summary">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="mc-kicker">This period</p>
            <h2 className="mc-section-title">Demonstration layout</h2>
          </div>
          <span className="mc-capability-chip">Not live pay data</span>
        </div>

        <dl className="mc-meta-grid">
          <div>
            <dt>Gross</dt>
            <dd>—</dd>
          </div>
          <div>
            <dt>Deductions</dt>
            <dd>—</dd>
          </div>
          <div>
            <dt>Escrow / savings</dt>
            <dd>—</dd>
          </div>
          <div>
            <dt>Net payout</dt>
            <dd className="mc-earnings-value text-xl">—</dd>
          </div>
        </dl>
        <p className="mc-section-copy mt-4">
          Status and history will connect to verified settlement services. Do not treat this screen
          as live earnings.
        </p>
      </ElmCard>
    </div>
  </MissionShell>
);

/** More — organized utilities using verified session context. */
export const MorePage: React.FC = () => {
  const { session } = useAuth();
  const company = getCompanyDisplayName(session?.companyCode);

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
              <Link to="/today" className="mc-task-row mc-task-row-link">
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
              <Link to="/capture" className="mc-task-row mc-task-row-link">
                <div className="min-w-0 flex-1">
                  <p className="mc-task-title">Capture</p>
                  <p className="mc-task-detail">BOL/POD and expense uploads</p>
                </div>
                <span aria-hidden className="text-blue-400">
                  ›
                </span>
              </Link>
            </li>
          </ul>
        </ElmCard>

        <ElmCard variant="muted" padding="md" as="section" aria-label="System">
          <p className="mc-kicker mb-2">System</p>
          <dl className="mc-meta-grid">
            <div>
              <dt>Platform</dt>
              <dd>ELM CONNECT</dd>
            </div>
            <div>
              <dt>App version</dt>
              <dd className="font-mono">{ELM_VERSION}</dd>
            </div>
          </dl>
          <p className="mc-section-copy mt-4">
            Preferences, legal, and support channels will expand here. Use Logout in the header to
            end your session.
          </p>
        </ElmCard>
      </div>
    </MissionShell>
  );
};
