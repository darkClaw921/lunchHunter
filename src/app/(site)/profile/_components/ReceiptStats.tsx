"use client";

import { useEffect, useState } from "react";
import {
  Wallet,
  MapPin,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { formatPrice } from "@/lib/utils/format";
import { CATEGORY_LABELS, type ReceiptItemCategory } from "@/lib/db/receipt-categories";

/**
 * ReceiptStats — мини-статистика чеков пользователя.
 *
 * Отображает: сколько потрачено всего, количество визитов,
 * breakdown по категориям (beer, wine, tips и т.д.).
 * Данные загружаются из /api/receipts/stats.
 *
 * Props:
 * - compact — компактный режим для отображения на странице профиля
 */

interface UserReceiptStats {
  totalSpent: number;
  visitCount: number;
  categoryBreakdown: Record<string, number>;
}

interface ReceiptStatsProps {
  compact?: boolean;
}

export function ReceiptStats({ compact = false }: ReceiptStatsProps): React.JSX.Element {
  const [stats, setStats] = useState<UserReceiptStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/receipts/stats");
        if (!res.ok) return;
        const data: UserReceiptStats = await res.json();
        if (!cancelled) setStats(data);
      } catch {
        // silent fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-fg-muted" />
      </div>
    );
  }

  if (!stats || stats.visitCount === 0) {
    if (compact) return <></>;
    return (
      <div className="rounded-2xl border border-border bg-surface-primary p-5 text-center">
        <div className="h-14 w-14 rounded-full bg-accent-light text-accent grid place-items-center mx-auto">
          <TrendingUp className="h-7 w-7" />
        </div>
        <p className="mt-3 text-[14px] font-medium text-fg-primary">
          Статистика пока пуста
        </p>
        <p className="mt-1 text-[13px] text-fg-muted">
          Загрузите чеки, чтобы увидеть свою статистику расходов
        </p>
      </div>
    );
  }

  const categories = Object.entries(stats.categoryBreakdown)
    .sort((a, b) => b[1] - a[1]);

  // Compact mode — just summary numbers
  if (compact) {
    return (
      <div className="rounded-2xl border border-border bg-surface-primary p-4">
        <div className="flex items-center gap-4">
          <StatBadge
            icon={<Wallet className="h-4 w-4" />}
            label="Потрачено"
            value={formatPrice(stats.totalSpent)}
          />
          <div className="w-px h-8 bg-border" />
          <StatBadge
            icon={<MapPin className="h-4 w-4" />}
            label="Визитов"
            value={String(stats.visitCount)}
          />
        </div>
      </div>
    );
  }

  // Full mode — for receipts page
  return (
    <div className="rounded-2xl border border-border bg-surface-primary p-5">
      {/* Main stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl bg-surface-secondary p-3 text-center">
          <div className="h-10 w-10 rounded-full bg-accent-light text-accent grid place-items-center mx-auto">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="mt-2 text-[18px] font-bold text-fg-primary">
            {formatPrice(stats.totalSpent)}
          </div>
          <div className="text-[11px] text-fg-muted">Потрачено</div>
        </div>
        <div className="rounded-xl bg-surface-secondary p-3 text-center">
          <div className="h-10 w-10 rounded-full bg-accent-light text-accent grid place-items-center mx-auto">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="mt-2 text-[18px] font-bold text-fg-primary">
            {stats.visitCount}
          </div>
          <div className="text-[11px] text-fg-muted">Визитов</div>
        </div>
      </div>

      {/* Category breakdown */}
      {categories.length > 0 ? (
        <div>
          <h3 className="text-[13px] font-semibold text-fg-secondary mb-2">
            По категориям
          </h3>
          <div className="flex flex-col gap-1.5">
            {categories.map(([key, amount]) => {
              const label =
                CATEGORY_LABELS[key as ReceiptItemCategory] ?? key;
              const pct =
                stats.totalSpent > 0
                  ? Math.round((amount / stats.totalSpent) * 100)
                  : 0;

              return (
                <div key={key} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-fg-primary">{label}</span>
                    <span className="text-fg-secondary font-medium">
                      {formatPrice(amount)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatBadge({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <span className="h-8 w-8 rounded-full bg-accent-light text-accent grid place-items-center shrink-0">
        {icon}
      </span>
      <div className="flex flex-col min-w-0">
        <span className="text-[11px] text-fg-muted">{label}</span>
        <span className="text-[14px] font-bold text-fg-primary truncate">
          {value}
        </span>
      </div>
    </div>
  );
}
