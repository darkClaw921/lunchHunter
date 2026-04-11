# src/app/api/receipts/route.ts

API route для standalone загрузки чеков из профиля. POST — validateSession(), multipart/form-data (file), OCR через recognizeReceipt(), сохранение в /uploads/, insert в receipts. Не привязан к ресторану (restaurantId опционален). GET — список чеков текущего пользователя. Зависимости: sharp, receipt-ocr, receipts.ts.
