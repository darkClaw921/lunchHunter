# src/components/desktop/DesktopInstallCard.tsx

DesktopInstallCard — плавающая карточка установки PWA для desktop (≥md). Client component.

## Назначение
Отображает предложение установить приложение на десктопе во всех поддерживаемых браузерах. Mobile-эквивалент — PWAInstallBanner.

## Поведение по браузерам
- **Chromium / Edge / Brave (desktop)**: подписка на beforeinstallprompt через общий хук useBeforeInstallPrompt. По клику на 'Установить' вызывается нативный promptInstall() (программный install API).
- **Safari macOS Sonoma+ / Safari 17+**: программного API нет, beforeinstallprompt не фаерится. Детектим через UA (Safari + Mac + !iOS) и показываем инструкцию 'File → Add to Dock'. Единственная кнопка — 'Понятно' (dismiss).
- **Firefox / прочие**: рендерим null.
- **Если display-mode: standalone** (приложение уже установлено) — null.
- **Если пользователь закрывал ранее** (localStorage lh:pwa-install-dismissed-desktop) — null.

## Детект Safari desktop
detectSafariDesktop(): /Safari/.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|Edg|OPR/.test(ua) && /Macintosh|Mac OS X/.test(ua) && !/iPad|iPhone|iPod/.test(ua).

## Стиль
Фикс-позиция bottom-6 right-6, 360px ширина, surface-primary фон, accent-light иконка Download, accent-кнопка. hidden md:flex — скрывается на мобильных.

## Зависимости
- @/components/mobile/useBeforeInstallPrompt (общий хук — ловит beforeinstallprompt)
- lucide-react (Download, X)
- @/lib/utils/cn

## Используется в
- src/app/(site)/page.tsx — рядом с PWAInstallBanner, на главной странице.
