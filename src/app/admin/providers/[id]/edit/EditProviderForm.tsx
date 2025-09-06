// src/app/admin/providers/[id]/edit/EditProviderForm.tsx
'use client';

type Initial = {
  name: string;
  slug: string;
  title: string;
  city: string;
  priceFrom: number | string;
  rating: number | string;
  reviewsCount: number;
  isVerified: boolean | null;
  passportVerified: boolean;
  worksByContract: boolean;
  experienceYears: number;
  ownerEmail: string;
  website: string;
  phone: string;
  about: string;
  avatarUrl: string;
  categoryIds: number[];
};

export default function EditProviderForm({
  id,
  initial,
  categories,
}: {
  id: number;
  initial: Initial;
  categories: { id: number; name: string }[];
}) {
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const payload: any = Object.fromEntries(fd.entries());

    // числа
    payload.priceFrom = payload.priceFrom === '' ? null : Number(payload.priceFrom);
    payload.rating = payload.rating === '' ? null : Number(payload.rating);
    payload.reviewsCount = payload.reviewsCount === '' ? null : Math.max(0, Number(payload.reviewsCount));
    payload.experienceYears = payload.experienceYears === '' ? null : Math.max(0, Math.min(60, Number(payload.experienceYears)));

    // чекбоксы
    payload.isVerified = fd.get('isVerified') != null;
    payload.passportVerified = fd.get('passportVerified') != null;
    payload.worksByContract = fd.get('worksByContract') != null;

    // мульти значения
    payload.categoryIds = fd.getAll('categoryIds').map((v) => Number(v));

    const res = await fetch(`/api/providers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      alert('Сохранено');
      console.log('Updated provider:', data);
    } else {
      alert(`Ошибка: ${data.error || res.statusText}`);
      console.error(data);
    }
  }

  return (
    <form className="row g-3" onSubmit={onSubmit}>
      <div className="col-md-6">
        <label className="form-label">Имя*</label>
        <input name="name" defaultValue={initial.name} required className="form-control" />
      </div>
      <div className="col-md-6">
        <label className="form-label">Slug</label>
        <input name="slug" defaultValue={initial.slug} className="form-control" />
      </div>

      <div className="col-md-6">
        <label className="form-label">Заголовок</label>
        <input name="title" defaultValue={initial.title} className="form-control" />
      </div>
      <div className="col-md-3">
        <label className="form-label">Город</label>
        <input name="city" defaultValue={initial.city} className="form-control" />
      </div>
      <div className="col-md-3">
        <label className="form-label">Прайс от</label>
        <input name="priceFrom" type="number" min={0} defaultValue={initial.priceFrom} className="form-control" />
      </div>

      <div className="col-md-3">
        <label className="form-label">Рейтинг</label>
        <input name="rating" type="number" step="0.1" min={0} max={5} defaultValue={initial.rating} className="form-control" />
      </div>
      <div className="col-md-3">
        <label className="form-label">Отзывы (шт.)</label>
        <input name="reviewsCount" type="number" min={0} defaultValue={initial.reviewsCount} className="form-control" />
      </div>
      <div className="col-md-3">
        <label className="form-label">Опыт (лет)</label>
        <input name="experienceYears" type="number" min={0} max={60} defaultValue={initial.experienceYears} className="form-control" />
      </div>

      <div className="col-md-3">
        <label className="form-label">Телефон</label>
        <input name="phone" defaultValue={initial.phone} className="form-control" />
      </div>
      <div className="col-md-6">
        <label className="form-label">Сайт</label>
        <input name="website" defaultValue={initial.website} className="form-control" />
      </div>
      <div className="col-md-6">
        <label className="form-label">Owner Email (админ)</label>
        <input name="ownerEmail" type="email" defaultValue={initial.ownerEmail} className="form-control" />
      </div>

      <div className="col-12">
        <label className="form-label">О себе</label>
        <textarea name="about" defaultValue={initial.about} className="form-control" rows={4} />
      </div>

      <div className="col-md-6">
        <label className="form-label">Avatar URL</label>
        <input name="avatarUrl" defaultValue={initial.avatarUrl} className="form-control" />
        <div className="form-text">Путь вида <code>/uploads/...</code>.</div>
      </div>

      {/* чекбоксы статусов */}
      <div className="col-md-6 d-flex align-items-center gap-4" style={{ paddingTop: '2rem' }}>
        <div className="form-check">
          <input className="form-check-input" type="checkbox" id="isVerified" name="isVerified" defaultChecked={!!initial.isVerified} />
          <label className="form-check-label" htmlFor="isVerified">Проверен (модератором)</label>
        </div>
        <div className="form-check">
          <input className="form-check-input" type="checkbox" id="passportVerified" name="passportVerified" defaultChecked={!!initial.passportVerified} />
          <label className="form-check-label" htmlFor="passportVerified">Паспорт проверен</label>
        </div>
        <div className="form-check">
          <input className="form-check-input" type="checkbox" id="worksByContract" name="worksByContract" defaultChecked={!!initial.worksByContract} />
          <label className="form-check-label" htmlFor="worksByContract">Работает по договору</label>
        </div>
      </div>

      <div className="col-12">
        <label className="form-label">Категории</label>
        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-2">
          {categories.map((c) => (
            <div className="col" key={c.id}>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`cat-${c.id}`}
                  name="categoryIds"
                  value={c.id}
                  defaultChecked={initial.categoryIds.includes(c.id)}
                />
                <label className="form-check-label" htmlFor={`cat-${c.id}`}>{c.name}</label>
              </div>
            </div>
          ))}
        </div>
        <div className="form-text">Можно выбрать несколько.</div>
      </div>

      <div className="col-12">
        <button type="submit" className="btn btn-primary">Сохранить</button>
      </div>
    </form>
  );
}
