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
} from '@heroicons/react/24/outline';
import {
  openPayrollTripSubmission,
  PAYROLL_TRIP_SUBMISSION_HELPER,
  PAYROLL_TRIP_SUBMISSION_LABEL,
} from '../utils/payrollTripSubmission.ts';

type CaptureKind = 'bol_pod' | 'receipt' | 'trip_paperwork';

interface CaptureChoice {
  id: CaptureKind;
  title: string;
  description: string;
  taskLabel: string;
  icon: React.ReactNode;
  productionHref?: '/submissions/bol-pod';
  showcaseAction: 'pod' | 'receipt';
  state: 'AVAILABLE' | 'DEMO_ONLY' | 'COMING_SOON';
}

/**
 * Capture — document actions. Live: Upload BOL / POD. Coming soon: Add receipt.
 * Submit Trip Form is a separate live action (not document capture).
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
  const rawType = params.get('type') || '';
  const preselected = (
    rawType === 'trip_paperwork' ? 'bol_pod' : rawType
  ) as CaptureKind | '';

  const choices: CaptureChoice[] = useMemo(() => {
    const demo = mode === 'showcase';
    return [
      {
        id: 'bol_pod',
        title: 'Upload BOL / POD',
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
        title: 'Add receipt',
        description: 'Fuel, tolls, lumper, and repair receipts',
        taskLabel: 'Add receipt',
        icon: <ReceiptPercentIcon className="mc-capture-choice-icon" aria-hidden />,
        showcaseAction: 'receipt',
        state: demo ? 'DEMO_ONLY' : 'COMING_SOON',
      },
    ];
  }, [mode, haul]);

  const ordered = useMemo(() => {
    if (!preselected) return choices;
    const hit = choices.find((c) => c.id === preselected);
    if (!hit) return choices;
    return [hit, ...choices.filter((c) => c.id !== preselected)];
  }, [choices, preselected]);

  const runChoice = async (choice: CaptureChoice) => {
    if (choice.state === 'COMING_SOON') {
      if (choice.id === 'receipt') {
        setSimMessage('Receipt submission is being connected and is not available yet.');
      } else {
        setSimMessage('Coming soon — this capture type is not available yet.');
      }
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
      }
      return;
    }

    if (!choice.productionHref) {
      setSimMessage('Not available yet — this capture type is not connected in Production.');
      return;
    }

    clearDraft();
    startDraft({
      submissionType: 'BOL_POD',
      driverName: session?.driverName || '',
      company,
    });
    navigate(choice.productionHref);
  };

  return (
    <MissionShell title="Capture" activeNav="capture">
      <PageContainer width="content" className="space-y-6">
        <ElmPageHeader
          eyebrow="Documents"
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
                  View trip
                </button>
              ) : null}
              <button type="button" className="mc-secondary-action" onClick={() => setReviewKind(null)}>
                Upload another
              </button>
            </div>
          </div>
        ) : null}

        <ul className="mc-capture-choices">
          {ordered
            .filter((c) => c.id === 'bol_pod')
            .map((choice) => (
              <li key={choice.id}>
                <button
                  type="button"
                  className={`mc-capture-choice mc-capture-choice--live${
                    preselected === choice.id ? ' is-preselected' : ''
                  }`}
                  onClick={() => runChoice(choice)}
                  aria-label={`${choice.title}. ${choice.description}`}
                >
                  <span className="mc-capture-choice-glyph" aria-hidden>
                    {choice.icon}
                  </span>
                  <span className="mc-capture-choice-body">
                    <span className="mc-capture-choice-title-row">
                      <span className="mc-capture-choice-title">{choice.title}</span>
                    </span>
                    <span className="mc-capture-choice-task">{choice.taskLabel}</span>
                    <span className="mc-capture-choice-desc">{choice.description}</span>
                  </span>
                  <span className="mc-capture-choice-cam" aria-hidden>
                    <CameraIcon className="mc-capture-choice-icon" />
                  </span>
                </button>
              </li>
            ))}
        </ul>

        <button
          type="button"
          className="mc-live-action w-full text-left"
          onClick={() => openPayrollTripSubmission()}
          aria-label={PAYROLL_TRIP_SUBMISSION_LABEL}
        >
          <span className="mc-live-action-kicker">Trip form</span>
          <span className="mc-live-action-title">{PAYROLL_TRIP_SUBMISSION_LABEL}</span>
          <span className="mc-live-action-copy">{PAYROLL_TRIP_SUBMISSION_HELPER}</span>
        </button>

        <ul className="mc-capture-choices">
          {ordered
            .filter((c) => c.id !== 'bol_pod')
            .map((choice) => {
              const unavailable = choice.state === 'COMING_SOON';
              return (
                <li key={choice.id}>
                  <button
                    type="button"
                    className={`mc-capture-choice${unavailable ? ' is-unavailable' : ''}`}
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
          Upload documents only when safely stopped. Do not photograph or submit while driving.
        </p>
      </PageContainer>
    </MissionShell>
  );
};

export default WorkspacePage;
