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
 * A project after the radial layout has resolved its on-screen position.
 * Coordinates are absolute pixels within the canvas, with the core at center.
 */
export interface PositionedProject extends SynapseProject {
  x: number;
  y: number;
  /** Angle (radians) of the node relative to the core, used for label offset. */
  angle: number;
}
