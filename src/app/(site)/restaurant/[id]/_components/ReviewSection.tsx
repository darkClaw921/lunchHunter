"use client";

import { useState } from "react";
import { Star, MessageSquarePlus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ReviewCard, type ReviewCardProps } from "./ReviewCard";
import { ReviewForm } from "./ReviewForm";

export interface ReviewSectionProps {
  reviews: Omit<ReviewCardProps, "isAdmin">[];
  reviewStats: { count: number; avgRating: number };
  restaurantId: number;
  isAdmin: boolean;
  isAuthenticated: boolean;
  className?: string;
}

/**
 * Секция отзывов: заголовок со статистикой, список карточек,
 * кнопка "Оставить отзыв" и форма.
 */
export function ReviewSection({
  reviews,
  reviewStats,
  restaurantId,
  isAdmin,
  isAuthenticated,
  className,
}: ReviewSectionProps): React.JSX.Element {
  const [showForm, setShowForm] = useState(false);

  return (
    <section className={cn("flex flex-col gap-3", className)}>
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-[16px] font-semibold text-fg-primary">Отзывы</h3>
          {reviewStats.count > 0 && (
            <div className="flex items-center gap-1">
              <Star
                className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                aria-hidden="true"
              />
              <span className="text-[13px] font-medium text-fg-primary">
                {reviewStats.avgRating.toFixed(1)}
              </span>
              <span className="text-[12px] text-fg-muted">
                ({reviewStats.count})
              </span>
            </div>
          )}
        </div>
        {isAuthenticated && !showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent hover:text-accent/80 transition-colors"
          >
            <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
            Оставить отзыв
          </button>
        )}
      </div>

      {/* Review form */}
      {showForm && (
        <ReviewForm
          restaurantId={restaurantId}
          onSuccess={() => setShowForm(false)}
        />
      )}

      {/* Reviews list */}
      {reviews.length > 0 ? (
        reviews.map((review) => (
          <ReviewCard key={review.id} {...review} isAdmin={isAdmin} />
        ))
      ) : (
        <div className="rounded-2xl bg-surface-secondary p-6 text-center">
          <p className="text-[13px] text-fg-muted">
            Пока нет отзывов. Будьте первым!
          </p>
        </div>
      )}
    </section>
  );
}

export default ReviewSection;
