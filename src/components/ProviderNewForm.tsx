// src/components/ProviderNewForm.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type ServiceRow = { name: string; priceFrom?: number | ''; unit?: string; desc?: string };
type PortfolioItem = { title: string; file?: File | null };
type Category = { id: number; name: string; slug: string };

export default function ProviderNewForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [type, setType] = useState<'company'|'individual'>('company');
  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [about, setAbout] = useState('');
  const [experienceYears, setExperienceYears] = useState<number | ''>('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);

  const [services, setServices] = useState<ServiceRow[]>([
    { name: 'Консультация', priceFrom: 2000, unit: 'час', desc: 'Выезд и первичный расчёт' },
  ]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([{ title: 'Проект #1', file: null }]);

  const [cats, setCats] = useState<Category[]>([]);
  const [selectedCatIds, setSelectedCatIds] = useState<number[]>([]);

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then((data: Category[]) => setCats(data))
      .catch(() => setCats([]));
  }, []);

  const toggleCat = (id: number) =>
    setSelectedCatIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  const addService = () => setServices(s => [...s, { name: '', priceFrom: '', unit: 'проект', desc: '' }]);
  const removeService = (idx: number) => setServices(s => s.filter((_, i) => i !== idx));
  const updateService = (idx: number, patch: Partial<ServiceRow>) =>
    setServices(s => s.map((row, i) => (i === idx ? { ...row, ...patch } : row)));

  const addPortfolio = () => setPortfolio(g => [...g, { title: '', file: null }]);
  const removePortfolio = (idx: number) => setPortfolio(g => g.filter((_, i) => i !== idx));
  const updatePortfolio = (idx: number, patch: Partial<PortfolioItem>) =>
    setPortfolio(g => g.map((row, i) => (i === idx ? { ...row, ...patch } : row)));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) return alert('Укажите название/ФИО');
    if (selectedCatIds.length === 0) return alert('Выберите хотя бы одну категорию');

    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append('type', type);
      fd.append('name', displayName.trim());
      fd.append('city', city.trim());
      if (experienceYears !== '') fd.append('experienceYears', String(experienceYears));
      fd.append('about', about.trim());
      fd.append('phone', phone.trim());
      fd.append('website', website.trim());
      if (avatar) fd.append('avatar', avatar);

      selectedCatIds.forEach(id => fd.append('categories', String(id)));

      fd.append('services', JSON.stringify(
        services
          .filter(s => s.name.trim())
          .map(s => ({
            name: s.name.trim(),
            priceFrom: s.priceFrom === '' ? null : Number(s.priceFrom),
            unit: s.unit || null,
            description: s.desc || null,
          }))
      ));

      portfolio.forEach((p, idx) => {
        if (p.file) fd.append('portfolioFiles', p.file, p.file.name);
        fd.append(`portfolioTitle_${idx}`, p.title || '');
      });

      const res = await fetch('/api/providers', { method: 'POST', body: fd });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || 'Не удалось сохранить');
      router.push(`/provider/${payload.id}`);
    } catch (err: any) {
      alert(err.message || 'Ошибка сохранения');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="subhero py-4">
        <div className="container">
          <h1 className="h3 fw-bold mb-1">Стать исполнителем</h1>
          <p className="text-secondary mb-0">Заполните профиль, добавьте услуги и примеры работ.</p>
        </div>
      </section>

      <main className="py-4">
        <div className="container">
          <form onSubmit={onSubmit}>
            <div className="row g-4">
              <div className="col-lg-8">
                {/* Профиль */}
                <div className="card-modern p-3 mb-3">
                  <h2 className="h5 mb-3">Профиль</h2>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Тип</label>
                      <select className="form-select" value={type} onChange={e=>setType(e.target.value as any)}>
                        <option value="company">Компания</option>
                        <option value="individual">Индивидуальный специалист</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Название/ФИО</label>
                      <input className="form-control" value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Например: Atelier Forma" required />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Город</label>
                      <input className="form-control" value={city} onChange={e=>setCity(e.target.value)} placeholder="Москва" />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Опыт (лет)</label>
                      <input
                        type="number"
                        min={0}
                        max={60}
                        className="form-control"
                        value={experienceYears}
                        onChange={e => {
                          const v = e.target.value === '' ? '' : Math.max(0, Math.min(60, Number(e.target.value)));
                          setExperienceYears(v);
                        }}
                        placeholder="Например: 7"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Телефон</label>
                      <input className="form-control" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+7 999 000-00-00" />
                    </div>

                    <div className="col-md-12">
                      <label className="form-label">Описание</label>
                      <textarea className="form-control" rows={3} value={about} onChange={e=>setAbout(e.target.value)} placeholder="Коротко о вас и подходе к работе" />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Сайт</label>
                      <input className="form-control" value={website} onChange={e=>setWebsite(e.target.value)} placeholder="https://..." />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Аватар</label>
                      <input className="form-control" type="file" accept="image/*" onChange={e=>setAvatar(e.target.files?.[0] || null)} />
                    </div>
                  </div>
                </div>

                {/* Категории */}
                <div className="card-modern p-3 mb-3">
                  <h2 className="h6 mb-2">Категории</h2>
                  <div className="row">
                    {cats.map(c => (
                      <div className="col-sm-6 col-md-4" key={c.id}>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`cat-${c.id}`}
                            checked={selectedCatIds.includes(c.id)}
                            onChange={() => toggleCat(c.id)}
                          />
                          <label className="form-check-label" htmlFor={`cat-${c.id}`}>{c.name}</label>
                        </div>
                      </div>
                    ))}
                    {cats.length === 0 && <div className="text-secondary px-2">Категории не найдены</div>}
                  </div>
                  <div className="form-text">Можно выбрать несколько.</div>
                </div>

                {/* Услуги */}
                <div className="card-modern p-3 mb-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <h2 className="h5 mb-0">Услуги и цены</h2>
                    <button type="button" onClick={addService} className="btn btn-outline-primary btn-sm">
                      <i className="bi bi-plus-lg" /> Добавить услугу
                    </button>
                  </div>
                  <div className="table-responsive mt-2">
                    <table className="table align-middle">
                      <thead className="small text-secondary">
                        <tr>
                          <th>Услуга</th>
                          <th className="text-nowrap">Цена от</th>
                          <th className="text-nowrap">Ед.</th>
                          <th>Описание</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {services.map((s, idx) => (
                          <tr key={idx}>
                            <td style={{minWidth:220}}>
                              <input className="form-control"
                                     value={s.name}
                                     onChange={e=>updateService(idx,{name:e.target.value})}
                                     placeholder="Например: Проект освещения" />
                            </td>
                            <td style={{maxWidth:140}}>
                              <input type="number" min={0} className="form-control"
                                     value={s.priceFrom ?? ''}
                                     onChange={e=>updateService(idx,{priceFrom:e.target.value === '' ? '' : Number(e.target.value)})}
                                     placeholder="0" />
                            </td>
                            <td style={{maxWidth:140}}>
                              <select className="form-select" value={s.unit || 'проект'} onChange={e=>updateService(idx,{unit:e.target.value})}>
                                <option>проект</option>
                                <option>час</option>
                                <option>м²</option>
                                <option>шт</option>
                              </select>
                            </td>
                            <td>
                              <input className="form-control"
                                     value={s.desc || ''}
                                     onChange={e=>updateService(idx,{desc:e.target.value})}
                                     placeholder="Короткое описание" />
                            </td>
                            <td className="text-end">
                              <button type="button" className="btn btn-outline-danger btn-sm" onClick={()=>removeService(idx)}>
                                <i className="bi bi-trash" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {services.length === 0 && (
                          <tr><td colSpan={5} className="text-secondary">Добавьте хотя бы одну услугу</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Портфолио */}
                <div className="card-modern p-3 mb-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <h2 className="h5 mb-0">Портфолио</h2>
                    <button type="button" onClick={addPortfolio} className="btn btn-outline-primary btn-sm">
                      <i className="bi bi-plus-lg" /> Добавить проект
                    </button>
                  </div>
                  <div className="row g-3 mt-1">
                    {portfolio.map((p, idx) => (
                      <div className="col-md-6" key={idx}>
                        <div className="card-modern p-2">
                          <div className="ratio ratio-4x3 rounded overflow-hidden mb-2">
                            <img
                              src={p.file ? URL.createObjectURL(p.file) : 'https://images.unsplash.com/photo-1615870216515-4f0f1a9d1d5c?q=80&w=800&auto=format&fit=crop'}
                              className="w-100 h-100 object-fit-cover"
                              alt="preview"
                            />
                          </div>
                          <input
                            className="form-control form-control-sm mb-2"
                            value={p.title}
                            onChange={e=>updatePortfolio(idx,{title:e.target.value})}
                            placeholder="Название проекта"
                          />
                          <input
                            type="file"
                            accept="image/*"
                            className="form-control form-control-sm"
                            onChange={e=>updatePortfolio(idx,{file:e.target.files?.[0]||null})}
                          />
                          <div className="text-end mt-2">
                            <button type="button" className="btn btn-outline-danger btn-sm" onClick={()=>removePortfolio(idx)}>
                              <i className="bi bi-trash" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {portfolio.length === 0 && <div className="text-secondary">Добавьте хотя бы одно изображение</div>}
                  </div>
                </div>

                <div className="d-grid">
                  <button className="btn btn-success" type="submit" disabled={submitting}>
                    {submitting ? 'Сохраняем...' : <><i className="bi bi-rocket-takeoff me-1" /> Опубликовать</>}
                  </button>
                </div>
              </div>

              {/* Превью / сайдбар */}
              <aside className="col-lg-4">
                <div className="card-modern p-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="ratio ratio-1x1" style={{width:72}}>
                      <img
                        src={avatar ? URL.createObjectURL(avatar) : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&h=200&auto=format&fit=crop'}
                        className="w-100 h-100 rounded-circle object-fit-cover"
                        alt="avatar"
                      />
                    </div>
                    <div>
                      <div className="fw-semibold">{displayName || 'Название студии'}</div>
                      <div className="small text-secondary">
                        <i className="bi bi-geo-alt me-1" /> {city || 'Город'}
                      </div>
                    </div>
                    <span className="ms-auto badge badge-soft">
                      {type === 'company' ? 'Компания' : 'Специалист'}
                    </span>
                  </div>
                  <p className="small text-secondary mt-2 mb-1">{about || 'Краткое описание появится здесь.'}</p>
                  <div className="small text-secondary">
                    {phone && <div><i className="bi bi-telephone me-1" /> {phone}</div>}
                    {website && <div><i className="bi bi-globe me-1" /> {website}</div>}
                  </div>
                </div>
              </aside>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
