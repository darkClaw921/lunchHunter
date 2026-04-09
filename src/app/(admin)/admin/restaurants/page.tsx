import Link from "next/link";
import { desc, like, or, sql } from "drizzle-orm";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { db } from "@/lib/db/client";
import { restaurants, menuItems } from "@/lib/db/schema";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/Input";

/**
 * Admin Restaurant List /admin/restaurants — таблица со списком ресторанов.
 *
 * Колонки: Название, Адрес, Категория, Позиций в меню, Статус, Действия.
 * Поддерживает поиск через ?q= и пагинацию через ?page=. Соответствует
 * pencil-фрейму Admin - Restaurant List.
 */

const PAGE_SIZE = 10;

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function AdminRestaurantsPage({
  searchParams,
}: PageProps): Promise<React.JSX.Element> {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const whereExpr = q
    ? or(like(restaurants.name, `%${q}%`), like(restaurants.address, `%${q}%`))
    : undefined;

  const rows = await db
    .select({
      id: restaurants.id,
      name: restaurants.name,
      category: restaurants.category,
      address: restaurants.address,
      status: restaurants.status,
      itemCount: sql<number>`(SELECT COUNT(*) FROM ${menuItems} WHERE ${menuItems.restaurantId} = ${restaurants.id})`,
    })
    .from(restaurants)
    .where(whereExpr)
    .orderBy(desc(restaurants.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  const [totalRow] = await db
    .select({ c: sql<number>`count(*)` })
    .from(restaurants)
    .where(whereExpr);
  const total = totalRow?.c ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-fg-primary">Рестораны</h1>
        <Link href="/admin/restaurants/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>
            Добавить ресторан
          </Button>
        </Link>
      </div>

      <div className="rounded-2xl border border-border bg-surface-primary shadow-sm overflow-hidden">
        <form className="p-4 border-b border-border-light flex gap-3">
          <div className="flex-1">
            <SearchInput
              name="q"
              defaultValue={q}
              placeholder="Поиск ресторана..."
            />
          </div>
          <Button type="submit" variant="secondary">
            Найти
          </Button>
        </form>

        {rows.length === 0 ? (
          <div className="p-8 text-center text-fg-muted text-sm">
            Ничего не найдено
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-fg-muted uppercase tracking-wide border-b border-border-light">
                <th className="px-6 py-3 font-medium">Название</th>
                <th className="px-6 py-3 font-medium">Адрес</th>
                <th className="px-6 py-3 font-medium">Категория</th>
                <th className="px-6 py-3 font-medium text-right">Позиций</th>
                <th className="px-6 py-3 font-medium">Статус</th>
                <th className="px-6 py-3 font-medium text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border-light">
                  <td className="px-6 py-4 font-medium text-fg-primary">
                    {r.name}
                  </td>
                  <td className="px-6 py-4 text-fg-secondary max-w-[240px] truncate">
                    {r.address}
                  </td>
                  <td className="px-6 py-4 text-fg-secondary">{r.category}</td>
                  <td className="px-6 py-4 text-right tabular-nums text-fg-primary">
                    {r.itemCount}
                  </td>
                  <td className="px-6 py-4">
                    <StatusPill status={r.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/restaurants/${r.id}`}
                        aria-label="Редактировать"
                        className="h-8 w-8 flex items-center justify-center rounded-md text-fg-secondary hover:bg-surface-secondary hover:text-accent transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        aria-label="Удалить"
                        className="h-8 w-8 flex items-center justify-center rounded-md text-fg-secondary hover:bg-error/10 hover:text-error transition-colors"
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

        <div className="p-4 flex items-center justify-between border-t border-border-light">
          <div className="text-xs text-fg-muted">
            Показано {rows.length} из {total}
          </div>
          <Pagination page={page} pageCount={pageCount} q={q} />
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }): React.JSX.Element {
  const map: Record<string, { cls: string; label: string }> = {
    published: { cls: "bg-success/10 text-success", label: "Активен" },
    draft: { cls: "bg-warning/10 text-warning", label: "Черновик" },
    archived: { cls: "bg-fg-muted/10 text-fg-muted", label: "Архив" },
  };
  const v = map[status] ?? { cls: "bg-fg-muted/10 text-fg-muted", label: status };
  return (
    <span
      className={`inline-flex items-center h-6 px-2 rounded-md text-xs font-medium ${v.cls}`}
    >
      {v.label}
    </span>
  );
}

function Pagination({
  page,
  pageCount,
  q,
}: {
  page: number;
  pageCount: number;
  q: string;
}): React.JSX.Element {
  const mkHref = (p: number): string => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/admin/restaurants?${qs}` : "/admin/restaurants";
  };
  const pages: number[] = [];
  for (let i = 1; i <= Math.min(pageCount, 5); i++) pages.push(i);

  return (
    <nav className="flex items-center gap-1" aria-label="Пагинация">
      {pages.map((p) => (
        <Link
          key={p}
          href={mkHref(p)}
          className={`h-8 min-w-8 px-2 rounded-md flex items-center justify-center text-xs font-medium ${
            p === page
              ? "bg-accent text-white"
              : "text-fg-secondary hover:bg-surface-secondary"
          }`}
        >
          {p}
        </Link>
      ))}
    </nav>
  );
}
