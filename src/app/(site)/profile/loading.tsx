import { Skeleton } from "@/components/ui/Skeleton";

/**
 * (site)/profile/loading.tsx — скелет страницы профиля.
 *
 * Повторяет реальный `page.tsx`:
 * - Avatar 80×80 по центру, имя (20/700) и subtitle
 * - 6 SettingRow: Избранные / История / Город / Уведомления / О приложении
 *   + placeholder 6-й строки
 * - Кнопка "Выйти" (если залогинен). Заглушка — тоже оставляем, т.к.
 *   на момент показа скелета ещё не знаем, есть сессия или нет.
 *
 * Каждая строка — высота 56px с rounded 12, border, h-9 w-9 иконка слева.
 *
 * Профиль — mobile-first (на desktop тоже занимает центр колонки 430px).
 * Используется один и тот же layout и для mobile, и для desktop.
 *
 * Server component.
 */
export default function ProfileLoading(): React.JSX.Element {
  return (
    <div className="flex flex-col px-5 pt-8 pb-4">
      {/* Avatar + name */}
      <div className="flex flex-col items-center gap-3">
        <Skeleton width={80} height={80} rounded="9999px" />
        <Skeleton width={140} height={22} />
        <Skeleton width={180} height={14} />
      </div>

      {/* 6 Setting rows */}
      <ul className="mt-8 flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i}>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-primary px-4 h-14">
              <Skeleton width={36} height={36} rounded="9999px" />
              <div className="flex-1">
                <Skeleton width="55%" height={14} />
              </div>
              <Skeleton width={20} height={20} rounded="9999px" />
            </div>
          </li>
        ))}
      </ul>

      {/* Logout button placeholder */}
      <div className="mt-6">
        <Skeleton height={48} rounded={12} />
      </div>
    </div>
  );
}
