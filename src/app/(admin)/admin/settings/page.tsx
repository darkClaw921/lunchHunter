import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { requireAdmin } from "@/lib/auth/session";

/**
 * Admin Settings /admin/settings — статичная страница настроек админки.
 *
 * Серверный компонент, защищён admin-layout. Email берётся из сессии.
 * Для MVP — только UI без реального сохранения (несколько карточек:
 * профиль, приложение, LLM, Telegram). Поля заполнены плейсхолдерами,
 * реальные секреты остаются в .env.
 */
export default async function AdminSettingsPage(): Promise<React.JSX.Element> {
  const session = await requireAdmin();
  const email = session?.user.email ?? "admin@lunchhunter.local";

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-fg-primary">Настройки</h1>
        <Button type="button">Сохранить</Button>
      </div>

      <SettingsSection
        title="Профиль администратора"
        description="Данные аккаунта, под которым вы вошли в админку."
      >
        <FormRow label="Email">
          <Input type="email" value={email} readOnly />
        </FormRow>
        <FormRow label="Пароль">
          <div className="flex flex-col gap-2">
            <Input type="password" placeholder="Новый пароль" />
            <span className="text-xs text-fg-muted">
              Оставьте пустым, чтобы не менять
            </span>
          </div>
        </FormRow>
      </SettingsSection>

      <SettingsSection
        title="Приложение"
        description="Базовые параметры витрины lancHunter."
      >
        <FormRow label="Название">
          <Input defaultValue="lancHunter" />
        </FormRow>
        <FormRow label="Город по умолчанию">
          <select className="w-full h-11 rounded-lg border border-border bg-surface-secondary px-4 text-[15px] text-fg-primary outline-none focus:border-accent focus:bg-surface-primary">
            <option>Москва</option>
            <option>Санкт-Петербург</option>
            <option>Казань</option>
          </select>
        </FormRow>
        <FormRow label="Accent-цвет">
          <div className="flex items-center gap-3">
            <input
              type="color"
              defaultValue="#F97316"
              className="h-10 w-14 rounded-lg border border-border bg-surface-secondary cursor-pointer"
              aria-label="Accent цвет"
            />
            <Input defaultValue="#F97316" className="max-w-[160px]" />
          </div>
        </FormRow>
      </SettingsSection>

      <SettingsSection
        title="LLM"
        description="Настройки распознавания меню через OpenRouter."
      >
        <FormRow label="Модель OCR">
          <Input defaultValue="x-ai/grok-4-fast" />
        </FormRow>
        <FormRow label="OpenRouter API key">
          <Input type="password" placeholder="•••••• из .env" />
        </FormRow>
      </SettingsSection>

      <SettingsSection
        title="Telegram"
        description="Интеграция с Telegram WebApp и ботом."
      >
        <FormRow label="Bot token">
          <Input type="password" placeholder="•••••• из .env" />
        </FormRow>
        <FormRow label="Webhook URL">
          <Input
            readOnly
            value="https://lunchhunter.local/api/telegram/webhook"
          />
        </FormRow>
      </SettingsSection>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="secondary">
          Отмена
        </Button>
        <Button type="button">Сохранить</Button>
      </div>
    </div>
  );
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <section className="rounded-lg border border-border bg-surface-primary shadow-sm p-6">
      <div className="flex flex-col gap-1 mb-5">
        <h2 className="text-base font-semibold text-fg-primary">{title}</h2>
        {description ? (
          <p className="text-sm text-fg-secondary">{description}</p>
        ) : null}
      </div>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}

function FormRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] md:items-center gap-2 md:gap-6">
      <label className="text-sm font-medium text-fg-secondary">{label}</label>
      <div>{children}</div>
    </div>
  );
}
