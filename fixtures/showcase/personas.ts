import type { CarrierDemoConfig, CarrierId, DemoPersona, ScenarioId } from '../../types/showcase.ts';

export const CARRIER_DEMO_CONFIG: Record<CarrierId, CarrierDemoConfig> = {
  GLX: {
    carrierId: 'GLX',
    legalName: 'Greenleaf Xpress LLC',
    displayName: 'Greenleaf Xpress',
    supportPhone: '800-555-0142',
    supportEmail: 'maintenance@greenleafxpressllc.com',
    branding: { primaryAccent: '#10b981', secondaryAccent: '#4ade80' },
  },
  BST: {
    carrierId: 'BST',
    legalName: 'BST Expedite Inc',
    displayName: 'BST Expedite Inc',
    supportPhone: '800-555-0199',
    supportEmail: 'nick@bstexpediteinc.com',
    branding: { primaryAccent: '#3b82f6', secondaryAccent: '#818cf8' },
  },
};

export const SHOWCASE_PERSONAS: DemoPersona[] = [
  {
    id: 'glx-driver',
    carrierId: 'GLX',
    role: 'driver',
    driverId: 'GLX-D-204',
    displayName: 'Avery Chen',
    scenarioId: 'normal',
  },
  {
    id: 'glx-admin',
    carrierId: 'GLX',
    role: 'admin',
    driverId: 'GLX-A-01',
    displayName: 'Morgan Ellis (GLX Admin)',
    scenarioId: 'normal',
  },
  {
    id: 'bst-driver',
    carrierId: 'BST',
    role: 'driver',
    driverId: 'BST-D-881',
    displayName: 'Jordan Rivers',
    scenarioId: 'normal',
  },
  {
    id: 'bst-admin',
    carrierId: 'BST',
    role: 'admin',
    driverId: 'BST-A-01',
    displayName: 'Casey Brooks (BST Admin)',
    scenarioId: 'normal',
  },
];

export function personaFor(carrierId: CarrierId, role: 'driver' | 'admin'): DemoPersona {
  const found = SHOWCASE_PERSONAS.find((p) => p.carrierId === carrierId && p.role === role);
  if (!found) throw new Error(`Missing persona ${carrierId} ${role}`);
  return found;
}

export function defaultScenarioForCarrier(_carrierId: CarrierId): ScenarioId {
  return 'normal';
}
