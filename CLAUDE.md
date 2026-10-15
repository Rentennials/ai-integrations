# CLAUDE.md · ai-integrations

## Leer primero

1. `AGENTS.md`.
2. `README.md`.
3. `views/VIEWS-SPEC.md` para construir las pantallas.

## Snapshot

### Views 2.0.0 · implementación local 2026-10-13

Dos views: `vehicle-results` (abre con `search_vehicles`; carrusel con orden,
“Ver más autos” y “Elegir”, que devuelve la elección al chat) y `quote` (abre con
`show_rental_summary`; edición de fechas, puntos, coberturas, extras y cupón con
recotización por `get_vehicle_quote` tras 500 ms; “Solicitar reserva” vuelve al
chat para confirmación). Se eliminaron las views de detalle, confirmación y mis
reservas. Ninguna view crea reservas ni cobros.
Distribución pendiente: el tag de fuentes `mcp-views-v2.0.0` debe crear
`mcp-views-dist-v2.0.0`; no se creó ningún tag.
Validado localmente con Node 22: lint, typecheck, 35 tests Vitest, build de 2 HTML
y manifest, 36 tests Playwright y el bloque de validación del workflow de release
contra `views/dist` sin `RELEASE_TAG`. Las capturas de OpenAI en `openai/assets/`
se copiaron desde el harness sintético a 706 px; las de Claude quedan a 1000 px.
Nada de eso equivale a ejecución real en ChatGPT ni Codex. Sin nuevas dependencias,
instalación ni publicación de tags.

Repo público de presentación y publicación de integraciones. Setup workspaces,
configs, manifiestos/validador OpenAI y tres workflows implementados. Stack:
Node 22 >=22.12, Yarn 1, TypeScript strict y React 19. Dependencias instaladas
por el usuario y yarn.lock generado. Las dos views, bridge/harness, fixtures y
tests están integrados y ajustados a los contratos reales. Las fuentes embebidas
y la revisión final de capturas con marca siguen pendientes.

`views/` contiene la especificación de MCP Apps. `claude/` y `whatsapp/` son
placeholders. `openai/` contiene el plugin portable de ChatGPT/Codex, listing,
casos pendientes y script de validación/ZIP; no hay `.app.json`.

## Convenciones

- Repo público: sin secretos, URLs internas ni de staging. Fixtures sintéticas,
  sin datos personales ni IDs reales. Configuración por entorno.
- Comentarios por defecto ninguno; solo una oración sobre un requisito externo
  o detalle no obvio del SDK. Sin historia ni repetición del código.
- Contratos, errores, metadata, listing y skills para el modelo en inglés;
  documentación interna y commits en español. La UI respeta locale es/en.
- Commits de una línea: `feat: …`, `fix: …`, `chore: …`, `docs: …`.
  Sin firmas, trailers ni menciones a asistentes en su atribución.
- No instalar dependencias ni hacer push sin autorización. No cambiar otras
  ramas, rebase, amend, force ni reset hard.

## Publicación prevista

`mcp-views-vX.Y.Z` dispara el workflow que crea el tag de distribución
`mcp-views-dist-vX.Y.Z`: solo `package.json` y `dist/` en la raíz, con
`dist/manifest.json`. El consumidor fija el tag en `package.json`, borra
`node_modules/rentennials-mcp-views` y `yarn.lock`; el usuario ejecuta
`yarn install` y despliega. Ver `.claude/skills/release-views/SKILL.md`.

## Comandos y pendientes

Scripts reales: `yarn lint`, `yarn typecheck`, `yarn test`, `yarn build`,
`yarn views:dev`, `yarn test:e2e`, `yarn openai:validate`, `yarn openai:package`.
Ejecutar yarn build antes de yarn views:dev o yarn test:e2e: el harness carga
los HTML compilados, no versiones especiales de las views. El host usa
127.0.0.1 y el sandbox localhost como orígenes diferentes. Playwright usa
playwright/test del paquete ya declarado, sin @playwright/test adicional.
Acá están permitidos build/harness/tests frontend; no trasladar esa autorización
al servidor backend. CI exige yarn.lock generado por instalación del usuario.

Validaciones realizadas con Node 22: lint, typecheck, 35 tests Vitest, build
de 2 HTML/manifest y 36 tests Playwright. El bloque de validación del workflow de
release pasa contra views/dist sin RELEASE_TAG. Capturas de harness a 706/1000 px;
las imágenes de tests son sintéticas y las fuentes usan fallback. No representan
evidencia de ejecución en ChatGPT/Codex. El árbol de distribución se validó
en dry-run sin publicar tags.

Soporte confirmado: https://www.rentennials.app/contact. Los cuatro PNG
oficiales de icono/logo (512 px) se generaron desde SVGs públicos con permiso.
openai:validate pasa en esta corrida; openai:package no se volvió a ejecutar, así
que el ZIP vigente es anterior a las capturas nuevas.

Pendientes: primer tag de distribución, fuentes, cuenta demo,
video y evidencia en clientes reales. Configuración
por variables del proceso: MCP_PUBLIC_URL, OPENAI_SUPPORT_URL, MCP_UI_IMAGE_HOSTS;
los scripts no cargan .env automáticamente. Vite deriva de MCP_UI_IMAGE_HOSTS la
allowlist de imágenes de la view, sin otra configuración de ambiente.
Packaging falla si faltan soporte o assets. Los actuales están completos;
capturas/material de revisión y pruebas de clientes reales siguen pendientes.
No se eligió una licencia.
