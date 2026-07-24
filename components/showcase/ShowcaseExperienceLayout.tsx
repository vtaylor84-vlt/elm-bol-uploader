import React, { useEffect, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { DriverExperienceProvider } from '../../context/DriverExperienceContext.tsx';
import { useShowcase } from '../../context/ShowcaseContext.tsx';
import { createShowcaseDriverDataSource } from '../../services/dataSource/ShowcaseDriverDataSource.ts';
import { createShowcaseDriverActionPort } from '../../services/dataSource/ShowcaseDriverActionPort.ts';
import DemoControls from './DemoControls.tsx';
import ViewAsBanner from './ViewAsBanner.tsx';
import { setShowcaseProductionWriteBlock } from '../../utils/submissionUpload.ts';

/** Thin Showcase shell — shared pages render via Outlet with Showcase data sources. */
const ShowcaseExperienceLayout: React.FC = () => {
  const { state } = useShowcase();
  const dataSource = useMemo(
    () =>
      createShowcaseDriverDataSource({
        carrierId: state.carrierId,
        personaRole: state.personaRole,
        scenarioId: state.scenarioId,
      }),
    [state.carrierId, state.personaRole, state.scenarioId]
  );
  const actions = useMemo(() => createShowcaseDriverActionPort(), []);

  useEffect(() => {
    setShowcaseProductionWriteBlock(true);
    return () => setShowcaseProductionWriteBlock(false);
  }, []);

  return (
    <DriverExperienceProvider
      mode="showcase"
      routePrefix="/showcase"
      dataSource={dataSource}
      actions={actions}
    >
      <div className="showcase-layout">
        <div className="demo-chrome-wrap">
          <DemoControls />
          <ViewAsBanner />
        </div>
        <Outlet />
      </div>
    </DriverExperienceProvider>
  );
};

export default ShowcaseExperienceLayout;
