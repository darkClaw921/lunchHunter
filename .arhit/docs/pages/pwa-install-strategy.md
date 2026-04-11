Стратегия PWA install prompt в lunchHunter: НЕ используем custom install banner. Полагаемся на нативный UI браузера:

- Desktop Chromium: иконка установки в адресной строке появляется автоматически когда manifest + SW удовлетворяют install-критериям (name/short_name, icons 192+512, start_url, display=standalone, SW с fetch handler). Никаких preventDefault() на beforeinstallprompt — любое подавление mini-infobar может скрыть и desktop-prompt в некоторых браузерах.
- Android Chrome: встроенный add-to-home-screen mini-infobar.
- iOS Safari: beforeinstallprompt никогда не фаерится — iOS требует Share → Add to Home Screen вручную, никакой программной альтернативы нет.

Важно: Serwist отключён в dev (next.config.ts: disable на NODE_ENV==='development'), поэтому install prompt в dev никогда не появится. Тестировать только через next build && next start или Docker.

Раньше были src/components/mobile/PWAInstallBanner.tsx и useBeforeInstallPrompt.ts — удалены, т.к. banner висел с md:hidden и на desktop никогда не показывался, а вызов preventDefault() на beforeinstallprompt мог мешать нативному UI. Подход скопирован с cliongo (frontend/users), где install прекрасно работает через встроенный браузерный UI без кастомного компонента.