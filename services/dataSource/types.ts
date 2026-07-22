import type { MissionControlViewModel } from '../../types/missionControl.ts';
import type {
  CarrierId,
  DisclosureKind,
  ScenarioId,
  ShowcaseActionResult,
  ShowcasePersonaRole,
} from '../../types/showcase.ts';

export type DriverExperienceMode = 'production' | 'showcase';

export interface CaptureModuleInfo {
  id: string;
  title: string;
  description: string;
  href: string;
  capability: 'LIVE' | 'DEMONSTRATION' | 'FUTURE' | 'SIMULATED ACTION';
}

export interface LoadListItem {
  id: string;
  carrierId?: CarrierId;
  loadNum: string;
  origin: string;
  destination: string;
  statusLabel: string;
  disclosure?: DisclosureKind;
}

export interface PaySummaryView {
  disclosure: DisclosureKind;
  periodLabel: string;
  grossLabel: string;
  deductionsLabel: string;
  netLabel: string;
  note: string;
}

export interface MessageItem {
  id: string;
  carrierId?: CarrierId;
  from: string;
  subject: string;
  preview: string;
  unread: boolean;
  disclosure: DisclosureKind;
}

export interface TruckStatusView {
  /** Present only when branded from the active carrier configuration. */
  carrierId?: CarrierId;
  truckNumber: string;
  trailerNumber: string;
  statusLabel: string;
  nextServiceLabel: string;
  disclosure: DisclosureKind;
}

export interface SafetyStatusView {
  carrierId?: CarrierId;
  scoreLabel: string;
  openItems: string[];
  disclosure: DisclosureKind;
}

export interface HomeTimeRequestView {
  carrierId?: CarrierId;
  statusLabel: string;
  requestedWindow: string;
  disclosure: DisclosureKind;
}

export interface BenefitItem {
  id: string;
  carrierId?: CarrierId;
  title: string;
  detail: string;
  disclosure: DisclosureKind;
}

export interface DocumentItem {
  id: string;
  carrierId?: CarrierId;
  title: string;
  statusLabel: string;
  disclosure: DisclosureKind;
}

export interface PerformanceView {
  carrierId?: CarrierId;
  onTimeLabel: string;
  safetyLabel: string;
  note: string;
  disclosure: DisclosureKind;
}

export interface TimelineEvent {
  id: string;
  carrierId?: CarrierId;
  whenLabel: string;
  title: string;
  detail: string;
  disclosure: DisclosureKind;
}

export interface AssistantTurn {
  id: string;
  role: 'driver' | 'assistant';
  text: string;
  disclosure: DisclosureKind;
}

export interface DriverDataSource {
  mode: DriverExperienceMode;
  getMissionControl(): MissionControlViewModel;
  getLoads(): LoadListItem[];
  getPaySummary(): PaySummaryView;
  getCaptureModules(): CaptureModuleInfo[];
  getMessages(): MessageItem[];
  getTruckStatus(): TruckStatusView;
  getSafetyStatus(): SafetyStatusView;
  getHomeTime(): HomeTimeRequestView;
  getBenefits(): BenefitItem[];
  getDocuments(): DocumentItem[];
  getPerformance(): PerformanceView;
  getTimeline(): TimelineEvent[];
  getAssistantThread(): AssistantTurn[];
}

export interface DriverActionPort {
  mode: DriverExperienceMode;
  submitPodSimulated?(): Promise<ShowcaseActionResult>;
  submitReceiptSimulated?(): Promise<ShowcaseActionResult>;
  acknowledgeMessage?(messageId: string): Promise<ShowcaseActionResult>;
  requestHomeTime?(): Promise<ShowcaseActionResult>;
  requestMaintenance?(): Promise<ShowcaseActionResult>;
  completeTraining?(): Promise<ShowcaseActionResult>;
  inquirePayroll?(): Promise<ShowcaseActionResult>;
  askAssistant?(prompt: string): Promise<ShowcaseActionResult>;
}

export interface ShowcaseSelection {
  carrierId: CarrierId;
  personaRole: ShowcasePersonaRole;
  personaId: string;
  scenarioId: ScenarioId;
}
