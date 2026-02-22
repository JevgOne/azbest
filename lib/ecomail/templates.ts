import { ecomailRequest } from './client';

export async function getTemplates() {
  return ecomailRequest<any>('/templates');
}
