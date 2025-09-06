'use client';

export default function NewCategoryForm() {
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) location.href = '/admin/categories';
    else alert('Ошибка создания категории');
  }

  return (
    <form className="row g-3" onSubmit={onSubmit}>
      <div className="col-md-6">
        <label className="form-label">Название*</label>
        <input name="name" required className="form-control" />
      </div>
      <div className="col-md-6">
        <label className="form-label">Slug*</label>
        <input name="slug" required className="form-control" />
      </div>

      <div className="col-md-6">
        <label className="form-label">SEO Title</label>
        <input name="seoTitle" className="form-control" />
      </div>
      <div className="col-md-6">
        <label className="form-label">H1</label>
        <input name="seoH1" className="form-control" />
      </div>
      <div className="col-12">
        <label className="form-label">Meta Description</label>
        <textarea name="seoDescription" className="form-control" rows={3} />
      </div>
      <div className="col-12">
        <label className="form-label">Meta Keywords (через запятую)</label>
        <input name="seoKeywords" className="form-control" />
      </div>

      <div className="col-12">
        <button className="btn btn-primary">Создать</button>
      </div>
    </form>
  );
}
