// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/** ===================== КАТЕГОРИИ (дерево) ===================== */
// Корни + подкатегории (2 уровень)
const categoriesTree = [
  {
    name: 'Дизайнеры',
    slug: 'designers',
    children: [
      { name: 'Дизайн интерьера', slug: 'interior' },
      { name: 'Ландшафтный дизайн', slug: 'landscape' },
      { name: 'Авторский надзор', slug: 'authors-supervision' },
    ],
  },
  {
    name: 'Инженеры-проектировщики',
    slug: 'engineers',
    children: [
      { name: 'Проект ОВиК', slug: 'hvac-project' },
      { name: 'ВК/К1', slug: 'water-sewage' },
      { name: 'Электроснабжение', slug: 'power-supply' },
    ],
  },
  {
    name: 'Монтажники',
    slug: 'installers',
    children: [
      { name: 'Электромонтаж', slug: 'electrical' },
      { name: 'Шкафы управления', slug: 'control-cabinets' },
    ],
  },
  {
    name: 'Потолочники',
    slug: 'ceilings',
    children: [
      { name: 'Натяжные потолки', slug: 'stretch' },
      { name: 'Световые линии', slug: 'light-lines' },
    ],
  },
  {
    name: 'Светорасчёт',
    slug: 'lighting',
    children: [
      { name: 'DIALux проекты', slug: 'dialux' },
      { name: 'Светотехнический расчёт', slug: 'photometric' },
    ],
  },
  {
    name: 'Электрики',
    slug: 'electricians',
    children: [
      { name: 'Проводка', slug: 'wiring' },
      { name: 'Сборка щитов', slug: 'switchboards' },
    ],
  },
  {
    name: 'Инженерные системы',
    slug: 'engineering-systems',
    children: [
      { name: 'Отопление и ВК', slug: 'heating-water' },
      { name: 'ОВиК проект', slug: 'hvac' },
    ],
  },
] as const;

/** ===================== ВСПОМОГАТЕЛЬНОЕ ===================== */
const cities = [
  'Москва', 'Санкт-Петербург', 'Нижний Новгород', 'Казань',
  'Екатеринбург', 'Новосибирск', 'Ростов-на-Дону', 'Краснодар'
];

const companyPrefixes = ['Atelier', 'Studio', 'Forma', 'Lux', 'Pro', 'Master', 'Craft', 'Concept', 'Design', 'Light', 'Electro'];
const firstNames = ['Алексей','Марина','Иван','Ксения','Дмитрий','Анна','Павел','Юлия','Сергей','Елена','Никита','Ольга','Роман','Наталья','Виктор'];
const lastNames  = ['Иванов','Петрова','Смирнов','Кузнецова','Егоров','Федорова','Соколов','Павлова','Козлов','Соловьёва','Орлов','Васильева'];

const servicesBySlug: Record<string, {name:string, priceFrom:number}[]> = {
  // roots
  designers: [
    { name: 'Дизайн-проект',        priceFrom: 45000 },
    { name: 'Рабочие чертежи',      priceFrom: 900 },
    { name: 'Авторский надзор',     priceFrom: 15000 },
  ],
  engineers: [
    { name: 'Проектные решения',    priceFrom: 60000 },
    { name: 'Сметная документация', priceFrom: 25000 },
  ],
  installers: [
    { name: 'Монтаж электрики',     priceFrom: 350 },
    { name: 'Шкаф управления',      priceFrom: 18000 },
  ],
  ceilings: [
    { name: 'Натяжной потолок',     priceFrom: 700 },
    { name: 'Световые линии',       priceFrom: 2500 },
  ],
  lighting: [
    { name: 'DIALux проект',            priceFrom: 25000 },
    { name: 'Светотехнический расчёт',  priceFrom: 18000 },
  ],
  electricians: [
    { name: 'Монтаж проводки',      priceFrom: 350 },
    { name: 'Сборка щитов',         priceFrom: 12000 },
  ],
  'engineering-systems': [
    { name: 'Отопление и ВК',       priceFrom: 50000 },
    { name: 'ОВиК проект',          priceFrom: 80000 },
  ],

  // children (при желании — более точные пресеты)
  interior: [
    { name: 'Планировка', priceFrom: 15000 },
    { name: 'Ведомость отделки', priceFrom: 9000 },
  ],
  landscape: [
    { name: 'Генплан', priceFrom: 30000 },
    { name: 'Посадочный план', priceFrom: 18000 },
  ],
  'authors-supervision': [
    { name: 'Выезды на объект', priceFrom: 10000 },
    { name: 'Согласования', priceFrom: 15000 },
  ],
  'hvac-project': [
    { name: 'Проект вентиляции', priceFrom: 70000 },
    { name: 'Проект кондиционирования', priceFrom: 80000 },
  ],
  'water-sewage': [
    { name: 'Проект ВК/К1', priceFrom: 60000 },
  ],
  'power-supply': [
    { name: 'Проект ЭОМ', priceFrom: 65000 },
  ],
  electrical: [
    { name: 'Прокладка кабеля', priceFrom: 250 },
  ],
  'control-cabinets': [
    { name: 'Сборка щита', priceFrom: 15000 },
  ],
  stretch: [
    { name: 'Монтаж потолка', priceFrom: 800 },
  ],
  'light-lines': [
    { name: 'Профиль с подсветкой', priceFrom: 3200 },
  ],
  dialux: [
    { name: 'DIALux evo проект', priceFrom: 30000 },
  ],
  photometric: [
    { name: 'Расчёт освещённости', priceFrom: 22000 },
  ],
  wiring: [
    { name: 'Разводка по комнате', priceFrom: 2500 },
  ],
  switchboards: [
    { name: 'Щит квартира/дом', priceFrom: 18000 },
  ],
  'heating-water': [
    { name: 'Проект отопления и ВК', priceFrom: 70000 },
  ],
  hvac: [
    { name: 'ОВиК раздел', priceFrom: 90000 },
  ],
};

const unsplashAvatars = [
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=256&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?q=80&w=256&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=256&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=256&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1541534401786-2077eed87a74?q=80&w=256&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&auto=format&fit=crop',
];

function pick<T>(arr: T[]) { return arr[Math.floor(Math.random()*arr.length)]; }
function rand(min:number, max:number) { return Math.floor(Math.random()*(max-min+1))+min; }
function slugifyCompany(name:string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/(^-|-$)+/g,'');
}

function makeCompanyOrPerson(): {name:string; title:string} {
  const isCompany = Math.random() < 0.55;
  if (isCompany) {
    const name = `${pick(companyPrefixes)} ${pick(companyPrefixes)}`;
    return { name, title: 'Студия / Компания' };
  } else {
    const name = `${pick(firstNames)} ${pick(lastNames)}`;
    return { name, title: 'Частный мастер' };
  }
}

function makeReviews(): {rating:number, authorName:string, authorAvatar?:string, text:string}[] {
  const texts = [
    'Сделали всё в срок и качественно. Буду обращаться ещё!',
    'Отличная коммуникация, предложили классные решения.',
    'Есть замечания по срокам, но результат понравился.',
    'Понравился подход к деталям и аккуратность.',
    'Хорошее соотношение цена/качество. Рекомендую.',
  ];
  const count = rand(2,5);
  const arr = [];
  for (let i=0;i<count;i++){
    const fn = pick(firstNames);
    const ln = pick(lastNames);
    arr.push({
      rating: rand(4,5),
      authorName: `${fn} ${ln[0]}.`,
      authorAvatar: pick(unsplashAvatars),
      text: pick(texts),
    });
  }
  return arr;
}

const serviceDescTemplates = [
  '{service}: выезжаем на объект, фиксируем ТЗ, предлагаем 2–3 варианта решений. Включаем базовые спецификации и рекомендации по материалам.',
  '{service}: аккуратно и в срок. Работаем по договору, согласовываем этапы и смету заранее.',
  '{service}: детальные пояснения и оптимизация под бюджет. Предоставляем отчёт по итогам и рекомендации по дальнейшим шагам.',
  '{service}: учитываем нормы и требования. Обновляем документацию по мере согласований, сопровождаем до сдачи.',
  '{service}: прозрачные сроки, понятные этапы и контроль качества. Под ключ.',
];
function makeServiceDesc(serviceName: string) {
  const first = pick(serviceDescTemplates).replace('{service}', serviceName);
  const maybeSecond = Math.random() < 0.5 ? ' Поддерживаем связь и даём быстрые правки.' : '';
  return (first + maybeSecond).trim();
}

function makeAbout(catName: string, city: string) {
  const years = rand(3, 15);
  const templates = [
    'Опыт {years}+ лет. Делаем {cat} под ключ. Работаем в {city} и области. Соблюдаем сроки и бюджет.',
    'Команда инженеров и дизайнеров. {cat}. Подбираем решения под ваш бюджет. {city}.',
    'Проектируем и реализуем. {cat}. Авторское сопровождение на всех этапах. Работаем в {city}.',
    'Честные сметы и прозрачные этапы. {cat}. Гарантия на выполненные работы. {city}.',
    'Аккуратность и внимательность к деталям. {cat}. Опыт {years}+ лет. {city}.',
    'Сильное портфолио и живые отзывы. {cat}. Поможем с выбором материалов. {city}.',
    'Комплекс: от ТЗ до сдачи. {cat}. Гибкие условия и договор. {city}.',
    'Профессионально, в срок и без сюрпризов. {cat}. Работаем по договору. {city}.',
  ];
  const t = pick(templates);
  return t.replace('{years}', String(years)).replace('{cat}', catName.toLowerCase()).replace('{city}', city);
}

/** проекты с несколькими фото */
function makeProjectsWithImages(seed: number) {
  const ids = [
    'photo-1616596872547-6cebdfdbf1b9',
    'photo-1615870216515-4f0f1a9d1d5c',
    'photo-1556909190-eccf4a8bf97a',
    'photo-1519710164239-da123dc03ef4',
    'photo-1598555664790-8c647e8ca1bd',
    'photo-1522542550221-31fd19575a2d',
    'photo-1504805572947-34fad45aed93',
    'photo-1524758631624-e2822e304c36',
  ];
  const projectsCount = rand(3, 5);
  const projects = [];
  for (let p=0; p<projectsCount; p++) {
    const imagesCount = rand(2, 5);
    const images = [];
    for (let i=0; i<imagesCount; i++) {
      const pid = pick(ids);
      images.push({
        url: `https://images.unsplash.com/${pid}?q=80&w=1600&auto=format&fit=crop`,
        title: `Фото ${p+1}-${i+1}`,
        sort: i,
      });
    }
    projects.push({
      title: `Проект #${seed}-${p+1}`,
      images: { create: images },
    });
  }
  return projects;
}

/** ===================== SEED ===================== */
async function main() {
  // очистка (сначала дочерние сущности)
  await prisma.providerCategory.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.projectImage.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.provider.deleteMany({});
  await prisma.category.deleteMany({});

  // 1) создаём корни и детей с правильными level/fullSlug
  const createdRoots: { id:number; name:string; slug:string; fullSlug:string }[] = [];
  const createdChildren: { id:number; name:string; slug:string; fullSlug:string; parentId:number }[] = [];

  for (const root of categoriesTree) {
    const rootCat = await prisma.category.create({
      data: {
        name: root.name,
        slug: root.slug,
        level: 1,
        parentId: null,
        fullSlug: root.slug,
      },
      select: { id: true, name: true, slug: true, fullSlug: true },
    });
    createdRoots.push(rootCat);

    for (const child of root.children) {
      const ch = await prisma.category.create({
        data: {
          name: child.name,
          slug: child.slug,
          level: 2,
          parentId: rootCat.id,
          fullSlug: `${root.slug}/${child.slug}`,
        },
        select: { id: true, name: true, slug: true, fullSlug: true, parentId: true },
      });
      createdChildren.push(ch);
    }
  }

  const allCats = [...createdRoots, ...createdChildren];
  const leafCats = createdChildren.length ? createdChildren : createdRoots; // провайдеров в основном в листья

  // Вспомогательные индексы
  const bySlug = Object.fromEntries(allCats.map(c => [c.slug, c]));
  const byFullSlug = Object.fromEntries(allCats.map(c => [c.fullSlug, c]));

  // 2) генерим провайдеров
  const total = 50;
  for (let i=1; i<=total; i++) {
    const { name, title } = makeCompanyOrPerson();

    // 70% — подкатегория, 30% — корень
    const useLeaf = Math.random() < 0.7;
    const mainCat = useLeaf ? pick(leafCats) : pick(createdRoots);

    const city = pick(cities);
    const rating = Math.round((Math.random()*1.5 + 3.5)*10)/10; // 3.5..5.0
    const reviewsCount = rand(15, 180);
    const isVerified = Math.random() < 0.55;

    const passportVerified = isVerified ? Math.random() < 0.8 : Math.random() < 0.25;
    const worksByContract  = (title === 'Студия / Компания' ? Math.random() < 0.75 : Math.random() < 0.45) || isVerified;

    // пресеты услуг: сначала по slug выбранной категории, иначе по родителю, ещё иначе — пусто
    const preset = servicesBySlug[mainCat.slug]
      ?? (() => {
        // если выбрали лист, попробуем родителя по fullSlug "parent/child"
        const parentSlug = mainCat.fullSlug.includes('/') ? mainCat.fullSlug.split('/')[0] : null;
        return parentSlug ? (servicesBySlug[parentSlug] ?? []) : [];
      })();

    const providerPriceFrom = preset.length ? Math.min(...preset.map(s => s.priceFrom)) : undefined;

    const createdProvider = await prisma.provider.create({
      data: {
        name,
        slug: slugifyCompany(`${name}-${i}`),
        title,
        city,
        rating,
        reviewsCount,
        isVerified,
        passportVerified,
        worksByContract,
        priceFrom: providerPriceFrom,
        avatarUrl: pick(unsplashAvatars),
        about: makeAbout(mainCat.name, city),

        services: {
          create: preset.map(s => ({
            ...s,
            description: makeServiceDesc(s.name),
          })),
        },

        projects: { create: makeProjectsWithImages(i) },
      },
    });

    // связь с выбранной категорией
    await prisma.providerCategory.create({
      data: {
        providerId: createdProvider.id,
        categoryId: mainCat.id,
      },
    });

    // иногда добавляем вторую категорию (35%) — из всего множества, отличную от первой
    if (Math.random() < 0.35) {
      const extra = pick(allCats);
      if (extra.id !== mainCat.id) {
        await prisma.providerCategory.create({
          data: { providerId: createdProvider.id, categoryId: extra.id },
        });
      }
    }

    // отзывы 2–5 шт
    const reviews = makeReviews();
    await prisma.review.createMany({
      data: reviews.map(r => ({ ...r, providerId: createdProvider.id })),
    });
  }

  console.log('🌱 Seed done. Categories:', allCats.length, 'Providers: 50');
}

main()
  .catch(e => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
