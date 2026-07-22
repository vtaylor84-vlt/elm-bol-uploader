import type { MissionControlViewModel } from '../../types/missionControl.ts';
import type {
  CarrierId,
  DisclosureKind,
  ScenarioId,
  ShowcaseActionResult,
  ShowcasePersonaRole,
} from '../../types/showcase.ts';

export type DriverExperienceMode = 'production' | 'showcase';

export type LoadBucket = 'current' | 'upcoming' | 'completed';

export interface CaptureModuleInfo {
  id: string;
  title: string;
  description: string;
  href: string;
  capability: 'LIVE' | 'DEMONSTRATION' | 'FUTURE' | 'SIMULATED ACTION';
  /** Required for current haul, optional, or informational. */
  priority?: 'required' | 'optional' | 'available';
  contextLabel?: string;
  recentStatusLabel?: string;
  guidanceLabel?: string;
}

export interface LoadStopView {
  id: string;
  sequence: number;
  kind: 'pickup' | 'delivery' | 'warehouse' | 'other';
  locationLabel: string;
  appointmentLabel: string;
  statusLabel: string;
  state: 'done' | 'active' | 'upcoming';
}

export interface LoadListItem {
  id: string;
  carrierId?: CarrierId;
  loadNum: string;
  origin: string;
  destination: string;
  statusLabel: string;
  disclosure?: DisclosureKind;
  bucket?: LoadBucket;
  milesLabel?: string;
  stopCount?: number;
  appointmentLabel?: string;
  documentsLabel?: string;
  earningsEstimateLabel?: string;
  dispatcherLabel?: string;
  instructions?: string;
  stops?: LoadStopView[];
  documentRequirements?: string[];
}

export interface PayLineItem {
  id: string;
  category: 'trip' | 'reimbursement' | 'deduction' | 'escrow' | 'savings' | 'bonus' | 'other';
  label: string;
  amountLabel: string;
  statusLabel: string;
  relatedLoadNum?: string;
}

export interface SettlementHistoryItem {
  id: string;
  periodLabel: string;
  netLabel: string;
  statusLabel: 'estimated' | 'processing' | 'approved' | 'paid';
}

export interface PaySummaryView {
  disclosure: DisclosureKind;
  periodLabel: string;
  grossLabel: string;
  deductionsLabel: string;
  netLabel: string;
  note: string;
  estimatedEarningsLabel?: string;
  reimbursementsPendingLabel?: string;
  escrowBalanceLabel?: string;
  savingsBalanceLabel?: string;
  ytdLabel?: string;
  payrollStatusLabel?: string;
  timelineSteps?: { id: string; label: string; state: 'done' | 'active' | 'upcoming' }[];
  lineItems?: PayLineItem[];
  history?: SettlementHistoryItem[];
}

export type MessageCategory = 'dispatch' | 'payroll' | 'safety' | 'maintenance' | 'announcement';

export interface MessageItem {
  id: string;
  carrierId?: CarrierId;
  from: string;
  subject: string;
  preview: string;
  unread: boolean;
  disclosure: DisclosureKind;
  category?: MessageCategory;
  priority?: 'normal' | 'high' | 'urgent';
  ackRequired?: boolean;
  body?: string;
  relatedLoadNum?: string;
  relatedEquipment?: string;
  hasAttachment?: boolean;
}

export interface EquipmentDefect {
  id: string;
  label: string;
  severity: 'minor' | 'major' | 'critical';
  statusLabel: string;
}

export interface TruckStatusView {
  /** Present only when branded from the active carrier configuration. */
  carrierId?: CarrierId;
  truckNumber: string;
  trailerNumber: string;
  statusLabel: string;
  nextServiceLabel: string;
  disclosure: DisclosureKind;
  odometerLabel?: string;
  fuelLevelLabel?: string;
  dvirStatusLabel?: string;
  makeModelLabel?: string;
  defects?: EquipmentDefect[];
  maintenanceDueLabel?: string;
  roadsideLabel?: string;
  documentLabels?: string[];
}

export interface CredentialItem {
  id: string;
  title: string;
  statusLabel: string;
  expiresLabel?: string;
  urgency?: 'ok' | 'soon' | 'expired';
}

export interface SafetyStatusView {
  carrierId?: CarrierId;
  scoreLabel: string;
  openItems: string[];
  disclosure: DisclosureKind;
  hosDriveRemainingLabel?: string;
  hosShiftRemainingLabel?: string;
  credentials?: CredentialItem[];
  trainingDueLabel?: string;
  inspectionHistoryLabel?: string;
  trendNote?: string;
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

export type NotificationPriority = 'critical' | 'action' | 'info';

export interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  unread: boolean;
  priority: NotificationPriority;
  category: string;
  href?: string;
  whenLabel: string;
  disclosure: DisclosureKind;
}

export type SearchResultKind = 'load' | 'document' | 'message' | 'pay' | 'resource';

export interface SearchResultItem {
  id: string;
  kind: SearchResultKind;
  title: string;
  subtitle: string;
  href: string;
  disclosure: DisclosureKind;
}

export interface MoreMenuGroup {
  id: string;
  title: string;
  items: { id: string; label: string; detail: string; href: string }[];
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
  getNotifications?(): NotificationItem[];
  getSearchIndex?(): SearchResultItem[];
  getMoreMenu?(): MoreMenuGroup[];
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
  reportPayQuestion?(): Promise<ShowcaseActionResult>;
  markNotificationRead?(notificationId: string): Promise<ShowcaseActionResult>;
}

export interface ShowcaseSelection {
  carrierId: CarrierId;
  personaRole: ShowcasePersonaRole;
  personaId: string;
  scenarioId: ScenarioId;
}
