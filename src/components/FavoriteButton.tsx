'use client';

import { useEffect, useState } from 'react';
import { addFavorite, removeFavorite, isFavorite, Favorite } from '@/lib/favorites';

export default function FavoriteButton({ provider }: { provider: Favorite }) {
  const [fav, setFav] = useState(false);

  useEffect(() => { setFav(isFavorite(provider.id)); }, [provider.id]);

  const toggle = () => {
    if (fav) { removeFavorite(provider.id); setFav(false); }
    else { addFavorite(provider); setFav(true); }
  };

  return (
    <button type="button" className={`btn ${fav ? 'btn-danger' : 'btn-outline-secondary'}`} onClick={toggle}>
      <i className={`bi ${fav ? 'bi-heart-fill' : 'bi-heart'}`} />
    </button>
  );
}
