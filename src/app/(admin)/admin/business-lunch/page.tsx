import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { Plus, Pencil, Trash2, Clock } from "lucide-react";
import { db } from "@/lib/db/client";
import {
  businessLunches,
  businessLunchDays,
  restaurants,
  searchHistory,
} from "@/lib/db/schema";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/Input";

/**
 * Admin Business Lunch Management /admin/business-lunch (pencil фрейм nK4OR).
 *
 * 4 стат-карточки сверху (Всего ланчей / Сейчас подают (success) /
 * Средняя цена / Популярно сегодня (accent)), ряд pill-tabs
 * (Все ланчи / Активные / Черновики / Архив) и таблица ланчей с
 * колонками ресторан, состав, цена, время, дни, статус, действия.
 */

const WEEKDAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] as const;

function formatDaysMask(mask: number): string {
  const on: string[] = [];
  for (let i = 0; i < 7; i++) {
    if ((mask >> i) & 1) on.push(WEEKDAY_NAMES[i] ?? "");
  }
  if (on.length === 5 && on.slice(0, 5).join("") === "ПнВтСрЧтПт") {
    return "Пн–Пт";
  }
  return on.join(" ");
}

function isServingNow(
  timeFrom: string,
  timeTo: string,
  mask: number,
): boolean {
  const now = new Date();
  const day = (now.getDay() + 6) % 7; // Mon=0..Sun=6
  if (!((mask >> day) & 1)) return false;
  const cur = now.getHours() * 60 + now.getMinutes();
  const [fh, fm] = timeFrom.split(":").map(Number);
  const [th, tm] = timeTo.split(":").map(Number);
  const from = (fh ?? 0) * 60 + (fm ?? 0);
  const to = (th ?? 0) * 60 + (tm ?? 0);
  return cur >= from && cur <= to;
}

export default async function AdminBusinessLunchPage(): Promise<React.JSX.Element> {
  const rows = await db
    .select({
      id: businessLunches.id,
      name: businessLunches.name,
      price: businessLunches.price,
      timeFrom: businessLunches.timeFrom,
      timeTo: businessLunches.timeTo,
      daysMask: businessLunches.daysMask,
      status: businessLunches.status,
      restaurantName: restaurants.name,
      restaurantAddress: restaurants.address,
      dayCount: sql<number>`(SELECT COUNT(*) FROM ${businessLunchDays} WHERE ${businessLunchDays.lunchId} = ${businessLunches.id})`,
    })
    .from(businessLunches)
    .innerJoin(restaurants, eq(businessLunches.restaurantId, restaurants.id))
    .orderBy(desc(businessLunches.createdAt));

  const total = rows.length;
  const activeNow = rows.filter(
    (r) =>
      r.status === "active" &&
      isServingNow(r.timeFrom, r.timeTo, r.daysMask),
  ).length;
  const avgPrice =
    total > 0 ? Math.round(rows.reduce((a, r) => a + r.price, 0) / total) : 0;

  // "Популярно сегодня" — количество поисков за последние 24 часа
  const daySec = Math.floor(Date.now() / 1000) - 24 * 60 * 60;
  const [popularRow] = await db
    .select({ c: sql<number>`count(*)` })
    .from(searchHistory)
    .where(sql`${searchHistory.createdAt} >= ${daySec}`);
  const popularToday = popularRow?.c ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-fg-primary">Бизнес-ланчи</h1>
        <Link href="/admin/business-lunch/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>
            Добавить бизнес-ланч
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Всего ланчей" value={total.toString()} />
        <StatCard
          label="Сейчас подают"
          value={activeNow.toString()}
          variant="success"
        />
        <StatCard label="Средняя цена" value={`${avgPrice} ₽`} />
        <StatCard
          label="Популярно сегодня"
          value={popularToday.toLocaleString("ru-RU")}
          variant="accent"
        />
      </div>

      <LunchTabs />

      <div className="rounded-2xl border border-border bg-surface-primary shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border-light">
          <div className="max-w-md">
            <SearchInput placeholder="Поиск по ресторану..." />
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="p-8 text-center text-fg-muted text-sm">
            Ещё нет ни одного бизнес-ланча
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-fg-muted uppercase tracking-wide border-b border-border-light">
                <th className="px-6 py-3 font-medium">Ресторан</th>
                <th className="px-6 py-3 font-medium">Состав</th>
                <th className="px-6 py-3 font-medium text-right">Цена</th>
                <th className="px-6 py-3 font-medium">Время</th>
                <th className="px-6 py-3 font-medium">Дни</th>
                <th className="px-6 py-3 font-medium">Статус</th>
                <th className="px-6 py-3 font-medium text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border-light">
                  <td className="px-6 py-4">
                    <div className="font-medium text-fg-primary">
                      {r.restaurantName}
                    </div>
                    <div className="text-xs text-fg-muted">
                      {r.restaurantAddress}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-fg-secondary">
                    {r.dayCount} блюд
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-accent">
                    {r.price} ₽
                  </td>
                  <td className="px-6 py-4 text-fg-secondary">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {r.timeFrom} – {r.timeTo}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-fg-secondary">
                    {formatDaysMask(r.daysMask)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center h-6 px-2 rounded-md text-xs font-medium ${
                        r.status === "active"
                          ? "bg-success/10 text-success"
                          : "bg-fg-muted/10 text-fg-muted"
                      }`}
                    >
                      {r.status === "active" ? "Активен" : "Выключен"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        aria-label="Редактировать"
                        className="h-8 w-8 flex items-center justify-center rounded-md text-fg-secondary hover:bg-surface-secondary hover:text-accent"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Удалить"
                        className="h-8 w-8 flex items-center justify-center rounded-md text-fg-secondary hover:bg-error/10 hover:text-error"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

type StatVariant = "default" | "success" | "accent";

function StatCard({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: string;
  variant?: StatVariant;
}): React.JSX.Element {
  const card =
    variant === "accent"
      ? "bg-accent text-white border-accent"
      : "bg-surface-primary border-border";
  const labelCls =
    variant === "accent"
      ? "text-white/80"
      : variant === "success"
        ? "text-success"
        : "text-fg-secondary";
  const valueCls = variant === "success" ? "text-success" : "";
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${card}`}>
      <div className={`text-xs font-medium mb-2 ${labelCls}`}>{label}</div>
      <div
        className={`text-3xl font-semibold tabular-nums ${valueCls}`}
      >
        {value}
      </div>
    </div>
  );
}

const LUNCH_TABS = [
  "Все ланчи",
  "Активные",
  "Черновики",
  "Архив",
] as const;

function LunchTabs(): React.JSX.Element {
  return (
    <div
      role="tablist"
      aria-label="Фильтр бизнес-ланчей"
      className="flex flex-wrap items-center gap-2"
    >
      {LUNCH_TABS.map((t, i) => {
        const active = i === 0;
        return (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={active}
            className={`h-9 px-4 rounded-full text-sm font-medium transition-colors ${
              active
                ? "bg-accent text-white"
                : "bg-surface-primary text-fg-secondary border border-border hover:text-fg-primary"
            }`}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}
