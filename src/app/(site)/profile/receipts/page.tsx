import Link from "next/link";
import { ArrowLeft, Receipt, Calendar, Store } from "lucide-react";
import { validateSession } from "@/lib/auth/session";
import { getUserReceipts } from "@/lib/db/receipts";
import { formatPrice } from "@/lib/utils/format";
import { ReceiptUpload } from "../_components/ReceiptUpload";
import { ReceiptStats } from "../_components/ReceiptStats";

export const dynamic = "force-dynamic";

/**
 * /profile/receipts — Список загруженных чеков пользователя.
 *
 * Server component: проверяет авторизацию, загружает чеки через getUserReceipts().
 * Показывает кнопку загрузки нового чека (ReceiptUpload), статистику (ReceiptStats),
 * и список чеков (дата, сумма, заведение).
 */
export default async function ReceiptsPage(): Promise<React.JSX.Element> {
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
        <h1 className="text-[20px] font-bold text-fg-primary">Мои чеки</h1>
      </header>

      {!session ? (
        <GuestState />
      ) : (
        <ReceiptsList userId={session.user.id} />
      )}
    </div>
  );
}

async function ReceiptsList({
  userId,
}: {
  userId: string;
}): Promise<React.JSX.Element> {
  const receipts = await getUserReceipts(userId);

  return (
    <div className="flex flex-col gap-4">
      {/* Upload section */}
      <ReceiptUpload />

      {/* Stats */}
      <ReceiptStats />

      {/* Receipts list */}
      {receipts.length === 0 ? (
        <div className="mt-4 flex flex-col items-center text-center">
          <div className="h-16 w-16 rounded-full bg-accent-light text-accent grid place-items-center">
            <Receipt className="h-7 w-7" aria-hidden="true" />
          </div>
          <p className="mt-4 text-[14px] font-medium text-fg-primary">
            Чеков пока нет
          </p>
          <p className="mt-1 text-[13px] text-fg-muted">
            Загрузите фото чека, чтобы увидеть статистику расходов
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-fg-primary">
              Загруженные чеки
            </h2>
            <span className="text-[12px] text-fg-muted">
              {receipts.length}
            </span>
          </div>
          <ul className="flex flex-col gap-2">
            {receipts.map((r) => {
              const items = r.itemsJson ? parseItems(r.itemsJson) : [];
              const itemCount = items.length;

              return (
                <li
                  key={r.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface-primary px-4 py-3"
                >
                  {/* Receipt icon */}
                  <span className="h-10 w-10 rounded-full bg-accent-light text-accent grid place-items-center shrink-0">
                    <Receipt className="h-5 w-5" />
                  </span>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    {r.establishmentName ? (
                      <div className="flex items-center gap-1.5 text-[14px] font-medium text-fg-primary truncate">
                        <Store className="h-3.5 w-3.5 text-fg-muted shrink-0" />
                        {r.establishmentName}
                      </div>
                    ) : (
                      <div className="text-[14px] font-medium text-fg-primary">
                        Чек #{r.id}
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-0.5">
                      {r.date ? (
                        <span className="flex items-center gap-1 text-[12px] text-fg-muted">
                          <Calendar className="h-3 w-3" />
                          {r.date}
                        </span>
                      ) : null}
                      {itemCount > 0 ? (
                        <span className="text-[12px] text-fg-muted">
                          {itemCount} {itemCount === 1 ? "позиция" : "позиций"}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Total */}
                  {r.total != null ? (
                    <span className="text-[14px] font-bold text-accent shrink-0">
                      {formatPrice(r.total)}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function parseItems(
  json: string,
): Array<{ name: string; price: number; quantity: number }> {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function GuestState(): React.JSX.Element {
  return (
    <div className="mt-10 flex flex-col items-center text-center">
      <div className="h-16 w-16 rounded-full bg-accent-light text-accent grid place-items-center">
        <Receipt className="h-7 w-7" aria-hidden="true" />
      </div>
      <p className="mt-4 text-[14px] font-medium text-fg-primary">
        Войдите, чтобы загружать чеки
      </p>
      <p className="mt-1 text-[13px] text-fg-muted">
        Загружайте чеки и отслеживайте свои расходы
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
