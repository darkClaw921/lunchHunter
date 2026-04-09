"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { Star, X } from "lucide-react";
import type { MapMarker } from "@/components/map/MapView";
import { MapView } from "@/components/map/MapView";
import { navigate, supportsViewTransitions } from "@/lib/transitions";
import { usePrefetchImage } from "@/lib/hooks/usePrefetchImage";
import {
  useActiveVT,
  ACTIVE_RESTAURANT_VT_STORAGE_KEY,
} from "@/lib/hooks/useActiveVT";
import {
  formatPrice,
  formatDistance,
  formatRating,
} from "@/lib/utils/format";
import type { SearchResultItem } from "@/app/api/search/route";

interface MobileSearchResultsProps {
  query: string;
  results: SearchResultItem[];
}

/**
 * Мобильный список результатов поиска с миниатюрой карты справа
 * в каждой карточке. По клику на миниатюру открывается модальное
 * окно с интерактивной картой — закрывается кликом по фону.
 *
 * Каждая карточка — {@link MobileSearchResultCard} с чистым {@link Link}
 * из `next/link` поверх левой (непрозрачной) зоны. По ANIMATIONS_GUIDE
 * §9.5.3 `viewTransitionName` ставится **только на активной карточке**
 * через `useActiveVT` + `flushSync`.
 *
 * В Telegram WebView (без VT API) fallback через `navigate()`, который
 * запускает manualFlipMorph — на мобиле Telegram это критичный путь.
 */
export function MobileSearchResults({
  query,
  results,
}: MobileSearchResultsProps): React.JSX.Element {
  const [selected, setSelected] = useState<SearchResultItem | null>(null);
  const { activate, isActive } = useActiveVT<number>(
    ACTIVE_RESTAURANT_VT_STORAGE_KEY,
  );

  const close = useCallback(() => setSelected(null), []);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    // Блокируем прокрутку фона пока открыта модалка.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [selected, close]);

  return (
    <>
      <div className="px-5 mt-3 flex flex-col gap-3">
        {results.map((r) => (
          <MobileSearchResultCard
            key={r.itemId}
            result={r}
            query={query}
            isActive={isActive(r.restaurantId)}
            onActivate={() => activate(r.restaurantId)}
            onOpenMap={() => setSelected(r)}
          />
        ))}
      </div>

      {/* Bottom-sheet карта (как на странице ресторана) */}
      {selected ? (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-label={`Карта: ${selected.restaurantName}`}
          onClick={close}
        >
          <div
            className="mt-auto flex flex-col bg-surface-primary rounded-t-2xl overflow-hidden"
            style={{ height: "70dvh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-light shrink-0">
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-fg-primary truncate">
                  {selected.restaurantName}
                </div>
                <div className="text-[12px] text-fg-secondary truncate">
                  {selected.address}
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                className="ml-3 shrink-0 h-8 w-8 grid place-items-center rounded-full bg-surface-secondary text-fg-secondary"
                aria-label="Закрыть карту"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Map */}
            <div className="flex-1 relative">
              <MapView
                markers={[
                  {
                    id: selected.itemId,
                    lat: selected.lat,
                    lng: selected.lng,
                    label: selected.restaurantName,
                    position: selected.itemName,
                    price: selected.price,
                    distanceMeters: selected.distanceMeters,
                    href: `/restaurant/${selected.restaurantSlug}?q=${encodeURIComponent(
                      query,
                    )}`,
                  } satisfies MapMarker,
                ]}
                center={{ lat: selected.lat, lng: selected.lng }}
                zoom={16}
                className="absolute inset-0"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

interface MobileSearchResultCardProps {
  result: SearchResultItem;
  query: string;
  isActive: boolean;
  onActivate: () => void;
  onOpenMap: () => void;
}

/**
 * Отдельный компонент карточки — имеет свой `linkRef` для FLIP fallback.
 * `viewTransitionName` выставляется условно: только если `isActive === true`.
 */
function MobileSearchResultCard({
  result: r,
  query,
  isActive,
  onActivate,
  onOpenMap,
}: MobileSearchResultCardProps): React.JSX.Element {
  const router = useRouter();
  const linkRef = useRef<HTMLAnchorElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const prefetchImage = usePrefetchImage();
  const href = `/restaurant/${r.restaurantSlug}?q=${encodeURIComponent(query)}`;

  const handleClick = (event: ReactMouseEvent<HTMLAnchorElement>): void => {
    onActivate();
    if (supportsViewTransitions()) return;
    event.preventDefault();
    // Source — внешняя карточка целиком (а не overlay-link), чтобы FLIP
    // клонировал визуально осмысленный прямоугольник.
    navigate(router, href, {
      sourceEl: cardRef.current,
      targetSelector: `[data-vt-target="restaurant-image-${r.restaurantId}"]`,
    });
  };

  const handlePrefetch = (): void => {
    prefetchImage(r.restaurantCoverUrl);
  };

  const cardVtStyle = isActive
    ? { viewTransitionName: `restaurant-image-${r.restaurantId}` }
    : undefined;
  const titleVtStyle = isActive
    ? { viewTransitionName: `restaurant-title-${r.restaurantId}` }
    : undefined;

  return (
    // Внешний врапер держит shadow-hover: hover-тень через ::after не
    // обрезается overflow-hidden внутреннего div (что критично для blur
    // и маски MapThumbnail). rounded-xl здесь нужен чтобы ::after
    // унаследовал border-radius через `border-radius: inherit`.
    <div className="rounded-xl shadow-hover">
      <div
        ref={cardRef}
        data-search-card
        style={cardVtStyle}
        className="relative overflow-hidden rounded-xl border border-border bg-surface-primary min-h-[140px]"
      >
        {/* Карта-миниатюра (фон карточки справа) — кликабельна
            в видимой правой зоне, открывает модалку */}
        <MapThumbnail lat={r.lat} lng={r.lng} onOpen={onOpenMap} />

        {/* Контент карточки — Link поверх левой + blur-зоны.
            Абсолютно спозиционирован с правым отступом, чтобы
            не перекрывать видимую (неразмытую) часть карты. */}
        <Link
          ref={linkRef}
          href={href}
          onClick={handleClick}
          onPointerEnter={handlePrefetch}
          onPointerDown={handlePrefetch}
          className="absolute inset-y-0 left-0 right-[110px] z-10 block p-4"
        >
          <div className="min-w-0">
            <div className="text-[12px] font-medium text-fg-muted min-h-[1rem]">
              {r.restaurantName}
            </div>
            <div
              style={titleVtStyle}
              className="text-[15px] font-semibold text-fg-primary mt-0.5 line-clamp-1 min-h-[1.25rem]"
            >
              {r.itemName}
            </div>
            <div className="flex items-center gap-2 mt-2 text-[12px] text-fg-secondary">
              <span className="inline-flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                {formatRating(r.rating)}
              </span>
              {r.distanceMeters !== null ? (
                <span className="inline-flex items-center h-5 px-2 rounded-full bg-accent-light text-accent text-[11px] font-medium">
                  {formatDistance(r.distanceMeters)}
                </span>
              ) : null}
            </div>
            <div className="text-[20px] font-bold text-accent leading-none mt-3">
              {formatPrice(r.price)}
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

/**
 * Лёгкая миниатюра карты на статичных OSM-тайлах — без maplibre-gl
 * инстанса на каждую карточку. Слева плавно размывается в фон карточки
 * через gradient + backdrop-filter, чтобы переход был бесшовным.
 */
function MapThumbnail({
  lat,
  lng,
  onOpen,
}: {
  lat: number;
  lng: number;
  onOpen: () => void;
}): React.JSX.Element {
  const W = 340;
  const H = 140;
  const z = 15;
  const n = 1 << z;
  const worldPx = 256 * n;

  const px = ((lng + 180) / 360) * worldPx;
  const latRad = (lat * Math.PI) / 180;
  const py =
    ((1 -
      Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) /
      2) *
    worldPx;

  // Смещаем геометрический центр карты вправо, чтобы маркер был
  // в видимой (неразмытой) части миниатюры.
  const MARKER_X_RATIO = 0.78;
  const markerScreenX = W * MARKER_X_RATIO;

  // Левый верхний угол видимой области (в мировых пикселях)
  const x0 = px - markerScreenX;
  const y0 = py - H / 2;

  const tileX0 = Math.floor(x0 / 256);
  const tileY0 = Math.floor(y0 / 256);
  const tileX1 = Math.floor((x0 + W) / 256);
  const tileY1 = Math.floor((y0 + H) / 256);

  const tiles: { x: number; y: number; left: number; top: number }[] = [];
  for (let tx = tileX0; tx <= tileX1; tx++) {
    for (let ty = tileY0; ty <= tileY1; ty++) {
      tiles.push({
        x: tx,
        y: ty,
        left: tx * 256 - x0,
        top: ty * 256 - y0,
      });
    }
  }

  return (
    <button
      type="button"
      aria-label="Открыть карту"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onOpen();
      }}
      className="absolute top-0 right-0 bottom-0 overflow-hidden"
      style={{ width: W, height: "100%" }}
    >
      {/* Тайлы OSM */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "#e8edf2" }}
      >
        {tiles.map((t) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${t.x}-${t.y}`}
            src={`https://tile.openstreetmap.org/${z}/${t.x}/${t.y}.png`}
            alt=""
            aria-hidden="true"
            width={256}
            height={256}
            loading="lazy"
            decoding="async"
            draggable={false}
            style={{
              position: "absolute",
              left: t.left,
              top: t.top,
              width: 256,
              height: 256,
              maxWidth: "none",
              userSelect: "none",
            }}
          />
        ))}
      </div>

      {/* Маркер в видимой (правой) части миниатюры */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          left: `${MARKER_X_RATIO * 100}%`,
          top: "50%",
          width: 16,
          height: 16,
          borderRadius: "9999px",
          background: "#FF5C00",
          border: "3px solid #ffffff",
          boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Бесшовный переход в левую часть карточки:
          blur + градиентная маска + белый gradient поверх */}
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[75%] pointer-events-none"
        style={{
          backdropFilter: "blur(7px)",
          WebkitBackdropFilter: "blur(7px)",
          WebkitMaskImage:
            "linear-gradient(to right, black 0%, black 40%, transparent 100%)",
          maskImage:
            "linear-gradient(to right, black 0%, black 40%, transparent 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-full pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, var(--color-surface-primary, #ffffff) 0%, var(--color-surface-primary, #ffffff) 15%, rgba(255,255,255,0.85) 35%, rgba(255,255,255,0.4) 60%, rgba(255,255,255,0) 90%)",
        }}
      />
    </button>
  );
}
