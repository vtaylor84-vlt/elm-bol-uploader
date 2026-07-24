import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MissionShell from '../components/mission-control/MissionShell.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useSubmissionDraft } from '../context/SubmissionDraftContext.tsx';
import { useDriverExperience } from '../context/DriverExperienceContext.tsx';
import ElmPageHeader from '../design-system/components/ElmPageHeader.tsx';
import PageContainer from '../design-system/components/PageContainer.tsx';
import CapabilityStateBadge from '../components/mission-control/CapabilityStateBadge.tsx';
import { getCompanyDisplayName } from '../utils/companyMap.ts';
import {
  CameraIcon,
  DocumentTextIcon,
  ReceiptPercentIcon,
  PhotoIcon,
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import {
  openPayrollTripSubmission,
  PAYROLL_TRIP_SUBMISSION_LABEL,
} from '../utils/payrollTripSubmission.ts';

type CaptureKind =
  | 'trip_paperwork'
  | 'receipt'
  | 'freight_photos'
  | 'vehicle_issue'
  | 'incident_evidence';

interface CaptureChoice {
  id: CaptureKind;
  title: string;
  description: string;
  taskLabel: string;
  icon: React.ReactNode;
  /** Production path when live */
  productionHref?: '/submissions/bol-pod' | '/submissions/receipt';
  showcaseAction: 'pod' | 'receipt' | 'sim';
  state: 'AVAILABLE' | 'DEMO_ONLY' | 'COMING_SOON';
}

/**
 * Capture — camera-first action hub (not a document repository).
 * First decision is limited to five plain-language choices.
 */
const WorkspacePage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { session } = useAuth();
  const { startDraft, clearDraft } = useSubmissionDraft();
  const { mode, routePrefix, dataSource, actions } = useDriverExperience();
  const [simMessage, setSimMessage] = useState('');
  const [reviewKind, setReviewKind] = useState<CaptureKind | null>(null);

  const company = getCompanyDisplayName(session?.companyCode);
  const driverName = session?.driverName || 'Driver';
  const haul = dataSource.getMissionControl().activeHaul;
  const truck = mode === 'showcase' ? dataSource.getTruckStatus() : null;
  const preselected = (params.get('type') || '') as CaptureKind | '';

  const choices: CaptureChoice[] = useMemo(() => {
    const demo = mode === 'showcase';
    return [
      {
        id: 'trip_paperwork',
        title: 'Trip paperwork',
        description: haul
          ? `Upload BOL or POD for trip #${haul.loadNum}`
          : 'Upload BOL or POD for your current trip',
        taskLabel: haul?.missingDocuments?.includes('POD')
          ? 'Upload POD'
          : haul?.missingDocuments?.includes('BOL')
            ? 'Upload BOL'
            : 'Upload BOL / POD',
        icon: <DocumentTextIcon className="mc-capture-choice-icon" aria-hidden />,
        productionHref: '/submissions/bol-pod',
        showcaseAction: 'pod',
        state: demo ? 'DEMO_ONLY' : 'AVAILABLE',
      },
      {
        id: 'receipt',
        title: 'Receipt',
        description: 'Fuel, tolls, lumper, and repair receipts',
        taskLabel: 'Add receipt',
        icon: <ReceiptPercentIcon className="mc-capture-choice-icon" aria-hidden />,
        productionHref: '/submissions/receipt',
        showcaseAction: 'receipt',
        state: demo ? 'DEMO_ONLY' : 'AVAILABLE',
      },
      {
        id: 'freight_photos',
        title: 'Freight photos',
        description: haul
          ? `Condition photos for ${haul.origin} → ${haul.destination}`
          : 'Photograph seals, cargo, and damage',
        taskLabel: 'Take freight photos',
        icon: <PhotoIcon className="mc-capture-choice-icon" aria-hidden />,
        showcaseAction: 'sim',
        state: demo ? 'DEMO_ONLY' : 'COMING_SOON',
      },
      {
        id: 'vehicle_issue',
        title: 'Vehicle issue',
        description: truck
          ? `Report a problem with ${truck.truckNumber} / ${truck.trailerNumber}`
          : 'Report a truck or trailer problem',
        taskLabel: 'Report vehicle issue',
        icon: <WrenchScrewdriverIcon className="mc-capture-choice-icon" aria-hidden />,
        showcaseAction: 'sim',
        state: demo ? 'DEMO_ONLY' : 'COMING_SOON',
      },
      {
        id: 'incident_evidence',
        title: 'Incident evidence',
        description: 'Photos and notes for accidents, claims, or roadside events',
        taskLabel: 'Add incident evidence',
        icon: <ExclamationTriangleIcon className="mc-capture-choice-icon" aria-hidden />,
        showcaseAction: 'sim',
        state: demo ? 'DEMO_ONLY' : 'COMING_SOON',
      },
    ];
  }, [mode, haul, truck]);

  const ordered = useMemo(() => {
    if (!preselected) return choices;
    const hit = choices.find((c) => c.id === preselected);
    if (!hit) return choices;
    return [hit, ...choices.filter((c) => c.id !== preselected)];
  }, [choices, preselected]);

  const runChoice = async (choice: CaptureChoice) => {
    if (choice.state === 'COMING_SOON') {
      setSimMessage('Coming soon — this capture type is not available yet.');
      return;
    }

    if (mode === 'showcase') {
      setReviewKind(choice.id);
      if (choice.showcaseAction === 'pod') {
        const result = await actions.submitPodSimulated?.();
        if (result) setSimMessage(`${result.disclosure}: ${result.message}`);
      } else if (choice.showcaseAction === 'receipt') {
        const result = await actions.submitReceiptSimulated?.();
        if (result) setSimMessage(`${result.disclosure}: ${result.message}`);
      } else {
        setSimMessage(
          `SIMULATED ACTION: ${choice.taskLabel} recorded for demonstration only. No production write.`
        );
      }
      return;
    }

    if (!choice.productionHref) {
      setSimMessage('Not available yet — this capture type is not connected in Production.');
      return;
    }

    clearDraft();
    startDraft({
      submissionType: choice.productionHref.includes('receipt') ? 'EXPENSE_RECEIPT' : 'BOL_POD',
      driverName: session?.driverName || '',
      company,
    });
    navigate(choice.productionHref);
  };

  return (
    <MissionShell title="Capture" activeNav="capture">
      <PageContainer width="content" className="space-y-6">
        <ElmPageHeader
          eyebrow="Capture"
          title="What are you submitting?"
          align="left"
          description={
            mode === 'showcase'
              ? `${driverName} — camera-first demonstration capture. Simulated only.`
              : `${driverName} — choose a live upload. Complete only when safely stopped.`
          }
        />

        {haul ? (
          <p className="mc-capture-context" role="status">
            Current trip #{haul.loadNum} · {haul.origin} → {haul.destination}
            {haul.appointmentLabel ? ` · ${haul.appointmentLabel}` : ''}
          </p>
        ) : null}

        <section className="mc-payroll-submit-card" aria-labelledby="payroll-submit-heading">
          <div className="mc-payroll-submit-card-main">
            <span className="mc-capture-choice-glyph" aria-hidden>
              <BanknotesIcon className="mc-capture-choice-icon" />
            </span>
            <div className="min-w-0">
              <h2 id="payroll-submit-heading" className="mc-capture-choice-title">
                {PAYROLL_TRIP_SUBMISSION_LABEL}
              </h2>
              <p className="mc-capture-choice-desc">
                Continue to the payroll trip-submission workflow for completed trips. Your Driver
                Workspace session stays open. Submission status is not synced back here yet.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="mc-exception-action"
            onClick={() => openPayrollTripSubmission()}
          >
            Open trip submission
          </button>
        </section>

        {simMessage ? (
          <p className="mc-sim-status" role="status">
            {simMessage}
          </p>
        ) : null}

        {reviewKind ? (
          <div className="mc-capture-review" role="status">
            <p className="mc-kicker mb-1">Review</p>
            <p className="mc-task-title">
              {ordered.find((c) => c.id === reviewKind)?.taskLabel || 'Submission'} queued
            </p>
            <p className="mc-task-detail">
              {mode === 'showcase'
                ? 'Demonstration status: simulated success. Nothing reached Production.'
                : 'Continue in the live upload flow.'}
            </p>
            <div className="mc-home-trip-actions mt-3">
              {haul ? (
                <button
                  type="button"
                  className="mc-secondary-action"
                  onClick={() => navigate(`${routePrefix}/trips`)}
                >
                  Return to trip
                </button>
              ) : null}
              <button type="button" className="mc-secondary-action" onClick={() => setReviewKind(null)}>
                Capture another
              </button>
            </div>
          </div>
        ) : null}

        <ul className="mc-capture-choices">
          {ordered.map((choice) => {
            const unavailable = choice.state === 'COMING_SOON';
            return (
              <li key={choice.id}>
                <button
                  type="button"
                  className={`mc-capture-choice${unavailable ? ' is-unavailable' : ''}${
                    preselected === choice.id ? ' is-preselected' : ''
                  }`}
                  onClick={() => runChoice(choice)}
                  aria-label={`${choice.title}: ${choice.taskLabel}. ${choice.description}`}
                >
                  <span className="mc-capture-choice-glyph" aria-hidden>
                    {choice.icon}
                  </span>
                  <span className="mc-capture-choice-body">
                    <span className="mc-capture-choice-title-row">
                      <span className="mc-capture-choice-title">{choice.title}</span>
                      <CapabilityStateBadge
                        state={
                          choice.state === 'COMING_SOON'
                            ? 'COMING_SOON'
                            : choice.state === 'DEMO_ONLY'
                              ? 'DEMO_ONLY'
                              : 'AVAILABLE'
                        }
                      />
                    </span>
                    <span className="mc-capture-choice-task">{choice.taskLabel}</span>
                    <span className="mc-capture-choice-desc">{choice.description}</span>
                  </span>
                  <span className="mc-capture-choice-cam" aria-hidden>
                    <CameraIcon className="mc-capture-choice-icon" />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <p className="mc-safe-driving-note">
          Capture requires attention — use only while safely stopped. Do not photograph or submit
          while driving.
        </p>
      </PageContainer>
    </MissionShell>
  );
};

export default WorkspacePage;
