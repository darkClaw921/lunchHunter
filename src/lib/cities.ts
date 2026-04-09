/**
 * Список поддерживаемых городов для профиля пользователя.
 * Используется как в client components (/profile/city CityPicker), так и
 * в server-side валидации API /api/profile/city.
 */
export const AVAILABLE_CITIES: readonly string[] = [
  "Москва",
  "Санкт-Петербург",
  "Екатеринбург",
  "Новосибирск",
  "Казань",
  "Нижний Новгород",
  "Краснодар",
];
