# Views de Rentennials · especificación MCP Apps

Estado: dos views (`vehicle-results` y `quote`, paquete 2.0.0) integradas al repo,
con contratos y harness ajustados. Lint, typecheck, 35 tests Vitest, build y
36 tests Playwright pasan con Node 22. Los criterios siguientes siguen siendo el
contrato de aceptación; fuentes de marca y validación en hosts reales pendientes.

## Traspaso al agente de diseño

El usuario asignó las pantallas a su agente de diseño. Leer CLAUDE.md y AGENTS.md
y trabajar en `views/`; no cambiar plugin, listing, workflows ni placeholders
de otras integraciones. El setup y `vite.config.ts` ya existen.

Este documento es autocontenido para el diseño: no hace falta acceso al front
ni a otros repositorios de Rentennials. La sección 2 describe la identidad y
componentes relevados del portal actual; las secciones 4 y 5 definen cómo
componer las dos views. Las capturas que aporte el usuario complementan esta
guía, pero no son requisito para empezar. No pedir al usuario código privado
para resolver decisiones visuales ya detalladas acá.

Cada view necesita `views/src/<view>/index.html` como entrada y su componente
React/estilos locales. El build raíz compila en orden las dos entradas con
mode igual al nombre de view, renombra index.html a <view>.html y genera
manifest.json en el último build. No modificar los nombres/URI del contrato.
El harness tiene entrada `views/src/_harness/index.html`, servida por
`yarn views:dev`; construir su sandbox proxy de otro origen en ese mismo scope.
Preparar configuración Vitest y Playwright dentro de views/ para sus scripts
ya declarados (`test`, `test:e2e`), evitando mezclar tests Playwright con Vitest.

No instalar dependencias sin autorización: el usuario ejecuta yarn install
en la raíz. Usar las dependencias declaradas; no agregar UI kits o paquetes
de fuentes por iniciativa propia. Los tests de frontend están pedidos.

Capturas OpenAI: Playwright genera screenshot-1.png a screenshot-4.png a 706 px
en views/test-results/openai/ (resultados, cotización Viaje, cotización Cobertura
y resultados ordenados por precio). El paquete las copia a openai/assets/; no se
cambia openai/plugin.json. Capturas Claude de las mismas cuatro a 1000 px en
views/test-results/claude/. No guardar capturas dentro de views/dist/, cuyo árbol
debe contener exclusivamente dos HTML y manifest.json.

La integración usa `_shared/` para componentes/contratos/formato y `_bridge/`
para el wrapper oficial. Playwright importa `playwright/test`, incluido en el
paquete declarado. Los mensajes enviados al modelo van en inglés aunque la UI
esté en español. Vite deriva la allowlist de imágenes de `MCP_UI_IMAGE_HOSTS`;
no es necesario configurar variables VITE adicionales.

Las capturas actuales usan imágenes sintéticas interceptadas por los tests y
fallback Georgia/system-ui; no se presenta ese material como evidencia de
ChatGPT/Codex ni como aprobación de assets de marca.

Al entregar: indicar comandos ejecutados, resultados y assets/fuentes aún
pendientes. No marcar verificación en ChatGPT/Codex real por probar el harness.

## 1. Contrato de una view

### Ajuste vigente · views 2.0.0 (2026-10-13)

Solo hay dos views. `vehicle-results` abre con `search_vehicles` y permite
ordenar, ampliar y elegir un auto en un carrusel. `quote` abre con
`show_rental_summary` y permite editar fechas, puntos, coberturas, extras y cupón;
recotiza con `get_vehicle_quote`, que no tiene widget propio. Elegir un auto
devuelve la decisión al chat, y el resumen pide confirmación en el chat antes de
cualquier reserva. No se crea ninguna reserva ni cobro desde la UI.
El orden “Promociones” es el de la plataforma, nunca una recomendación personal;
menor o mayor tarifa diaria no garantiza el menor o mayor total del viaje.
Cambiar orden vuelve a consultar conservando filtros. Puntos globales y por
vehículo se asocian por identidad real, no por nombre o similitud de IDs.
Origen de imágenes declarado por servidor/host también en lecturas locales;
HTTPS y CSP exactos. Un 404 conserva fallback. Configuración de ambiente fuera
del repo público. Las URI son `ui://rentennials/vehicle-results` y
`ui://rentennials/quote`; los clientes sin UI reciben solo texto.

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
Componentes base: tarjeta de auto, badge, fila de precio, panel de total,
botones primario/secundario, aviso y estados vacío o de error.

Accesibilidad AA: contraste 4.5:1 para texto normal, foco visible, nombres
accesibles, navegación por teclado, alt de imágenes y estados anunciados.
Los colores de estado no son el único indicador; no usar éxito/aviso como texto
de bajo contraste sobre blanco. Respetar reduced-motion.

Distribución a los tres anchos de prueba:

- **360 px:** una columna; CTA ancho completo; secciones apiladas. Fechas en dos
  celdas solo mientras sigan legibles; apilarlas si locale/zoom lo exige.
- **360 px:** resultados en carrusel con tarjetas de 240 px; resumen en una columna.
- **706 px:** resultados en carrusel con tarjetas de 260 px y flechas; resumen en
  dos columnas, con el total en el panel lateral (desde 640 px).
- **1000 px:** resultados en carrusel con flechas; resumen en dos columnas, con el
  total en el panel lateral. Respetar max-width del contenedor del host y no
  agregar columnas vacías para simular un sitio web.

Estas medidas dependen del ancho **del iframe**, no del tamaño de la pantalla
del navegador. Las cards usan min-width: 0 para evitar overflow. Los resultados
usan carrusel horizontal con navegación explícita y el botón Elegir visible en
cada tarjeta; no ocultan la selección detrás de un swipe obligatorio.

### 2.6. Biblioteca de componentes esperada

| Componente | Especificación visual y comportamiento |
| --- | --- |
| VehicleCard (resultados) | Radio 20 px, borde 1 px, sombra suave; imagen superior 16:10 con object-cover; badge Superhost y pills de rating y viajes sobre la foto; cuerpo 12 px con nombre violeta, lugar, badges de descuento y aprobación, total + moneda destacados y días debajo; una sola acción Elegir. |
| Badge | Pill radio 9999 px, padding 4 px vertical / 8–12 px horizontal; label 12 px y un icono opcional; wraps entre badges, no dentro de una palabra. Superhost, aprobación automática y disponibilidad inmediata son conceptos separados. |
| PriceRow | Grid etiqueta flexible / monto auto, gap 12 px, baseline alineada; etiqueta puede ocupar varias líneas y monto permanece completo. Líneas negativas identificadas como descuento. |
| TotalPanel | Banda de fondo #444 en claro, radio 16 px o integrada en el panel; label Total y cifra 28–32 px blanca, moneda explícita. Seña, saldo y depósito fuera de esa banda y bien rotulados. |
| PrimaryButton | Altura mínima 44 px, preferida 46–48 px; radio pill; fondo primario, texto blanco 14 px/500; padding horizontal 20 px. Hover secundario, foco visible exterior; loading con spinner sin cambiar ancho. |
| SecondaryButton | Misma altura, fondo transparente, borde/divisor y texto de énfasis; hover tenue violeta. No dar a ambas acciones la misma prominencia visual. |
| Notice | Caja radio 16 px, padding 12–16 px; icono + título + explicación. Usar texto además del color; owner conditions truncadas son aviso, no prueba de fraude ni error de pago. |
| Empty/Error | Icono sobrio, título y explicación breve; layout del mismo sistema visual, sin ilustración gigante. Error de una acción no borra un resultado válido previo, pero lo distingue del intento fallido. |

Skeletons de imagen y líneas con `#fafafa`/`#f1f1f1` en claro, tonos auxiliares
en oscuro, manteniendo proporciones. Animación opcional suave, desactivada con
reduced-motion; evitar loaders que reemplacen todo el iframe durante una acción.

Textos de referencia es/en: “Elegir / Choose”, “Ver más autos / Show more cars”,
“Ordenar por / Sort by”, “Solicitar reserva / Request booking”, “Precio no
disponible / Price unavailable”, “Sin resultados / No results”, “Autos para tu
viaje / Cars for your trip”, “Resumen de tu alquiler / Your rental summary”. Mantener tono
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

Origen: `search_vehicles`. URI `ui://rentennials/vehicle-results`. Muestra el
resultado de la búsqueda y la reordena o amplía con `search_vehicles`, reusando
los argumentos de `_meta['rentennials/search_args']` o, si no llegan, los del
tool-input. Sin esos argumentos, los chips de orden y “Ver más autos” quedan
deshabilitados.

Campos del resultado: `vehicles[]`, `total_count` (nullable), `has_more`, `page`,
`limit`, `search_context {country, region, from_date, to_date, from_date_time,
to_date_time, sort}`. Cada vehículo usa `id`, `slug`, `name`, `year` (string/null),
`image_url`, `total_price`, `price_per_day`, `currency`, `total_days`,
`transmission`, `passengers`, `city`, `province`, `timezone`,
`automatic_approval`, `is_super_host`, `immediate_reserve`, `owner_rating`
(0–5 o null), `bookings_count` y `price_before_promotion`.

La tarjeta muestra: foto (o fallback neutro si falta o no pasa la allowlist);
badge Superhost solo con `is_super_host === true`; rating, o “Sin calificaciones”
si es null, sin estrellas llenas ni 0 por defecto; chip de viajes solo si
`bookings_count` es mayor que 0; nombre con año, y lugar `province - city` o
“Ciudad no informada”; descuento y precio anterior solo si
`price_before_promotion` supera `total_price`; badge de aprobación automática solo
con `true`; importe total con moneda y “total x N días”, o “Precio no disponible”
si es null. `transmission`, `passengers`, `price_per_day`, `timezone`, `slug` e
`immediate_reserve` llegan en el contrato pero la tarjeta actual no los muestra.
El precio de catálogo es orientativo: la view lo aclara con una nota fija.

**Acciones**

- Orden: cinco chips en fila horizontal, sin menú: Promociones (`default`),
  Precio menor a mayor (`lower_price`), Precio mayor a menor (`higher_price`),
  Más solicitados (`amount_of_bookings`) y Mejor rankeado (`average_rating`).
  Cada chip llama `search_vehicles` con los mismos filtros, el `sort` elegido,
  `page: 1` y `limit: 5`. El chip activo lleva `aria-pressed`. Mientras consulta,
  los chips se deshabilitan y el carril muestra tres esqueletos.
- Ver más autos: `search_vehicles` con la página siguiente y `limit: 5`. Agrega
  las tarjetas sin repetir `id`. Aparece al final del carrusel solo si
  `has_more` es true y hay menos de 15 vehículos cargados.
- Elegir: `sendMessage` en inglés con el `id` del vehículo. Pide al modelo
  completar lo que falte (puntos, coberturas, extras) y llamar
  `show_rental_summary` una sola vez con argumentos completos. La tarjeta elegida
  pasa a “Elegido” y queda deshabilitada; las demás siguen disponibles. No reserva
  ni cobra.
- Error de acción: si una consulta falla, aparece “No pudimos completar la
  acción” y el resultado anterior sigue visible con esa advertencia.
- Vacío: sin `vehicles`, la view informa que no hay coincidencias y no dibuja
  tarjetas ni precios.

**Composición visual:** encabezado “Autos para tu viaje”, chips con lugar y fechas
buscadas, conteo de coincidencias (o “N autos” si `total_count` es null), fila de
chips de orden y carrusel. Cada tarjeta muestra la foto 16:10 con los badges y
pills sobre ella, luego nombre, lugar, descuento, total y el botón Elegir.
`has_more` sin tarjeta siguiente se informa con texto que pide ver más en el chat.

**Layout**

- Carrusel horizontal de 3 a 8 ítems con la siguiente tarjeta asomando. Tarjetas
  de 260 px (240 px bajo 400 px de ancho) y 12 px de separación, con snap.
  Flechas anterior y siguiente desde 640 px.
- Chips en vez de menús. Sin scroll vertical interno: la view crece en alto; el
  único desplazamiento interno es horizontal, en el carrusel y en la fila de chips.
- Alturas máximas validadas por Playwright: carrusel de 640 px o menos a 706 y
  1000 px, y de 680 px o menos a 360 px. Sin overflow horizontal de la página.

## 5. quote

Origen: `show_rental_summary`, la tool que abre la view. El modelo la llama una
sola vez con los datos completos del viaje. Recotizaciones: `get_vehicle_quote`,
llamada por la view con `callServerTool`. URI `ui://rentennials/quote`.

Tool-input (`QuoteArguments`): `vehicle_id` (24 hex), `from_date` y `to_date`
(`YYYY-MM-DD`), `from_date_time` y `to_date_time` (`HH:mm`, opcionales), `coupon`,
`covers[]`, `pickup_meeting_point_id`, `return_meeting_point_id` y
`extra_services[{key, quantity}]`.

Resultado (`Quote`): `vehicle {id, slug, name, year, image_url, country, timezone}`,
`availability` (`available` | `unknown`), `meeting_points {pickup[], return[]}` con
`{id, location_id, name, type, price}`, `breakdown[]{concept, description,
unit_amount, quantity, amount}`, `total`, `currency`, `total_days`,
`price_per_day`, `discount`, `discount_code`, `pay_now`, `pay_on_pickup`,
`security_deposit`, `security_deposit_currency`, `timezone`,
`automatic_approval`, `payment_fast` (nullable), `included_coverages[]`,
`available_coverages[]` (con `id`) y `available_extras[]{key, label,
description, price_by_quantity[]}`.

**Reglas de datos**

- `amount` del breakdown es el importe normalizado por el servidor. Con
  `unit_amount` null (cargos acumulados) no se muestra cantidad × precio. No se
  suma el breakdown para reemplazar `total`.
- El descuento ya está dentro del total; no se resta otra vez.
- `price_by_quantity[i]` es el total para i+1 unidades; no se asume precio lineal.
- Coberturas incluidas y disponibles se muestran separadas. Extras y coberturas
  disponibles no se suman al total automáticamente.
- `payment_fast` se muestra solo si `automatic_approval` y
  `payment_fast.available` son true: importe ahora, saldo y fecha local del cobro
  automático en la zona del auto. Sin fecha, aviso sin fecha. Null equivale a no
  disponible.
- Puntos de retiro y devolución se asocian por `id` real. Un punto del borrador
  que ya no llega en la respuesta se rotula como no disponible.

**Pestañas**

- Viaje: fechas y horas de retiro y devolución, puntos de retiro y devolución
  (si llega `meeting_points`) y cupón.
- Cobertura (solo si hay coberturas): incluidas como chips; opcionales agrupadas
  por tipo (daños, depósito, reserva), con una opción por grupo mediante radio.
  Cada opción muestra precio y depósito o franquicia.
- Extras (solo si hay extras): cantidad de 0 a N, con el precio total de cada
  cantidad.
- Cambiar de pestaña no recotiza.

**Recotización**

- Cada cambio válido (fechas coherentes, extras dentro de la oferta, argumentos
  válidos) llama `get_vehicle_quote` 500 ms después del último cambio.
- Mientras hay cambios sin aplicar o una consulta en curso, el total aplicado se
  rotula “Total anterior” y un aviso indica el estado.
- Las respuestas tardías se descartan: cuenta solo la última selección.
- Fechas inválidas (devolución igual o anterior al retiro): aviso “Revisá las
  fechas”, sin llamada.
- Error de recotización, incluido un cupón rechazado: aviso con Reintentar
  cotización y Descartar cambios. El total aplicado no cambia.
- Descartar cambios vuelve a los últimos argumentos aplicados.

**Panel de total y desglose**

- Panel lateral con el total aplicado, días, precio por día y descuento. Debajo,
  “A pagar ahora”, “Al retirar” y “Depósito de garantía”, fuera de la banda del
  total, más el modo de aprobación (automática o a confirmar).
- Payment Fast: aviso compacto, solo cuando corresponde según la regla de datos.
- Desglose plegado por defecto (“Ver desglose”): filas por concepto, con cantidad
  × precio unitario cuando corresponde. Importes negativos se rotulan como
  descuento.

**Solicitar reserva**

- Deshabilitado durante recotización, espera, entradas inválidas, error o si no
  hay total.
- Al pulsar, `updateModelContext` registra los argumentos aplicados y el total.
  Después, `sendMessage` en inglés pide recotizar con `get_vehicle_quote` usando
  exactamente esos argumentos, mostrar el resumen completo y pedir confirmación
  explícita antes de `create_booking_request`. Si el envío falla, aparece “No
  pudimos completar la acción”.
- Nunca llama `create_booking_request`, nunca fija `confirmed=true` y no usa
  `callServerTool` de escritura.

**Composición visual:** título “Resumen de tu alquiler”, cabecera con miniatura,
nombre y fechas, pestañas, contenido de la pestaña y panel de total. Sin barra
fija ni scroll interno.

**Layout**

- Menos de 640 px: columna única (pestañas, contenido y total en ese orden).
  Desde 640 px: dos columnas, contenido principal y panel lateral de 280 px.
- Alturas máximas validadas por Playwright: 1300 px a 360 px, 820 px a 706 px y
  720 px a 1000 px. Desde 640 px diferencia de altura entre columnas de 160 px o
  menos. Sin overflow horizontal.
- Ningún control parece comprar una cobertura, cargar una tarjeta o confirmar un
  cobro: los controles solo editan argumentos de cotización.

## 6. Entregables y aceptación

Implementación en `views/src/<view>/` (`vehicle-results` y `quote`), wrapper
oficial en `_bridge/`, harness en `_harness/` y fixtures sintéticas en
`views/fixtures/`. Los contratos de origen (`search_vehicles`,
`show_rental_summary` y `get_vehicle_quote`) se representan sin homogeneizar
campos que no existen.

Build secuencial por view con React/Vite/singlefile: dos HTML sin JS/CSS ni fuentes
externos. `dist/manifest.json` es un array de
`{name, uri, file, csp:{connectDomains:[], resourceDomains:[...]}}`, sin rutas
que escapen de dist/. Paquete `rentennials-mcp-views` versión 2.0.0, con
`files:["dist"]`. El árbol de distribución contiene exclusivamente los dos HTML y
`manifest.json`.

Criterios de aceptación:

- `yarn workspace rentennials-mcp-views build` produce las dos views y el manifest.
- Vitest: ARS/USD, zonas distintas a las del navegador, null/false/0, textos
  largos, imágenes inválidas y render de cada view con fixtures de ambas variantes.
- Playwright: dos views, 360/706/1000 px, claro/oscuro; sin errores de consola ni
  red propia; handshake con AppBridge, mensajes y llamadas correctas.
- El harness web usa sandbox proxy de origen diferente y aplica CSP real; no se
  valida solo con un mock directo de React o postMessage.
- Capturas OpenAI a 706 px en `views/test-results/openai/`, numeradas así:
  1. resultados (`vehicle-results`, fixture `ars`);
  2. cotización, pestaña Viaje;
  3. cotización, pestaña Cobertura;
  4. resultados tras elegir el orden “Precio menor a mayor”.
  El paquete las copia a `openai/assets/` sin tocar `openai/plugin.json`.
- Capturas Claude de las mismas cuatro pantallas a 1000 px en
  `views/test-results/claude/screenshot-1..4.png`.
- No considerar esas capturas evidencia de ChatGPT/Codex: los casos de revisión
  se ejecutan por separado en clientes reales.

### Material visual que puede aportar el usuario

Para ajustar fidelidad, solicitar este conjunto de referencias, con nombre de
pantalla y ancho aproximado. Son complementarias a los tokens y contratos de
este documento; no requieren compartir acceso al front:

1. **Listado de autos:** una captura de escritorio con 2–3 tarjetas completas,
   precios y badges; una de móvil con una tarjeta y sus bordes visibles.
2. **Cotización/resumen de reserva:** desglose, seña/saldo/depósito, total y CTA;
   incluir el aviso Rentennials Fast si aparece para ese caso.
3. **Assets:** logo completo SVG/PNG y, si están disponibles, archivos de Bree
   Serif/Poppins con permiso de uso y licencia para embeberlos. Una captura de
   texto no reemplaza los archivos de fuente.

Compartir capturas recortadas al producto, con datos personales y referencias
reales anonimizados. Claude Design debe usarlas para forma, color y composición,
no para copiar datos, inventar campos ausentes ni trasladar acciones del portal
que aquí se ejecutan por el chat. Si una captura muestra un dato o control fuera
del contrato, conservar solo la referencia visual de su componente.

Revisión visual final: identidad reconocible por el isotipo, violeta y tipografía;
fotos protagonistas cuando existen; jerarquía de precio y fechas; radios y espacios
consistentes; texto legible en ambos temas y CTA correspondiente a cada estado.
La especificación de datos y acciones prevalece frente a la apariencia del portal.

Fuentes públicas: [MCP Apps estable 2026-01-26](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx)
y [envío de plugins OpenAI](https://developers.openai.com/plugins/deploy/submission).
