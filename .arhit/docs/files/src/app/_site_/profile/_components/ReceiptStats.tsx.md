# src/app/(site)/profile/_components/ReceiptStats.tsx

Client component — мини-статистика чеков пользователя. Fetch /api/receipts/stats. Показывает: totalSpent (Wallet icon), visitCount (MapPin), categoryBreakdown (TrendingUp). Props: compact? — компактный режим для встраивания в профиль. Использует CATEGORY_LABELS из receipt-categories.ts для отображения категорий.
