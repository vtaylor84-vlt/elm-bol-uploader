/** Showcase + Driver Experience shared contracts */

export type CarrierId = 'GLX' | 'BST';

export type ShowcasePersonaRole = 'driver' | 'admin';

export type ScenarioId =
  | 'normal'
  | 'urgent_pod'
  | 'payroll_ready'
  | 'maintenance'
  | 'safety_review'
  | 'road_breakdown'
  | 'storm_delay'
  | 'missing_paperwork'
  | 'perfect_week'
  | 'new_driver';

export type DisclosureKind =
  | 'DEMONSTRATION DATA'
  | 'FUTURE CAPABILITY'
  | 'SIMULATED ACTION'
  | 'NOT CONNECTED TO PRODUCTION';

export interface DemoPersona {
  id: string;
  carrierId: CarrierId;
  role: ShowcasePersonaRole;
  driverId?: string;
  displayName: string;
  scenarioId: ScenarioId;
}

export interface CarrierDemoConfig {
  carrierId: CarrierId;
  legalName: string;
  displayName: string;
  supportPhone?: string;
  supportEmail?: string;
  branding: {
    primaryAccent?: string;
    secondaryAccent?: string;
  };
}

export interface ShowcaseActionResult {
  success: boolean;
  message: string;
  disclosure: DisclosureKind;
  simulatedId?: string;
}

export const SCENARIO_OPTIONS: { id: ScenarioId; label: string }[] = [
  { id: 'normal', label: 'Normal operations' },
  { id: 'urgent_pod', label: 'Urgent POD' },
  { id: 'payroll_ready', label: 'Payroll ready' },
  { id: 'maintenance', label: 'Maintenance issue' },
  { id: 'safety_review', label: 'Safety review' },
  { id: 'road_breakdown', label: 'Road breakdown' },
  { id: 'storm_delay', label: 'Storm delay' },
  { id: 'missing_paperwork', label: 'Missing paperwork' },
  { id: 'perfect_week', label: 'Perfect week' },
  { id: 'new_driver', label: 'New driver' },
];

export const SHOWCASE_GRANT_KEY = 'elm_showcase_grant';
export const SHOWCASE_GRANT_EXP_KEY = 'elm_showcase_grant_exp';
