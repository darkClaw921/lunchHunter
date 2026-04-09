import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { eq } from "drizzle-orm";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { CityPicker } from "./_components/CityPicker";
import { AVAILABLE_CITIES } from "@/lib/cities";

export const dynamic = "force-dynamic";

/**
 * /profile/city — Выбор города пользователя.
 *
 * Server component: читает текущий users.city из БД и рендерит клиентский
 * CityPicker. Guest → пустое состояние с CTA на /profile (для логина).
 * Выбор города сохраняется в users.city через POST /api/profile/city.
 */
export default async function CityPage(): Promise<React.JSX.Element> {
  const session = await validateSession();

  let currentCity: string | null = null;
  if (session) {
    const row = await db
      .select({ city: users.city })
      .from(users)
      .where(eq(users.id, session.user.id))
      .get();
    currentCity = row?.city ?? null;
  }

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
        <h1 className="text-[20px] font-bold text-fg-primary">Город</h1>
      </header>

      <p className="text-[13px] text-fg-muted mb-4">
        Выберите город, чтобы видеть релевантные заведения и бизнес-ланчи.
      </p>

      {session ? (
        <CityPicker currentCity={currentCity} cities={AVAILABLE_CITIES} />
      ) : (
        <div className="mt-6 rounded-xl border border-border bg-surface-primary px-4 py-6 text-center">
          <p className="text-[14px] font-medium text-fg-primary">
            Войдите, чтобы сохранить город
          </p>
          <p className="mt-1 text-[13px] text-fg-muted">
            Без авторизации город используется только локально
          </p>
        </div>
      )}
    </div>
  );
}
