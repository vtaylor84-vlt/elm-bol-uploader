/**
 * Showcase actions — fixture/simulation only.
 * Must never import production upload, vault, or Netlify upload clients.
 */
import type { ShowcaseActionResult } from '../../types/showcase.ts';
import type { DriverActionPort } from './types.ts';

function ok(message: string, simulatedId?: string): ShowcaseActionResult {
  return {
    success: true,
    message,
    disclosure: 'SIMULATED ACTION',
    simulatedId: simulatedId || `sim-${Date.now().toString(36)}`,
  };
}

export function createShowcaseDriverActionPort(): DriverActionPort {
  return {
    mode: 'showcase',
    async submitPodSimulated() {
      return ok('Simulated POD submission recorded in Showcase only.');
    },
    async submitReceiptSimulated() {
      return ok('Simulated expense receipt recorded in Showcase only.');
    },
    async acknowledgeMessage(messageId: string) {
      return ok(`Simulated acknowledgement for ${messageId}.`);
    },
    async requestHomeTime() {
      return ok('Simulated home-time request submitted.');
    },
    async requestMaintenance() {
      return ok('Simulated maintenance request submitted.');
    },
    async completeTraining() {
      return ok('Simulated training marked complete.');
    },
    async inquirePayroll() {
      return ok('Simulated payroll inquiry sent to demo dispatch.');
    },
    async askAssistant(prompt: string) {
      const clipped = String(prompt || '').trim().slice(0, 120) || 'your question';
      return ok(`Simulated assistant reply about “${clipped}”. NOT CONNECTED TO PRODUCTION.`);
    },
  };
}
