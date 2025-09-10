'use client';

import { useMemo, useState } from 'react';

type ServiceRow = { name: string; priceFrom?: number | ''; unit?: string; desc?: string };
type Category = { id: number; name: string; slug: string };

type ProjectImage = { id: number; url: string; title?: string | null; sort?: number | null };
type Project = { id: number; title?: string | null; images?: ProjectImage[] };

export default function ProviderEditForm({
  initial,
  allCategories,
}: {
  initial: any;
  allCategories: Category[];
}) {
  const id = initial.id as number;

  const [submitting, setSubmitting] = useState(false);

  const [type, setType] = useState<'company' | 'individual'>(
    initial.title === 'Студия / Компания' ? 'company' : 'individual'
  );
  const [displayName, setDisplayName] = useState(initial.name || '');
  const [city, setCity] = useState(initial.city || '');
  const [about, setAbout] = useState(initial.about || '');
  const [experienceYears, setExperienceYears] = useState<number | ''>(
    initial.experienceYears ?? ''
  );
  const [phone, setPhone] = useState(initial.phone || '');
  const [website, setWebsite] = useState(initial.website || '');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [passportVerified, setPassportVerified] = useState<boolean>(
    !!initial.passportVerified
  );
  const [worksByContract, setWorksByContract] = useState<boolean>(
    !!initial.worksByContract
  );

  // категории
  const initCatIds = useMemo(
    () => (initial.categories || []).map((pc: any) => pc.categoryId as number),
    [initial.categories]
  );
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
  const addService = () =>
    setServices((s) => [...s, { name: '', priceFrom: '', unit: 'проект', desc: '' }]);
  const removeService = (idx: number) =>
    setServices((s) => s.filter((_, i) => i !== idx));
  const updateService = (idx: number, patch: Partial<ServiceRow>) =>
    setServices((s) => s.map((row, i) => (i === idx ? { ...row, ...patch } : row)));

  // ===== Портфолио =====
  // существующие проекты (с изображениями)
  const [existing, setExisting] = useState<(Project & { _delete?: boolean })[]>(
    (initial.projects || []).map((p: any) => ({
      id: p.id,
      title: p.title,
      images: Array.isArray(p.images) ? p.images : [], // защитно
    }))
  );

  // для существующих проектов — локально храним "добавляемые файлы"
  // ключ = projectId, значение = File[]
  const [toAppend, setToAppend] = useState<Record<number, File[]>>({});

  const addFilesToExisting = (projectId: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setToAppend((prev) => ({
      ...prev,
      [projectId]: [...(prev[projectId] || []), ...Array.from(files)],
    }));
  };
  const clearFilesForExisting = (projectId: number) => {
    setToAppend((prev) => {
      const { [projectId]: _, ...rest } = prev;
      return rest;
    });
  };

  // новые проекты: каждый со своим заголовком и множественными файлами
  const [newProjects, setNewProjects] = useState<
    { title: string; files: File[] }[]
  >([]);

  const addNewProject = () =>
    setNewProjects((g) => [...g, { title: '', files: [] }]);

  const removeNewProject = (idx: number) =>
    setNewProjects((g) => g.filter((_, i) => i !== idx));

  const updateNewProjectTitle = (idx: number, title: string) =>
    setNewProjects((g) => g.map((row, i) => (i === idx ? { ...row, title } : row)));

  const addFilesToNewProject = (idx: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setNewProjects((g) =>
      g.map((row, i) =>
        i === idx ? { ...row, files: [...row.files, ...Array.from(files)] } : row
      )
    );
  };

  const toggleCat = (id: number) =>
    setSelectedCatIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

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
      fd.append('worksByContract', worksByContract ? '1' : '0');

      if (avatar) fd.append('avatar', avatar);

      selectedCatIds.forEach((cid) => fd.append('categories', String(cid)));

      fd.append(
        'services',
        JSON.stringify(
          services
            .filter((s) => s.name.trim())
            .map((s) => ({
              name: s.name.trim(),
              priceFrom: s.priceFrom === '' ? null : Number(s.priceFrom),
              unit: s.unit || null,
              description: s.desc || null,
            }))
        )
      );

      // существующие проекты (update title / delete flag)
      fd.append(
        'existingProjects',
        JSON.stringify(
          existing.map((p) => ({
            id: p.id,
            title: p.title ?? undefined,
            _delete: !!p._delete,
          }))
        )
      );

      // добавление файлов к существующим проектам
      // Бэкенд PATCH уже умеет разбирать поля projectFiles_<projectId>
      for (const ex of existing) {
        const files = toAppend[ex.id];
        if (files && files.length) {
          for (const f of files) {
            fd.append(`projectFiles_${ex.id}`, f, f.name);
          }
        }
      }

      // новые проекты (title + files[])
      // Бэкенд PATCH уже умеет разбирать projectTitle_<i> + projectFiles_<i>
      newProjects.forEach((pr, idx) => {
        fd.append(`projectTitle_${idx}`, pr.title || '');
        for (const f of pr.files) {
          fd.append(`projectFiles_${idx}`, f, f.name);
        }
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
            <select
              className="form-select"
              value={type}
              onChange={(e) => setType(e.target.value as any)}
            >
              <option value="company">Компания</option>
              <option value="individual">Индивидуальный специалист</option>
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Название/ФИО</label>
            <input
              className="form-control"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Например: Atelier Forma"
              required
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Город</label>
            <input
              className="form-control"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Москва"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Опыт (лет)</label>
            <input
              type="number"
              min={0}
              max={60}
              className="form-control"
              value={experienceYears}
              onChange={(e) => {
                const v =
                  e.target.value === ''
                    ? ''
                    : Math.max(0, Math.min(60, Number(e.target.value)));
                setExperienceYears(v);
              }}
              placeholder="Например: 7"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Телефон</label>
            <input
              className="form-control"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 999 000-00-00"
            />
          </div>

          <div className="col-md-12">
            <label className="form-label">Описание</label>
            <textarea
              className="form-control"
              rows={3}
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="Коротко о вас и подходе к работе"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Сайт</label>
            <input
              className="form-control"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Аватар</label>
            <input
              className="form-control"
              type="file"
              accept="image/*"
              onChange={(e) => setAvatar(e.target.files?.[0] || null)}
            />
            {initial.avatarUrl && (
              <div className="small text-secondary mt-1">
                Сейчас:{' '}
                <a href={initial.avatarUrl} target="_blank">
                  {initial.avatarUrl}
                </a>
              </div>
            )}
          </div>

          <div className="col-md-6">
            <div className="form-check mt-2">
              <input
                className="form-check-input"
                id="pp"
                type="checkbox"
                checked={passportVerified}
                onChange={(e) => setPassportVerified(e.target.checked)}
              />
              <label htmlFor="pp" className="form-check-label">
                Паспорт проверен
              </label>
            </div>
            <div className="form-check">
              <input
                className="form-check-input"
                id="wd"
                type="checkbox"
                checked={worksByContract}
                onChange={(e) => setWorksByContract(e.target.checked)}
              />
              <label htmlFor="wd" className="form-check-label">
                Работает по договору
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Категории */}
      <div className="card-modern p-3 mb-3">
        <h2 className="h6 mb-2">Категории</h2>
        <div className="row">
          {allCategories.map((c) => (
            <div className="col-sm-6 col-md-4" key={c.id}>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`cat-${c.id}`}
                  checked={selectedCatIds.includes(c.id)}
                  onChange={() => toggleCat(c.id)}
                />
                <label className="form-check-label" htmlFor={`cat-${c.id}`}>
                  {c.name}
                </label>
              </div>
            </div>
          ))}
        </div>
        <div className="form-text">Можно выбрать несколько.</div>
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

        {/* Цена и единица */}
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
            rows={4}
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


      {/* Портфолио */}
      <div className="card-modern p-3 mb-3">
        <div className="d-flex align-items-center justify-content-between">
          <h2 className="h5 mb-0">Портфолио</h2>
          <button
            type="button"
            onClick={addNewProject}
            className="btn btn-outline-primary btn-sm"
          >
            <i className="bi bi-plus-lg" /> Добавить проект
          </button>
        </div>

        {/* Существующие проекты */}
        <div className="vstack gap-3 mt-2">
          {existing.map((proj, i) => {
            const imgs = proj.images || [];
            const pending = toAppend[proj.id] || [];
            return (
              <div key={proj.id} className="card-modern p-2">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <strong className="me-2">Проект #{proj.id}</strong>
                  <input
                    className="form-control form-control-sm"
                    value={proj.title || ''}
                    onChange={(e) =>
                      setExisting((arr) =>
                        arr.map((x, idx) =>
                          idx === i ? { ...x, title: e.target.value } : x
                        )
                      )
                    }
                    placeholder="Название проекта"
                    style={{ maxWidth: 420 }}
                  />
                  <div className="form-check ms-auto">
                    <input
                      className="form-check-input"
                      id={`del-${proj.id}`}
                      type="checkbox"
                      checked={!!proj._delete}
                      onChange={(e) =>
                        setExisting((arr) =>
                          arr.map((x, idx) =>
                            idx === i ? { ...x, _delete: e.target.checked } : x
                          )
                        )
                      }
                    />
                    <label htmlFor={`del-${proj.id}`} className="form-check-label">
                      Удалить проект
                    </label>
                  </div>
                </div>

                {/* Превью существующих изображений */}
                {imgs.length > 0 ? (
                  <div className="row g-2">
                    {imgs.map((im) => (
                      <div key={im.id} className="col-6 col-md-3">
                        <div className="ratio ratio-4x3 rounded overflow-hidden border">
                          <img
                            src={im.url}
                            className="w-100 h-100 object-fit-cover"
                            alt={im.title || 'image'}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-secondary small">Нет изображений</div>
                )}

                {/* Мультизагрузка новых фото в этот проект */}
                <div className="mt-2 d-flex align-items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="form-control form-control-sm"
                    onChange={(e) => addFilesToExisting(proj.id, e.target.files)}
                  />
                  {pending.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => clearFilesForExisting(proj.id)}
                    >
                      Очистить выбранные ({pending.length})
                    </button>
                  )}
                </div>

                {/* Превью выбираемых новых файлов (локально) */}
                {pending.length > 0 && (
                  <div className="row g-2 mt-1">
                    {pending.map((f, idx2) => (
                      <div key={idx2} className="col-6 col-md-3">
                        <div className="ratio ratio-4x3 rounded overflow-hidden border">
                          <img
                            src={URL.createObjectURL(f)}
                            className="w-100 h-100 object-fit-cover"
                            alt={f.name}
                          />
                        </div>
                        <div className="small text-truncate mt-1">{f.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {existing.length === 0 && (
            <div className="text-secondary">Пока нет проектов.</div>
          )}
        </div>

        {/* Новые проекты */}
        <div className="vstack gap-3 mt-3">
          {newProjects.map((p, idx) => (
            <div key={idx} className="card-modern p-2">
              <div className="d-flex align-items-center gap-2 mb-2">
                <strong className="me-2">Новый проект</strong>
                <input
                  className="form-control form-control-sm"
                  value={p.title}
                  onChange={(e) => updateNewProjectTitle(idx, e.target.value)}
                  placeholder="Название проекта"
                  style={{ maxWidth: 420 }}
                />
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm ms-auto"
                  onClick={() => removeNewProject(idx)}
                >
                  <i className="bi bi-trash" />
                </button>
              </div>

              <input
                type="file"
                accept="image/*"
                multiple
                className="form-control form-control-sm"
                onChange={(e) => addFilesToNewProject(idx, e.target.files)}
              />

              {p.files.length > 0 && (
                <div className="row g-2 mt-1">
                  {p.files.map((f, i2) => (
                    <div key={i2} className="col-6 col-md-3">
                      <div className="ratio ratio-4x3 rounded overflow-hidden border">
                        <img
                          src={URL.createObjectURL(f)}
                          className="w-100 h-100 object-fit-cover"
                          alt={f.name}
                        />
                      </div>
                      <div className="small text-truncate mt-1">{f.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="d-grid">
        <button className="btn btn-success" type="submit" disabled={submitting}>
          {submitting ? 'Сохраняем...' : (<><i className="bi bi-save me-1" /> Сохранить изменения</>)}
        </button>
      </div>
    </form>
  );
}
