'use client';

import { useEffect, useState } from 'react';
import { getFavorites } from '@/lib/favorites';
import ProviderCard from './ProviderCard';

type Service = { id: number; name: string; priceFrom: number | null };
type Provider = {
  id: number;
  name: string;
  city: string | null;
  about?: string | null;
  avatarUrl: string | null;
  passportVerified: boolean;
  worksByContract: boolean;
  services: Service[];
};

export default function FavoritesClient() {
  const [providers, setProviders] = useState<Provider[] | null>(null);

  const load = async () => {
    const favs = getFavorites();          // [{id, name, ...}] — локально
    const ids = favs.map(f => f.id);
    if (ids.length === 0) {
      setProviders([]);
      return;
    }
    const res = await fetch(`/api/favorites?ids=${ids.join(',')}`, { cache: 'no-store' });
    const data: Provider[] = await res.json();
    setProviders(data);
  };

  useEffect(() => {
    load();
    // обновляем при изменениях в избранном (и между вкладками)
    const onStorage = () => load();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (providers === null) {
    return <div className="text-secondary">Загрузка…</div>;
  }

  if (providers.length === 0) {
    return <p className="text-secondary">Нет избранных исполнителей.</p>;
  }

  return (
    <div className="row g-4">
      {providers.map(p => (
        <ProviderCard key={p.id} p={p} />
      ))}
    </div>
  );
}
