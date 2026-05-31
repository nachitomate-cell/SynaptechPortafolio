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

> Se eligió el enfoque **Framer Motion + SVG** (en lugar de una librería de
> grafos) por el control total que ofrece sobre el efecto de pulso neón viajando
> por la línea, animando `strokeDashoffset` para un resultado muy fluido.

## Características

- 🌌 **Tema Premium Dark** — fondo `zinc-950` con un viñeteado radial sutil.
- 💠 **Núcleo neón** — el nodo central tiene un *glow* que respira y un anillo
  giratorio.
- ⚡ **Sinapsis animadas** — cada conexión tiene un gradiente estático más un
  pulso luminoso que fluye desde el núcleo hacia el nodo periférico.
- 🏷️ **Nodos periféricos** — muestran el nombre del proyecto siempre y revelan la
  categoría al pasar el cursor (*hover*).
- ➕ **Añadir sinapsis en vivo** — formulario para conectar nuevos proyectos (con
  un botón ⚡ que genera uno de prueba al instante).
- 📐 **Layout radial responsivo** — los nodos se redistribuyen automáticamente
  según el tamaño del lienzo usando un `ResizeObserver`.

## Datos iniciales

La red se inicializa con proyectos reales: *Patio Curauma*, *Barbería Ferraza*,
*Colegio Diego Thompson*, *Diagnomed* y *Vida Sana (Minimarket)*.

## Desarrollo

```bash
npm install
npm run dev      # servidor de desarrollo (Vite)
npm run build    # build de producción
npm run lint     # chequeo de tipos (tsc --noEmit)
```

## Estructura

```
src/
├── App.tsx
├── components/
│   ├── SynapseDashboard.tsx   # orquestador: layout + render de la red
│   ├── CentralNode.tsx        # núcleo SynapTech con glow neón
│   ├── SynapseNode.tsx        # nodo periférico con label en hover
│   ├── SynapseLink.tsx        # sinapsis SVG con pulso animado
│   └── AddProjectForm.tsx     # panel para añadir conexiones
├── hooks/
│   ├── useRadialLayout.ts     # posiciona los nodos en círculo
│   └── useElementSize.ts      # mide el lienzo para responsividad
├── data/mockData.ts           # proyectos iniciales
└── types.ts
```
