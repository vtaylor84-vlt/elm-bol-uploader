import React from 'react';
import { useNavigate } from 'react-router-dom';
import AuthenticatedShell from '../components/terminal/AuthenticatedShell.tsx';
import ElmButton from '../design-system/components/ElmButton.tsx';
import ElmPageHeader from '../design-system/components/ElmPageHeader.tsx';
import GlassCard from '../design-system/components/GlassCard.tsx';
import PageContainer from '../design-system/components/PageContainer.tsx';
import CapabilityStateBadge from '../components/mission-control/CapabilityStateBadge.tsx';

/**
 * Production gate for receipt capture.
 * Full workflow preserved in ReceiptWorkflowPage.tsx until Drive destination is verified.
 */
const ReceiptPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AuthenticatedShell title="Receipt">
      <PageContainer width="content">
        <ElmPageHeader
          eyebrow="Capture"
          title="Receipt"
          align="left"
          description="This capture type is not open in Production yet."
        />
        <GlassCard glowColor="cyan" padding="lg" className="mt-4 space-y-4">
          <CapabilityStateBadge state="COMING_SOON" />
          <p className="text-sm text-zinc-300 normal-case leading-relaxed">
            Receipt submission is being connected and is not available yet. No receipt was uploaded
            or saved. Authoritative storage and logging must be verified before this workflow
            reopens in Production.
          </p>
          <ElmButton type="button" variant="secondary" onClick={() => navigate('/capture')}>
            Back to Capture
          </ElmButton>
        </GlassCard>
      </PageContainer>
    </AuthenticatedShell>
  );
};

export default ReceiptPage;
