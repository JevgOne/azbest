import { ecomailRequest } from './client';

export async function getCampaigns() {
  return ecomailRequest<any>('/campaigns');
}

export async function getCampaignStats(campaignId: string) {
  return ecomailRequest<any>(`/campaigns/${campaignId}/stats`);
}

export async function createCampaign(data: { name: string; subject: string; from_name: string; from_email: string; html_body: string }) {
  return ecomailRequest<any>('/campaigns', { method: 'POST', body: data });
}
