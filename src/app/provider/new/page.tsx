// src/app/provider/new/page.tsx
import { cookies } from 'next/headers';
import { verifyEditToken } from '@/lib/magic';
import ProviderNewForm from '@/components/ProviderNewForm';

export default async function NewProviderPage() {
  const c = await cookies();
  const token = c.get('edit_token')?.value;

  if (!token) {
    return (
      <main className="py-4">
        <div className="container">
          <h1 className="h3 fw-bold mb-2">Стать исполнителем</h1>
          <p className="text-secondary">Чтобы добавить профиль, войдите по email.</p>
          <button
            className="btn btn-primary"
            type="button"
            data-bs-toggle="modal"
            data-bs-target="#loginModal"
          >
            <i className="bi bi-box-arrow-in-right me-1" />
            Войти
          </button>
        </div>
      </main>
    );
  }

  // валидируем токен (срок/подпись)
  try {
    await verifyEditToken(token);
  } catch {
    return (
      <main className="py-4">
        <div className="container">
          <h1 className="h3 fw-bold mb-2">Сессия истекла</h1>
          <p className="text-secondary">Войдите снова по email.</p>
          <button
            className="btn btn-primary"
            type="button"
            data-bs-toggle="modal"
            data-bs-target="#loginModal"
          >
            Войти
          </button>
        </div>
      </main>
    );
  }

  // токен ок — показываем форму добавления
  return <ProviderNewForm />;
}
