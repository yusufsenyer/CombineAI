import { apiFetch } from './client';
import {
  AuthResponse,
  GenerationJob,
  OnboardingQuestion,
  Outfit,
  Package,
  SwipeCard,
  Usage,
  User,
  WardrobeItem,
} from './types';

export const authApi = {
  register: (email: string, password: string, name: string) =>
    apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),
  login: (email: string, password: string) =>
    apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: (refreshToken: string) =>
    apiFetch<void>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),
};

export const meApi = {
  get: () => apiFetch<User>('/me'),
  usage: () => apiFetch<Usage>('/me/usage'),
};

export const onboardingApi = {
  questions: () => apiFetch<OnboardingQuestion[]>('/onboarding/questions'),
  swipeCards: () => apiFetch<SwipeCard[]>('/onboarding/swipe_cards'),
  complete: (answers: { question_key: string; answer_value: string }[], swipes: { card_id: number; liked: boolean }[]) =>
    apiFetch<{ user: User }>('/onboarding/complete', {
      method: 'POST',
      body: JSON.stringify({ answers, swipes }),
    }),
};

export interface WardrobeImageFile {
  uri: string;
  fileName: string;
  mimeType: string;
}

export const wardrobeApi = {
  list: (category?: string) =>
    apiFetch<WardrobeItem[]>(`/wardrobe/items${category ? `?category=${category}` : ''}`),
  create: (image: WardrobeImageFile) => {
    const form = new FormData();
    form.append('image', {
      uri: image.uri,
      name: image.fileName,
      type: image.mimeType,
    } as unknown as Blob);
    if (__DEV__) {
      console.log(
        `[UPLOAD] FormData part: ${JSON.stringify({ uri: image.uri, name: image.fileName, type: image.mimeType })}`,
      );
    }
    // NOTE: no manual Content-Type header — fetch sets multipart/form-data with the boundary itself.
    return apiFetch<WardrobeItem>('/wardrobe/items', { method: 'POST', body: form });
  },
  update: (id: number, data: { category?: string; color?: string }) =>
    apiFetch<WardrobeItem>(`/wardrobe/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  remove: (id: number) => apiFetch<void>(`/wardrobe/items/${id}`, { method: 'DELETE' }),
};

export const outfitsApi = {
  generate: (itemIds: number[]) =>
    apiFetch<{ job_id: number }>('/outfits/generate', {
      method: 'POST',
      body: JSON.stringify({ item_ids: itemIds }),
    }),
  job: (jobId: number) => apiFetch<GenerationJob>(`/outfits/jobs/${jobId}`),
  list: (page = 1) => apiFetch<Outfit[]>(`/outfits?page=${page}`),
  detail: (id: number) => apiFetch<Outfit>(`/outfits/${id}`),
};

export const packagesApi = {
  list: () => apiFetch<Package[]>('/packages'),
  subscribe: (packageId: number) =>
    apiFetch<{ subscription: unknown; user: User }>('/subscriptions', {
      method: 'POST',
      body: JSON.stringify({ package_id: packageId }),
    }),
};
