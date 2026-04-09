# src/app/(site)/map/loading.tsx

Скелет страницы /map. Повторяет раскладку MobileMapView: строка поиска сверху (padding 5, top 4) + серый прямоугольник карты во flex-1 min-h 55vh (эмулирует MapView) с floating radius selector pill вверху + bottom-sheet с 2 строками ближайших результатов (border+rounded 12, заголовок + subtitle + distance badge). Mobile-first — /map не имеет desktop варианта (см. page.tsx). Server component, использует Skeleton из @/components/ui.
