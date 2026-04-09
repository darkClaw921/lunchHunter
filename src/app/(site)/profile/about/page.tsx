import Link from "next/link";
import { ArrowLeft, Info, Mail, Globe, Heart } from "lucide-react";

export const dynamic = "force-static";

/**
 * /profile/about — Статическая страница «О приложении».
 *
 * Показывает описание проекта, версию, технологический стек и контактные
 * ссылки. Не требует данных пользователя; рендерится статически.
 */
const APP_VERSION = "0.1.0";

export default function AboutPage(): React.JSX.Element {
  return (
    <div className="flex flex-col px-5 pt-4 pb-10">
      <header className="flex items-center gap-3 pb-4">
        <Link
          href="/profile"
          aria-label="Назад"
          className="h-10 w-10 grid place-items-center rounded-full text-fg-primary hover:bg-surface-secondary"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <h1 className="text-[20px] font-bold text-fg-primary">О приложении</h1>
      </header>

      <div className="flex flex-col items-center text-center py-4">
        <div className="h-20 w-20 rounded-2xl bg-accent text-white grid place-items-center shadow-md">
          <Info className="h-10 w-10" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-[22px] font-bold text-fg-primary">
          Lunch Hunter
        </h2>
        <p className="mt-1 text-[13px] text-fg-muted">Версия {APP_VERSION}</p>
      </div>

      <section className="mt-6 rounded-xl border border-border bg-surface-primary p-5">
        <p className="text-[14px] text-fg-primary leading-relaxed">
          Lunch Hunter помогает находить лучшие бизнес-ланчи и блюда поблизости:
          цены, рейтинги, расстояние и часы работы — всё в одном месте.
        </p>
        <p className="mt-3 text-[13px] text-fg-secondary leading-relaxed">
          Ищите по названию блюда или ресторана, сохраняйте понравившиеся
          заведения в избранное и получайте уведомления о новых предложениях в
          вашем городе.
        </p>
      </section>

      <section className="mt-4 rounded-xl border border-border bg-surface-primary p-5">
        <h3 className="text-[14px] font-semibold text-fg-primary mb-3">
          Технологии
        </h3>
        <ul className="flex flex-wrap gap-2">
          {[
            "Next.js 15",
            "React 19",
            "TypeScript",
            "Tailwind CSS",
            "Drizzle ORM",
            "SQLite",
          ].map((tech) => (
            <li
              key={tech}
              className="inline-flex items-center h-7 px-3 rounded-full bg-accent-light text-accent text-[12px] font-medium"
            >
              {tech}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 flex flex-col gap-2">
        <AboutRow
          icon={<Globe className="h-5 w-5" />}
          label="Разработчик"
          value="alteran.tech"
          href="https://alteran.tech"
        />
        <AboutRow
          icon={<Mail className="h-5 w-5" />}
          label="Связаться с нами"
          value="support@alteran.tech"
          href="mailto:support@alteran.tech"
        />
      </section>

      <p className="mt-8 text-center text-[12px] text-fg-muted inline-flex items-center justify-center gap-1">
        Сделано с <Heart className="h-3 w-3 fill-current text-error" aria-hidden="true" /> командой alteran.tech
      </p>
    </div>
  );
}

interface AboutRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  href: string;
}

function AboutRow({
  icon,
  label,
  value,
  href,
}: AboutRowProps): React.JSX.Element {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className="flex items-center gap-3 rounded-xl border border-border bg-surface-primary px-4 h-14 transition-colors hover:bg-surface-secondary"
    >
      <span className="h-9 w-9 rounded-full bg-accent-light text-accent grid place-items-center shrink-0">
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] text-fg-muted">{label}</span>
        <span className="block text-[14px] font-medium text-fg-primary truncate">
          {value}
        </span>
      </span>
    </a>
  );
}
