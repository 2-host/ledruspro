'use client';

import { useState } from 'react';

type ServiceRow = { name: string; priceFrom?: number | ''; unit?: string; desc?: string };
type Category = { id: number; name: string; slug: string };
type Project = { id: number; title?: string | null; imageUrl: string };

export default function ProviderEditForm({ initial, allCategories }: { initial: any; allCategories: Category[] }) {
  const id = initial.id as number;

  const [submitting, setSubmitting] = useState(false);

  const [type, setType] = useState<'company'|'individual'>(initial.title === 'Студия / Компания' ? 'company' : 'individual');
  const [displayName, setDisplayName] = useState(initial.name || '');
  const [city, setCity] = useState(initial.city || '');
  const [about, setAbout] = useState(initial.about || '');
  const [experienceYears, setExperienceYears] = useState<number | ''>(initial.experienceYears ?? '');
  const [phone, setPhone] = useState(initial.phone || '');
  const [website, setWebsite] = useState(initial.website || '');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [passportVerified, setPassportVerified] = useState<boolean>(!!initial.passportVerified);
  const [worksByContract, setWorksByContract] = useState<boolean>(!!initial.worksByContract);

  // категории
  const initCatIds = (initial.categories || []).map((pc: any) => pc.categoryId);
  const [selectedCatIds, setSelectedCatIds] = useState<number[]>(initCatIds);

  // услуги
  const [services, setServices] = useState<ServiceRow[]>(
    (initial.services || []).map((s: any) => ({
      name: s.name,
      priceFrom: s.priceFrom ?? '',
      unit: s.unit || 'проект',
      desc: s.description || '',
    }))
  );

  const addService = () => setServices(s => [...s, { name: '', priceFrom: '', unit: 'проект', desc: '' }]);
  const removeService = (idx: number) => setServices(s => s.filter((_, i) => i !== idx));
  const updateService = (idx: number, patch: Partial<ServiceRow>) =>
    setServices(s => s.map((row, i) => (i === idx ? { ...row, ...patch } : row)));

  // портфолио: существующие + новые
  const [existing, setExisting] = useState<(Project & { _delete?: boolean })[]>(
    (initial.projects || []).map((p: any) => ({ id: p.id, title: p.title, imageUrl: p.imageUrl }))
  );
  const [newItems, setNewItems] = useState<{ title: string; file: File | null }[]>([]);

  const toggleCat = (id: number) =>
    setSelectedCatIds(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);

  const addNewProject = () => setNewItems(g => [...g, { title: '', file: null }]);
  const removeNewProject = (idx: number) => setNewItems(g => g.filter((_, i)=>i!==idx));
  const updateNewProject = (idx: number, patch: Partial<{title:string; file:File|null}>) =>
    setNewItems(g => g.map((row, i) => i===idx ? { ...row, ...patch } : row));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) return alert('Укажите название/ФИО');

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

      // флаги
      fd.append('passportVerified', passportVerified ? '1' : '0');
      fd.append('worksByContract',  worksByContract  ? '1' : '0');

      if (avatar) fd.append('avatar', avatar);

      selectedCatIds.forEach(cid => fd.append('categories', String(cid)));

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

      // существующие (update/delete)
      fd.append('existingProjects', JSON.stringify(
        existing.map(p => ({ id: p.id, title: p.title ?? undefined, _delete: !!p._delete }))
      ));

      // новые файлы
      newItems.forEach((p, idx) => {
        if (p.file) fd.append('portfolioFiles', p.file, p.file.name);
        fd.append(`portfolioTitle_${idx}`, p.title || '');
      });

      const res = await fetch(`/api/providers/${id}`, { method: 'PATCH', body: fd });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || 'Не удалось сохранить');

      window.location.assign(`/provider/${id}`);
    } catch (err: any) {
      alert(err.message || 'Ошибка сохранения');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
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
              onChange={e=>{
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
            {initial.avatarUrl && (
              <div className="small text-secondary mt-1">Сейчас: <a href={initial.avatarUrl} target="_blank">{initial.avatarUrl}</a></div>
            )}
          </div>

          <div className="col-md-6">
            <div className="form-check mt-2">
              <input className="form-check-input" id="pp" type="checkbox" checked={passportVerified} onChange={e=>setPassportVerified(e.target.checked)} />
              <label htmlFor="pp" className="form-check-label">Паспорт проверен</label>
            </div>
            <div className="form-check">
              <input className="form-check-input" id="wd" type="checkbox" checked={worksByContract} onChange={e=>setWorksByContract(e.target.checked)} />
              <label htmlFor="wd" className="form-check-label">Работает по договору</label>
            </div>
          </div>
        </div>
      </div>

      {/* Категории */}
      <div className="card-modern p-3 mb-3">
        <h2 className="h6 mb-2">Категории</h2>
        <div className="row">
          {allCategories.map(c => (
            <div className="col-sm-6 col-md-4" key={c.id}>
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id={`cat-${c.id}`}
                       checked={selectedCatIds.includes(c.id)}
                       onChange={()=>toggleCat(c.id)} />
                <label className="form-check-label" htmlFor={`cat-${c.id}`}>{c.name}</label>
              </div>
            </div>
          ))}
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
          <button type="button" onClick={addNewProject} className="btn btn-outline-primary btn-sm">
            <i className="bi bi-plus-lg" /> Добавить проект
          </button>
        </div>

        {/* Существующие */}
        <div className="row g-3 mt-1">
          {existing.map((p, i)=>(
            <div className="col-md-6" key={p.id}>
              <div className="card-modern p-2">
                <div className="ratio ratio-4x3 rounded overflow-hidden mb-2">
                  <img src={p.imageUrl} className="w-100 h-100 object-fit-cover" alt={p.title || 'project'} />
                </div>
                <input
                  className="form-control form-control-sm mb-2"
                  value={p.title || ''}
                  onChange={e=>{
                    const v = e.target.value;
                    setExisting(arr => arr.map((x, idx)=> idx===i ? { ...x, title: v } : x));
                  }}
                  placeholder="Название проекта"
                />
                <div className="form-check">
                  <input className="form-check-input" id={`del-${p.id}`} type="checkbox" checked={!!p._delete}
                         onChange={e=>setExisting(arr => arr.map((x, idx)=> idx===i ? { ...x, _delete: e.target.checked } : x))}/>
                  <label htmlFor={`del-${p.id}`} className="form-check-label">Удалить</label>
                </div>
              </div>
            </div>
          ))}
          {existing.length === 0 && <div className="text-secondary px-2">Пока нет примеров работ.</div>}
        </div>

        {/* Новые */}
        <div className="row g-3 mt-1">
          {newItems.map((p, idx)=>(
            <div className="col-md-6" key={idx}>
              <div className="card-modern p-2">
                <div className="ratio ratio-4x3 rounded overflow-hidden mb-2">
                  <img
                    src={p.file ? URL.createObjectURL(p.file) : 'https://images.unsplash.com/photo-1615870216515-4f0f1a9d1d5c?q=80&w=800&auto=format&fit=crop'}
                    className="w-100 h-100 object-fit-cover" alt="preview"
                  />
                </div>
                <input className="form-control form-control-sm mb-2"
                       value={p.title}
                       onChange={e=>updateNewProject(idx,{title:e.target.value})}
                       placeholder="Название проекта" />
                <input type="file" accept="image/*" className="form-control form-control-sm"
                       onChange={e=>updateNewProject(idx,{file:e.target.files?.[0]||null})} />
                <div className="text-end mt-2">
                  <button type="button" className="btn btn-outline-danger btn-sm" onClick={()=>removeNewProject(idx)}>
                    <i className="bi bi-trash" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="d-grid">
        <button className="btn btn-success" type="submit" disabled={submitting}>
          {submitting ? 'Сохраняем...' : <><i className="bi bi-save me-1" /> Сохранить изменения</>}
        </button>
      </div>
    </form>
  );
}
