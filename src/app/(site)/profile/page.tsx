import {
  Heart,
  Clock,
  MapPin,
  Bell,
  Info,
  ChevronRight,
  LogOut,
} from "lucide-react";
import Image from "next/image";
import { ProfileNotificationsToggle } from "./_components/ProfileNotificationsToggle";
import { validateSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * Profile — читает текущего пользователя из сессии (cookie-based, custom).
 *
 * Если пользователь залогинен через Telegram (есть users.tgId) — показываем
 * Telegram name/username и avatar_url; иначе показываем email/имя либо
 * гостевой placeholder (предложение войти через TG-бота).
 */
const GUEST_USER = {
  name: "Гость",
  subtitle: "Войдите через Telegram-бота",
  initials: "?",
  city: "Москва",
  favoritesCount: 0,
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    const first = parts[0] ?? "";
    return first.slice(0, 2).toUpperCase();
  }
  const a = parts[0] ?? "";
  const b = parts[1] ?? "";
  return `${a.charAt(0)}${b.charAt(0)}`.toUpperCase();
}

export default async function ProfilePage(): Promise<React.JSX.Element> {
  const session = await validateSession();
  const user = session?.user ?? null;

  const displayName = user?.name ?? GUEST_USER.name;
  const subtitle = user
    ? user.tgUsername
      ? `@${user.tgUsername}`
      : (user.email ?? "Telegram-пользователь")
    : GUEST_USER.subtitle;
  const initials = user ? getInitials(displayName) : GUEST_USER.initials;
  const avatarUrl = user?.avatarUrl ?? null;

  return (
    <div className="flex flex-col px-5 pt-8 pb-4">
      {/* Avatar + name */}
      <div className="flex flex-col items-center">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            width={80}
            height={80}
            className="h-20 w-20 rounded-full object-cover shadow-md"
            unoptimized
          />
        ) : (
          <div className="h-20 w-20 rounded-full bg-accent text-white grid place-items-center text-2xl font-bold shadow-md">
            {initials}
          </div>
        )}
        <h1 className="text-[20px] font-bold text-fg-primary mt-3">
          {displayName}
        </h1>
        <div className="text-[13px] text-fg-muted mt-0.5">{subtitle}</div>
        {user?.tgId ? (
          <div className="mt-2 inline-flex items-center h-5 px-2 rounded-full bg-accent-light text-accent text-[11px] font-semibold">
            Telegram
          </div>
        ) : null}
      </div>

      {/* Settings list */}
      <ul className="mt-8 flex flex-col gap-2">
        <SettingRow
          icon={<Heart className="h-5 w-5" />}
          label="Избранные заведения"
          rightExtra={
            <span className="inline-flex items-center h-5 px-2 rounded-full bg-accent text-white text-[11px] font-semibold">
              {GUEST_USER.favoritesCount}
            </span>
          }
          chevron
        />
        <SettingRow
          icon={<Clock className="h-5 w-5" />}
          label="История поиска"
          chevron
        />
        <SettingRow
          icon={<MapPin className="h-5 w-5" />}
          label="Город"
          rightExtra={
            <span className="text-[13px] text-fg-secondary">
              {GUEST_USER.city}
            </span>
          }
          chevron
        />
        <SettingRow
          icon={<Bell className="h-5 w-5" />}
          label="Уведомления"
          rightExtra={<ProfileNotificationsToggle />}
        />
        <SettingRow
          icon={<Info className="h-5 w-5" />}
          label="О приложении"
          chevron
        />
      </ul>

      {user ? (
        <button
          type="button"
          className="mt-6 inline-flex items-center justify-center gap-2 h-12 rounded-xl border border-border bg-surface-primary text-error font-medium hover:bg-error/5 transition-colors"
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
          Выйти
        </button>
      ) : null}
    </div>
  );
}

interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  rightExtra?: React.ReactNode;
  chevron?: boolean;
}

function SettingRow({
  icon,
  label,
  rightExtra,
  chevron = false,
}: SettingRowProps): React.JSX.Element {
  return (
    <li>
      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-primary px-4 h-14">
        <span className="h-9 w-9 rounded-full bg-accent-light text-accent grid place-items-center shrink-0">
          {icon}
        </span>
        <span className="flex-1 text-[14px] font-medium text-fg-primary">
          {label}
        </span>
        {rightExtra ? <span className="shrink-0">{rightExtra}</span> : null}
        {chevron ? (
          <ChevronRight
            className="h-5 w-5 text-fg-muted shrink-0"
            aria-hidden="true"
          />
        ) : null}
      </div>
    </li>
  );
}
