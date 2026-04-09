# Card

Базовый surface-компонент с форвард-реф. Poll Phase 4.2 (global press-feedback) и Phase 7.1 (shadow-hover migration): при interactive=true проставляется role='button' + tabIndex=0 (использует глобальное правило press-feedback в globals.css) и shadow-hover utility (hover-тень через ::after opacity transition вместо анимации box-shadow). Больше нет локальных active:scale-* или transition-shadow hover:shadow-[...]. Подкомпоненты: CardHeader, CardTitle, CardDescription, CardBody, CardFooter.
