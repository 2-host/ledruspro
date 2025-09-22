// src/components/ProviderNewForm.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type ServiceRow = { name: string; priceFrom?: number | ''; unit?: string; desc?: string };
type CategoryNode = { id: number; name: string; slug: string; fullSlug?: string; children?: CategoryNode[] };
type Project = { title: string; files: File[] };

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

  // 🔥 Новая структура проектов: на каждый проект — массив файлов
  const [projects, setProjects] = useState<Project[]>([{ title: 'Проект #1', files: [] }]);

  const [cats, setCats] = useState<CategoryNode[]>([]);
  const [selectedCatIds, setSelectedCatIds] = useState<number[]>([]);

  useEffect(() => {
  fetch('/api/categories')
    .then(r => r.json())
    .then((data: CategoryNode[]) => setCats(data))
    .catch(() => setCats([]));
  }, []);

  const toggleCat = (id: number) =>
    setSelectedCatIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const addService = () => setServices(s => [...s, { name: '', priceFrom: '', unit: 'проект', desc: '' }]);
  const removeService = (idx: number) => setServices(s => s.filter((_, i) => i !== idx));
  const updateService = (idx: number, patch: Partial<ServiceRow>) =>
    setServices(s => s.map((row, i) => (i === idx ? { ...row, ...patch } : row)));

  // ==== Проекты ====
  const addProject = () => setProjects(p => [...p, { title: `Проект #${p.length + 1}`, files: [] }]);
  const removeProject = (idx: number) => setProjects(p => p.filter((_, i) => i !== idx));
  const updateProjectTitle = (idx: number, title: string) =>
    setProjects(p => p.map((row, i) => (i === idx ? { ...row, title } : row)));

  // Мульти-загрузка файлов
  const addFilesToProject = (idx: number, filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;
    const files = Array.from(filesList);
    setProjects(p => p.map((row, i) => (i === idx ? { ...row, files: [...row.files, ...files] } : row)));
  };

  const removeFileFromProject = (idx: number, fileIndex: number) => {
    setProjects(p => p.map((row, i) => {
      if (i !== idx) return row;
      const next = [...row.files];
      next.splice(fileIndex, 1);
      return { ...row, files: next };
    }));
  };

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

      // 🔥 Главное: массовая отправка по проектам
      // Формат: projectTitle_<i>, projectFiles_<i> (несколько файлов)
      projects.forEach((proj, i) => {
        fd.append(`projectTitle_${i}`, proj.title || `Проект #${i+1}`);
        for (const file of proj.files) {
          fd.append(`projectFiles_${i}`, file, file.name);
        }
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
                        type="number" min={0} max={60} className="form-control"
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

  <div className="vstack gap-2">
    {cats.map((root) => (
      <div key={root.id}>
        {/* Корневая категория */}
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id={`cat-${root.id}`}
            checked={selectedCatIds.includes(root.id)}
            onChange={() => toggleCat(root.id)}
          />
          <label className="form-check-label fw-semibold" htmlFor={`cat-${root.id}`}>
            {root.name}
          </label>
        </div>

        {/* Дети второго уровня */}
        {root.children && root.children.length > 0 && (
          <div className="ms-4 mt-1">
            {root.children.map((child) => (
              <div className="form-check" key={child.id}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`cat-${child.id}`}
                  checked={selectedCatIds.includes(child.id)}
                  onChange={() => toggleCat(child.id)}
                />
                <label className="form-check-label" htmlFor={`cat-${child.id}`}>
                  {child.name}
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    ))}

    {cats.length === 0 && <div className="text-secondary px-2">Категории не найдены</div>}
  </div>

  <div className="form-text">Можно выбрать несколько (как родительские, так и подкатегории).</div>
</div>

                {/* Услуги */}
                {/* Услуги */}
<div className="card-modern p-3 mb-3">
  <div className="d-flex align-items-center justify-content-between">
    <h2 className="h5 mb-0">Услуги и цены</h2>
    <button type="button" onClick={addService} className="btn btn-outline-primary btn-sm">
      <i className="bi bi-plus-lg" /> Добавить услугу
    </button>
  </div>

  <div className="vstack gap-3 mt-3">
    {services.map((s, idx) => (
      <div key={idx} className="border rounded p-3">
        {/* Название */}
        <div className="mb-2">
          <label className="form-label small mb-1">Название услуги</label>
          <input
            className="form-control"
            value={s.name}
            onChange={e => updateService(idx, { name: e.target.value })}
            placeholder="Например: Проект освещения"
          />
        </div>

        {/* Цена и Единица */}
        <div className="row g-2 mb-2">
          <div className="col-sm-6 col-md-4">
            <label className="form-label small mb-1">Цена от</label>
            <input
              type="number"
              min={0}
              className="form-control"
              value={s.priceFrom ?? ''}
              onChange={e =>
                updateService(idx, {
                  priceFrom: e.target.value === '' ? '' : Number(e.target.value),
                })
              }
              placeholder="0"
            />
          </div>
          <div className="col-sm-6 col-md-4">
            <label className="form-label small mb-1">Единица</label>
            <select
              className="form-select"
              value={s.unit || 'проект'}
              onChange={e => updateService(idx, { unit: e.target.value })}
            >
              <option value="проект">проект</option>
              <option value="час">час</option>
              <option value="м²">м²</option>
              <option value="шт">шт</option>
            </select>
          </div>
          <div className="col-sm-12 col-md-4 d-flex align-items-end">
            <div className="ms-auto">
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={() => removeService(idx)}
              >
                <i className="bi bi-trash" /> Удалить
              </button>
            </div>
          </div>
        </div>

        {/* Большое описание */}
        <div>
          <label className="form-label small mb-1">Описание</label>
          <textarea
            className="form-control"
            rows={4} // 👈 больше места под текст
            value={s.desc || ''}
            onChange={e => updateService(idx, { desc: e.target.value })}
            placeholder="Коротко опишите, что входит в услугу (этапы, условия, что даёт клиенту)"
          />
        </div>
      </div>
    ))}

    {services.length === 0 && (
      <div className="text-secondary">Добавьте хотя бы одну услугу</div>
    )}
  </div>
</div>


                {/* 🔥 ПРОЕКТЫ с мультизагрузкой */}
                <div className="card-modern p-3 mb-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <h2 className="h5 mb-0">Проекты</h2>
                    <button type="button" onClick={addProject} className="btn btn-outline-primary btn-sm">
                      <i className="bi bi-plus-lg" /> Добавить проект
                    </button>
                  </div>

                  <div className="vstack gap-3 mt-2">
                    {projects.map((proj, idx) => (
                      <div key={idx} className="card-modern p-2">
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <input
                            className="form-control"
                            value={proj.title}
                            onChange={(e)=>updateProjectTitle(idx, e.target.value)}
                            placeholder={`Проект #${idx+1}`}
                          />
                          <button type="button" className="btn btn-outline-danger btn-sm" onClick={()=>removeProject(idx)}>
                            <i className="bi bi-trash" />
                          </button>
                        </div>

                        <div className="d-flex align-items-center gap-2 mb-2">
                          <label className="btn btn-outline-secondary btn-sm mb-0">
                            <i className="bi bi-upload me-1" />
                            Загрузить фото
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              hidden
                              onChange={e => addFilesToProject(idx, e.target.files)}
                            />
                          </label>
                          <div className="text-secondary small">
                            Можно выбрать сразу несколько изображений.
                          </div>
                        </div>

                        {proj.files.length > 0 ? (
                          <div className="row g-2">
                            {proj.files.map((file, fi) => (
                              <div className="col-6 col-md-4 col-lg-3" key={fi}>
                                <div className="position-relative">
                                  <div className="ratio ratio-4x3 rounded overflow-hidden">
                                    <img
                                      src={URL.createObjectURL(file)}
                                      className="w-100 h-100 object-fit-cover"
                                      alt={file.name}
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-danger position-absolute"
                                    style={{ top: 6, right: 6, borderRadius: 999 }}
                                    onClick={() => removeFileFromProject(idx, fi)}
                                    aria-label="Удалить"
                                    title="Удалить"
                                  >
                                    <i className="bi bi-x-lg" />
                                  </button>
                                </div>
                                <div className="small text-truncate mt-1">{file.name}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-secondary small">Фотографии не выбраны</div>
                        )}
                      </div>
                    ))}

                    {projects.length === 0 && (
                      <div className="text-secondary">Добавьте хотя бы один проект</div>
                    )}
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
