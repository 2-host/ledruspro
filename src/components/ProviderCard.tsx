'use client';

import FavoriteButton from './FavoriteButton';

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

export default function ProviderCard({ p }: { p: Provider }) {
  const truncate = (s: string, max: number) => (s.length > max ? s.slice(0, max) + '…' : s);

  return (
    <div className="col-md-6">
      <div className="card-modern p-3 h-100">
        <div className="d-flex align-items-center mb-3">
          <img
            className="avatar me-3"
            src={p.avatarUrl || `https://picsum.photos/seed/ava${p.id}/140`}
            alt={p.name}
          />
          <div>
            <div className="fw-semibold">{p.name}</div>
            <div className="small text-secondary">
              <i className="bi bi-geo-alt me-1" />
              {p.city || '—'}
              {p.services.length > 0 && (
                <>
                  {' '}• от{' '}
                  {p.services[0].priceFrom
                    ? p.services[0].priceFrom.toLocaleString('ru-RU')
                    : '—'} ₽
                </>
              )}
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap mt-1">
              {p.passportVerified && (
                <span className="badge bg-success-subtle text-success border">
                  <i className="bi bi-shield-check me-1" /> Паспорт проверен
                </span>
              )}
              {p.worksByContract && (
                <span className="badge bg-primary-subtle text-primary border">
                  <i className="bi bi-file-earmark-text me-1" /> По договору
                </span>
              )}
            </div>
            {p.about && <div className="small text-muted mt-2">{truncate(p.about, 120)}</div>}
          </div>
        </div>

        <ul className="list-unstyled small text-secondary mb-3">
          {(p.services || []).slice(0, 3).map(s => (
            <li key={s.id}>
              <i className="bi bi-check2-circle me-2 text-success" />
              {s.name}
              {s.priceFrom ? ` — от ${s.priceFrom.toLocaleString('ru-RU')} ₽` : ''}
            </li>
          ))}
        </ul>

        <div className="d-flex align-items-center gap-2">
          <a href={`/provider/${p.id}`} className="btn btn-primary flex-grow-1">
            Смотреть профиль
          </a>
          <FavoriteButton
            provider={{ id: p.id, name: p.name, avatarUrl: p.avatarUrl, city: p.city }}
          />
        </div>
      </div>
    </div>
  );
}
