"use client";

import * as React from "react";
import Link from "next/link";
import { Clock, Star } from "lucide-react";
import { formatPrice, formatDistance, formatRating } from "@/lib/utils/format";
import { CompareButton } from "@/components/compare/CompareButton";
import type { CompareLunch } from "@/lib/compare/CompareContext";

interface LunchCardProps {
  lunch: CompareLunch & { servingNow: boolean };
}

export function LunchCard({ lunch }: LunchCardProps): React.JSX.Element {
  return (
    <div className="relative rounded-2xl border border-border bg-surface-primary shadow-hover">
      <Link
        href={{ pathname: `/business-lunch/${lunch.id}` }}
        className="block p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-[16px] font-bold text-fg-primary truncate min-h-[1.375rem]">
                {lunch.restaurantName}
              </h3>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[12px] text-fg-secondary">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {lunch.timeFrom} — {lunch.timeTo}
              </span>
            </div>
            <div className="mt-1 text-[12px] text-fg-secondary line-clamp-1">
              {lunch.courses.length > 0 ? lunch.courses.join(" · ") : lunch.name}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-0.5 text-[12px] text-fg-secondary">
                <Star className="h-3 w-3 fill-current text-amber-500" aria-hidden="true" />
                {formatRating(lunch.rating)}
              </span>
              <span className="inline-flex items-center h-5 px-2 rounded-full bg-accent-light text-accent text-[11px] font-medium">
                {formatDistance(lunch.distanceMeters)}
              </span>
            </div>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-2">
            {lunch.servingNow ? (
              <span className="inline-flex items-center h-5 px-2 rounded-full bg-success/15 text-success text-[10px] font-semibold">
                Сейчас подают
              </span>
            ) : null}
            <div className="text-[22px] font-bold text-accent leading-none">
              {formatPrice(lunch.price)}
            </div>
          </div>
        </div>
      </Link>
      {/* Compare button — overlaid below main content */}
      <div className="px-4 pb-3 -mt-1">
        <CompareButton lunch={lunch} variant="card" />
      </div>
    </div>
  );
}
