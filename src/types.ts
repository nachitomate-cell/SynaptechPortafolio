/**
 * A peripheral node in the synaptic network. Each one represents a client or
 * project connected to the SynapTech SpA core.
 */
export interface SynapseProject {
  id: string;
  name: string;
  /** Optional short descriptor shown alongside the label. */
  category?: string;
}

/**
 * A project after a layout has resolved its on-screen position. Coordinates are
 * absolute pixels within the canvas.
 */
export interface PositionedProject extends SynapseProject {
  x: number;
  y: number;
  /** Angle (radians) of the node relative to its parent, for label placement. */
  angle: number;
}

/**
 * A category cluster in the "por categorías" view: a hub positioned around the
 * core, with its member projects positioned around the hub.
 */
export interface PositionedCategory {
  id: string;
  name: string;
  accent: string;
  x: number;
  y: number;
  angle: number;
  projects: PositionedProject[];
}
