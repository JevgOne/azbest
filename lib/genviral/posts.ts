import { genviralRequest } from './client';
import type { GenViralPost, GenViralPostCreateRequest, GenViralPostUpdateRequest } from '@/types/genviral';

export async function createPost(data: GenViralPostCreateRequest): Promise<GenViralPost> {
  return genviralRequest<GenViralPost>('/posts', {
    method: 'POST',
    body: {
      ...data,
      metadata: { source: 'partner_api', app: 'qsport-marketing', ...(data.metadata || {}) },
    },
  });
}

export async function getPosts(params?: Record<string, string>): Promise<{ data: GenViralPost[]; total: number }> {
  return genviralRequest<{ data: GenViralPost[]; total: number }>('/posts', { params: params || {} });
}

export async function getPost(id: string): Promise<GenViralPost> {
  return genviralRequest<GenViralPost>(`/posts/${id}`);
}

export async function updatePost(id: string, data: GenViralPostUpdateRequest): Promise<GenViralPost> {
  return genviralRequest<GenViralPost>(`/posts/${id}`, {
    method: 'PATCH',
    body: data,
  });
}

export async function retryFailedPosts(postIds: string[]): Promise<{ retried: number }> {
  return genviralRequest<{ retried: number }>('/posts/retry', {
    method: 'POST',
    body: { post_ids: postIds },
  });
}
