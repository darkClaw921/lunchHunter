import { desc, sql } from "drizzle-orm";
import {
  Store,
  UtensilsCrossed,
  Users as UsersIcon,
  Search,
} from "lucide-react";
import { db } from "@/lib/db/client";
import {
  restaurants,
  menuItems,
  users,
  searchHistory,
} from "@/lib/db/schema";

/**
 * Admin Dashboard /admin — статистика, последние добавленные рестораны,
 * популярные поисковые запросы. Соответствует pencil фрейму Admin - Dashboard.
 */

interface StatDef {
  label: string;
  value: number;
  icon: React.ReactNode;
}

async function fetchStats(): Promise<{
  stats: StatDef[];
  recent: Array<{
    id: number;
    name: string;
    category: string;
    createdAt: Date;
    status: string;
  }>;
  popular: Array<{ query: string; count: number }>;
}> {
  const [restRow] = await db
    .select({ c: sql<number>`count(*)` })
    .from(restaurants);
  const [menuRow] = await db
    .select({ c: sql<number>`count(*)` })
    .from(menuItems);
  const [userRow] = await db
    .select({ c: sql<number>`count(*)` })
    .from(users);

  // Поисков сегодня
  const startOfDaySec = Math.floor(
    new Date(new Date().setHours(0, 0, 0, 0)).getTime() / 1000,
  );
  const [searchRow] = await db
    .select({ c: sql<number>`count(*)` })
    .from(searchHistory)
    .where(sql`${searchHistory.createdAt} >= ${startOfDaySec}`);

  const recent = await db
    .select({
      id: restaurants.id,
      name: restaurants.name,
      category: restaurants.category,
      createdAt: restaurants.createdAt,
      status: restaurants.status,
    })
    .from(restaurants)
    .orderBy(desc(restaurants.createdAt))
    .limit(6);

  const popular = await db
    .select({
      query: searchHistory.query,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(searchHistory)
    .groupBy(searchHistory.query)
    .orderBy(sql`count DESC`)
    .limit(8);

  const stats: StatDef[] = [
    {
      label: "Рестораны",
      value: restRow?.c ?? 0,
      icon: <Store className="h-4 w-4 text-accent" />,
    },
    {
      label: "Позиции меню",
      value: menuRow?.c ?? 0,
      icon: <UtensilsCrossed className="h-4 w-4 text-accent" />,
    },
    {
      label: "Пользователи",
      value: userRow?.c ?? 0,
      icon: <UsersIcon className="h-4 w-4 text-accent" />,
    },
    {
      label: "Поисков сегодня",
      value: searchRow?.c ?? 0,
      icon: <Search className="h-4 w-4 text-accent" />,
    },
  ];

  return { stats, recent, popular };
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export default async function AdminDashboardPage(): Promise<React.JSX.Element> {
  const { stats, recent, popular } = await fetchStats();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-fg-primary">Дашборд</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-border bg-surface-primary p-5 shadow-sm"
          >
            <div className="flex items-center gap-2 text-xs text-fg-secondary font-medium mb-3">
              {s.icon}
              <span>{s.label}</span>
            </div>
            <div className="text-3xl font-semibold text-fg-primary tabular-nums">
              {s.value.toLocaleString("ru-RU")}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 rounded-2xl border border-border bg-surface-primary p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-fg-primary">
              Последние добавленные
            </h2>
            <a
              href="/admin/restaurants"
              className="text-sm text-accent hover:underline"
            >
              Все →
            </a>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-fg-muted">Пока нет ресторанов</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-fg-muted uppercase tracking-wide">
                  <th className="pb-2 font-medium">Название</th>
                  <th className="pb-2 font-medium">Категория</th>
                  <th className="pb-2 font-medium">Дата</th>
                  <th className="pb-2 font-medium text-right">Статус</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="border-t border-border-light">
                    <td className="py-3 font-medium text-fg-primary">
                      {r.name}
                    </td>
                    <td className="py-3 text-fg-secondary">{r.category}</td>
                    <td className="py-3 text-fg-secondary">
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="py-3 text-right">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-surface-primary p-6 shadow-sm">
          <h2 className="text-base font-semibold text-fg-primary mb-4">
            Популярные запросы
          </h2>
          {popular.length === 0 ? (
            <p className="text-sm text-fg-muted">Пока нет запросов</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {popular.map((p) => (
                <li
                  key={p.query}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-fg-primary truncate">{p.query}</span>
                  <span className="text-fg-muted tabular-nums">{p.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }): React.JSX.Element {
  const map: Record<string, string> = {
    published: "bg-success/10 text-success",
    draft: "bg-warning/10 text-warning",
    archived: "bg-fg-muted/10 text-fg-muted",
  };
  const label: Record<string, string> = {
    published: "Активен",
    draft: "Черновик",
    archived: "Архив",
  };
  return (
    <span
      className={`inline-flex items-center h-6 px-2 rounded-md text-xs font-medium ${
        map[status] ?? "bg-fg-muted/10 text-fg-muted"
      }`}
    >
      {label[status] ?? status}
    </span>
  );
}
