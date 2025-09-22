'use client';

import { useEffect, useMemo, useState } from 'react';

type CategoryNode = {
  id: number;
  name: string;
  slug: string;
  fullSlug?: string;
  children?: CategoryNode[];
};

// такой же slugify, как на бэке
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

export default function NewCategoryForm() {
  const [submitting, setSubmitting] = useState(false);

  // поля формы
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugLocked, setSlugLocked] = useState(false); // false = авто, true = вручную
  const [parentId, setParentId] = useState<string>(''); // '' = без родителя
  const [seoTitle, setSeoTitle] = useState('');
  const [seoH1, setSeoH1] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');

  // список корней
  const [roots, setRoots] = useState<CategoryNode[]>([]);
  const [error, setError] = useState<string | null>(null);

  // грузим дерево категорий
  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then((data: CategoryNode[]) => setRoots(data || []))
      .catch(() => setRoots([]));
  }, []);

  // Когда меняется name — если slug не «залочен», генерим его из name
  const onNameChange = (v: string) => {
    setName(v);
    if (!slugLocked) {
      setSlug(slugify(v));
    }
  };

  // Когда пользователь редактирует slug — считаем «вручную», если он отличается от автогенерации
  const onSlugChange = (v: string) => {
    setSlug(v);
    const auto = slugify(name);
    // если поле slug пустое — снова включаем авто
    if (v.trim() === '') {
      setSlugLocked(false);
    } else {
      setSlugLocked(v !== auto);
    }
  };

  // превью полного пути
  const parent = useMemo(
    () => roots.find(r => String(r.id) === parentId) || null,
    [roots, parentId]
  );
  const fullSlugPreview = useMemo(() => {
    const s = slugify(slug || name);
    if (!s) return '';
    return parent ? `${parent.fullSlug || parent.slug}/${s}` : s;
  }, [parent, slug, name]);

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
      };
      if (seoTitle.trim()) body.seoTitle = seoTitle.trim();
      if (seoH1.trim()) body.seoH1 = seoH1.trim();
      if (seoDescription.trim()) body.seoDescription = seoDescription.trim();
      if (seoKeywords.trim()) body.seoKeywords = seoKeywords.trim();
      if (parentId) body.parentId = Number(parentId);

      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });

      if (res.ok) {
        location.href = '/admin/categories';
        return;
      }

      const payload = await res.json().catch(() => ({}));
      setError(payload?.error || 'Ошибка создания категории');
    } catch (err: any) {
      setError(err?.message || 'Ошибка создания категории');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="row g-3" onSubmit={onSubmit}>
      {error && (
        <div className="col-12">
          <div className="alert alert-danger py-2">{error}</div>
        </div>
      )}

      <div className="col-md-6">
        <label className="form-label">Название*</label>
        <input
          name="name"
          required
          className="form-control"
          value={name}
          onChange={e => onNameChange(e.target.value)}
          placeholder="Например: Проект освещения"
        />
      </div>

      <div className="col-md-6">
        <label className="form-label">Slug*</label>
        <input
          name="slug"
          required
          className="form-control"
          value={slug}
          onChange={e => onSlugChange(e.target.value)}
          placeholder="lighting"
        />
        <div className="form-text">
          Будет нормализован: <code>{slugify(slug || name) || '—'}</code>
          {' '}
          {slugLocked ? '(зафиксирован вручную)' : '(автогенерация)'}
        </div>
      </div>

      <div className="col-md-6">
        <label className="form-label">Родительская категория</label>
        <select
          className="form-select"
          value={parentId}
          onChange={e => setParentId(e.target.value)}
        >
          <option value="">(нет — сделать корневой)</option>
          {roots.map(r => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <div className="form-text">Разрешены только 2 уровня: корневая → подкатегория.</div>
      </div>

      <div className="col-md-6">
        <label className="form-label">Предпросмотр пути</label>
        <input className="form-control" value={fullSlugPreview || ''} readOnly />
        <div className="form-text">URL будет: <code>/c/{fullSlugPreview || ''}</code></div>
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
        <button className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Создаём…' : 'Создать'}
        </button>
      </div>
    </form>
  );
}
