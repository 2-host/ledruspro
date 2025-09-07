import FavoritesClient from '@/components/FavoritesClient';

export default function FavoritesPage() {
  return (
    <div className="container py-5">
      <h1 className="h3 mb-4">Избранные исполнители</h1>
      <FavoritesClient />
    </div>
  );
}
