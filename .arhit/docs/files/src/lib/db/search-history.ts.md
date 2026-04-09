# src/lib/db/search-history.ts

Helper-функции для таблицы search_history. recordSearchQuery дедупит относительно 5 последних записей и подрезает историю до 50 на пользователя. getUserSearchHistory возвращает свежие сверху. deleteSearchHistoryEntry и clearUserSearchHistory для управления записями.
