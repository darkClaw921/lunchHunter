import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

/**
 * Feature-карточка для Home desktop (секция под hero).
 *
 * По pencil: surface-secondary фон, radius-lg (16px), padding 28px, gap 16px
 * (vertical). Круглый/rounded accent-light иконочный контейнер 48×48,
 * внутри — lucide-иконка 24px accent. Заголовок 18/600, описание 14/normal
 * (fg-secondary, line-height 1.5).
 */
export function FeatureCard({
  icon: Icon,
  title,
  description,
  className,
}: FeatureCardProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "flex-1 flex flex-col gap-4 rounded-2xl bg-surface-primary border border-border-light shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)] p-7",
        className,
      )}
    >
      <div className="h-12 w-12 rounded-xl bg-accent-light grid place-items-center">
        <Icon className="h-6 w-6 text-accent" aria-hidden="true" />
      </div>
      <h3 className="text-[18px] font-semibold text-fg-primary leading-tight">
        {title}
      </h3>
      <p className="text-[14px] text-fg-secondary leading-relaxed">
        {description}
      </p>
    </div>
  );
}

export default FeatureCard;
