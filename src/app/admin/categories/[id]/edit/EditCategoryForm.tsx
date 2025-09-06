'use client';

export default function EditCategoryForm({
  id,
  initial,
}: {
  id: number;
  initial: {
    name: string;
    slug: string;
    seoTitle: string;
    seoDescription: string;
    seoKeywords: string;
    seoH1: string;
  };
}) {
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    alert(res.ok ? 'Сохранено' : 'Ошибка сохранения');
  }

  return (
    <form className="row g-3" onSubmit={onSubmit}>
      <div className="col-md-6">
        <label className="form-label">Название</label>
        <input name="name" defaultValue={initial.name} className="form-control" />
      </div>
      <div className="col-md-6">
        <label className="form-label">Slug</label>
        <input name="slug" defaultValue={initial.slug} className="form-control" />
      </div>

      <div className="col-md-6">
        <label className="form-label">SEO Title</label>
        <input name="seoTitle" defaultValue={initial.seoTitle} className="form-control" />
      </div>
      <div className="col-md-6">
        <label className="form-label">H1</label>
        <input name="seoH1" defaultValue={initial.seoH1} className="form-control" />
      </div>
      <div className="col-12">
        <label className="form-label">Meta Description</label>
        <textarea name="seoDescription" defaultValue={initial.seoDescription} className="form-control" rows={3} />
      </div>
      <div className="col-12">
        <label className="form-label">Meta Keywords (через запятую)</label>
        <input name="seoKeywords" defaultValue={initial.seoKeywords} className="form-control" />
      </div>

      <div className="col-12">
        <button className="btn btn-primary">Сохранить</button>
      </div>
    </form>
  );
}
