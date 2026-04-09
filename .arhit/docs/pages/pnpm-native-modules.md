# pnpm + Нативные модули в Docker

Конфигурация для корректной работы нативных модулей (better-sqlite3, @node-rs/argon2, sharp) в production Docker-сборке через Next.js standalone output.

## Проблема 1: pnpm 10 блокирует postinstall

pnpm v10+ по умолчанию **не запускает** lifecycle-скрипты зависимостей (postinstall, preinstall) для безопасности. Для нативных модулей это критично: у них postinstall вызывает node-gyp rebuild или prebuild-install для компиляции/загрузки .node бинарей.

**Симптом в Docker:** pnpm install проходит, но при next build падает на стадии Collecting page data:
```
Error: Could not locate the bindings file. Tried:
 → /app/node_modules/.pnpm/better-sqlite3@.../build/Release/better_sqlite3.node
 → ... (12 вариантов)
```

**Решение:** В package.json добавлена секция
```json
"pnpm": {
  "onlyBuiltDependencies": [
    "@node-rs/argon2",
    "@serwist/sw",
    "better-sqlite3",
    "esbuild",
    "sharp"
  ]
}
```

Эта секция явно разрешает запуск lifecycle-скриптов для перечисленных пакетов. pnpm install теперь компилирует нативные модули под linux/arm64 (или linux/amd64) в Docker.

Локально на macOS эффекта нет — prebuilt-бинари уже были установлены до ужесточения политики pnpm.

## Проблема 2: standalone output не захватывает bindings

better-sqlite3 использует пакет `bindings` для поиска .node-файла. Pseudocode:
```js
const bindings = require('bindings');
const sqliteBinding = bindings('better_sqlite3.node');
// bindings динамически перебирает пути:
// build/Release/, build/Debug/, out/Release/, ...
```

Такой динамический require не виден статическому трассировщику Next.js (outputFileTracing). В результате standalone output копирует better-sqlite3/lib/*.js и .node бинарь, но не копирует сам пакет bindings. Runtime падает:
```
Error: Cannot find module 'bindings'
Require stack:
- /app/node_modules/better-sqlite3/lib/database.js
```

**Решение:** в .npmrc добавлены public-hoist-pattern:
```
public-hoist-pattern[]=bindings
public-hoist-pattern[]=file-uri-to-path
public-hoist-pattern[]=node-gyp-build
```

С этим pnpm создаёт симлинк node_modules/bindings → .pnpm/bindings@1.5.0/node_modules/bindings (а также file-uri-to-path — транзитивная зависимость самого bindings). Next.js трассировщик теперь видит bindings как прямую зависимость корневого node_modules и корректно копирует его в standalone.

Дополнительно в next.config.ts явно прописан outputFileTracingIncludes как страховка:
```js
outputFileTracingIncludes: {
  '/*': [
    'node_modules/better-sqlite3/**/*',
    'node_modules/bindings/**/*',
    'node_modules/file-uri-to-path/**/*',
    'node_modules/sharp/**/*',
    'node_modules/@node-rs/argon2/**/*',
    'node_modules/@node-rs/argon2-*/**/*',
  ],
}
```

## Dockerfile: deps stage

В deps stage .npmrc копируется ДО install:
```dockerfile
COPY package.json pnpm-lock.yaml .npmrc ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile
```

Порядок важен: pnpm читает .npmrc при старте install, и только тогда применяет public-hoist-pattern. Если .npmrc скопировать после — hoisting не произойдёт.

## Почему --frozen-lockfile не падает после изменений

- package.json: pnpm.onlyBuiltDependencies — это мета-конфигурация, не список зависимостей, не попадает в pnpm-lock.yaml
- .npmrc: public-hoist-pattern влияет на layout node_modules, но не на содержимое lockfile

Оба изменения безопасны для --frozen-lockfile.

## Итог

Чтобы в Docker работал Next.js standalone с better-sqlite3 через pnpm, нужны ТРИ вещи одновременно:

1. package.json → pnpm.onlyBuiltDependencies (разрешает postinstall → компиляция .node)
2. .npmrc → public-hoist-pattern (хостит bindings в корневой node_modules)
3. next.config.ts → outputFileTracingIncludes (страховка: явно включаем в trace)

Каждое по отдельности не решает проблему полностью.