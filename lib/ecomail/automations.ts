import { ecomailRequest } from './client';

export async function getAutomations() {
  return ecomailRequest<any>('/automations');
}

export async function getAutomationStats(automationId: string) {
  return ecomailRequest<any>(`/automations/${automationId}/stats`);
}
