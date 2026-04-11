# src/components/desktop/DesktopInstallButton.tsx

DesktopInstallButton — client-компонент с кнопкой 'Установить приложение' для desktop PWA.

## Что делает

Рендерит оранжевую кнопку с иконкой Download, по клику вызывает нативный install-диалог Chrome/Edge через deferredPrompt.prompt(). Использует общий хук useBeforeInstallPrompt из src/components/mobile/useBeforeInstallPrompt.ts — событие beforeinstallprompt глобальное, поэтому один и тот же хук работает и для мобильного баннера, и для этой кнопки.

## Поведение

- Не рендерится, пока не произошла гидратация (избегаем hydration mismatch).
- Не рендерится, если приложение уже запущено в standalone-режиме (isStandalone).
- Не рендерится, если пользователь закрыл prompt и мы записали 'lh:pwa-install-dismissed-desktop' = 1 в localStorage.
- Не рендерится, если браузер не выстрелил beforeinstallprompt (Safari, Firefox) — тогда !canInstall.
- На клике вызывает promptInstall(), если outcome === 'dismissed' — сохраняем флаг в localStorage и скрываем кнопку до сброса.

## CSS

hidden md:inline-flex — скрыта на мобильных (там работает PWAInstallBanner), видна на md+. Оранжевый фон #FF5C00 под бренд.

## Размещение

Вставлен в src/app/(site)/_components/DesktopHome.tsx внутри hero-секции, под SearchHomeForm.

## Зависимости

- @/components/mobile/useBeforeInstallPrompt — хук с deferredPrompt
- @/lib/utils/cn — утилита classnames
- lucide-react (Download)
