/**
 * Общие форматтеры для UI.
 */

/** Цена в рублях: 450 → "450 ₽". */
export function formatPrice(price: number): string {
  return `${price.toLocaleString("ru-RU")} ₽`;
}

/** Расстояние в метрах → "250м" / "1.2км" / "5км". */
export function formatDistance(meters: number | null): string {
  if (meters === null || !Number.isFinite(meters)) return "";
  if (meters < 1000) return `${Math.round(meters)}м`;
  const km = meters / 1000;
  if (km < 10) return `${km.toFixed(1).replace(".", ",")}км`;
  return `${Math.round(km)}км`;
}

/** Рейтинг: 4.6 → "4.6" / null → "—". */
export function formatRating(rating: number | null): string {
  if (rating === null || !Number.isFinite(rating)) return "—";
  return rating.toFixed(1);
}
