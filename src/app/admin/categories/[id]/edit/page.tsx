import { prisma } from '@/lib/prisma';
import EditCategoryForm from './EditCategoryForm';

export default async function EditCategory({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const c = await prisma.category.findUnique({ where: { id } });
  if (!c) return <main className="container py-4">Не найдено</main>;

  return (
    <main className="container py-4">
      <h1 className="h4 mb-3">Редактирование: {c.name}</h1>
      <EditCategoryForm id={c.id} initial={{ name: c.name, slug: c.slug }} />
    </main>
  );
}
