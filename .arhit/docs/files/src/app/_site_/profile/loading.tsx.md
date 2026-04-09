# src/app/(site)/profile/loading.tsx

Скелет страницы /profile. Повторяет page.tsx: avatar 80×80 rounded-full по центру + имя (22px) + subtitle (14px) + 6 SettingRow строк (rounded-xl border bg-surface-primary px-4 h-14, каждая: 36×36 rounded icon placeholder + label 55%/14 + chevron 20×20) + logout button 48px. Используется один layout для mobile и desktop (в shell колонка max-w 430px). Server component, Skeleton из @/components/ui.
