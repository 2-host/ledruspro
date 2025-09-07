'use client';

import { useEffect, useState } from 'react';
import { getFavorites } from '@/lib/favorites';

export default function FavoriteNavLink() {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    // читаем избранные из localStorage
    setCount(getFavorites().length);

    // слушаем изменения между вкладками
    const onStorage = () => setCount(getFavorites().length);
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <a className="nav-link link-muted position-relative" href="/favorites">
      <i className="bi bi-heart me-1"></i> Избранные
      {count > 0 && (
        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
          {count}
        </span>
      )}
    </a>
  );
}
