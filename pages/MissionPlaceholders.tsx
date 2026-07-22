import React from 'react';
import MissionShell from '../components/mission-control/MissionShell.tsx';
import ElmCard from '../design-system/components/ElmCard.tsx';
import type { BottomNavId } from '../components/mission-control/BottomNav.tsx';

interface IntegrationPlaceholderPageProps {
  title: string;
  nav: BottomNavId;
  summary: string;
}

const IntegrationPlaceholderPage: React.FC<IntegrationPlaceholderPageProps> = ({
  title,
  nav,
  summary,
}) => (
  <MissionShell title={title} activeNav={nav}>
    <div className="max-w-2xl mx-auto">
      <ElmCard variant="muted" padding="lg" as="section">
        <p className="mc-kicker mb-2">Ready for integration</p>
        <h1 className="mc-page-title mb-3">{title}</h1>
        <p className="mc-section-copy">{summary}</p>
        <p className="mc-capability-chip mt-5 inline-flex">Not a live production module yet</p>
      </ElmCard>
    </div>
  </MissionShell>
);

export const LoadsPage: React.FC = () => (
  <IntegrationPlaceholderPage
    title="Loads"
    nav="loads"
    summary="Load list and detail views will connect to verified load services. No invented load board is shown here."
  />
);

export const PayPage: React.FC = () => (
  <IntegrationPlaceholderPage
    title="Pay"
    nav="pay"
    summary="Settlement and reimbursement views will appear here. No pay amounts are calculated in this build."
  />
);

export const MorePage: React.FC = () => (
  <IntegrationPlaceholderPage
    title="More"
    nav="more"
    summary="Profile, support, and preferences will live here. Use Capture for live document modules, or Logout from the header."
  />
);
