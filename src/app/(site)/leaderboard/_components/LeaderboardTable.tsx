"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  Trophy,
  Medal,
  Crown,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";

/**
 * LeaderboardTable — клиентский компонент лидерборда.
 *
 * Табы категорий (total, beer, wine, tips и т.д.).
 * Таблица рангов: позиция, аватар, имя, значение.
 * Процентиль текущего пользователя внизу.
 * Данные из /api/leaderboard?category=X.
 */

interface LeaderboardEntry {
  userId: string;
  userName: string | null;
  avatarUrl: string | null;
  totalAmount: number;
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  userPercentile: number;
}

interface TabItem {
  key: string;
  label: string;
}

const TABS: TabItem[] = [
  { key: "total", label: "Всего" },
  { key: "beer", label: "Пиво" },
  { key: "wine", label: "Вино" },
  { key: "cocktail", label: "Коктейли" },
  { key: "food", label: "Еда" },
  { key: "coffee", label: "Кофе" },
  { key: "tips", label: "Чаевые" },
];

function getRankIcon(rank: number): React.ReactNode {
  if (rank === 1)
    return <Crown className="h-5 w-5 text-yellow-500" />;
  if (rank === 2)
    return <Medal className="h-5 w-5 text-gray-400" />;
  if (rank === 3)
    return <Medal className="h-5 w-5 text-amber-600" />;
  return (
    <span className="text-[14px] font-bold text-fg-muted w-5 text-center">
      {rank}
    </span>
  );
}

export function LeaderboardTable(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState("total");
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (category: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/leaderboard?category=${category}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Ошибка ${res.status}`);
      }
      const result: LeaderboardData = await res.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(activeTab);
  }, [activeTab, loadData]);

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Category tabs */}
      <div className="overflow-x-auto -mx-5 px-5 scrollbar-hide">
        <div className="flex gap-2 min-w-max">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={cn(
                "h-9 px-4 rounded-full text-[13px] font-medium transition-colors shrink-0",
                activeTab === tab.key
                  ? "bg-accent text-white"
                  : "bg-surface-secondary text-fg-secondary hover:bg-surface-secondary/80",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-fg-muted" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-8 w-8 text-error mb-2" />
          <p className="text-[14px] text-error">{error}</p>
        </div>
      ) : !data || data.leaderboard.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-16 w-16 rounded-full bg-accent-light text-accent grid place-items-center mb-3">
            <Trophy className="h-8 w-8" />
          </div>
          <p className="text-[14px] font-medium text-fg-primary">
            Пока нет данных
          </p>
          <p className="text-[13px] text-fg-muted mt-1">
            Загружайте чеки, чтобы попасть в рейтинг
          </p>
        </div>
      ) : (
        <>
          {/* Leaderboard list */}
          <ul className="flex flex-col gap-2">
            {data.leaderboard.map((entry, i) => {
              const rank = i + 1;
              return (
                <li
                  key={entry.userId}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-4 h-14 transition-colors",
                    rank <= 3
                      ? "border-accent/20 bg-accent/5"
                      : "border-border bg-surface-primary",
                  )}
                >
                  <span className="shrink-0 w-6 flex justify-center">
                    {getRankIcon(rank)}
                  </span>

                  {entry.avatarUrl ? (
                    <Image
                      src={entry.avatarUrl}
                      alt={entry.userName ?? ""}
                      width={36}
                      height={36}
                      className="h-9 w-9 rounded-full object-cover shrink-0"
                      unoptimized
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-accent-light text-accent grid place-items-center text-[13px] font-bold shrink-0">
                      {(entry.userName ?? "?").slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <span className="flex-1 text-[14px] font-medium text-fg-primary truncate min-w-0">
                    {entry.userName ?? "Пользователь"}
                  </span>

                  <span className="text-[14px] font-bold text-accent shrink-0">
                    {formatPrice(entry.totalAmount)}
                  </span>
                </li>
              );
            })}
          </ul>

          {/* User percentile */}
          <div className="rounded-2xl border border-border bg-surface-primary p-4">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-fg-secondary">
                Ваш процентиль
              </span>
              <span className="text-[16px] font-bold text-accent">
                Топ {100 - data.userPercentile}%
              </span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-surface-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${data.userPercentile}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-fg-muted">
              Вы тратите больше, чем {data.userPercentile}% пользователей
            </p>
          </div>
        </>
      )}
    </div>
  );
}
