// src/app/admin/providers/ui/DeleteButton.tsx
'use client';

export default function DeleteButton({ id }: { id: number }) {
  const onDelete = async () => {
    const yes = confirm(`Удалить исполнителя #${id}?`);
    if (!yes) return;

    const res = await fetch(`/api/providers/${id}`, { method: 'DELETE' });
    if (res.ok) {
      location.reload();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(`Ошибка удаления: ${data.error || res.statusText}`);
    }
  };

  return (
    <button type="button" className="btn btn-sm btn-outline-danger" onClick={onDelete}>
      <i className="bi bi-trash me-1" /> Delete
    </button>
  );
}
