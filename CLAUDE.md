# CLAUDE.md · ai-integrations

## Leer primero

1. `AGENTS.md`.
2. `README.md`.
3. `views/VIEWS-SPEC.md` para construir las pantallas.

## Snapshot

Repo público de presentación y publicación de integraciones. Setup workspaces,
configs, manifiestos/validador OpenAI y tres workflows implementados. Stack:
Node 22 >=22.12, Yarn 1, TypeScript strict y React 19. Dependencias declaradas;
instalación manual pendiente. Pantallas, bridge/harness, fixtures/tests y assets
oficiales pendientes del agente de diseño del usuario.

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
Los comandos de views requieren sus fuentes/harness/tests, todavía pendientes.
Acá están permitidos build/harness/tests frontend; no trasladar esa autorización
al servidor backend. CI exige yarn.lock generado por instalación del usuario.

Pendientes: instalación manual, entrega del agente de diseño, logo/fuentes,
soporte HTTPS, cuenta demo, video y evidencia en clientes reales. Configuración
por variables del proceso: MCP_PUBLIC_URL, OPENAI_SUPPORT_URL, MCP_UI_IMAGE_HOSTS;
los scripts no cargan .env automáticamente. Packaging falla si faltan assets.
No se eligió una licencia.
