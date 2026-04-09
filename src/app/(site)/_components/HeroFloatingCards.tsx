import { Clock, MapPin, Star } from "lucide-react";
import type { CSSProperties } from "react";
import type {
  DesktopHomeHeroLunch,
  DesktopHomeHeroMenuItem,
  DesktopHomeRestaurant,
} from "./DesktopHome";
import { formatPrice, formatRating } from "@/lib/utils/format";

export interface HeroFloatingCardsProps {
  restaurants: DesktopHomeRestaurant[];
  menuItems?: DesktopHomeHeroMenuItem[];
  lunches?: DesktopHomeHeroLunch[];
}

type CardKind = "restaurant" | "menu" | "lunch" | "map";

interface SlotStyle {
  kind: CardKind;
  /** Позиция на hero-контейнере (absolute, %/px) */
  position: CSSProperties;
  /** Угол наклона, передаётся как CSS-переменная --tilt */
  tilt: string;
  /** CSS-класс анимации (float A/B/C) */
  animationClass: "hero-card" | "hero-card-b" | "hero-card-c";
  /** Размер карточки */
  size: { w: number; h: number };
  /** Дополнительные классы (напр. hidden на маленьких экранах) */
  hideBelow?: "lg" | "xl";
}

/**
 * Слоты расположения фоновых карточек в hero-секции.
 * Карточки расположены по периметру так, чтобы не перекрывать центральный
 * блок с заголовком и поисковой строкой (он закрыт radial-gradient оверлеем).
 */
const SLOTS: SlotStyle[] = [
  // Левая колонка
  {
    kind: "restaurant",
    position: { top: "6%", left: "3%" },
    tilt: "-9deg",
    animationClass: "hero-card",
    size: { w: 180, h: 220 },
  },
  {
    kind: "menu",
    position: { top: "52%", left: "1%" },
    tilt: "7deg",
    animationClass: "hero-card-b",
    size: { w: 175, h: 215 },
    hideBelow: "lg",
  },
  {
    kind: "lunch",
    position: { top: "22%", left: "19%" },
    tilt: "-4deg",
    animationClass: "hero-card-c",
    size: { w: 200, h: 150 },
    hideBelow: "xl",
  },
  // Правая колонка
  {
    kind: "menu",
    position: { top: "5%", right: "4%" },
    tilt: "11deg",
    animationClass: "hero-card-c",
    size: { w: 185, h: 225 },
  },
  {
    kind: "map",
    position: { top: "50%", right: "2%" },
    tilt: "-10deg",
    animationClass: "hero-card",
    size: { w: 200, h: 170 },
    hideBelow: "lg",
  },
  {
    kind: "lunch",
    position: { top: "68%", right: "22%" },
    tilt: "6deg",
    animationClass: "hero-card-b",
    size: { w: 200, h: 150 },
    hideBelow: "xl",
  },
];

const FALLBACK_GRADIENTS = [
  "linear-gradient(135deg, #ff8a3d 0%, #ff5c00 100%)",
  "linear-gradient(135deg, #ffc371 0%, #ff5f6d 100%)",
  "linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)",
  "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)",
  "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)",
  "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
];

const CARD_SHELL =
  "absolute rounded-2xl bg-white shadow-[0_20px_60px_-15px_rgba(255,92,0,0.25),0_8px_20px_-8px_rgba(0,0,0,0.12)] ring-1 ring-black/5 overflow-hidden will-change-transform";

/** Карточка ресторана — обложка + имя + рейтинг + категория. */
function RestaurantCard({
  restaurant,
  gradient,
}: {
  restaurant: DesktopHomeRestaurant | undefined;
  gradient: string;
}): React.JSX.Element {
  const cover = restaurant?.coverUrl ?? null;
  return (
    <>
      <div
        className="h-[65%] w-full overflow-hidden"
        style={{ background: cover ? undefined : gradient }}
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full grid place-items-center text-white/90 text-3xl">
            🍽
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 px-3 py-2">
        <div className="text-[12px] font-semibold text-fg-primary truncate">
          {restaurant?.name ?? "Ресторан рядом"}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-fg-secondary">
          <Star
            className="h-3 w-3 fill-amber-400 text-amber-400"
            aria-hidden="true"
          />
          <span className="font-medium">
            {formatRating(restaurant?.rating ?? 4.7)}
          </span>
          <span className="text-fg-muted">·</span>
          <span className="truncate">{restaurant?.category ?? "Кафе"}</span>
        </div>
      </div>
    </>
  );
}

/** Карточка позиции меню — фото блюда + имя + цена accent + ресторан. */
function MenuCard({
  item,
  gradient,
}: {
  item: DesktopHomeHeroMenuItem | undefined;
  gradient: string;
}): React.JSX.Element {
  const photo = item?.photoUrl ?? null;
  return (
    <>
      <div
        className="h-[62%] w-full overflow-hidden"
        style={{ background: photo ? undefined : gradient }}
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full grid place-items-center text-white/90 text-3xl">
            🍝
          </div>
        )}
      </div>
      <div className="flex flex-col gap-0.5 px-3 py-2">
        <div className="text-[12px] font-semibold text-fg-primary line-clamp-1">
          {item?.name ?? "Паста карбонара"}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] font-bold text-accent">
            {formatPrice(item?.price ?? 490)}
          </span>
          <span className="text-[10px] text-fg-muted truncate">
            {item?.restaurantName ?? "Ресторан"}
          </span>
        </div>
      </div>
    </>
  );
}

/** Карточка бизнес-ланча — accent-заголовок + название + цена + время. */
function LunchCard({
  lunch,
}: {
  lunch: DesktopHomeHeroLunch | undefined;
}): React.JSX.Element {
  return (
    <>
      <div className="h-[38%] w-full bg-gradient-to-br from-accent to-accent-dark px-3 py-2 flex items-start justify-between">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-white">
            Бизнес-ланч
          </span>
        </div>
        <span className="text-[18px] leading-none">🍽</span>
      </div>
      <div className="flex flex-col gap-1 px-3 py-2">
        <div className="text-[12px] font-semibold text-fg-primary line-clamp-1">
          {lunch?.name ?? "Сет дня"}
        </div>
        <div className="text-[10px] text-fg-muted truncate">
          {lunch?.restaurantName ?? "Ресторан"}
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <span className="text-[14px] font-bold text-accent">
            от {formatPrice(lunch?.price ?? 390)}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-fg-secondary">
            <Clock className="h-2.5 w-2.5" aria-hidden="true" />
            {lunch?.timeFrom ?? "12:00"}–{lunch?.timeTo ?? "16:00"}
          </span>
        </div>
      </div>
    </>
  );
}

/**
 * Карточка-кусок карты — SVG-имитация карты с дорогами, кварталами и пином.
 * Без загрузки MapLibre, чисто декоративный элемент.
 */
function MapCard(): React.JSX.Element {
  return (
    <>
      <div className="relative h-[70%] w-full overflow-hidden bg-[#eaf4ef]">
        <svg
          viewBox="0 0 200 140"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          {/* Кварталы */}
          <rect x="0" y="0" width="200" height="140" fill="#eaf4ef" />
          <rect x="10" y="10" width="60" height="40" fill="#dbeadf" rx="2" />
          <rect x="80" y="12" width="50" height="34" fill="#dbeadf" rx="2" />
          <rect x="140" y="6" width="55" height="46" fill="#dbeadf" rx="2" />
          <rect x="6" y="60" width="44" height="36" fill="#dbeadf" rx="2" />
          <rect x="60" y="58" width="70" height="42" fill="#dbeadf" rx="2" />
          <rect x="140" y="64" width="56" height="38" fill="#dbeadf" rx="2" />
          <rect x="14" y="106" width="66" height="30" fill="#dbeadf" rx="2" />
          <rect x="92" y="110" width="100" height="28" fill="#dbeadf" rx="2" />

          {/* Вода */}
          <path
            d="M 0 80 Q 40 74 75 86 T 150 78 T 200 82 L 200 100 L 0 100 Z"
            fill="#c7e4f0"
            opacity="0.55"
          />

          {/* Улицы */}
          <line
            x1="0"
            y1="54"
            x2="200"
            y2="54"
            stroke="#ffffff"
            strokeWidth="3"
          />
          <line
            x1="0"
            y1="102"
            x2="200"
            y2="102"
            stroke="#ffffff"
            strokeWidth="3"
          />
          <line
            x1="75"
            y1="0"
            x2="75"
            y2="140"
            stroke="#ffffff"
            strokeWidth="3"
          />
          <line
            x1="135"
            y1="0"
            x2="135"
            y2="140"
            stroke="#ffffff"
            strokeWidth="3"
          />
          {/* Подсвеченный маршрут */}
          <path
            d="M 30 120 L 30 54 L 100 54 L 100 30"
            stroke="#ff5c00"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="4 3"
            fill="none"
          />
        </svg>

        {/* Пин */}
        <div className="absolute left-1/2 top-[30%] -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <div className="absolute inset-0 -m-2 rounded-full bg-accent/25 animate-ping" />
            <div className="relative grid h-7 w-7 place-items-center rounded-full bg-accent shadow-lg ring-2 ring-white">
              <MapPin
                className="h-3.5 w-3.5 text-white"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-0.5 px-3 py-2">
        <div className="text-[11px] font-semibold text-fg-primary">
          Рядом с тобой
        </div>
        <div className="text-[10px] text-fg-secondary">
          12 мест в радиусе 500 м
        </div>
      </div>
    </>
  );
}

/**
 * HeroFloatingCards — декоративный фон для hero главной страницы.
 *
 * Рендерит наклонённые карточки четырёх типов — restaurant / menu / lunch /
 * map — с бесконечной float-анимацией и fade-in на загрузке. Карточки
 * используют реальные данные витрины (рестораны, позиции меню, бизнес-ланчи),
 * кусок карты — декоративный SVG с пином. Респектит `prefers-reduced-motion`.
 *
 * Карточки расположены абсолютно по периметру hero-секции, центр закрыт
 * radial-gradient оверлеем в `DesktopHome`, чтобы h1 и поисковая строка
 * оставались читаемыми.
 */
export function HeroFloatingCards({
  restaurants,
  menuItems = [],
  lunches = [],
}: HeroFloatingCardsProps): React.JSX.Element {
  // Индексы-счётчики для разных типов, чтобы брать разные данные под каждый слот.
  const counters: Record<CardKind, number> = {
    restaurant: 0,
    menu: 0,
    lunch: 0,
    map: 0,
  };

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 select-none"
    >
      {SLOTS.map((slot, i) => {
        const idx = counters[slot.kind]++;
        const gradient = FALLBACK_GRADIENTS[i % FALLBACK_GRADIENTS.length]!;
        const hideClass =
          slot.hideBelow === "xl"
            ? "hidden xl:block"
            : slot.hideBelow === "lg"
              ? "hidden lg:block"
              : "";

        const style: CSSProperties = {
          ...slot.position,
          width: `${slot.size.w}px`,
          height: `${slot.size.h}px`,
          ["--tilt" as string]: slot.tilt,
        };

        let content: React.JSX.Element;
        switch (slot.kind) {
          case "restaurant":
            content = (
              <RestaurantCard
                restaurant={restaurants[idx % Math.max(restaurants.length, 1)]}
                gradient={gradient}
              />
            );
            break;
          case "menu":
            content = (
              <MenuCard
                item={menuItems[idx % Math.max(menuItems.length, 1)]}
                gradient={gradient}
              />
            );
            break;
          case "lunch":
            content = (
              <LunchCard
                lunch={lunches[idx % Math.max(lunches.length, 1)]}
              />
            );
            break;
          case "map":
            content = <MapCard />;
            break;
        }

        return (
          <div
            key={i}
            style={style}
            className={`${CARD_SHELL} ${hideClass} ${slot.animationClass}`}
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}

export default HeroFloatingCards;
