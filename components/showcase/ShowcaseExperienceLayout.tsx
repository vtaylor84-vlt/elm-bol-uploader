import React, { useEffect, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { DriverExperienceProvider } from '../../context/DriverExperienceContext.tsx';
import { useShowcase } from '../../context/ShowcaseContext.tsx';
import { createShowcaseDriverDataSource } from '../../services/dataSource/ShowcaseDriverDataSource.ts';
import { createShowcaseDriverActionPort } from '../../services/dataSource/ShowcaseDriverActionPort.ts';
import ShowcaseDisclosureBanner from './ShowcaseDisclosureBanner.tsx';
import ScenarioControlPanel from './ScenarioControlPanel.tsx';
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
    <DriverExperienceProvider mode="showcase" routePrefix="/showcase" dataSource={dataSource} actions={actions}>
      <div className="showcase-layout">
        <div className="px-4 pt-3 max-w-6xl mx-auto w-full space-y-3">
          <ShowcaseDisclosureBanner />
          <ScenarioControlPanel />
        </div>
        <Outlet />
      </div>
    </DriverExperienceProvider>
  );
};

export default ShowcaseExperienceLayout;
