// src/app/admin/categories/[id]/edit/EditCategoryForm.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

type RootCategory = {
  id: number;
  name: string;
  slug: string;
  fullSlug?: string | null;
  children?: RootCategory[];
};

type CategoryDetails = {
  id: number;
  name: string;
  slug: string;
  fullSlug?: string | null;
  parentId?: number | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  seoH1?: string | null;
};

// тот же slugify, что и в API, чтобы не было расхождения
function slugify(input: string) {
  const map: Record<string, string> = {
    'ё':'e','й':'i','ц':'c','у':'u','к':'k','е':'e','н':'n','г':'g','ш':'sh','щ':'sch','з':'z','х':'h','ъ':'',
    'ф':'f','ы':'y','в':'v','а':'a','п':'p','р':'r','о':'o','л':'l','д':'d','ж':'zh','э':'e',
    'я':'ya','ч':'ch','с':'s','м':'m','и':'i','т':'t','ь':'','б':'b','ю':'yu'
  };
  return (input || '')
    .trim()
    .toLowerCase()
    .replace(/[а-яё]/g, ch => map[ch] ?? '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

export default function EditCategoryForm({
  id,
  initial,
}: {
  id: number;
  initial: {
    name: string;
    slug: string;
    seoTitle: string | null;
    seoDescription: string | null;
    seoKeywords: string | null;
    seoH1: string | null;
    parentId?: number | null;   // если сервер уже отдаёт — супер
    fullSlug?: string | null;
  };
}) {
  // основные поля
  const [name, setName] = useState(initial.name || '');
  const [slug, setSlug] = useState(initial.slug || '');
  const [seoTitle, setSeoTitle] = useState(initial.seoTitle || '');
  const [seoH1, setSeoH1] = useState(initial.seoH1 || '');
  const [seoDescription, setSeoDescription] = useState(initial.seoDescription || '');
  const [seoKeywords, setSeoKeywords] = useState(initial.seoKeywords || '');

  // дерево корней (для выбора родителя)
  const [roots, setRoots] = useState<RootCategory[]>([]);
  // выбранный родитель (как строка для <select>)
  const [parentId, setParentId] = useState<string>(
    initial.parentId != null ? String(initial.parentId) : ''
  );

  // состояния
  const [loadingRoots, setLoadingRoots] = useState(false);
  const [loadingSelf, setLoadingSelf] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1) тянем корневые категории (с сервера — /api/categories отдаёт дерево из корней и их детей)
  useEffect(() => {
    let cancelled = false;
    setLoadingRoots(true);
    fetch('/api/categories', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : [])
      .then((data: RootCategory[]) => {
        if (!cancelled) setRoots(Array.isArray(data) ? data : []);
      })
      .catch(() => { if (!cancelled) setRoots([]); })
      .finally(() => { if (!cancelled) setLoadingRoots(false); });
    return () => { cancelled = true; };
  }, []);

  // 2) если parentId не пришёл с сервера — дотягиваем через /api/categories/:id
  useEffect(() => {
    if (initial.parentId != null) return;
    let cancelled = false;
    setLoadingSelf(true);
    fetch(`/api/categories/${id}`, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then((data: CategoryDetails | null) => {
        if (!cancelled && data && typeof data.parentId !== 'undefined') {
          setParentId(data.parentId == null ? '' : String(data.parentId));
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingSelf(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // не даём выбрать самой себя в качестве родителя
  const parentOptions = useMemo(
    () => roots.filter(r => r.id !== id),
    [roots, id]
  );

  // текущий выбранный родитель (объект) — чтобы показать «сейчас в: …»
  const currentParent = useMemo(
    () => parentOptions.find(r => String(r.id) === parentId) || null,
    [parentOptions, parentId]
  );

  // предпросмотр итогового пути
  const fullSlugPreview = useMemo(() => {
    const s = slugify(slug || name);
    if (!s) return '';
    return currentParent ? `${currentParent.fullSlug || currentParent.slug}/${s}` : s;
  }, [currentParent, slug, name]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const s = slugify(slug || name);
    if (!name.trim()) {
      setError('Название обязательно');
      return;
    }
    if (!s) {
      setError('Не удалось сформировать slug');
      return;
    }

    try {
      setSubmitting(true);
      const body: any = {
        name: name.trim(),
        slug: s,
        seoTitle: seoTitle.trim() || null,
        seoH1: seoH1.trim() || null,
        seoDescription: seoDescription.trim() || null,
        seoKeywords: seoKeywords.trim() || null,
        // Пустая строка => null (делаем корневой)
        parentId: parentId ? Number(parentId) : null,
      };

      const res = await fetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        alert('Сохранено');
      } else {
        const payload = await res.json().catch(() => ({}));
        setError(payload?.error || 'Ошибка сохранения');
      }
    } catch (err: any) {
      setError(err?.message || 'Ошибка сохранения');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="row g-3" onSubmit={onSubmit}>
      {(error) && (
        <div className="col-12">
          <div className="alert alert-danger py-2">{error}</div>
        </div>
      )}

      <div className="col-md-6">
        <label className="form-label">Название</label>
        <input
          name="name"
          className="form-control"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Название категории"
        />
      </div>

      <div className="col-md-6">
        <label className="form-label">Slug</label>
        <input
          name="slug"
          className="form-control"
          value={slug}
          onChange={e => setSlug(e.target.value)}
          placeholder="lighting"
        />
        <div className="form-text">
          Будет нормализован: <code>{slugify(slug || name) || '—'}</code>
        </div>
      </div>

      {/* Родитель — только корневые */}
      <div className="col-md-6">
        <label className="form-label">
          Родительская категория{' '}
          {(loadingRoots || loadingSelf) && <span className="text-muted">(загрузка…)</span>}
        </label>
        <select
          className="form-select"
          value={parentId}
          onChange={e => setParentId(e.target.value)}
          disabled={loadingRoots || loadingSelf}
        >
          <option value="">(нет — сделать корневой)</option>
          {parentOptions.map(r => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <div className="form-text">
          Максимум 2 уровня: корень → подкатегория.
        </div>

        {/* Чёткая индикация текущего родителя */}
        <div className="mt-2">
          <span className="badge bg-light text-dark border">
            Сейчас: {currentParent ? `в «${currentParent.name}»` : 'корневая'}
          </span>
        </div>
      </div>

      {/* Превью итогового пути */}
      <div className="col-md-6">
        <label className="form-label">Предпросмотр пути</label>
        <input className="form-control" value={fullSlugPreview || ''} readOnly />
        <div className="form-text">
          URL будет: <code>/c/{fullSlugPreview || ''}</code>
        </div>
      </div>

      <div className="col-md-6">
        <label className="form-label">SEO Title</label>
        <input
          name="seoTitle"
          className="form-control"
          value={seoTitle}
          onChange={e => setSeoTitle(e.target.value)}
        />
      </div>
      <div className="col-md-6">
        <label className="form-label">H1</label>
        <input
          name="seoH1"
          className="form-control"
          value={seoH1}
          onChange={e => setSeoH1(e.target.value)}
        />
      </div>

      <div className="col-12">
        <label className="form-label">Meta Description</label>
        <textarea
          name="seoDescription"
          className="form-control"
          rows={3}
          value={seoDescription}
          onChange={e => setSeoDescription(e.target.value)}
        />
      </div>

      <div className="col-12">
        <label className="form-label">Meta Keywords (через запятую)</label>
        <input
          name="seoKeywords"
          className="form-control"
          value={seoKeywords}
          onChange={e => setSeoKeywords(e.target.value)}
        />
      </div>

      <div className="col-12">
        <button className="btn btn-primary" disabled={submitting || loadingRoots || loadingSelf}>
          {submitting ? 'Сохраняем…' : 'Сохранить'}
        </button>
      </div>
    </form>
  );
}
