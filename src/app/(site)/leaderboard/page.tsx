import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import { validateSession } from "@/lib/auth/session";
import { LeaderboardTable } from "./_components/LeaderboardTable";

export const dynamic = "force-dynamic";

/**
 * /leaderboard — Страница лидерборда.
 *
 * Server component: проверяет авторизацию.
 * Гости видят CTA на вход.
 * Авторизованные — LeaderboardTable с табами категорий и процентилем.
 */
export default async function LeaderboardPage(): Promise<React.JSX.Element> {
  const session = await validateSession();

  return (
    <div className="flex flex-col px-5 pt-4 pb-8">
      <header className="flex items-center gap-3 pb-4">
        <Link
          href="/profile"
          aria-label="Назад"
          className="h-10 w-10 grid place-items-center rounded-full text-fg-primary hover:bg-surface-secondary"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <h1 className="text-[20px] font-bold text-fg-primary">
          Топ пользователей
        </h1>
      </header>

      {!session ? <GuestState /> : <LeaderboardTable />}
    </div>
  );
}

function GuestState(): React.JSX.Element {
  return (
    <div className="mt-10 flex flex-col items-center text-center">
      <div className="h-16 w-16 rounded-full bg-accent-light text-accent grid place-items-center">
        <Trophy className="h-8 w-8" aria-hidden="true" />
      </div>
      <p className="mt-4 text-[14px] font-medium text-fg-primary">
        Войдите, чтобы увидеть рейтинг
      </p>
      <p className="mt-1 text-[13px] text-fg-muted">
        Загружайте чеки и соревнуйтесь с другими пользователями
      </p>
      <Link
        href="/profile"
        className="mt-5 inline-flex items-center justify-center h-11 px-5 rounded-xl bg-accent text-white text-[14px] font-semibold hover:bg-accent/90 transition-colors"
      >
        Войти
      </Link>
    </div>
  );
}
