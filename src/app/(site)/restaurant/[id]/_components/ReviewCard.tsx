"use client";

import { useState } from "react";
import { Star, CheckCircle, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

export interface ReviewCardProps {
  id: number;
  authorName: string | null;
  authorAvatarUrl: string | null;
  rating: number;
  text: string;
  receiptTotal: number | null;
  receiptDate: string | null;
  receiptItemsJson: string | null;
  createdAt: string; // ISO string (serialized from server)
  isAdmin: boolean;
}

/**
 * Карточка отзыва. Отображает автора, рейтинг, текст, бейдж "Чек подтверждён",
 * дату/сумму чека, раскрывающийся список позиций и кнопку "Посмотреть чек" (только admin).
 */
export function ReviewCard({
  id,
  authorName,
  authorAvatarUrl,
  rating,
  text,
  receiptTotal,
  receiptDate,
  receiptItemsJson,
  createdAt,
  isAdmin,
}: ReviewCardProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const displayName = authorName ?? "Пользователь";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const items: ReceiptItem[] = receiptItemsJson
    ? (() => {
        try {
          return JSON.parse(receiptItemsJson) as ReceiptItem[];
        } catch {
          return [];
        }
      })()
    : [];

  const formattedDate = (() => {
    try {
      const d = new Date(createdAt);
      return d.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "";
    }
  })();

  const formattedReceiptDate = (() => {
    if (!receiptDate) return null;
    try {
      const d = new Date(receiptDate);
      return d.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
      });
    } catch {
      return receiptDate;
    }
  })();

  async function handleViewReceipt() {
    if (receiptUrl) {
      setShowReceiptModal(true);
      return;
    }
    setReceiptLoading(true);
    try {
      const res = await fetch(`/api/reviews/${id}/receipt-image`);
      if (!res.ok) throw new Error("Failed to load");
      const data = (await res.json()) as { url: string };
      setReceiptUrl(data.url);
      setShowReceiptModal(true);
    } catch {
      // silently fail
    } finally {
      setReceiptLoading(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-2.5 rounded-2xl bg-surface-secondary p-4">
        {/* Author row */}
        <div className="flex items-center gap-2">
          {authorAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={authorAvatarUrl}
              alt={displayName}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <span className="h-8 w-8 rounded-full bg-accent grid place-items-center text-white text-[12px] font-semibold">
              {initials}
            </span>
          )}
          <span className="text-[13px] font-semibold text-fg-primary">
            {displayName}
          </span>
          <div className="flex items-center gap-0.5 text-amber-400 ml-auto">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-3 w-3",
                  i < rating ? "fill-current" : "",
                )}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>

        {/* Review text */}
        <p className="text-[12px] text-fg-secondary leading-relaxed">{text}</p>

        {/* Receipt badge + date + total */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">
            <CheckCircle className="h-3 w-3" aria-hidden="true" />
            Чек подтверждён
          </span>
          {formattedReceiptDate && (
            <span className="text-[11px] text-fg-muted">
              {formattedReceiptDate}
            </span>
          )}
          {receiptTotal !== null && (
            <span className="text-[11px] font-medium text-fg-secondary">
              {formatPrice(receiptTotal)}
            </span>
          )}
        </div>

        {/* Date */}
        <span className="text-[11px] text-fg-muted">{formattedDate}</span>

        {/* Expandable receipt items */}
        {items.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:text-accent/80 transition-colors"
            >
              {expanded ? "Скрыть" : "Подробнее"}
              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
            {expanded && (
              <ul className="mt-2 flex flex-col gap-1">
                {items.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between text-[11px] text-fg-secondary"
                  >
                    <span>
                      {item.name}
                      {item.quantity > 1 && (
                        <span className="text-fg-muted"> x{item.quantity}</span>
                      )}
                    </span>
                    <span className="font-medium">
                      {formatPrice(item.price)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Admin: view receipt button */}
        {isAdmin && (
          <button
            type="button"
            onClick={handleViewReceipt}
            disabled={receiptLoading}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-fg-muted hover:text-fg-secondary transition-colors disabled:opacity-50 self-start"
          >
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            {receiptLoading ? "Загрузка..." : "Посмотреть чек"}
          </button>
        )}
      </div>

      {/* Receipt image modal */}
      {showReceiptModal && receiptUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowReceiptModal(false)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw] overflow-auto rounded-2xl bg-surface-primary p-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={receiptUrl}
              alt="Фото чека"
              className="max-h-[85vh] max-w-full rounded-xl object-contain"
            />
            <button
              type="button"
              onClick={() => setShowReceiptModal(false)}
              className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/50 text-white grid place-items-center text-[14px] font-bold hover:bg-black/70 transition-colors"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default ReviewCard;
