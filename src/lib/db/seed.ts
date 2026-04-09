/**
 * Seed script — naselenie БД реалистичными данными для разработки.
 *
 * Запуск: pnpm db:seed
 *
 * Seeded:
 * - 6 ресторанов Москвы (разные районы, координаты, категории)
 * - меню с категориями (включая ключевые слова "пиво", "суши" для FTS5)
 * - 3 бизнес-ланча с недельным расписанием
 */
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, sqlite } from "./client";
import {
  restaurants,
  menuCategories,
  menuItems,
  businessLunches,
  businessLunchDays,
  users,
} from "./schema";
import { hashPassword } from "../auth/password";

interface SeedCategory {
  name: string;
  items: { name: string; description: string; price: number }[];
}

interface SeedRestaurant {
  name: string;
  slug: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  description: string;
  priceAvg: number;
  rating: number;
  tags: string[];
  menu: SeedCategory[];
}

interface SeedBusinessLunch {
  restaurantSlug: string;
  name: string;
  price: number;
  timeFrom: string;
  timeTo: string;
  daysMask: number;
  days: { weekday: number; courses: string[] }[];
}

/** days_mask: bit 0 = Mon, bit 6 = Sun. Mon-Fri = 0b0011111 = 31 */
const MON_FRI_MASK = 0b0011111;

/**
 * LoremFlickr URL helper — стабильное placeholder-фото по тегам.
 * `lock` делает URL детерминированным (та же картинка при каждом запросе).
 *
 * Пример: `flickr("sushi", 42, 800, 600)`
 *   → `https://loremflickr.com/800/600/sushi?lock=42`
 */
function flickr(tags: string, lock: number, w = 800, h = 600): string {
  return `https://loremflickr.com/${w}/${h}/${encodeURIComponent(tags)}?lock=${lock}`;
}

/**
 * Маппинг slug ресторана → поисковые теги LoremFlickr для обложки и фото
 * блюд. Используется в insert-цикле ниже для генерации `cover_url` и
 * `photo_url` без ручного ввода URL-ов.
 */
const RESTAURANT_IMAGE_TAGS: Record<string, string> = {
  zharovnya: "russian,food",
  "tanuki-arbat": "sushi,japanese",
  "osteria-mario": "pizza,italian",
  "khinkalnaya-1": "khinkali,georgian",
  "burger-heroes": "burger,fastfood",
  "pho-bo-cafe": "pho,vietnamese",
};

const RESTAURANTS: SeedRestaurant[] = [
  {
    name: "Жаровня",
    slug: "zharovnya",
    category: "Русская кухня",
    address: "Москва, ул. Тверская, 12",
    lat: 55.764_5,
    lng: 37.605_5,
    phone: "+7 495 123-45-67",
    description: "Уютный ресторан русской кухни в центре города.",
    priceAvg: 1200,
    rating: 4.6,
    tags: ["русская", "обед", "бизнес-ланч"],
    menu: [
      {
        name: "Супы",
        items: [
          {
            name: "Борщ украинский",
            description: "Классический борщ со сметаной и чесночными пампушками",
            price: 390,
          },
          {
            name: "Солянка мясная",
            description: "Густой суп с копчёностями и оливками",
            price: 450,
          },
        ],
      },
      {
        name: "Горячее",
        items: [
          {
            name: "Пельмени домашние",
            description: "Ручная лепка, со сметаной или сливочным маслом",
            price: 520,
          },
          {
            name: "Бефстроганов",
            description: "Нежная говядина в сливочном соусе с картофельным пюре",
            price: 680,
          },
        ],
      },
      {
        name: "Напитки",
        items: [
          {
            name: "Пиво крафтовое светлое",
            description: "Разливное пиво местной пивоварни, 0.5 л",
            price: 320,
          },
          {
            name: "Морс клюквенный",
            description: "Домашний морс, 0.3 л",
            price: 180,
          },
        ],
      },
    ],
  },
  {
    name: "Тануки",
    slug: "tanuki-arbat",
    category: "Японская кухня",
    address: "Москва, ул. Новый Арбат, 15",
    lat: 55.752_5,
    lng: 37.591_2,
    phone: "+7 495 234-56-78",
    description: "Японский ресторан с широким выбором суши и роллов.",
    priceAvg: 1500,
    rating: 4.4,
    tags: ["японская", "суши", "роллы"],
    menu: [
      {
        name: "Суши",
        items: [
          {
            name: "Суши с лососем",
            description: "Классические суши со свежим лососем, 2 шт",
            price: 280,
          },
          {
            name: "Суши с угрём",
            description: "Суши с копчёным угрём и соусом унаги, 2 шт",
            price: 340,
          },
        ],
      },
      {
        name: "Роллы",
        items: [
          {
            name: "Филадельфия",
            description: "Ролл с лососем, сливочным сыром и огурцом",
            price: 590,
          },
          {
            name: "Калифорния",
            description: "Ролл с крабом, авокадо и икрой тобико",
            price: 560,
          },
        ],
      },
    ],
  },
  {
    name: "Osteria Mario",
    slug: "osteria-mario",
    category: "Итальянская кухня",
    address: "Москва, Большая Дмитровка, 32",
    lat: 55.767_8,
    lng: 37.613_4,
    phone: "+7 495 345-67-89",
    description: "Настоящая итальянская остерия с дровяной печью.",
    priceAvg: 1800,
    rating: 4.7,
    tags: ["итальянская", "пицца", "паста"],
    menu: [
      {
        name: "Пицца",
        items: [
          {
            name: "Маргарита",
            description: "Томатный соус, моцарелла, базилик",
            price: 650,
          },
          {
            name: "Четыре сыра",
            description: "Горгонзола, моцарелла, пармезан, таледжо",
            price: 890,
          },
        ],
      },
      {
        name: "Паста",
        items: [
          {
            name: "Карбонара",
            description: "Спагетти с гуанчале, яичным желтком и пекорино",
            price: 720,
          },
          {
            name: "Болоньезе",
            description: "Тальятелле с традиционным мясным соусом",
            price: 690,
          },
        ],
      },
    ],
  },
  {
    name: "Хинкальная №1",
    slug: "khinkalnaya-1",
    category: "Грузинская кухня",
    address: "Москва, Кутузовский проспект, 22",
    lat: 55.742_1,
    lng: 37.548_9,
    phone: "+7 495 456-78-90",
    description: "Аутентичная грузинская кухня и домашние хинкали.",
    priceAvg: 900,
    rating: 4.8,
    tags: ["грузинская", "хинкали", "хачапури"],
    menu: [
      {
        name: "Хинкали",
        items: [
          {
            name: "Хинкали с говядиной и свининой",
            description: "Традиционные хинкали ручной лепки, 5 шт",
            price: 450,
          },
          {
            name: "Хинкали с сыром",
            description: "Вегетарианские хинкали с сулугуни, 5 шт",
            price: 420,
          },
        ],
      },
      {
        name: "Хачапури",
        items: [
          {
            name: "Хачапури по-аджарски",
            description: "С сыром сулугуни и яичным желтком",
            price: 520,
          },
          {
            name: "Хачапури по-имеретински",
            description: "Закрытый пирог с сулугуни",
            price: 480,
          },
        ],
      },
      {
        name: "Напитки",
        items: [
          {
            name: "Пиво Аргo",
            description: "Грузинское пиво, 0.5 л",
            price: 290,
          },
        ],
      },
    ],
  },
  {
    name: "Burger Heroes",
    slug: "burger-heroes",
    category: "Бургерная",
    address: "Москва, ул. Покровка, 8",
    lat: 55.758_9,
    lng: 37.640_1,
    phone: "+7 495 567-89-01",
    description: "Авторские крафтовые бургеры и картофель фри.",
    priceAvg: 750,
    rating: 4.5,
    tags: ["бургеры", "фастфуд", "крафт"],
    menu: [
      {
        name: "Бургеры",
        items: [
          {
            name: "Классический чизбургер",
            description: "Говяжья котлета, чеддер, соус, булочка бриошь",
            price: 490,
          },
          {
            name: "Бургер с беконом",
            description: "Двойная говяжья котлета, бекон, BBQ соус",
            price: 590,
          },
        ],
      },
      {
        name: "Напитки",
        items: [
          {
            name: "Пиво IPA",
            description: "Крафтовое пиво от локальной пивоварни, 0.5 л",
            price: 350,
          },
          {
            name: "Лимонад домашний",
            description: "Свежий лимонад с мятой, 0.4 л",
            price: 220,
          },
        ],
      },
    ],
  },
  {
    name: "Pho Bo Café",
    slug: "pho-bo-cafe",
    category: "Вьетнамская кухня",
    address: "Москва, ул. Мясницкая, 24",
    lat: 55.763_3,
    lng: 37.635_2,
    phone: "+7 495 678-90-12",
    description: "Вьетнамское кафе с настоящим фо бо и спринг-роллами.",
    priceAvg: 800,
    rating: 4.3,
    tags: ["вьетнамская", "азиатская", "фо"],
    menu: [
      {
        name: "Супы",
        items: [
          {
            name: "Фо Бо",
            description: "Традиционный вьетнамский суп с говядиной и рисовой лапшой",
            price: 490,
          },
          {
            name: "Фо Га",
            description: "Суп с курицей и рисовой лапшой",
            price: 440,
          },
        ],
      },
      {
        name: "Закуски",
        items: [
          {
            name: "Спринг-роллы с креветкой",
            description: "Свежие роллы из рисовой бумаги, 4 шт",
            price: 390,
          },
        ],
      },
    ],
  },
];

const BUSINESS_LUNCHES: SeedBusinessLunch[] = [
  {
    restaurantSlug: "zharovnya",
    name: "Бизнес-ланч «Жаровня»",
    price: 450,
    timeFrom: "12:00",
    timeTo: "16:00",
    daysMask: MON_FRI_MASK,
    days: [
      { weekday: 1, courses: ["Борщ", "Котлета по-киевски с пюре", "Морс"] },
      { weekday: 2, courses: ["Суп-лапша", "Бефстроганов с рисом", "Компот"] },
      { weekday: 3, courses: ["Солянка", "Тефтели с гречкой", "Морс"] },
      { weekday: 4, courses: ["Щи", "Запечённая курица с овощами", "Компот"] },
      { weekday: 5, courses: ["Грибной суп", "Пельмени со сметаной", "Морс"] },
    ],
  },
  {
    restaurantSlug: "osteria-mario",
    name: "Pranzo di lavoro",
    price: 590,
    timeFrom: "12:00",
    timeTo: "15:30",
    daysMask: MON_FRI_MASK,
    days: [
      { weekday: 1, courses: ["Минестроне", "Спагетти карбонара", "Эспрессо"] },
      { weekday: 2, courses: ["Крем-суп из тыквы", "Лазанья", "Эспрессо"] },
      { weekday: 3, courses: ["Минестроне", "Ризотто с грибами", "Эспрессо"] },
      { weekday: 4, courses: ["Крем-суп из брокколи", "Равиоли", "Эспрессо"] },
      { weekday: 5, courses: ["Минестроне", "Пицца Маргарита", "Эспрессо"] },
    ],
  },
  {
    restaurantSlug: "pho-bo-cafe",
    name: "Lunch set Vietnam",
    price: 420,
    timeFrom: "11:30",
    timeTo: "16:00",
    daysMask: MON_FRI_MASK,
    days: [
      { weekday: 1, courses: ["Фо Бо", "Рис с курицей", "Чай"] },
      { weekday: 2, courses: ["Фо Га", "Рис со свининой", "Чай"] },
      { weekday: 3, courses: ["Фо Бо", "Лапша с овощами", "Чай"] },
      { weekday: 4, courses: ["Фо Га", "Рис с говядиной", "Чай"] },
      { weekday: 5, courses: ["Фо Бо", "Рис с креветками", "Чай"] },
    ],
  },
];

async function seedAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL ?? "admin@lunchhunter.local";
  const password = process.env.ADMIN_PASSWORD ?? "admin12345";
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .get();
  const passwordHash = await hashPassword(password);
  if (existing) {
    await db
      .update(users)
      .set({ passwordHash, role: "admin" })
      .where(eq(users.id, existing.id));
    console.log(`  ✓ Admin refreshed: ${email}`);
    return;
  }
  await db.insert(users).values({
    id: randomUUID(),
    email,
    passwordHash,
    name: "Administrator",
    role: "admin",
  });
  console.log(`  ✓ Admin created: ${email} / ${password}`);
}

async function main(): Promise<void> {
  console.log("Seeding database...");

  // Clear existing data (idempotent seed) — admin пользователь остаётся
  sqlite.exec(`
    DELETE FROM business_lunch_days;
    DELETE FROM business_lunches;
    DELETE FROM menu_items;
    DELETE FROM menu_categories;
    DELETE FROM restaurants;
  `);

  await seedAdmin();

  const slugToRestaurantId = new Map<string, number>();

  // Монотонный счётчик для уникальных lock-seed'ов у позиций меню,
  // чтобы картинки блюд разных категорий/ресторанов не дублировались.
  let menuPhotoSeed = 1000;

  for (let ri = 0; ri < RESTAURANTS.length; ri++) {
    const r = RESTAURANTS[ri]!;
    const imageTags = RESTAURANT_IMAGE_TAGS[r.slug] ?? "food,restaurant";
    const coverUrl = flickr(imageTags, 100 + ri, 1200, 800);

    const [inserted] = await db
      .insert(restaurants)
      .values({
        name: r.name,
        slug: r.slug,
        category: r.category,
        address: r.address,
        lat: r.lat,
        lng: r.lng,
        phone: r.phone,
        description: r.description,
        priceAvg: r.priceAvg,
        rating: r.rating,
        coverUrl,
        status: "published",
        tagsJson: JSON.stringify(r.tags),
      })
      .returning({ id: restaurants.id });

    if (!inserted) {
      throw new Error(`Failed to insert restaurant ${r.slug}`);
    }
    slugToRestaurantId.set(r.slug, inserted.id);

    for (let ci = 0; ci < r.menu.length; ci++) {
      const cat = r.menu[ci];
      if (!cat) continue;
      const [catRow] = await db
        .insert(menuCategories)
        .values({
          restaurantId: inserted.id,
          name: cat.name,
          sortOrder: ci,
        })
        .returning({ id: menuCategories.id });

      if (!catRow) {
        throw new Error(`Failed to insert category ${cat.name}`);
      }

      for (const item of cat.items) {
        const photoUrl = flickr(imageTags, menuPhotoSeed++, 800, 600);
        await db.insert(menuItems).values({
          restaurantId: inserted.id,
          categoryId: catRow.id,
          name: item.name,
          description: item.description,
          price: item.price,
          photoUrl,
          status: "active",
        });
      }
    }

    console.log(`  ✓ ${r.name} (slug: ${r.slug})`);
  }

  for (const bl of BUSINESS_LUNCHES) {
    const restaurantId = slugToRestaurantId.get(bl.restaurantSlug);
    if (restaurantId === undefined) {
      throw new Error(`Unknown restaurant slug: ${bl.restaurantSlug}`);
    }
    const [lunchRow] = await db
      .insert(businessLunches)
      .values({
        restaurantId,
        name: bl.name,
        price: bl.price,
        timeFrom: bl.timeFrom,
        timeTo: bl.timeTo,
        daysMask: bl.daysMask,
        status: "active",
      })
      .returning({ id: businessLunches.id });

    if (!lunchRow) {
      throw new Error(`Failed to insert lunch ${bl.name}`);
    }

    for (const day of bl.days) {
      await db.insert(businessLunchDays).values({
        lunchId: lunchRow.id,
        weekday: day.weekday,
        coursesJson: JSON.stringify(day.courses),
      });
    }

    console.log(`  ✓ Business lunch: ${bl.name}`);
  }

  const restaurantCount = sqlite
    .prepare("SELECT COUNT(*) as c FROM restaurants")
    .get() as { c: number };
  const menuCount = sqlite
    .prepare("SELECT COUNT(*) as c FROM menu_items")
    .get() as { c: number };
  const ftsPivoHit = sqlite
    .prepare("SELECT COUNT(*) as c FROM menu_items_fts WHERE menu_items_fts MATCH 'пиво'")
    .get() as { c: number };
  const ftsSushiHit = sqlite
    .prepare("SELECT COUNT(*) as c FROM menu_items_fts WHERE menu_items_fts MATCH 'суши'")
    .get() as { c: number };
  const rtreeCount = sqlite
    .prepare("SELECT COUNT(*) as c FROM restaurants_rtree")
    .get() as { c: number };

  console.log("");
  console.log(`Restaurants: ${restaurantCount.c}`);
  console.log(`Menu items: ${menuCount.c}`);
  console.log(`FTS5 'пиво' matches: ${ftsPivoHit.c}`);
  console.log(`FTS5 'суши' matches: ${ftsSushiHit.c}`);
  console.log(`R*Tree rows: ${rtreeCount.c}`);

  sqlite.close();
  console.log("Seed complete.");
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
