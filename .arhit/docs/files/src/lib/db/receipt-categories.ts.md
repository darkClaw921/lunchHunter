# src/lib/db/receipt-categories.ts

Категоризация позиций чеков по keyword-словарю. Экспортирует: categorizeItem(itemName) — определяет категорию позиции (beer, wine, tips, food и т.д.) по ключевым словам; ReceiptItemCategory — тип категории; CATEGORY_LABELS — маппинг категорий на человекочитаемые названия для UI. Используется в receipts.ts для статистики и в ReceiptStats/LeaderboardTable компонентах.
