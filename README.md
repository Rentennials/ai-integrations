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
los workflows requieren ese lockfile. `views/VIEWS-SPEC.md` es la especificación
de las pantallas entregadas por el agente de diseño e integradas en `views/`.

El build necesita una entrada `views/src/<view>/index.html` por pantalla; el
dev server usa `views/src/_harness/index.html`. Ejecutar `yarn build` antes de
abrir el harness o correr Playwright. El harness usa AppBridge real, sandbox
de otro origen y CSP restrictiva; no se conecta al backend. Sus pruebas no
equivalen a validación del plugin en ChatGPT/Codex reales.

## Paquete OpenAI

`openai/plugin.json`, `mcp.json`, `listing.md` y `test-cases.md` contienen el
material público. El script valida schemas canónicos, metadata y PNGs y genera
`openai/dist/rentennials-openai-<versión>.zip`. Soporte confirmado:
`https://www.rentennials.app/contact`; `OPENAI_SUPPORT_URL` puede sobrescribirlo.
`MCP_PUBLIC_URL` permite inyectar el endpoint
según el ambiente. No cargar estas URLs de pruebas en archivos fuente ni subir
un artefacto de pruebas al directorio.

Los scripts leen variables del proceso, no cargan automáticamente `.env`.
`.env.example` solo enumera sus nombres. En GitHub configurar
`OPENAI_SUPPORT_URL` como variable del repositorio solo si se desea sobrescribir
la página de contacto. El workflow de empaquetado
fija el endpoint productivo y no incluye `.app.json` ni credenciales.

## Estado y pendientes

Setup, cinco pantallas, fixtures/tests/harness y workflows implementados.
Lint, typecheck, 47 tests Vitest, build y 39 tests Playwright pasan con Node 22.
El árbol de distribución se validó en dry-run; el tag público aún está pendiente.

Soporte y los cuatro PNG de icono/logo están completos. Los PNG cuadrados
de 512 px se generaron desde el isotipo y logos SVG públicos del portal, con
permiso del usuario, manteniendo la geometría y variantes clara/oscura.
Hay cuatro capturas de harness en esa carpeta, con datos/imágenes sintéticos
y fuentes fallback. Se deben revisar con marca y material final antes del envío.
Falla si falta soporte o cualquier asset; no produce un ZIP incompleto.
Las capturas son de 706 px de ancho y los iconos cuadrados de al menos 48 px.

El validador del plugin pasa y el ZIP se generó/revisó; esto verifica formato
y archivos, no aprobación del envío ni comportamiento de producción.
La cuenta demo sin MFA, archivos de tipografía, video y evidencia en clientes
reales también siguen pendientes. Las capturas de Claude quedan en
`views/test-results/claude/` y las de OpenAI se generan en
`views/test-results/openai/` antes de incorporarlas al paquete.

No se eligió una licencia de distribución. El canal especializado de reporte
de vulnerabilidades está pendiente de definición; soporte general confirmado
en la página de contacto.
