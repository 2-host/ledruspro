import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DeleteCategoryButton from './ui/DeleteCategoryButton';
import React from 'react';

export default async function CategoriesPage() {
  const roots = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { name: 'asc' },
    include: {
      children: { orderBy: { name: 'asc' } },
    },
  });

  return (
    <main className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="h3 m-0">Категории</h1>
        <Link href="/admin/categories/new" className="btn btn-primary">
          <i className="bi bi-plus-lg me-1" /> Новая
        </Link>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Slug</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {roots.map((c) => (
              <React.Fragment key={c.id}>
                {/* Корень */}
                <tr className="table-light">
                  <td>{c.id}</td>
                  <td className="fw-semibold">{c.name}</td>
                  <td>
                    <code>{c.slug}</code>
                  </td>
                  <td className="text-end">
                    <Link
                      href={`/admin/categories/${c.id}/edit`}
                      className="btn btn-sm btn-outline-secondary me-2"
                    >
                      <i className="bi bi-pencil" /> Edit
                    </Link>
                    <DeleteCategoryButton id={c.id} />
                  </td>
                </tr>

                {/* Дети */}
                {c.children.map((child) => (
                  <tr key={child.id}>
                    <td>{child.id}</td>
                    <td className="ps-4">└ {child.name}</td>
                    <td>
                      <code>{child.slug}</code>
                    </td>
                    <td className="text-end">
                      <Link
                        href={`/admin/categories/${child.id}/edit`}
                        className="btn btn-sm btn-outline-secondary me-2"
                      >
                        <i className="bi bi-pencil" /> Edit
                      </Link>
                      <DeleteCategoryButton id={child.id} />
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
