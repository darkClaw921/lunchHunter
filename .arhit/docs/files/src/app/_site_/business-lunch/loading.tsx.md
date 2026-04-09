# src/app/(site)/business-lunch/loading.tsx

Скелет страницы /business-lunch. Повторяет page.tsx: mobile — header 'Бизнес-ланчи' + filter pills row (4 chips) + sort label + 5 карточек в колонку (rounded 2xl border p-4: левая колонка название/часы/курсы/rating+distance, правая — цена + 'сейчас подают' badge). Desktop — hero-баннер 260px (серый placeholder вместо orange gradient) + filter row 56px (6 chips + sort) + grid-cols-3 × 2 rows = 6 карточек с cover 180px и body (название + цена 28px + часы + курсы + distance/rating). Server component, использует Skeleton из @/components/ui.
