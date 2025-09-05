// src/components/NewProviderNav.tsx
import { cookies } from 'next/headers';
import { verifyAuthToken } from '@/lib/magic';

export default async function NewProviderNav() {
  const c = await cookies();
  const token = c.get('auth_token')?.value;
  if (!token) {
    // не вошёл — показываем «Войти»
    return (
      <button className="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#loginModal">
        <i className="bi bi-box-arrow-in-right me-1" /> Войти
      </button>
    );
  }
  try {
    await verifyAuthToken(token);
  } catch {
    return (
      <button className="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#loginModal">
        <i className="bi bi-box-arrow-in-right me-1" /> Войти
      </button>
    );
  }
  // вошёл — даём ссылку на создание
  return (
    <a className="btn btn-primary" href="/provider/new">
      <i className="bi bi-building-add me-1"></i> Стать исполнителем
    </a>
  );
}
