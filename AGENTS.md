# AGENTS.md · ai-integrations

Leé `CLAUDE.md`, `README.md` y, para pantallas, `views/VIEWS-SPEC.md`.

## Alcance y estructura

Este repo público aloja presentación y publicación: `views/` para MCP Apps,
`openai/` para el plugin, `claude/` para el plugin de Claude y `whatsapp/` como
placeholder. No contiene el servidor MCP ni lógica de acceso al ecosistema privado.

## Plugin de Claude

Marketplace en `.claude-plugin/marketplace.json`; plugin en `claude/`, con
`.claude-plugin/plugin.json`, `.mcp.json`, `skills/rent-a-car/SKILL.md` (inglés),
`assets/` y `listing/`. `claude/.mcp.json` apunta siempre a producción, nunca a
staging. Validar con `yarn claude:validate`. Para probar contra staging se usa un
connector custom o `claude mcp add` local, sin commitear esa URL.

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
  openai:validate/openai:package/claude:validate. Las views del agente están integradas: build
  antes de harness/Playwright; no informar éxito sin correr los comandos.
- Cambios de pantallas dentro de `views/src/<view>/`; comunicación por el
  bridge oficial, sin red propia ni llamadas de escritura desde la UI.

## Versiones de views

Fuentes: `mcp-views-vX.Y.Z`. Distribución por workflow:
`mcp-views-dist-vX.Y.Z`, con paquete `rentennials-mcp-views` y `dist/` en raíz.
El servidor consumidor fija ese tag, borra la instalación previa y su lockfile;
el usuario instala y despliega. Procedimiento en la skill `release-views`.
