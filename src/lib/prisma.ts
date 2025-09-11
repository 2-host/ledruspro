// src/lib/prisma.ts
import { PrismaClient, Prisma } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };
const base =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error', 'warn'],
  });

const lower = (s?: string | null) => (s ? s.toLowerCase() : null);

function normService(data: Prisma.ServiceCreateInput | Prisma.ServiceUpdateInput) {
  const d: any = { ...data };
  d.nameSearch = lower(d.name ?? d.nameSearch);
  d.descriptionSearch = lower(d.description ?? d.descriptionSearch);
  return d;
}

function normProvider(data: Prisma.ProviderCreateInput | Prisma.ProviderUpdateInput) {
  const d: any = { ...data };

  d.nameSearch  = lower(d.name ?? d.nameSearch);
  d.titleSearch = lower(d.title ?? d.titleSearch);
  // если заведёте поле: d.aboutSearch = lower(d.about ?? d.aboutSearch);

  // Нормализуем вложенные services.create / createMany
  if (d.services?.create) {
    const list = Array.isArray(d.services.create) ? d.services.create : [d.services.create];
    d.services.create = list.map((s: any) => normService(s));
  }
  if (d.services?.createMany?.data) {
    const arr = Array.isArray(d.services.createMany.data)
      ? d.services.createMany.data
      : [d.services.createMany.data];
    d.services.createMany.data = arr.map((s: any) => normService(s));
  }

  // Нормализуем вложенные services.update / upsert (если где-то используете)
  if (d.services?.update) {
    const list = Array.isArray(d.services.update) ? d.services.update : [d.services.update];
    d.services.update = list.map((u: any) => ({ ...u, data: normService(u.data ?? {}) }));
  }
  if (d.services?.upsert) {
    const list = Array.isArray(d.services.upsert) ? d.services.upsert : [d.services.upsert];
    d.services.upsert = list.map((u: any) => ({
      ...u,
      update: normService(u.update ?? {}),
      create: normService(u.create ?? {}),
    }));
  }

  return d;
}

export const prisma = base.$extends({
  query: {
    provider: {
      async create({ args, query }) {
        args.data = normProvider(args.data);
        return query(args);
      },
      async update({ args, query }) {
        args.data = normProvider(args.data);
        return query(args);
      },
    },
    service: {
      async create({ args, query }) {
        args.data = normService(args.data);
        return query(args);
      },
      async update({ args, query }) {
        args.data = normService(args.data);
        return query(args);
      },
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = base;
