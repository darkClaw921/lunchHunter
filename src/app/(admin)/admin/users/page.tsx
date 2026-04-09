import { desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

/**
 * Admin Users page /admin/users — read-only список пользователей.
 * Соответствует пункту "Пользователи" в AdminSidebar (pencil lanchHunter.pen).
 *
 * Показывает id / email / имя / tg_username / роль / дата регистрации.
 * Формы добавления/редактирования отсутствуют — это заглушка.
 */
export default async function AdminUsersPage(): Promise<React.JSX.Element> {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      tgUsername: users.tgUsername,
      role: users.role,
      city: users.city,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(200);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-fg-primary">Пользователи</h1>
        <span className="text-sm text-fg-muted tabular-nums">
          Всего: {rows.length}
        </span>
      </div>

      <section className="rounded-2xl border border-border bg-surface-primary shadow-sm overflow-hidden">
        {rows.length === 0 ? (
          <p className="p-6 text-sm text-fg-muted">Пользователей пока нет</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-fg-muted uppercase tracking-wide bg-surface-secondary">
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Имя</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Telegram</th>
                  <th className="px-4 py-3 font-medium">Город</th>
                  <th className="px-4 py-3 font-medium">Роль</th>
                  <th className="px-4 py-3 font-medium text-right">
                    Зарегистрирован
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr
                    key={u.id}
                    className="border-t border-border-light hover:bg-surface-secondary/50"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-fg-muted">
                      {u.id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3 font-medium text-fg-primary">
                      {u.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-fg-secondary">
                      {u.email ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-fg-secondary">
                      {u.tgUsername ? `@${u.tgUsername}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-fg-secondary">
                      {u.city ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-3 text-right text-fg-secondary tabular-nums">
                      {u.createdAt.toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function RoleBadge({
  role,
}: {
  role: "user" | "admin";
}): React.JSX.Element {
  const cls =
    role === "admin"
      ? "bg-accent/10 text-accent"
      : "bg-fg-muted/10 text-fg-muted";
  const label = role === "admin" ? "Админ" : "Пользователь";
  return (
    <span
      className={`inline-flex items-center h-6 px-2 rounded-md text-xs font-medium ${cls}`}
    >
      {label}
    </span>
  );
}
