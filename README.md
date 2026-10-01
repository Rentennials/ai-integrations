# Rentennials · ai-integrations

Repositorio público para las integraciones de Rentennials con asistentes y las
pantallas compartidas de MCP Apps. El servidor MCP permanece en un repositorio
privado; acá viven su presentación y el material de publicación.

## Estructura prevista

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

## Distribución prevista de views

Las views se distribuyen desde GitHub, sin npm registry. El tag de fuentes
`mcp-views-vX.Y.Z` disparará un workflow que construye los HTML autocontenidos y
publica `mcp-views-dist-vX.Y.Z`, con `package.json` y `dist/` en la raíz.
`dist/manifest.json` describe las cinco URI `ui://rentennials/<view>` y su CSP.

El consumidor fija el tag de distribución en su dependencia
`rentennials-mcp-views`, borra su instalación anterior del paquete y `yarn.lock`,
ejecuta `yarn install` manualmente y despliega el servidor. El cambio de las
pantallas no requiere una nueva versión del plugin.

## Estado

Inicialización local. El setup, las pantallas, los workflows y el paquete de
OpenAI todavía no están implementados. Los comandos se documentarán cuando
existan sus scripts. Node 22 y Yarn 1 workspaces son el stack acordado.

No se eligió una licencia de distribución. El canal de soporte y los assets
oficiales para el listing están pendientes de confirmación.
