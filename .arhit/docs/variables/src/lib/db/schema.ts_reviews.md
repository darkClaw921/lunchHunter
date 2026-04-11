# src/lib/db/schema.ts:reviews

Таблица reviews — отзывы пользователей на рестораны с подтверждением чеком. Поля: id (PK), userId (FK→users, cascade), restaurantId (FK→restaurants, cascade), text, rating (1-5), receiptImageUrl, receiptTotal (nullable), receiptDate (nullable), receiptItemsJson (JSON nullable), receiptEstablishmentName (nullable), matchConfidence (real 0-1), status (pending/approved/rejected, default approved), createdAt. Индексы: reviews_restaurant_idx, reviews_user_idx, reviews_status_idx.
