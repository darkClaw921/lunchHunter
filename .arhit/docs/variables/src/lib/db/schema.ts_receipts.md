# src/lib/db/schema.ts:receipts

Таблица receipts — standalone загрузки чеков для статистики пользователей. Поля: id (PK), userId (FK→users, cascade), restaurantId (FK→restaurants, set null, nullable), imageUrl, total (nullable), date (nullable), itemsJson (JSON nullable), establishmentName (nullable), createdAt. Индекс: receipts_user_idx.
