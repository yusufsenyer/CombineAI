import { PackageKey } from '../api/types';

// UI-only mirror of backend `User::PACKAGE_LIMITS`. The backend remains authoritative;
// these values are used to drive proactive UI states (disabled CTAs, upgrade modals).
export const PACKAGE_LIMITS: Record<
  PackageKey,
  { wardrobe_items: number | null; daily_outfits: number | null; outfits_per_run: number; monthly_tryon: number | null }
> = {
  free: { wardrobe_items: 5, daily_outfits: 3, outfits_per_run: 2, monthly_tryon: 0 },
  plus: { wardrobe_items: null, daily_outfits: null, outfits_per_run: 4, monthly_tryon: 20 },
  pro: { wardrobe_items: null, daily_outfits: null, outfits_per_run: 6, monthly_tryon: null },
};

export const FREE_WARDROBE_LIMIT = 5;
