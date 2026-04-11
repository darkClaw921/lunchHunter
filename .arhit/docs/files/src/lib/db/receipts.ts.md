# src/lib/db/receipts.ts

Server-side helpers для работы с чеками пользователей. CRUD, статистика, лидерборд и процентили. Экспортирует: createReceipt(data) — insert; getUserReceipts(userId) — список чеков; getUserReceiptStats(userId) — агрегация: totalSpent, visitCount, categoryBreakdown; getLeaderboard(category, limit?) — топ пользователей по категории; getUserPercentile(userId, category) — процентиль пользователя. Использует categorizeItem из receipt-categories.ts. Зависимости: drizzle-orm, ./client, ./schema, ./receipt-categories.
