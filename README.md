# Rentennials · ai-integrations

Repositorio público para las integraciones de Rentennials con asistentes y las
pantallas compartidas de MCP Apps. El servidor MCP permanece en un repositorio
privado; acá viven su presentación y el material de publicación.

## Estructura

- `openai/`: paquete del plugin de ChatGPT y Codex.
- `views/`: cinco pantallas MCP Apps y su especificación.
- `claude/` y `whatsapp/`: placeholders para próximas integraciones.
- `.github/workflows/`: validación, distribución de views y empaquetado de OpenAI.

## Reglas del repositorio público

- Sin secretos, tokens, credenciales, URLs internas ni URLs de staging.
- Toda configuración de ambiente entra por variables de entorno.
- `.env.example` contiene solo nombres de variables con valores vacíos.
- Fixtures sintéticas: sin nombres personales, DNI, emails ni identificadores reales.
- No copiar código privado ni su historial; los contratos públicos de tools son
  la fuente para construir las pantallas.

## Distribución de views

Las views se distribuyen desde GitHub, sin npm registry. El tag de fuentes
`mcp-views-vX.Y.Z` dispara un workflow que construye los HTML autocontenidos y
publica `mcp-views-dist-vX.Y.Z`, con `package.json` y `dist/` en la raíz.
`dist/manifest.json` describe las cinco URI `ui://rentennials/<view>` y su CSP.

El consumidor fija el tag de distribución en su dependencia
`rentennials-mcp-views`, borra su instalación anterior del paquete y `yarn.lock`,
ejecuta `yarn install` manualmente y despliega el servidor. El cambio de las
pantallas no requiere una nueva versión del plugin.

## Desarrollo

Node 22 (>=22.12) y Yarn 1.22.22. Desde la raíz del clon:

```bash
yarn install
yarn lint
yarn typecheck
yarn test
yarn build
yarn views:dev
yarn test:e2e
yarn openai:validate
yarn openai:package
```

La instalación inicial y la generación de `yarn.lock` las hace el usuario;
los workflows requieren ese lockfile. `views/VIEWS-SPEC.md` es el documento de
traspaso para el agente de diseño, que implementa las entradas, harness, fixtures
y tests dentro de `views/`.

El build necesita una entrada `views/src/<view>/index.html` por pantalla; el
dev server usa `views/src/_harness/index.html`. Los tests y el harness aún no
existen: sus comandos fallarán hasta completar esa entrega. No se consideran
validación real del plugin en ChatGPT/Codex.

## Paquete OpenAI

`openai/plugin.json`, `mcp.json`, `listing.md` y `test-cases.md` contienen el
material público. El script valida schemas canónicos, metadata y PNGs y genera
`openai/dist/rentennials-openai-<versión>.zip`. Configurar `OPENAI_SUPPORT_URL`
con una página HTTPS aprobada; `MCP_PUBLIC_URL` permite inyectar el endpoint
según el ambiente. No cargar estas URLs de pruebas en archivos fuente ni subir
un artefacto de pruebas al directorio.

Los scripts leen variables del proceso, no cargan automáticamente `.env`.
`.env.example` solo enumera sus nombres. En GitHub configurar
`OPENAI_SUPPORT_URL` como variable del repositorio. El workflow de empaquetado
fija el endpoint productivo y no incluye `.app.json` ni credenciales.

## Estado y pendientes

Setup y workflows implementados, dependencias declaradas sin instalación local.
Pantallas/tests/harness pendientes del agente de diseño. El validador del plugin
requiere soporte y estos assets oficiales: `icon.png`, `icon-dark.png`,
`logo.png`, `logo-dark.png` y `screenshot-1.png` a `screenshot-4.png`, dentro
de `openai/assets/`. Falla si falta cualquier asset; no produce un ZIP incompleto.
Las capturas son de 706 px de ancho y los iconos cuadrados de al menos 48 px.

El CI completo y el dry-run de distribución solo pueden pasar después de la
instalación/lockfile y entrega frontend/assets. La cuenta demo sin MFA, video y
evidencia en clientes reales también siguen pendientes.

No se eligió una licencia de distribución. El canal de soporte y los assets
oficiales para el listing están pendientes de confirmación.
