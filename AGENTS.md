# AGENTS.md · ai-integrations

Leé `CLAUDE.md`, `README.md` y, para pantallas, `views/VIEWS-SPEC.md`.

## Alcance y estructura

Este repo público aloja presentación y publicación: `views/` para MCP Apps,
`openai/` para el plugin y `claude/`/`whatsapp/` como placeholders. No contiene
el servidor MCP ni lógica de acceso al ecosistema privado.

## Reglas

- No publicar secretos, URLs internas/de staging ni datos personales. Toda
  configuración de ambiente va por variables; fixtures solo sintéticas.
- No agregar dependencias fuera del plan sin preguntar. La instalación es
  manual por el usuario. Frenar y preguntar ante discrepancias.
- Comentarios solo para detalles externos no obvios, una oración, sin historia.
- Lo que lee el modelo y `SKILL.md` va en inglés; docs internas y commits en
  español. UI localizada es/en.
- Commits simples de una línea con `feat:`, `fix:`, `chore:` o `docs:`;
  sin firmas ni trailers de atribución. No push, amend, rebase ni force.
- El build de views, el harness y los tests pedidos están permitidos acá.
  Scripts: yarn lint/typecheck/test/build/views:dev/test:e2e y
  openai:validate/openai:package. Las views del agente están integradas: build
  antes de harness/Playwright; no informar éxito sin correr los comandos.
- Cambios de pantallas dentro de `views/src/<view>/`; comunicación por el
  bridge oficial, sin red propia ni llamadas de escritura desde la UI.

## Versiones de views

Fuentes: `mcp-views-vX.Y.Z`. Distribución por workflow:
`mcp-views-dist-vX.Y.Z`, con paquete `rentennials-mcp-views` y `dist/` en raíz.
El servidor consumidor fija ese tag, borra la instalación previa y su lockfile;
el usuario instala y despliega. Procedimiento en la skill `release-views`.
