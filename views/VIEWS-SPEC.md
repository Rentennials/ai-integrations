# Views de Rentennials · especificación MCP Apps

Estado: cinco views entregadas por el agente de diseño e integradas al repo,
con contratos y harness ajustados. Lint/typecheck, 47 tests Vitest, build y
39 tests Playwright verificados con Node 22. Los criterios siguientes siguen
siendo el contrato de aceptación; fuentes de marca y validación en hosts reales pendientes.

## Traspaso al agente de diseño

El usuario asignó las pantallas a su agente de diseño. Leer CLAUDE.md y AGENTS.md
y trabajar en `views/`; no cambiar plugin, listing, workflows ni placeholders
de otras integraciones. El setup y `vite.config.ts` ya existen.

Este documento es autocontenido para el diseño: no hace falta acceso al front
ni a otros repositorios de Rentennials. La sección 2 describe la identidad y
componentes relevados del portal actual; las secciones 4–8 definen cómo
componer las cinco views. Las capturas que aporte el usuario complementan esta
guía, pero no son requisito para empezar. No pedir al usuario código privado
para resolver decisiones visuales ya detalladas acá.

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

La integración usa `_shared/` para componentes/contratos/formato y `_bridge/`
para el wrapper oficial. Playwright importa `playwright/test`, incluido en el
paquete declarado. Los mensajes enviados al modelo van en inglés aunque la UI
esté en español. El origen productivo de pago es `https://mcp.rentennials.app`.
Vite deriva allowlists de `MCP_UI_IMAGE_HOSTS` y del origen de `MCP_PUBLIC_URL`;
no es necesario configurar variables VITE adicionales.

Las capturas actuales usan imágenes sintéticas interceptadas por los tests y
fallback Georgia/system-ui; no se presenta ese material como evidencia de
ChatGPT/Codex ni como aprobación de assets de marca.

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

### 2.1. Identidad y referencias del portal actual

Referencia relevada el 1 de octubre de 2026 a partir de estilos y componentes
de catálogo, detalle de vehículo, resumen de pago y tarjetas de viajes.
No se inspeccionó una sesión de navegador: la apariencia exacta de una página
completa debe contrastarse con las capturas del usuario.

Rentennials combina una identidad violeta reconocible con un trato cercano:
fotos grandes de autos reales, esquinas redondeadas, superficies blancas,
tipografía serif con personalidad para títulos y cifras, y detalles de lectura
más livianos. La información de precio y fechas es protagonista junto con la
foto; evitar una estética de dashboard corporativo denso.

Rasgos comprobados en los componentes del portal:

- **Resultados:** tarjeta con radio de 20 px, borde fino gris y `shadow-lg`;
  imagen superior de unos 260 px de alto en el portal, recortada con object-cover,
  nombre violeta, ubicación gris, rating con estrella violeta y precio/duración
  hacia el extremo derecho del resumen.
- **Detalle:** panel blanco con radio de 16 px y sombra; foto y características
  en dos columnas cuando hay espacio. Características en celdas de tres
  columnas, con iconos de unos 24 px, texto pequeño Poppins y separaciones de
  16 px. Secciones informativas separadas por espacio, no por grandes bloques
  de color.
- **Fechas:** dos columnas simétricas “Desde” y “Hasta”, borde exterior de 2 px
  en gris de campo, radio de 16 px, divisor vertical y encabezados violetas.
  Fecha violeta y hora en gris; cada etiqueta puede acompañarse de un icono.
- **Precios:** etiquetas a la izquierda y montos violetas a la derecha;
  separadores grises. El resumen de pago tiene una banda de total sobre
  `#444444` con texto blanco y cifra grande, diferenciada de seña/saldo.
- **Viajes:** tarjeta blanca con radio de 20 px, número de solicitud pequeño,
  nombre del auto violeta destacado, fechas y total agrupados debajo. En anchos
  grandes la foto y el resumen pueden estar en la misma fila.
- **Interacción:** botones con hover violeta secundario y estado de carga;
  tarjetas e indicadores redondeados. El portal incluye imágenes/iconos propios
  además del isotipo.

Las medidas de iframe, jerarquía tipográfica, modo oscuro y simplificación de
controles indicadas a continuación son **adaptaciones para MCP Apps**, no una
afirmación de que el portal completo usa exactamente esas medidas. Las fotos
de propietario, promociones, banners de urgencia, mapa, checkout y menú web
del portal no se incorporan si no existen en el contrato de la view.

### 2.2. Paleta y uso de tokens

| Token | Valor claro |
| --- | --- |
| Primario / hover / profundo | `#7B45F6` / `#8E33E5` / `#6141D8` |
| Texto / secundario / muted | `#5a5a5a` / `#444` / `#757575` |
| Superficie / divisor / campo | `#fff` / `#ddd` / `#EDEDED` |
| Éxito / aviso / error / urgente | `#8AC43D` / `#F4A34A` / `#EF693A` / `#ea5050` |
| Radios | 16 / 20 / 24 / 9999 px |
| Sombra | `0 10px 15px -3px rgb(0 0 0/.1), 0 4px 6px -4px rgb(0 0 0/.1)` |

Usos concretos:

- Primario: CTA principal, nombre del vehículo, monto destacado e iconos de
  marca. No convertir todos los textos de la pantalla en violeta.
- Hover: solo al interactuar con CTA; profundo para énfasis secundario.
- Superficie blanca: tarjetas y paneles. Campo gris: bloques auxiliares y
  placeholders, no el fondo de toda la tarjeta.
- Texto secundario `#444`: datos principales y banda de total; `#5a5a5a` para
  texto general y `#757575` para metadatos sobre blanco cuando tenga contraste.
- Éxito/aviso/error: icono, borde o acento de un aviso con texto legible. No
  usarlos como fondo de párrafos blancos pequeños sin comprobar contraste.
- El gradiente de marca es decorativo y opcional: encabezado pequeño o acento,
  nunca detrás de todo el desglose, de condiciones ni de texto extenso.

Gradiente completo, si se utiliza:

```css
linear-gradient(104.68deg,
  #6141d8 0%, #6175d8 20.27%, #61a6d8 43.35%,
  #61c9d8 60.42%, #61dfd8 88.39%, #61e7d8 100%)
```

### 2.3. Tipografía y espaciado para el chat

Títulos Bree Serif; cuerpo Poppins, pesos 300–600. Fuentes embebidas, no Google
Fonts por red. Si no hay assets de fuentes aprobados, registrar el pendiente
antes de implementar el requisito, con fallback Georgia/system-ui.
Gradiente 104.68° de `#6141d8` a `#61e7d8`; logo SVG con `currentColor`.

El portal usa Bree Serif ampliamente, incluso en etiquetas y precios; Poppins
aparece en características y detalles. Para estas views, conservar Bree Serif
en títulos, nombres y total, y Poppins en cuerpo, fechas, metadatos y textos
largos. Bree Serif tiene peso regular: no simular una negrita 700 para esa fuente.

Escala recomendada para implementar sin ver el portal:

| Elemento | Fuente | Tamaño / interlineado | Peso |
| --- | --- | --- | --- |
| Título de view | Bree Serif | 24 / 30 px; hasta 28 / 34 px en ancho amplio | 400 |
| Nombre en tarjeta / sección | Bree Serif | 18 / 24 px | 400 |
| Total destacado | Bree Serif | 28 / 34 px; hasta 32 / 38 px | 400 |
| Texto general / acción | Poppins | 14 / 21 px | 400 / 500 |
| Etiqueta de dato | Poppins | 13 / 18 px | 500 |
| Metadata / badge | Poppins | 12 / 18 px | 400 / 500 |
| Descripción y condiciones | Poppins | 14 / 22 px | 400 |

Usar una escala de espacios 4/8/12/16/20/24/32 px. Padding exterior 16 px en
360 px, 20–24 px en 706/1000 px; padding de tarjetas 16–20 px. Gaps de 12–16 px
entre tarjetas y de 20–24 px entre secciones. Permitir wrap en todas las filas
con texto largo; montos alineados al extremo derecho sin recortar su moneda.

La view ocupa el ancho que ofrece el host, sin navbar, footer web, sidebar,
selector de idioma, formulario de login ni botones fijos al viewport. Encabezado
compacto: isotipo/nombre Rentennials, título de la view y contexto si lo hay.
Una sola acción principal por panel; acciones secundarias claramente menores.

### 2.4. Logo e iconos sin acceso al front

Isotipo oficial compacto, con geometría del asset público y fill adaptable.
Puede embebirse directamente; no requiere una URL de imágenes ni una librería:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 43.236 49.5"
     width="28" height="32" role="img" aria-label="Rentennials">
  <path fill="currentColor" d="M20.7,20.014l0.001,3.975c0,1.087-0.881,1.968-1.967,1.968c-1.087,0-1.968-0.881-1.968-1.968l-0.001-9.099 c0-1.087,0.881-1.968,1.967-1.968l9.099-0.002c1.087,0,1.968,0.881,1.968,1.968s-0.881,1.968-1.968,1.968l-4.769,0.001 l11.551,12.859c3.435-2.929,5.62-7.281,5.62-12.15c0-8.823-7.152-15.975-15.975-15.975H5.356v0.006 c-1.517,0-3.314,1.389-3.314,3.425l0,0v9.395l19.696,21.926l-0.001-3.975c0-1.087,0.881-1.968,1.967-1.968 c1.087,0,1.968,0.881,1.968,1.968l0.001,9.099c0,1.087-0.881,1.968-1.967,1.968l-9.099,0.002c-1.087,0-1.968-0.881-1.968-1.968 c0-1.087,0.881-1.968,1.967-1.968l4.769-0.001L2.042,20.203v24.795L2.048,45c0.058,1.705,1.357,3.093,3.024,3.288l0.4,0.025l0,0 h0.001h32.953h0.001c1.895,0,3.431-1.536,3.431-3.431c0-1.218-0.78-2.177-0.78-2.177C41.047,42.668,20.7,20.014,20.7,20.014z" />
</svg>
```

En claro: color primario/profundo; sobre gradiente oscuro: blanco. Mantener
proporción y espacio libre de al menos 8 px, sin deformarlo ni redibujarlo.
Se puede acompañar de “Rentennials” como nombre textual de la app; eso no
recrea el logotipo tipográfico oficial. Si el usuario entrega el logo completo,
usar ese asset sin sustituir sus letras por una fuente aproximada.

Iconos funcionales: SVG inline simples de 20–24 px, stroke de 1.5–2 px y estilo
consistente para calendario, pasajeros, transmisión, ubicación, estrella,
información, check, reloj y enlace externo. Decorativos con aria-hidden;
botones con nombre accesible. No agregar react-icons/lucide ni copiar dependencias
del portal. Un fallback de foto debe ser neutro, con silueta de auto y texto
“Imagen no disponible”, no una fotografía de otro vehículo.

### 2.5. Oscuro y responsive

Paleta oscura **propuesta para MCP Apps**, a contrastar con capturas si el usuario
entrega una referencia oscura del producto:

| Función | Valor oscuro recomendado |
| --- | --- |
| Fondo de view / superficie / auxiliar | `#17181D` / `#22232B` / `#2B2D38` |
| Texto principal / secundario / muted | `#F4F4F7` / `#D5D6DF` / `#B8BAC8` |
| Divisor / borde | `#444650` |
| Violeta para texto/iconos sobre superficie | `#B79AFF` |
| CTA primario / hover | `#7B45F6` / `#8E33E5`, texto blanco |
| Banda de total | `#30323D`, texto blanco |

Separar token de CTA y token de enlace/importe: el violeta oscuro original puede
perder contraste como texto en fondo oscuro. Adaptar los avisos con fondos
tenues y texto claro. No invertir fotografías ni SVGs que contienen colores
intrínsecos; el isotipo currentColor sí adapta su color. Comprobar AA también
en badges, texto sobre campos y estados de foco, no solo en fondo blanco.

Definir tokens oscuros legibles y aplicar cambios de `hostContext.theme`.
Respetar locale es/en del host; sus fechas no reemplazan la zona del vehículo.
Responsive desde 360 px, pruebas a 360, 706 y 1000 px sin overflow horizontal.
Componentes base: tarjeta de auto, badge, fila de precio, bloque de fechas,
botones primario/secundario, aviso, galería y contador.

Accesibilidad AA: contraste 4.5:1 para texto normal, foco visible, nombres
accesibles, navegación por teclado, alt de imágenes y estados anunciados.
Los colores de estado no son el único indicador; no usar éxito/aviso como texto
de bajo contraste sobre blanco. Respetar reduced-motion.

Distribución a los tres anchos de prueba:

- **360 px:** una columna; CTA ancho completo; secciones apiladas. Fechas en dos
  celdas solo mientras sigan legibles; apilarlas si locale/zoom lo exige.
- **706 px:** resultados en dos columnas; detalle puede separar galería y
  atributos si caben sin comprimir texto. Cotización y confirmación mantienen
  un resumen claro, sin forzar un checkout de escritorio dentro del iframe.
- **1000 px:** resultados en tres columnas; detalle en dos áreas, galería y
  resumen; cotización puede separar desglose y total. Respetar max-width del
  contenedor del host y no agregar columnas vacías para simular un sitio web.

Estas columnas dependen del ancho **del iframe**, no del tamaño de la pantalla
del navegador. Las cards usan min-width: 0 para evitar overflow. Los carruseles
se reservan para la galería de una sola unidad, con navegación explícita;
no ocultar toda la selección de vehículos detrás de un swipe obligatorio.

### 2.6. Biblioteca de componentes esperada

| Componente | Especificación visual y comportamiento |
| --- | --- |
| VehicleCard | Radio 20 px, borde 1 px, sombra suave; imagen superior 4:3 con object-cover; cuerpo 16 px; nombre violeta, ciudad y características compactas; total + moneda destacados, duración debajo; acciones separadas. |
| Badge | Pill radio 9999 px, padding 4 px vertical / 8–12 px horizontal; label 12 px y un icono opcional; wraps entre badges, no dentro de una palabra. Superhost, aprobación automática y disponibilidad inmediata son conceptos separados. |
| DateBlock | Radio 16 px, borde 2 px gris de campo; Desde/Hasta en dos celdas con divisor; fecha y hora claras y timezone debajo. Sin selector de fechas en esta entrega. |
| PriceRow | Grid etiqueta flexible / monto auto, gap 12 px, baseline alineada; etiqueta puede ocupar varias líneas y monto permanece completo. Líneas negativas identificadas como descuento. |
| TotalPanel | Banda de fondo #444 en claro, radio 16 px o integrada en el panel; label Total y cifra 28–32 px blanca, moneda explícita. Seña, saldo y depósito fuera de esa banda y bien rotulados. |
| PrimaryButton | Altura mínima 44 px, preferida 46–48 px; radio pill; fondo primario, texto blanco 14 px/500; padding horizontal 20 px. Hover secundario, foco visible exterior; loading con spinner sin cambiar ancho. |
| SecondaryButton | Misma altura, fondo transparente, borde/divisor y texto de énfasis; hover tenue violeta. No dar a ambas acciones la misma prominencia visual. |
| Notice | Caja radio 16 px, padding 12–16 px; icono + título + explicación. Usar texto además del color; owner conditions truncadas son aviso, no prueba de fraude ni error de pago. |
| Gallery | Foto principal con radio 16–20 px; anterior/siguiente accesibles, indicador “1 de N”, miniaturas cuando hay espacio. Sin autoplay; layout estable antes y después de cargar. |
| Countdown | Reloj + etiqueta + mm:ss; números tabulares y texto accesible, sin anunciar cada segundo a un lector de pantalla. Cambio a expirado visible y CTA de pago deshabilitado. |
| Empty/Error | Icono sobrio, título y explicación breve; layout del mismo sistema visual, sin ilustración gigante. Error de una acción no borra un resultado válido previo, pero lo distingue del intento fallido. |

Skeletons de imagen y líneas con `#fafafa`/`#f1f1f1` en claro, tonos auxiliares
en oscuro, manteniendo proporciones. Animación opcional suave, desactivada con
reduced-motion; evitar loaders que reemplacen todo el iframe durante una acción.

Textos de referencia es/en: “Ver detalle / View details”, “Cotizar / Get a quote”,
“Solicitar reserva / Request booking”, “Pagar en Rentennials / Pay on Rentennials”,
“Mis reservas / My bookings”, “Precio no disponible / Price unavailable”,
“Sin resultados / No results”, “Enlace vencido / Link expired”. Mantener tono
directo, sin promesas de disponibilidad, ahorro o aprobación no respaldadas.

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

**Composición visual:** encabezado “Autos para tu viaje”, resumen de ubicación
y fechas buscadas, cantidad de coincidencias y grilla de tarjetas. Cada tarjeta,
en orden: foto, badges válidos, nombre/año, ciudad, transmisión/pasajeros,
total/moneda/duración y botones Ver detalle (secundario) / Cotizar (principal).
La imagen_url única del resultado no se convierte en una galería ficticia.
Rating nullable: no dibujar cinco estrellas llenas ni usar 0 por defecto.
En 360 px cada card ocupa el ancho útil; a 706/1000 px mantener alturas de
foto iguales y acciones alineadas, dejando crecer los textos cuando se expanden.

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

**Composición visual:** nombre del vehículo arriba; galería y resumen de
características debajo. Usar celdas compactas de atributos presentes, sin
repetir año/transmisión/pasajeros tanto en cabecera como en la misma grilla.
Seguir con Descripción, Condiciones del propietario, Retiro/devolución y bloque
Depósito/franquicia. CTA Cotizar al final del resumen y antes de textos extensos
si hace falta, con una sola acción primaria visible por área. Sin precio de
alquiler, avatar de propietario, mapa, comentarios, badge GPS o coberturas
inventadas: la referencia del portal solo aporta la apariencia.

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

**Composición visual:** título “Tu cotización”, contexto de fechas solo cuando
esté disponible en tool-input, desglose en PriceRows, coberturas incluidas,
opcionales/extras como información y TotalPanel. Luego filas “A pagar ahora”,
“Al retirar” y “Depósito de garantía” separadas del total. Payment Fast en
Notice/panel violeta tenue, con importe inicial y siguiente cobro explícitos.
Cerrar con modo de aprobación y CTA de solicitud de reserva mediante chat.
En 360/706 px usar lectura vertical; a 1000 px resumen/CTA en columna lateral
opcional, en flujo normal sin barra sticky. Ningún control que parezca comprar
una cobertura, ingresar tarjeta o confirmar un cobro directamente.

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

**Composición visual:** aviso de estado con icono semántico, número de reserva
y vehículo; fechas si existen, resumen de total/importe a pagar, siguiente paso
y acciones. `request` usa “Solicitud enviada / Request sent” y espera de
aprobación, no “Reserva confirmada”. `instant` provisional usa “Pendiente de
pago / Awaiting payment”; recibir un link no demuestra que se pagó. Para
pay_booking el título es “Enlace de pago / Payment link” y no se adivina status.
Agrupar countdown y botón Pagar en un mismo bloque visible, con icono de enlace
externo y texto “Se abre fuera del chat”. Si venció, sustituir el contador por
aviso de expiración sin mostrar un check de éxito. Diseño compacto de una
columna; no copiar el formulario Stripe del portal al iframe.

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

**Composición visual:** encabezado “Mis reservas”, tarjetas de una columna con
número de solicitud pequeño, nombre de auto destacado, badge de estado textual,
fechas, total e importe pendiente cuando corresponda. Acciones abajo a 360 px;
a 706/1000 px pueden alinearse al costado si el contenido sigue legible. Lista
de reservas sin foto: estos resultados no incluyen image_url, ni avatar, ni
rating; no reutilizar imágenes de otro auto para imitar el portal.
El detalle de get_booking amplía con desglose, coberturas, puntos de encuentro,
depósito y cuota si existen. El marcador Extensión debe ser visible y excluir
el CTA Pagar. Si status es null, “Estado no disponible”; no inferirlo a partir
del color o de un monto.

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

### Material visual que puede aportar el usuario

Para ajustar fidelidad, solicitar este conjunto de referencias, con nombre de
pantalla y ancho aproximado. Son complementarias a los tokens/contratos de
este MD; no requieren compartir acceso al front:

1. **Listado de autos:** una captura de escritorio con 2–3 tarjetas completas,
   precios y badges; una de móvil con una tarjeta y sus bordes visibles.
2. **Detalle de auto:** galería/cabecera/atributos y una captura de las secciones
   de descripción, condiciones y puntos de entrega.
3. **Cotización/resumen de reserva:** desglose, seña/saldo/depósito, total y CTA;
   incluir el aviso Rentennials Fast si aparece para ese caso.
4. **Resultado de reserva y enlace de pago:** estado, siguiente paso y tiempo de
   vencimiento si lo muestra. No hace falta el formulario de tarjeta.
5. **Mis viajes/reservas:** una tarjeta pendiente y una pagada con sus acciones;
   versión móvil si difiere mucho. Una referencia oscura, si existe, es útil.
6. **Assets:** logo completo SVG/PNG y, si están disponibles, archivos de Bree
   Serif/Poppins con permiso de uso y licencia para embeberlos. Una captura de
   texto no reemplaza los archivos de fuente.

Compartir capturas recortadas al producto, con datos personales y referencias
reales anonimizados. Claude Design debe usarlas para forma/color/composición,
no para copiar datos, inventar campos ausentes ni trasladar acciones del portal
que aquí se ejecutan por el chat. Si una captura muestra un dato o control fuera
del contrato, conservar solo la referencia visual de su componente.

Revisión visual final: identidad reconocible por el isotipo/violeta/tipografía,
fotos protagonistas cuando existen, jerarquía de precio/fechas, radios y espacios
consistentes, texto legible en ambos temas y CTA correspondiente a cada estado.
La especificación de datos/acciones prevalece frente a la apariencia del portal.

Fuentes públicas: [MCP Apps estable 2026-01-26](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx)
y [envío de plugins OpenAI](https://developers.openai.com/plugins/deploy/submission).
