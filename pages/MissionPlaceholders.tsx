import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MissionShell from '../components/mission-control/MissionShell.tsx';
import RouteMilestoneBar from '../components/mission-control/RouteMilestoneBar.tsx';
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
import type { LoadBucket, LoadListItem } from '../services/dataSource/types.ts';

const BUCKET_LABEL: Record<LoadBucket, string> = {
  current: 'Current',
  upcoming: 'Upcoming',
  completed: 'Completed',
};

function loadBadgeTone(load: LoadListItem): 'ok' | 'info' | 'warning' | 'critical' {
  if ((load.documentsLabel || '').toLowerCase().includes('missing')) return 'critical';
  if (load.bucket === 'completed') return 'ok';
  if ((load.statusLabel || '').toLowerCase().includes('breakdown')) return 'critical';
  if ((load.statusLabel || '').toLowerCase().includes('delay')) return 'warning';
  return 'info';
}

/** Loads — production polite empty state / Showcase full load list with search, filters, and detail. */
export const LoadsPage: React.FC = () => {
  const { mode, routePrefix, dataSource } = useDriverExperience();
  const loads = dataSource.getLoads();
  const captureTo = routePrefix ? `${routePrefix}/capture` : '/capture';
  const messagesTo = routePrefix ? `${routePrefix}/messages` : '/messages';

  const [bucket, setBucket] = useState<LoadBucket>('current');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const bucketCounts = useMemo(
    () => ({
      current: loads.filter((l) => (l.bucket || 'current') === 'current').length,
      upcoming: loads.filter((l) => l.bucket === 'upcoming').length,
      completed: loads.filter((l) => l.bucket === 'completed').length,
    }),
    [loads]
  );

  const filtered = useMemo(() => {
    const byBucket = loads.filter((l) => (l.bucket || 'current') === bucket);
    const q = search.trim().toLowerCase();
    if (!q) return byBucket;
    return byBucket.filter(
      (l) =>
        l.loadNum.toLowerCase().includes(q) ||
        l.origin.toLowerCase().includes(q) ||
        l.destination.toLowerCase().includes(q)
    );
  }, [loads, bucket, search]);

  useEffect(() => {
    if (!filtered.some((l) => l.id === selectedId)) {
      setSelectedId(filtered[0]?.id ?? null);
    }
  }, [filtered, selectedId]);

  const selected = filtered.find((l) => l.id === selectedId) || null;

  return (
    <MissionShell title="Loads" activeNav="loads">
      <div className="space-y-6">
        <header>
          <p className="mc-kicker">Loads</p>
          <h1 className="mc-page-title">Active & history</h1>
          <p className="mc-section-copy">
            {mode === 'showcase'
              ? 'Demonstration data only — carrier-specific Showcase loads.'
              : 'Assigned loads will appear here with origin, destination, status, and document readiness.'}
          </p>
        </header>

        {loads.length === 0 ? (
          <EmptyState
            kicker="Active"
            title="No live load list yet"
            description="Your assigned loads will show here when load service is connected. Use Capture for live BOL/POD and expense uploads in the meantime."
            action={
              <Link to={captureTo} className="mc-exception-action inline-flex no-underline">
                Open Capture
              </Link>
            }
          />
        ) : (
          <>
            <div className="space-y-3">
              <div className="mc-filter-tabs" role="tablist" aria-label="Load status">
                {(['current', 'upcoming', 'completed'] as LoadBucket[]).map((b) => (
                  <button
                    key={b}
                    type="button"
                    role="tab"
                    aria-selected={bucket === b}
                    className={`mc-filter-tab${bucket === b ? ' is-active' : ''}`}
                    onClick={() => setBucket(b)}
                  >
                    {BUCKET_LABEL[b]}
                    <span className="mc-filter-tab-count">{bucketCounts[b]}</span>
                  </button>
                ))}
              </div>
              <input
                type="search"
                className="elm-input"
                placeholder="Search load #, origin, or destination"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search loads"
              />
            </div>

            <div className="mc-inbox-layout">
              <ul className="mc-inbox-list">
                {filtered.length === 0 ? (
                  <li>
                    <ElmCard variant="muted" padding="md">
                      <p className="mc-section-copy">No loads match this filter.</p>
                    </ElmCard>
                  </li>
                ) : (
                  filtered.map((load) => {
                    const tone = loadBadgeTone(load);
                    return (
                      <li key={load.id}>
                        <button
                          type="button"
                          className={`mc-inbox-row${selectedId === load.id ? ' is-selected' : ''}`}
                          onClick={() => setSelectedId(load.id)}
                          aria-pressed={selectedId === load.id}
                        >
                          <div className="flex justify-between gap-3">
                            <div className="min-w-0">
                              <p className="mc-kicker mb-0">Load #{load.loadNum}</p>
                              <p className="mc-inbox-row-title">
                                {load.origin} → {load.destination}
                              </p>
                              <p className="mc-inbox-row-preview">
                                {load.appointmentLabel} · {load.milesLabel} ·{' '}
                                {load.stopCount ?? load.stops?.length ?? 0} stops
                              </p>
                            </div>
                            <span className={`mc-status-badge mc-status-badge--${tone}`}>
                              {load.statusLabel}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-2 text-xs">
                            <span className="text-zinc-500">{load.documentsLabel}</span>
                            <span className="text-zinc-300 font-semibold">
                              {load.earningsEstimateLabel}
                            </span>
                          </div>
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>

              {selected ? (
                <div className="mc-load-detail space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="mc-kicker mb-0">Load #{selected.loadNum}</p>
                      <h2 className="mc-section-title">
                        {selected.origin} → {selected.destination}
                      </h2>
                      <p className="mc-section-copy">
                        {selected.dispatcherLabel ? `Dispatcher · ${selected.dispatcherLabel}` : null}
                      </p>
                    </div>
                    <span className={`mc-status-badge mc-status-badge--${loadBadgeTone(selected)}`}>
                      {selected.statusLabel}
                    </span>
                  </div>

                  <dl className="mc-meta-grid">
                    <div>
                      <dt>Miles</dt>
                      <dd>{selected.milesLabel || '—'}</dd>
                    </div>
                    <div>
                      <dt>Appointment</dt>
                      <dd>{selected.appointmentLabel || '—'}</dd>
                    </div>
                    <div>
                      <dt>Documents</dt>
                      <dd>{selected.documentsLabel || '—'}</dd>
                    </div>
                    <div>
                      <dt>Earnings estimate</dt>
                      <dd>{selected.earningsEstimateLabel || '—'}</dd>
                    </div>
                  </dl>

                  {selected.stops?.length ? (
                    <div>
                      <p className="mc-kicker mb-2">Stops</p>
                      <ol className="mc-load-detail-stops">
                        {selected.stops.map((stop) => (
                          <li key={stop.id} className={`mc-load-detail-stop is-${stop.state}`}>
                            <span className="mc-load-detail-stop-dot" aria-hidden />
                            <div className="min-w-0">
                              <p className="mc-task-title">
                                {stop.sequence}. {stop.locationLabel}
                              </p>
                              <p className="mc-task-detail">
                                {stop.appointmentLabel} · {stop.statusLabel}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : null}

                  {selected.instructions ? (
                    <div>
                      <p className="mc-kicker mb-2">Instructions</p>
                      <p className="mc-section-copy">{selected.instructions}</p>
                    </div>
                  ) : null}

                  {selected.documentRequirements?.length ? (
                    <div>
                      <p className="mc-kicker mb-2">Document requirements</p>
                      <ul className="flex flex-wrap gap-2">
                        {selected.documentRequirements.map((doc) => (
                          <li key={doc} className="mc-doc-chip">
                            {doc}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-3 pt-1">
                    <Link to={captureTo} className="mc-exception-action inline-flex no-underline">
                      Open Capture
                    </Link>
                    {mode === 'showcase' ? (
                      <Link
                        to={messagesTo}
                        className="mc-exception-action inline-flex no-underline"
                        style={{ background: 'transparent' }}
                      >
                        Message dispatch
                      </Link>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </MissionShell>
  );
};

/** Pay — production disconnected (driver language, e2e strings preserved) / Showcase full pay center. */
export const PayPage: React.FC = () => {
  const { mode, dataSource, actions } = useDriverExperience();
  const pay = dataSource.getPaySummary();
  const [status, setStatus] = useState('');

  const reportPayQuestion = async () => {
    if (!actions.reportPayQuestion) return;
    const result = await actions.reportPayQuestion();
    setStatus(`${result.disclosure}: ${result.message}`);
  };

  return (
    <MissionShell title="Pay" activeNav="pay">
      <div className="space-y-6 max-w-3xl">
        <header>
          <p className="mc-kicker">Pay</p>
          <h1 className="mc-page-title">Settlement</h1>
          <p className="mc-section-copy">
            {mode === 'showcase'
              ? 'Demonstration data only — Showcase settlement preview.'
              : "Pay details aren't available yet."}
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
              Pay details aren&apos;t available yet in this build. No gross, deduction, or net
              amounts are calculated or displayed. When payroll is connected through the approved
              architecture, settlement summaries will appear here.
            </p>
          </section>
        ) : (
          <>
            <ElmCard variant="muted" padding="md" as="section" aria-label="Settlement summary">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="mc-kicker">{pay.periodLabel}</p>
                  <h2 className="mc-section-title">Demonstration settlement</h2>
                  {pay.payrollStatusLabel ? (
                    <p className="mc-section-copy">{pay.payrollStatusLabel}</p>
                  ) : null}
                </div>
                <span className="mc-capability-chip">{pay.disclosure}</span>
              </div>

              <dl className="mc-metric-grid">
                <div className="mc-metric-tile">
                  <dt>Estimated earnings</dt>
                  <dd>{pay.estimatedEarningsLabel || pay.grossLabel}</dd>
                </div>
                <div className="mc-metric-tile">
                  <dt>Reimbursements pending</dt>
                  <dd>{pay.reimbursementsPendingLabel || '—'}</dd>
                </div>
                <div className="mc-metric-tile">
                  <dt>Escrow balance</dt>
                  <dd>{pay.escrowBalanceLabel || '—'}</dd>
                </div>
                <div className="mc-metric-tile">
                  <dt>Savings balance</dt>
                  <dd>{pay.savingsBalanceLabel || '—'}</dd>
                </div>
                <div className="mc-metric-tile">
                  <dt>Year to date</dt>
                  <dd>{pay.ytdLabel || '—'}</dd>
                </div>
                <div className="mc-metric-tile">
                  <dt>Net payout (est.)</dt>
                  <dd className="mc-earnings-value text-lg">{pay.netLabel}</dd>
                </div>
              </dl>
              <p className="mc-section-copy mt-4">{pay.note}</p>
            </ElmCard>

            {pay.timelineSteps?.length ? (
              <ElmCard padding="md" as="section" aria-label="Settlement timeline">
                <RouteMilestoneBar milestones={pay.timelineSteps} capabilityNote={false} />
              </ElmCard>
            ) : null}

            {pay.lineItems?.length ? (
              <ElmCard padding="md" as="section" aria-label="Settlement line items">
                <p className="mc-kicker mb-3">Line items</p>
                <ul className="mc-task-list">
                  {pay.lineItems.map((li) => (
                    <li key={li.id} className="mc-task-row">
                      <div className="min-w-0 flex-1">
                        <p className="mc-task-title">{li.label}</p>
                        <p className="mc-task-detail">
                          {li.statusLabel}
                          {li.relatedLoadNum ? ` · Load #${li.relatedLoadNum}` : ''}
                        </p>
                      </div>
                      <span className="mc-task-title">{li.amountLabel}</span>
                    </li>
                  ))}
                </ul>
              </ElmCard>
            ) : null}

            {pay.history?.length ? (
              <ElmCard padding="md" as="section" aria-label="Settlement history">
                <p className="mc-kicker mb-3">History</p>
                <ul className="mc-task-list">
                  {pay.history.map((h) => (
                    <li key={h.id} className="mc-task-row">
                      <div className="min-w-0 flex-1">
                        <p className="mc-task-title">{h.periodLabel}</p>
                        <p className="mc-task-detail capitalize">{h.statusLabel}</p>
                      </div>
                      <span className="mc-task-title">{h.netLabel}</span>
                    </li>
                  ))}
                </ul>
              </ElmCard>
            ) : null}

            <ElmCard variant="default" padding="md" as="section" aria-label="Pay questions">
              <p className="mc-kicker mb-2">Have a question about this settlement?</p>
              <p className="mc-section-copy">
                Route a demonstration pay question to Showcase dispatch. No real inquiry is sent.
              </p>
              {status ? (
                <p className="text-xs text-amber-300 normal-case mt-3" role="status">
                  {status}
                </p>
              ) : null}
              <button type="button" className="mc-exception-action mt-4" onClick={reportPayQuestion}>
                Report a pay question
              </button>
            </ElmCard>
          </>
        )}
      </div>
    </MissionShell>
  );
};

/** More — profile, Showcase menu / production shortcuts, and admin Showcase entry. */
export const MorePage: React.FC = () => {
  const { session, logout } = useAuth();
  const { mode, routePrefix, dataSource } = useDriverExperience();
  const showcase = useShowcaseOptional();
  const navigate = useNavigate();
  const [entering, setEntering] = useState(false);
  const company = getCompanyDisplayName(session?.companyCode);
  const isBridgeAdmin =
    mode === 'production' &&
    session?.authRole === 'admin' &&
    Boolean(session?.canSelectAnyDriver);
  const hasShowcaseGrant = isShowcaseGrantPresentAndUnexpired();
  const canEnterShowcase = isBridgeAdmin && hasShowcaseGrant;
  const moreMenu = mode === 'showcase' ? dataSource.getMoreMenu?.() ?? [] : [];

  const enterShowcase = async () => {
    if (!showcase) return;
    setEntering(true);
    const result = await showcase.enterShowcase();
    setEntering(false);
    if (result === 'ok') navigate('/showcase');
    else navigate('/showcase/today'); // guard will show Access Denied if grant invalid
  };

  const refreshAdminGrant = () => {
    logout();
    navigate('/login', { replace: true });
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

        {mode === 'showcase' ? (
          <>
            <ElmCard variant="muted" padding="md" as="section" aria-label="Utilities">
              <p className="mc-kicker mb-3">Utilities</p>
              <ul className="mc-task-list">
                <li>
                  <Link to={`${routePrefix}/search`} className="mc-task-row mc-task-row-link">
                    <div className="min-w-0 flex-1">
                      <p className="mc-task-title">Search</p>
                      <p className="mc-task-detail">Find loads, documents, and messages</p>
                    </div>
                    <span aria-hidden>›</span>
                  </Link>
                </li>
                <li>
                  <Link to={`${routePrefix}/notifications`} className="mc-task-row mc-task-row-link">
                    <div className="min-w-0 flex-1">
                      <p className="mc-task-title">Notifications</p>
                      <p className="mc-task-detail">Demonstration alert center</p>
                    </div>
                    <span aria-hidden>›</span>
                  </Link>
                </li>
                <li>
                  <Link to={`${routePrefix}/assistant`} className="mc-task-row mc-task-row-link">
                    <div className="min-w-0 flex-1">
                      <p className="mc-task-title">ELM AI Assistant</p>
                      <p className="mc-task-detail">Demonstration data only — no real actions taken</p>
                    </div>
                    <span aria-hidden>›</span>
                  </Link>
                </li>
              </ul>
            </ElmCard>

            <ElmCard variant="default" padding="md" as="section" aria-label="Shortcuts">
              <p className="mc-kicker mb-3">Shortcuts</p>
              <ul className="mc-task-list">
                <li>
                  <Link to={`${routePrefix}/messages`} className="mc-task-row mc-task-row-link">
                    <div className="min-w-0 flex-1">
                      <p className="mc-task-title">Messages</p>
                      <p className="mc-task-detail">Dispatch, payroll, and safety inbox</p>
                    </div>
                    <span aria-hidden>›</span>
                  </Link>
                </li>
                <li>
                  <Link to={`${routePrefix}/equipment`} className="mc-task-row mc-task-row-link">
                    <div className="min-w-0 flex-1">
                      <p className="mc-task-title">Equipment</p>
                      <p className="mc-task-detail">Truck, trailer, and DVIR status</p>
                    </div>
                    <span aria-hidden>›</span>
                  </Link>
                </li>
                <li>
                  <Link to={`${routePrefix}/safety`} className="mc-task-row mc-task-row-link">
                    <div className="min-w-0 flex-1">
                      <p className="mc-task-title">Safety</p>
                      <p className="mc-task-detail">HOS, credentials, and training</p>
                    </div>
                    <span aria-hidden>›</span>
                  </Link>
                </li>
              </ul>
            </ElmCard>

            {moreMenu.map((group) => (
              <ElmCard key={group.id} variant="muted" padding="md" as="section" aria-label={group.title}>
                <p className="mc-kicker mb-3">{group.title}</p>
                <ul className="mc-task-list">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <Link to={item.href} className="mc-task-row mc-task-row-link">
                        <div className="min-w-0 flex-1">
                          <p className="mc-task-title">{item.label}</p>
                          <p className="mc-task-detail">{item.detail}</p>
                        </div>
                        <span aria-hidden>›</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </ElmCard>
            ))}

            <ElmCard variant="default" padding="md" as="section" aria-label="Exit Showcase">
              <p className="mc-kicker mb-2">Showcase Mode</p>
              <p className="mc-section-copy">
                Demonstration data only — nothing in Showcase reaches production dispatch,
                payroll, or messaging.
              </p>
              <Link
                to="/today"
                className="mc-exception-action mt-4 inline-flex no-underline"
                onClick={() => showcase?.exitShowcase()}
              >
                Exit Showcase
              </Link>
            </ElmCard>
          </>
        ) : (
          <ElmCard variant="muted" padding="md" as="section" aria-label="Shortcuts">
            <p className="mc-kicker mb-3">Shortcuts</p>
            <ul className="mc-task-list">
              <li>
                <Link to={routePrefix ? `${routePrefix}/today` : '/today'} className="mc-task-row mc-task-row-link">
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
                <Link to={routePrefix ? `${routePrefix}/capture` : '/capture'} className="mc-task-row mc-task-row-link">
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
        )}

        {isBridgeAdmin ? (
          <div id="showcase-entry">
            <ElmCard variant="default" padding="md" as="section" aria-label="Admin Showcase">
              <p className="mc-kicker mb-2">Admin</p>
              <h2 className="mc-section-title">Showcase Mode</h2>
              <p className="mc-section-copy">
                Verified platform admin only. Demonstration fixtures for GLX and BST — NOT CONNECTED TO
                PRODUCTION.
              </p>
              {canEnterShowcase ? (
                <button
                  type="button"
                  className="mc-exception-action mt-4"
                  disabled={entering}
                  onClick={enterShowcase}
                >
                  {entering ? 'Verifying…' : 'Enter Showcase'}
                </button>
              ) : (
                <div className="mt-4 space-y-3">
                  <p className="mc-section-copy text-amber-200/90">
                    No valid Showcase grant in this browser session. Sign out and sign back in with your
                    bridge admin email so the server can issue a short-lived grant. Ordinary driver
                    accounts cannot enter Showcase.
                  </p>
                  <button type="button" className="mc-exception-action" onClick={refreshAdminGrant}>
                    Sign out to refresh Showcase grant
                  </button>
                </div>
              )}
            </ElmCard>
          </div>
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
