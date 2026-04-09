import Link from "next/link";
import { ArrowLeft, Clock, Search } from "lucide-react";
import { validateSession } from "@/lib/auth/session";
import { getUserSearchHistory } from "@/lib/db/search-history";
import { ClearHistoryButton } from "./_components/ClearHistoryButton";
import { DeleteHistoryItemButton } from "./_components/DeleteHistoryItemButton";

export const dynamic = "force-dynamic";

/**
 * /profile/history — История поиска пользователя.
 *
 * Server component: читает сессию и историю из `search_history`.
 * Состояния: guest → CTA на /profile; empty → empty-state; otherwise → список.
 * Клик по записи ведёт на /search?q=<query>.
 * Кнопка «Очистить всё» использует client component (ClearHistoryButton)
 * и вызывает DELETE /api/profile/search-history.
 */
export default async function SearchHistoryPage(): Promise<React.JSX.Element> {
  const session = await validateSession();

  return (
    <div className="flex flex-col px-5 pt-4 pb-8">
      <header className="flex items-center gap-3 pb-3">
        <Link
          href="/profile"
          aria-label="Назад"
          className="h-10 w-10 grid place-items-center rounded-full text-fg-primary hover:bg-surface-secondary"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <h1 className="text-[20px] font-bold text-fg-primary">
          История поиска
        </h1>
      </header>

      {!session ? (
        <GuestState />
      ) : (
        <HistoryList userId={session.user.id} />
      )}
    </div>
  );
}

async function HistoryList({
  userId,
}: {
  userId: string;
}): Promise<React.JSX.Element> {
  const entries = await getUserSearchHistory(userId);

  if (entries.length === 0) {
    return (
      <div className="mt-10 flex flex-col items-center text-center">
        <div className="h-16 w-16 rounded-full bg-accent-light text-accent grid place-items-center">
          <Search className="h-7 w-7" aria-hidden="true" />
        </div>
        <p className="mt-4 text-[14px] font-medium text-fg-primary">
          История пуста
        </p>
        <p className="mt-1 text-[13px] text-fg-muted">
          Выполняйте поиск — и запросы сохранятся здесь
        </p>
        <Link
          href="/search"
          className="mt-5 inline-flex items-center justify-center h-11 px-5 rounded-xl bg-accent text-white text-[14px] font-semibold hover:bg-accent/90 transition-colors"
        >
          Перейти к поиску
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mt-1 mb-2">
        <span className="text-[13px] text-fg-muted">
          {entries.length}{" "}
          {entries.length === 1 ? "запрос" : "запросов"}
        </span>
        <ClearHistoryButton />
      </div>
      <ul className="flex flex-col gap-2">
        {entries.map((entry) => (
          <li key={entry.id}>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-primary px-4 h-14">
              <span className="h-9 w-9 rounded-full bg-accent-light text-accent grid place-items-center shrink-0">
                <Clock className="h-5 w-5" aria-hidden="true" />
              </span>
              <Link
                href={`/search?q=${encodeURIComponent(entry.query)}`}
                className="flex-1 min-w-0 text-[14px] font-medium text-fg-primary truncate hover:text-accent"
              >
                {entry.query}
              </Link>
              <DeleteHistoryItemButton id={entry.id} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function GuestState(): React.JSX.Element {
  return (
    <div className="mt-10 flex flex-col items-center text-center">
      <p className="text-[14px] font-medium text-fg-primary">
        Войдите, чтобы видеть историю поиска
      </p>
      <p className="mt-1 text-[13px] text-fg-muted">
        История доступна только авторизованным пользователям
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
