# src/app/(site)/profile/_components/ReceiptUpload.tsx

Client component — форма загрузки чека из профиля. Фото-инпут (image/*, camera capture), превью загруженного фото, POST на /api/receipts. После успешной загрузки показывает превью OCR результата: позиции, сумма, дата, заведение. Стейты: idle, loading, success, error. Используется на странице /profile/receipts.
