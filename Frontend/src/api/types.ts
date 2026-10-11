import { API_BASE_URL } from '../config/env';

export type PackageKey = 'free' | 'plus' | 'pro';

export interface User {
  id: number;
  email: string;
  name: string;
  onboarding_completed: boolean;
  package: PackageKey;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface Usage {
  daily_outfit: { used: number; limit: number | null };
  monthly_tryon: { used: number; limit: number | null };
}

export type WardrobeCategory = 'top' | 'bottom' | 'shoes' | 'accessory';

export interface WardrobeItem {
  id: number;
  category: WardrobeCategory;
  color: string;
  image_url: string | null;
  tagging_status: 'processing' | 'done' | 'failed';
}

export interface OutfitVisual {
  status: 'pending' | 'ready' | 'locked' | 'error';
  url: string | null;
  locked: boolean;
}

export interface Outfit {
  id: number;
  text_suggestion: string;
  item_ids: number[];
  item_images: string[];
  visual: OutfitVisual;
  created_at: string;
}

export interface GenerationJob {
  status: 'pending' | 'partial' | 'complete' | 'error';
  outfits: Outfit[];
}

export interface OnboardingQuestion {
  key: string;
  prompt: string;
  options: string[];
}

export interface SwipeCard {
  id: number;
  image_url: string;
  tags: string[];
}

export interface Package {
  id: number;
  key: PackageKey;
  name: string;
  price_placeholder: string;
  features: string[];
}

export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL}${url}`;
}
