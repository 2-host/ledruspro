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
      <div className="col-12">
        <button className="btn btn-primary">Создать</button>
      </div>
    </form>
  );
}
