# src/app/(site)/restaurant/[id]/_components/ReviewCard.tsx

Client component — карточка отзыва. Показывает: автор, рейтинг звёздами, текст, бейдж 'Чек подтверждён' (CheckCircle), дату и сумму из чека. Раскрываемый список позиций чека (ChevronDown/Up). Кнопка 'Посмотреть чек' (только для isAdmin) — показывает фото чека через /api/reviews/:id/receipt-image. Props: ReviewCardProps (id, authorName, authorAvatar, rating, text, receiptTotal, receiptDate, receiptItems, isAdmin).
