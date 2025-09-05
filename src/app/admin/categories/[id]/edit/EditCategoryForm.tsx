'use client';

export default function EditCategoryForm({
  id,
  initial,
}: { id: number; initial: { name: string; slug: string } }) {

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) alert('Сохранено');
    else alert('Ошибка сохранения');
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
      <div className="col-12">
        <button className="btn btn-primary">Сохранить</button>
      </div>
    </form>
  );
}
