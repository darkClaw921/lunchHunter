# src/app/(site)/leaderboard/_components/LeaderboardTable.tsx

Client component — таблица лидерборда с табами категорий. Fetch /api/leaderboard?category=X. Табы: total, beer, wine, tips и другие из CATEGORY_LABELS. Таблица рангов: позиция (Crown/Medal/Trophy иконки для топ-3), аватар, имя, сумма. Внизу — процентиль текущего пользователя. Зависимости: lucide-react, formatPrice, CATEGORY_LABELS.
