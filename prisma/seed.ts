// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const categoriesSeed = [
  { name: 'Дизайнеры',               slug: 'designers' },
  { name: 'Инженеры-проектировщики', slug: 'engineers' },
  { name: 'Монтажники',              slug: 'installers' },
  { name: 'Потолочники',             slug: 'ceilings' },
  { name: 'Светорасчёт',             slug: 'lighting' },
  { name: 'Электрики',               slug: 'electricians' },
  { name: 'Инженерные системы',      slug: 'engineering-systems' },
];

const cities = [
  'Москва', 'Санкт-Петербург', 'Нижний Новгород', 'Казань',
  'Екатеринбург', 'Новосибирск', 'Ростов-на-Дону', 'Краснодар'
];

const companyPrefixes = ['Atelier', 'Studio', 'Forma', 'Lux', 'Pro', 'Master', 'Craft', 'Concept', 'Design', 'Light', 'Electro'];
const firstNames = ['Алексей','Марина','Иван','Ксения','Дмитрий','Анна','Павел','Юлия','Сергей','Елена','Никита','Ольга','Роман','Наталья','Виктор'];
const lastNames  = ['Иванов','Петрова','Смирнов','Кузнецова','Егоров','Федорова','Соколов','Павлова','Козлов','Соловьёва','Орлов','Васильева'];

const servicesByCategory: Record<string, {name:string, priceFrom:number}[]> = {
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
};

const unsplashAvatars = [
  // портреты
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

function makeProjects(seed:number) {
  // 6–10 фото портфолио
  const imgs = [
    'photo-1616596872547-6cebdfdbf1b9',
    'photo-1615870216515-4f0f1a9d1d5c',
    'photo-1556909190-eccf4a8bf97a',
    'photo-1519710164239-da123dc03ef4',
    'photo-1598555664790-8c647e8ca1bd',
    'photo-1522542550221-31fd19575a2d',
    'photo-1504805572947-34fad45aed93',
    'photo-1524758631624-e2822e304c36',
  ];
  const count = rand(6,10);
  const arr = [];
  for (let i=0;i<count;i++) {
    const pid = pick(imgs);
    arr.push({
      title: `Проект #${seed}-${i+1}`,
      imageUrl: `https://images.unsplash.com/${pid}?q=80&w=1200&auto=format&fit=crop`,
    });
  }
  return arr;
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

/** ---------- НОВОЕ: шаблоны и генератор описания ---------- */
const aboutTemplates = [
  'Опыт {years}+ лет. Делаем {cat} под ключ. Работаем в {city} и области. Соблюдаем сроки и бюджет.',
  'Команда инженеров и дизайнеров. {cat}. Подбираем решения под ваш бюджет. {city}.',
  'Проектируем и реализуем. {cat}. Авторское сопровождение на всех этапах. Работаем в {city}.',
  'Честные сметы и прозрачные этапы. {cat}. Гарантия на выполненные работы. {city}.',
  'Аккуратность и внимательность к деталям. {cat}. Опыт {years}+ лет. {city}.',
  'Сильное портфолио и живые отзывы. {cat}. Поможем с выбором материалов. {city}.',
  'Комплекс: от ТЗ до сдачи. {cat}. Гибкие условия и договор. {city}.',
  'Профессионально, в срок и без сюрпризов. {cat}. Работаем по договору. {city}.',
];

function makeAbout(catName: string, city: string) {
  const years = rand(3, 15);
  const t = pick(aboutTemplates);
  return t
    .replace('{years}', String(years))
    .replace('{cat}', catName.toLowerCase())
    .replace('{city}', city);
}
/** -------------------------------------------------------- */

async function main() {
  // очистка (сначала дочерние)
  await prisma.providerCategory.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.provider.deleteMany({});
  await prisma.category.deleteMany({});

  // категории
  await prisma.category.createMany({ data: categoriesSeed });

  const categories = await prisma.category.findMany();
  const catIndex = Object.fromEntries(categories.map(c => [c.slug, c.id]));

  // ~50 провайдеров
  const total = 50;
  for (let i=1; i<=total; i++) {
    const { name, title } = makeCompanyOrPerson();

    // равномерно разбрасываем по категориям
    const mainCat = categories[i % categories.length];
    const catSlug = mainCat.slug as keyof typeof servicesByCategory;

    const city = pick(cities);
    const rating = Math.round((Math.random()*1.5 + 3.5)*10)/10; // 3.5..5.0
    const reviewsCount = rand(15, 180);
    const isVerified = Math.random() < 0.55;

    // Новые флаги:
    const passportVerified = isVerified ? Math.random() < 0.8 : Math.random() < 0.25;
    const worksByContract  = (title === 'Студия / Компания' ? Math.random() < 0.75 : Math.random() < 0.45) || isVerified;

    // Прайс «от» из сервисов
    const servicesPreset = servicesByCategory[catSlug] || [];
    const providerPriceFrom = servicesPreset.length
      ? Math.min(...servicesPreset.map(s => s.priceFrom))
      : undefined;

    const created = await prisma.provider.create({
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

        // НОВОЕ: короткое описание
        about: makeAbout(mainCat.name, city),

        services: { create: servicesPreset.map(s => ({ ...s })) },
        projects: { create: makeProjects(i) },
      },
    });

    // связь с основной категорией
    await prisma.providerCategory.create({
      data: {
        providerId: created.id,
        categoryId: catIndex[mainCat.slug],
      },
    });

    // иногда добавляем вторую категорию (35%)
    if (Math.random() < 0.35) {
      const extra = pick(categories);
      if (extra.id !== catIndex[mainCat.slug]) {
        await prisma.providerCategory.create({
          data: { providerId: created.id, categoryId: extra.id },
        });
      }
    }

    // отзывы 2–5 шт
    const reviews = makeReviews();
    await prisma.review.createMany({
      data: reviews.map(r => ({ ...r, providerId: created.id })),
    });
  }

  console.log('🌱 Seed done');
}

main()
  .catch(e => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
