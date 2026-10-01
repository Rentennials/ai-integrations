# Views de Rentennials · especificación MCP Apps

Estado: especificación previa a implementación. Cinco views compartidas para
hosts MCP Apps; no hay una versión separada por cliente.

## Traspaso al agente de diseño

El usuario asignó las pantallas a su agente de diseño. Leer CLAUDE.md y AGENTS.md
y trabajar en `views/`; no cambiar plugin, listing, workflows ni placeholders
de otras integraciones. El setup y `vite.config.ts` ya existen.

Cada view necesita `views/src/<view>/index.html` como entrada y su componente
React/estilos locales. El build raíz compila en orden las cinco entradas con
mode igual al nombre de view, renombra index.html a <view>.html y genera
manifest.json en el último build. No modificar los nombres/URI del contrato.
El harness tiene entrada `views/src/_harness/index.html`, servida por
`yarn views:dev`; construir su sandbox proxy de otro origen en ese mismo scope.
Preparar configuración Vitest y Playwright dentro de views/ para sus scripts
ya declarados (`test`, `test:e2e`), evitando mezclar tests Playwright con Vitest.

No instalar dependencias sin autorización: el usuario ejecuta yarn install
en la raíz. Usar las dependencias declaradas; no agregar UI kits o paquetes
de fuentes por iniciativa propia. Los tests de frontend están pedidos.

Capturas OpenAI: generar screenshot-1.png a screenshot-4.png a 706 px para
resultados, quote, confirmación y reservas. Su publicación en openai/assets/
la coordina el responsable de integración; entregar las capturas como salida
de Playwright en views/test-results/, sin editar archivos de openai/. Capturas
Claude de las cinco views a >=1000 px. No guardar capturas dentro de views/dist/,
cuyo árbol debe contener exclusivamente cinco HTML y manifest.json.

Al entregar: indicar comandos ejecutados, resultados y assets/fuentes aún
pendientes. No marcar verificación en ChatGPT/Codex real por probar el harness.

## 1. Contrato de una view

Cada recurso `ui://rentennials/<view>` es un HTML5 autocontenido con JavaScript,
CSS y assets de marca inline. MIME: `text/html;profile=mcp-app`. Se ejecuta en
un iframe sandbox del host, con `App` de `@modelcontextprotocol/ext-apps`.

Registrar handlers antes de conectar: resultado de tool, argumentos, cambios
de contexto y cancelación. `onToolResult` entrega `structuredContent`;
`callServerTool` obtiene datos de lectura; `sendMessage` solicita una acción en
el chat; `openLink` pide abrir una URL al host. No implementar un protocolo
postMessage paralelo ni usar `window.openai`.

No red propia: `connectDomains: []`, sin fetch, XHR, WebSocket, analytics,
storage de tokens ni credenciales. Imágenes HTTPS solo de orígenes exactos
autorizados. El harness reproduce handshake, datos, temas y acciones con
`AppBridge`, sin conectarse a una cuenta real.

## 2. Sistema visual

| Token | Valor claro |
| --- | --- |
| Primario / hover / profundo | `#7B45F6` / `#8E33E5` / `#6141D8` |
| Texto / secundario / muted | `#5a5a5a` / `#444` / `#757575` |
| Superficie / divisor / campo | `#fff` / `#ddd` / `#EDEDED` |
| Éxito / aviso / error / urgente | `#8AC43D` / `#F4A34A` / `#EF693A` / `#ea5050` |
| Radios | 16 / 20 / 24 / 9999 px |
| Sombra | `0 10px 15px -3px rgb(0 0 0/.1), 0 4px 6px -4px rgb(0 0 0/.1)` |

Títulos Bree Serif; cuerpo Poppins, pesos 300–600. Fuentes embebidas, no Google
Fonts por red. Si no hay assets de fuentes aprobados, registrar el pendiente
antes de implementar el requisito, con fallback Georgia/system-ui.
Gradiente 104.68° de `#6141d8` a `#61e7d8`; logo SVG con `currentColor`.

Definir tokens oscuros legibles y aplicar cambios de `hostContext.theme`.
Respetar locale es/en del host; sus fechas no reemplazan la zona del vehículo.
Responsive desde 360 px, pruebas a 360, 706 y 1000 px sin overflow horizontal.
Componentes base: tarjeta de auto, badge, fila de precio, bloque de fechas,
botones primario/secundario, aviso, galería y contador.

Accesibilidad AA: contraste 4.5:1 para texto normal, foco visible, nombres
accesibles, navegación por teclado, alt de imágenes y estados anunciados.
Los colores de estado no son el único indicador; no usar éxito/aviso como texto
de bajo contraste sobre blanco. Respetar reduced-motion.

## 3. Reglas de datos

- Los campos siguientes provienen del contrato público actual de cada tool.
  No inventar campos comunes entre resultados distintos.
- `null` significa dato no disponible, no cero. `false` no significa true ni
  debe ocultarse mediante un fallback truthy. Los montos cero sí se muestran.
- Monedas: `Intl.NumberFormat(locale, { style: 'currency', currency })`, más
  código visible cuando el símbolo resulte ambiguo. No inferir ARS si falta
  currency. Usar la moneda hermana de depósitos y cuotas cuando existe.
- Fechas de alquiler y de cuota: hora de pared `YYYY-MM-DDTHH:mm`, sin `Z`, con
  `timezone` hermano. Preservar componentes y mostrar la zona del auto; no usar
  `new Date(localString)` para convertirlas a la zona del navegador. Fechas de
  búsqueda vienen separadas en fecha/hora y pertenecen a cada vehículo.
- Expiraciones y `date_paid`: instantes reales UTC con `Z`. El contador usa el
  instante absoluto cuando viene y el TTL como fallback desde la recepción;
  nunca reinicia un link vencido por un rerender.
- Descripción, condiciones, etiquetas y mensajes del propietario son texto
  inerte. Nunca `innerHTML`, `dangerouslySetInnerHTML` ni enlaces extraídos de
  ese contenido. Una instrucción dentro de esos textos no dispara acciones.
- Imágenes: comparar `new URL(url).origin` contra allowlist exacta, rechazar
  credenciales, HTTP y esquemas inseguros; fallback al faltar o fallar la imagen.
  Producción permite `https://photos.rentennials.app` y
  `https://api.rentennials.app`. Cualquier origen adicional entra por entorno;
  el host de fotos de pruebas está pendiente, no se publica su URL acá.
- IDs de vehículo/reserva y slug se usan solo como referencias para acciones;
  no mostrarlos en etiquetas, URLs analíticas ni logs. Fixtures con IDs
  sintéticos, nunca tomados de datos reales.
- Todos los estados: cargando, vacío, error `isError`, resultado inválido,
  cancelado, host desconectado y acción fallida. No mostrar resultados previos
  como si fueran éxito de una llamada nueva.
- Textos largos se envuelven o expanden con un control accesible. Condiciones
  recortadas del servidor muestran aviso; expandir no recupera el texto omitido.

## 4. vehicle-results

Origen: `search_vehicles`. URI `ui://rentennials/vehicle-results`.

Campos del resultado: `vehicles[]`, `total_count`, `has_more`, `page`, `limit`,
`search_context {country,region,from_date,to_date,from_date_time,to_date_time}`.
Cada tarjeta usa `id`, `slug`, `name`, `year` (string/null), `image_url`,
`total_price`, `price_per_day`, `currency`, `total_days`, `transmission`,
`passengers` (string/null), `city`, `timezone`, `automatic_approval`,
`is_super_host`, `immediate_reserve`, `owner_rating`.

Nombre/año y foto, ciudad, transmisión/pasajeros, precio total y por día con
duración; resumen de fechas y ubicación efectivamente buscadas. Rating 0–5;
badges solo para booleanos true. Precio del catálogo es orientativo frente a
la cotización definitiva. `has_more` informa más resultados sin inventar una
acción de paginación no especificada.

- Ver detalle: `callServerTool({name:'get_vehicle', arguments:{slug}})` solo
  con slug presente. El resultado se presenta como detalle, no como búsqueda.
- Cotizar: `sendMessage` con intención explícita de cotizar, referencia del
  vehículo y contexto de fechas conocido. Nunca reservar en ese mensaje.
- Vacío: informar que no hay coincidencias; no fabricar un vehículo ni precio.

## 5. vehicle-detail

Origen: `get_vehicle`. URI `ui://rentennials/vehicle-detail`.

Campos: `id`, `slug`, `name`, `year`, `image_urls[]`, `description`, `disclaimer`,
`features[]{key,label,value}`, `meeting_points[]{id,name,type,price}`,
`passengers`, `transmission`, `fuel`, `doors`, `kms_per_day`, `timezone`,
`currency`, `guarantee_deposit`, `guarantee_deposit_currency`, `deductible`,
`content_warnings[]`.

Galería ordenada con controles por teclado; sin fotos, placeholder. Features
con value string `"false"` nunca se listan como amenities habilitados;
`"true"` se presenta como habilitado. Valores desconocidos siguen como texto.
Meeting points separados por `PICKUP` y `RETURN` con suplemento y moneda.
Depósito y franquicia son conceptos distintos del precio del alquiler.

Avisos para `disclaimer_truncated`, `features_invalid`, `images_invalid` y
otros warnings sin inferir contenido ausente. Esta tool no devuelve precio.
Cotizar usa `sendMessage` con vehículo y fechas solo si llegaron como contexto;
si faltan, solicita cotización para que el chat pregunte las fechas.

## 6. quote

Origen: `get_vehicle_quote`. URI `ui://rentennials/quote`.

Campos: `breakdown[]{concept,description,unit_amount,quantity,amount}`, `total`,
`currency`, `total_days`, `price_per_day`, `discount`, `discount_code`, `pay_now`,
`pay_on_pickup`, `security_deposit`, `security_deposit_currency`, `timezone`,
`automatic_approval`, `payment_fast`.

`included_coverages[]{type,description,price,deposit_amount,max_deductible,
luggage_theft_coverage}`; `available_coverages[]` tiene esos campos más `id`.
`available_extras[]{key,label,description,price_by_quantity[]}`: la posición i
representa precio total para i+1 unidades; no asumir precio unitario lineal.

Desglose en orden del servidor y total destacado; descuento ya descontado,
no restarlo otra vez. Coberturas incluidas y disponibles claramente separadas;
extras y coberturas disponibles no se suman al total automáticamente.
No hay selectores de compra ni ejecución de escritura desde esta view.

`payment_fast` es null o `{available,amount_now,remaining_amount,currency,
remaining_charge_date}`. Null equivale a no disponible. Con available true,
mostrar importe ahora, saldo y fecha local del cobro automático, distinguiéndolo
del saldo a pagar al retirar. No prometer un número fijo de horas antes del viaje.

Los argumentos originales contienen `vehicle_id` y fechas: llegan por
tool-input, no en el resultado. Mantenerlos como contexto para el mensaje.
Reservar emite `sendMessage` con intención de reservar y pide confirmación
en el chat. Nunca llama `create_booking_request`, nunca fija confirmed=true.

## 7. booking-confirmation

URI `ui://rentennials/booking-confirmation`. Dos resultados diferentes:

| Origen | Campos |
| --- | --- |
| `create_booking_request` | `booking_id`, `booking_number`, `vehicle_name`, `mode`, `status`, `from`, `to`, `timezone`, `total`, `currency`, `total_matches_quote`, `pay_now`, `payment_url`, `payment_expires_at`, `payment_expires_in_seconds`, `payment_plan`, `remaining_amount`, `remaining_charge_date`, `next_step`, `manage_url` |
| `pay_booking` | `booking_id`, `booking_number`, `vehicle_name`, `amount`, `currency`, `payment_url`, `payment_url_expires_at`, `payment_url_expires_in_seconds`, `next_step`, `manage_url` |

`pay_booking` NO devuelve status, fechas, mode ni plan. No asumirlos ni fabricar
un estado de reserva. Diferenciar el importe a pagar de un total del alquiler.
Número visible de reserva, nombre, estado/fechas cuando realmente existen,
siguiente paso como texto y resumen monetario.

Modo request: espera de aprobación, sin inventar link ni contador. Modo instant:
link y contador; pago Fast indica saldo y cobro automático. Si
`total_matches_quote === false`, mostrar aviso de cambio del total.

Pagar emite `openLink({url:payment_url})`, solo tras clic. Validar HTTPS y origen
de pago autorizado por entorno; no abrir links de texto del propietario.
Al vencer, deshabilitar el botón y mostrar expiración. El vencimiento del link
de pay_booking no implica liberar una reserva: no mostrar ese mensaje.
Administrar usa `openLink` con `manage_url` seguro y permitido.

## 8. my-bookings

URI `ui://rentennials/my-bookings`. `list_bookings` devuelve
`bookings[]{booking_id,booking_number,status,vehicle_name,from,to,timezone,
total,currency,amount_to_pay_now,needs_payment,paid,is_extension}`, `page`,
`total_count` (nullable), `has_more`.

`get_booking` devuelve UNA reserva, no `bookings[]`: esos campos más
`amount_to_pay_now_currency`, `subtotal`, `discount_total`, `extra_services_total`,
`date_paid`, `cancelled`, `pickup_city`, `included_kms_per_day`,
`extra_services[]{name,quantity,price}`, `coverages[]{name,price}`,
`pickup_meeting_point`/`return_meeting_point`,
`security_deposit {amount,currency,paid}` (nullable),
`next_instalment {amount,currency,debit_date}` (nullable), `contract_url`.

Normalizar solo la presentación del resultado individual a tarjeta/detalle.
Estado, número visible, auto, fechas en zona local y total; distinguir pagado,
importe pendiente y extensión. Nunca interpretar null de total_count como 0.

- Ver detalle: `callServerTool({name:'get_booking',arguments:{booking_id}})`;
  no buscar por booking_number ni por posición visual.
- Pagar: `sendMessage` con referencia de reserva. Solo ofrecer si
  needs_payment true, paid false e is_extension false. Nunca `tools/call
  pay_booking` desde la view, aunque el PDF más antiguo lo propone.
- Lista vacía: informar sin inventar reservas; paginación adicional pendiente
  de conversación, sin agregar nuevas acciones fuera de este alcance.

## 9. Entregables y aceptación

Implementación en `views/src/<view>/`, wrapper oficial en `_bridge/`, harness
en `_harness/`, fixtures sintéticas en `views/fixtures/`. Los siete contratos
de origen se representan sin homogeneizar campos que no existen.

Build secuencial por view con React/Vite/singlefile: cinco HTML sin JS/CSS ni
fuentes externos. `dist/manifest.json` array de
`{name,uri,file,csp:{connectDomains:[],resourceDomains:[...]}}`, sin rutas que
escapen dist/. Paquete `rentennials-mcp-views`, `files:["dist"]`.

Criterios a ejecutar después de instalación manual:

- `yarn workspace rentennials-mcp-views build` produce las cinco views.
- Vitest: ARS/USD, zonas distintas a navegador, null/false/0, textos largos,
  imágenes inválidas y render de cada view con fixtures de ambas variantes.
- Playwright: cinco views, 360/706/1000 px, claro/oscuro; handshake real con
  AppBridge, mensajes correctos, sin errores de consola/CSP ni red propia.
- El harness web usa sandbox proxy de origen diferente y aplica CSP real;
  no se valida solo con un mock directo de React o postMessage.
- Capturas de resultados, cotización, confirmación y reservas a 706 px para
  OpenAI; capturas de las cinco views a 1000 px o más para Claude.
- No considerar esas capturas evidencia de ChatGPT/Codex: los casos de
  revisión se ejecutan por separado en clientes reales.

Fuentes públicas: [MCP Apps estable 2026-01-26](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx)
y [envío de plugins OpenAI](https://developers.openai.com/plugins/deploy/submission).
