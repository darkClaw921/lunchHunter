# src/app/api/receipts/stats/route.ts

API route для статистики чеков пользователя. GET — требует авторизацию, возвращает { totalSpent, visitCount, categoryBreakdown } через getUserReceiptStats(). Используется в ReceiptStats компоненте.
