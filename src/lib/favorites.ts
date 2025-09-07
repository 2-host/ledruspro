export type Favorite = { id: number; name: string; avatarUrl?: string | null; city?: string | null };
const KEY = 'favorites';

export function getFavorites(): Favorite[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

export function addFavorite(fav: Favorite) {
  const items = getFavorites();
  if (!items.find(i => i.id === fav.id)) {
    localStorage.setItem(KEY, JSON.stringify([...items, fav]));
    window.dispatchEvent(new Event('storage'));
  }
}

export function removeFavorite(id: number) {
  localStorage.setItem(KEY, JSON.stringify(getFavorites().filter(i => i.id !== id)));
  window.dispatchEvent(new Event('storage'));
}

export function isFavorite(id: number) {
  return getFavorites().some(i => i.id === id);
}
