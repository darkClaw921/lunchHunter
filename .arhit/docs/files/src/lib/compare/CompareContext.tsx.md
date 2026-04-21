# src/lib/compare/CompareContext.tsx

React Context + Provider для хранения списка ланчей в режиме сравнения. Использует localStorage (ключ 'lh_compare_lunches') для персистентности. Максимум 4 ланча одновременно. Экспортирует: CompareProvider (оборачивает app), useCompare (хук с методами add/remove/toggle/has/clear), CompareLunch (тип данных ланча).
