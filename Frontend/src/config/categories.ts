import { BadgeTone } from '../components/Badge';
import { WardrobeCategory } from '../api/types';

export interface CategoryConfig {
  key: WardrobeCategory;
  label: string;
  tone: BadgeTone;
}

export const CATEGORIES: CategoryConfig[] = [
  { key: 'top', label: 'Üst', tone: 'blue' },
  { key: 'bottom', label: 'Alt', tone: 'green' },
  { key: 'shoes', label: 'Ayakkabı', tone: 'yellow' },
  { key: 'accessory', label: 'Aksesuar', tone: 'red' },
];

export function categoryLabel(key: string): string {
  return CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

export function categoryTone(key: string): BadgeTone {
  return CATEGORIES.find((c) => c.key === key)?.tone ?? 'neutral';
}
