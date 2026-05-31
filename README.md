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
- ➕ **Añadir sinapsis en vivo** — formulario para conectar nuevos proyectos (con
  un botón ⚡ que genera uno de prueba al instante).
- 📐 **Layout radial responsivo** — los nodos se redistribuyen automáticamente
  según el tamaño del lienzo usando un `ResizeObserver`.
- 📱 **PWA instalable** — manifest, iconos (incl. *maskable*), service worker con
  precache del *app shell* y de las fuentes; funciona sin conexión y avisa
  cuando hay una nueva versión disponible.

## Datos iniciales

La red se inicializa con proyectos reales: *Patio Curauma*, *Barbería Ferraza*,
*Colegio Diego Thompson*, *Diagnomed* y *Vida Sana (Minimarket)*.

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
│   ├── SynapseDashboard.tsx   # orquestador: layout + render de la red
│   ├── CentralNode.tsx        # núcleo SynapTech con glow neón
│   ├── SynapseNode.tsx        # nodo periférico con label en hover
│   ├── SynapseLink.tsx        # sinapsis SVG con pulso animado
│   ├── AddProjectForm.tsx     # panel para añadir conexiones
│   └── PWAReloadPrompt.tsx    # toast de "offline ready" / "actualizar"
├── hooks/
│   ├── useRadialLayout.ts     # posiciona los nodos en círculo
│   └── useElementSize.ts      # mide el lienzo para responsividad
├── data/mockData.ts           # proyectos iniciales
└── types.ts

scripts/
├── icon-source.svg            # icono maestro de la red sináptica
└── generate-icons.mjs         # genera los PNG del manifest (npm run icons)
```
