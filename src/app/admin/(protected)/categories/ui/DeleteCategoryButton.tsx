'use client';

export default function DeleteCategoryButton({ id }: { id: number }) {
  const onDelete = async () => {
    if (!confirm('Удалить категорию?')) return;

    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    if (res.ok) {
      location.reload();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(`Ошибка удаления: ${data.error || res.statusText}`);
    }
  };

  return (
    <button type="button" className="btn btn-sm btn-outline-danger" onClick={onDelete}>
      Delete
    </button>
  );
}
