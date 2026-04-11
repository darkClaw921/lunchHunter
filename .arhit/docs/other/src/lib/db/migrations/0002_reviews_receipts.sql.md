# src/lib/db/migrations/0002_reviews_receipts.sql

Миграция для создания таблиц reviews и receipts. Создаёт обе таблицы с полными FK constraints (CASCADE/SET NULL), индексами для оптимизации запросов по restaurantId, userId, status.
