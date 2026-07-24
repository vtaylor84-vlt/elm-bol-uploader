import React, { useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { DriverExperienceProvider } from '../../context/DriverExperienceContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { createProductionDriverDataSource } from '../../services/dataSource/ProductionDriverDataSource.ts';
import { createProductionDriverActionPort } from '../../services/dataSource/ProductionDriverActionPort.ts';

/** Wraps production driver routes with ProductionDriverDataSource. */
const ProductionExperienceLayout: React.FC = () => {
  const { session } = useAuth();
  const dataSource = useMemo(() => createProductionDriverDataSource(session), [session]);
  const actions = useMemo(() => createProductionDriverActionPort(), []);

  return (
    <DriverExperienceProvider mode="production" routePrefix="" dataSource={dataSource} actions={actions}>
      <Outlet />
    </DriverExperienceProvider>
  );
};

export default ProductionExperienceLayout;
