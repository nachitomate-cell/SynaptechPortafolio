# SynapTech SpA — Red Sináptica

Dashboard interactivo que visualiza el portafolio de clientes y proyectos de
**SynapTech SpA** como una red de conexiones sinápticas. Un núcleo central
representa a la empresa y cada proyecto orbita a su alrededor, conectado por una
"sinapsis": una línea con un pulso luminoso de energía que viaja desde el centro
hacia cada nodo.

## Stack

- **React 18 + TypeScript**
- **Vite** como bundler / dev server
- **Tailwind CSS** (tema *premium dark*)
- **Framer Motion** + **SVG** para las animaciones y los trazos sinápticos
- **vite-plugin-pwa** (Workbox) — la app es una **PWA** instalable y offline-first

> Se eligió el enfoque **Framer Motion + SVG** (en lugar de una librería de
> grafos) por el control total que ofrece sobre el efecto de pulso neón viajando
> por la línea, animando `strokeDashoffset` para un resultado muy fluido.

## Características

- 🎨 **Identidad de marca SynapTech** — paleta verde lima (`#92c83a` / `#a3d94a`)
  sobre fondo oscuro, siguiendo el manual de marca y el concepto "data synapse".
- 🌌 **Tema Premium Dark** — fondo `zinc-950` con un viñeteado radial verde sutil.
- 💚 **Núcleo neón verde** — esfera oscura *glossy* con un *glow* lima que respira
  y un anillo giratorio, igual que el letrero de recepción de la marca.
- ⚡ **Sinapsis curvas animadas** — cada conexión es un arco con gradiente verde y
  un pulso luminoso que fluye desde el núcleo hacia el nodo periférico.
- 🏷️ **Nodos periféricos** — esferas oscuras con borde lima; muestran el nombre del
  proyecto siempre y revelan la categoría al pasar el cursor (*hover*).
- ➕ **Añadir sinapsis en vivo** — formulario con selector de categorías por
  defecto (y un botón ⚡ que genera un proyecto de prueba al instante).
- 🗑️ **Borrar sinapsis** — al pasar el cursor sobre un nodo aparece un control ✕
  para eliminar el proyecto de la red.
- ⏻ **Apagar / encender sinapsis** — un control de encendido permite desactivar
  proyectos que aún no están activos: el nodo se atenúa y su conexión se muestra
  desconectada (línea punteada tenue, sin pulso). El núcleo cuenta solo las
  sinapsis activas.
- 🔀 **Dos vistas** — *Sinapsis gigante* (todos los proyectos alrededor del núcleo)
  y *Por categorías* (clusters: el núcleo conecta con un hub por categoría y cada
  hub con sus proyectos). Se alternan con un *toggle* en la cabecera.
- 🔁 **Reordenar** — un botón cicla entre disposiciones ordenadas (Anillo, Espiral,
  Órbitas, Abanico); los nodos transicionan suavemente a su nueva posición.
- 🔍 **Zoom** — controles +/− (y rueda del mouse) escalan toda la red para
  despejar la pantalla cuando hay muchos proyectos o acercarse a un cluster.
- 🏷️ **Títulos sin solapamiento** — las etiquetas se miden y se colocan con un
  algoritmo de *declutter* (separación vertical + línea guía) que garantiza que
  dos títulos de conexión nunca se superpongan, por densa que sea la red.
- 🏷️ **Categorías por defecto** — Retail, Servicios, Educación, Salud, Gastronomía
  y Tecnología, cada una con un acento dentro de la familia verde de marca.
- 📐 **Layout radial responsivo** — los nodos se redistribuyen automáticamente
  según el tamaño del lienzo usando un `ResizeObserver`.
- 📱 **PWA instalable** — manifest, iconos (incl. *maskable*), service worker con
  precache del *app shell* y de las fuentes; funciona sin conexión y avisa
  cuando hay una nueva versión disponible.

## Datos iniciales

La red se inicializa con el portafolio actual de SynapTech, agrupado por categoría:

- **Patio Curauma** — Club Patio Curauma
- **SaaS Multitenant** (producto propio) — Barbería Ferraza, Barbería Elegance,
  Chameleon Barber Studio, Barbería D'Jones, Aura Salon
- **Consultora Sonqollay** — SonqollayAPP, Base de datos Sonqollay, Extensión
  Label Studio
- **Restaurantes** — ToHome, Calipso Concón

## Desarrollo

```bash
npm install
npm run dev      # servidor de desarrollo (Vite, con service worker activo)
npm run build    # build de producción (genera sw.js + manifest)
npm run preview  # sirve el build (recomendado para probar la PWA)
npm run lint     # chequeo de tipos (tsc --noEmit)
npm run icons    # regenera los iconos PNG desde scripts/icon-source.svg
```

> Para verificar la instalación/offline, usa `npm run build && npm run preview`
> y abre las DevTools → *Application* → *Manifest* / *Service Workers*.

## Estructura

```
src/
├── App.tsx
├── components/
│   ├── SynapseDashboard.tsx   # orquestador: vistas + render de la red
│   ├── CentralNode.tsx        # núcleo SynapTech con glow neón
│   ├── CategoryNode.tsx       # hub de categoría (vista por categorías)
│   ├── SynapseNode.tsx        # nodo periférico (anima posición) + borrado
│   ├── SynapseLink.tsx        # sinapsis SVG curva con pulso animado
│   ├── LabelLayer.tsx         # capa de títulos decluttered + líneas guía
│   ├── ViewToggle.tsx         # toggle "gigante" / "por categorías"
│   ├── AddProjectForm.tsx     # panel para añadir conexiones
│   └── PWAReloadPrompt.tsx    # toast de "offline ready" / "actualizar"
├── hooks/
│   ├── useRadialLayout.ts     # disposiciones ordenadas (anillo/espiral/…)
│   ├── useCategoryLayout.ts   # layout en clusters por categoría
│   ├── useLabelDeclutter.ts   # anti-solapamiento de etiquetas
│   └── useElementSize.ts      # mide el lienzo para responsividad
├── lib/measureText.ts         # medición de texto (canvas, cacheada)
├── data/
│   ├── mockData.ts            # proyectos iniciales
│   └── categories.ts          # categorías por defecto + acentos
└── types.ts

scripts/
├── icon-source.svg            # icono maestro de la red sináptica
└── generate-icons.mjs         # genera los PNG del manifest (npm run icons)
```
