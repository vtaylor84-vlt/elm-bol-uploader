import React, { useState } from 'react';
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
  ArrowRightIcon,
  ArrowTopRightOnSquareIcon,
  CameraIcon,
  ClipboardDocumentCheckIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  ReceiptPercentIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import {
  openPayrollTripSubmission,
  PAYROLL_TRIP_SUBMISSION_HELPER,
  PAYROLL_TRIP_SUBMISSION_LABEL,
} from '../utils/payrollTripSubmission.ts';

type FutureKind = 'receipt' | 'freight' | 'vehicle' | 'incident';

interface FutureSubmission {
  id: FutureKind;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const FUTURE_SUBMISSIONS: FutureSubmission[] = [
  {
    id: 'receipt',
    title: 'Add receipt',
    description: 'Fuel, tolls, lumper, and repair receipts',
    icon: <ReceiptPercentIcon className="mc-submit-card-icon" aria-hidden />,
  },
  {
    id: 'freight',
    title: 'Freight photos',
    description: 'Cargo condition photos for your trip',
    icon: <CameraIcon className="mc-submit-card-icon" aria-hidden />,
  },
  {
    id: 'vehicle',
    title: 'Vehicle issue',
    description: 'Report truck or trailer problems with photos',
    icon: <WrenchScrewdriverIcon className="mc-submit-card-icon" aria-hidden />,
  },
  {
    id: 'incident',
    title: 'Incident evidence',
    description: 'Capture evidence for an incident report',
    icon: <ExclamationTriangleIcon className="mc-submit-card-icon" aria-hidden />,
  },
];

/**
 * Submit — live Upload BOL / POD + Submit Trip Form, then coming-soon submissions.
 * Route remains /capture for link stability.
 */
const WorkspacePage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { session } = useAuth();
  const { startDraft, clearDraft } = useSubmissionDraft();
  const { mode, routePrefix, dataSource, actions } = useDriverExperience();
  const [simMessage, setSimMessage] = useState('');

  const company = getCompanyDisplayName(session?.companyCode);
  const haul = dataSource.getMissionControl().activeHaul;
  const rawType = (params.get('type') || '').toLowerCase();
  const prefersBol =
    rawType === 'bol_pod' || rawType === 'trip_paperwork' || rawType === 'bol' || rawType === 'pod';

  const openBolPod = async () => {
    if (mode === 'showcase') {
      const result = await actions.submitPodSimulated?.();
      if (result) setSimMessage(`${result.disclosure}: ${result.message}`);
      return;
    }

    clearDraft();
    startDraft({
      submissionType: 'BOL_POD',
      driverName: session?.driverName || '',
      company,
    });
    navigate('/submissions/bol-pod');
  };

  const bolDescription = haul
    ? `Upload paperwork for trip #${haul.loadNum}.`
    : 'Upload paperwork for your current trip.';

  return (
    <MissionShell title="Submit" activeNav="capture">
      <PageContainer width="content" className="space-y-6 mc-submit-page">
        <ElmPageHeader
          eyebrow="Submissions"
          title="What do you need to send?"
          align="left"
          description="Choose an option below. Only upload documents when safely stopped."
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

        <section className="mc-submit-section" aria-labelledby="submit-available-heading">
          <h2 id="submit-available-heading" className="mc-submit-section-title">
            Available now
          </h2>
          <div className="mc-submit-live-grid">
            <button
              type="button"
              className={`mc-submit-live-card${prefersBol ? ' is-hinted' : ''}`}
              onClick={() => openBolPod()}
              aria-label="Upload BOL / POD. Upload paperwork for your current trip."
              data-submit-action="bol-pod"
            >
              <span className="mc-submit-live-card-glyph" aria-hidden>
                <DocumentArrowUpIcon className="mc-submit-card-icon" />
              </span>
              <span className="mc-submit-live-card-body">
                <span className="mc-submit-live-card-title">Upload BOL / POD</span>
                <span className="mc-submit-live-card-copy">{bolDescription}</span>
              </span>
              <span className="mc-submit-live-card-trail" aria-hidden>
                <ArrowRightIcon className="mc-submit-card-icon mc-submit-card-icon--trail" />
              </span>
            </button>

            <button
              type="button"
              className="mc-submit-live-card"
              onClick={() => openPayrollTripSubmission()}
              aria-label={`${PAYROLL_TRIP_SUBMISSION_LABEL}. ${PAYROLL_TRIP_SUBMISSION_HELPER} Opens in a new tab.`}
              data-submit-action="trip-form"
            >
              <span className="mc-submit-live-card-glyph" aria-hidden>
                <ClipboardDocumentCheckIcon className="mc-submit-card-icon" />
              </span>
              <span className="mc-submit-live-card-body">
                <span className="mc-submit-live-card-title">{PAYROLL_TRIP_SUBMISSION_LABEL}</span>
                <span className="mc-submit-live-card-copy">{PAYROLL_TRIP_SUBMISSION_HELPER}</span>
              </span>
              <span className="mc-submit-live-card-trail" aria-hidden>
                <ArrowTopRightOnSquareIcon className="mc-submit-card-icon mc-submit-card-icon--trail" />
              </span>
            </button>
          </div>
        </section>

        <section className="mc-submit-section" aria-labelledby="submit-more-heading">
          <h2 id="submit-more-heading" className="mc-submit-section-title">
            More submissions
          </h2>
          <ul className="mc-submit-future-list">
            {FUTURE_SUBMISSIONS.map((item) => (
              <li key={item.id}>
                <div
                  className="mc-submit-future-card"
                  aria-disabled="true"
                  data-submit-future={item.id}
                >
                  <span className="mc-submit-future-card-glyph" aria-hidden>
                    {item.icon}
                  </span>
                  <span className="mc-submit-future-card-body">
                    <span className="mc-submit-future-card-title-row">
                      <span className="mc-submit-future-card-title">{item.title}</span>
                      <CapabilityStateBadge state="COMING_SOON" />
                    </span>
                    <span className="mc-submit-future-card-copy">{item.description}</span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {mode === 'showcase' ? (
          <p className="mc-section-copy">
            Showcase can simulate Upload BOL / POD from Available now. Future submission types stay
            Coming soon and do not write to Production.
            {routePrefix ? ` Demo path: ${routePrefix}/capture.` : ''}
          </p>
        ) : null}
      </PageContainer>
    </MissionShell>
  );
};

export default WorkspacePage;
