'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function AdminLoginPage() {
  const qp = useSearchParams();
  const from = qp.get('from') || '/admin';

  const [login, setLogin] = useState('');
  const [pass, setPass]   = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: login.trim(), pass: pass.trim(), from }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data?.error || 'Не удалось войти');
        return;
      }
      window.location.href = data.redirectTo || from || '/admin';
    } catch (e: any) {
      setErr(e?.message || 'Ошибка запроса');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container py-5" style={{ maxWidth: 520 }}>
      <h1 className="h3 mb-4">Вход в админку</h1>
      <form onSubmit={onSubmit} className="vstack gap-3">
        {err && <div className="alert alert-danger py-2">{err}</div>}

        <div>
          <label className="form-label">Логин</label>
          <input
            className="form-control"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            autoComplete="username"
            required
          />
        </div>

        <div>
          <label className="form-label">Пароль</label>
          <input
            type="password"
            className="form-control"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <button className="btn btn-primary" disabled={loading}>
          {loading ? 'Проверяем…' : 'Войти'}
        </button>

        <div className="form-text">
          После входа вернёмся на: <code>{from}</code>
        </div>
      </form>
    </main>
  );
}
