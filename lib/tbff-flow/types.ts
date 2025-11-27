/**
 * Flow-based Flow Funding Types
 *
 * This model focuses on resource circulation rather than accumulation.
 * Nodes receive flow, absorb what they need, and pass excess to others.
 */

export type FlowNodeStatus = 'starved' | 'minimum' | 'healthy' | 'saturated'

/**
 * A node in the flow network
 * Flow enters, gets partially absorbed, and excess flows out
 */
export interface FlowNode {
  id: string
  name: string

  // Position for rendering
  x: number
  y: number
  width: number
  height: number

  // Flow thresholds (per time unit)
  minAbsorption: number   // Minimum flow needed to function
  maxAbsorption: number   // Maximum flow that can be absorbed

  // Current flow state (computed)
  inflow: number          // Total flow entering this node
  absorbed: number        // Amount absorbed (between min and max)
  outflow: number         // Excess flow leaving this node
  status: FlowNodeStatus  // Derived from absorbed vs thresholds

  // External flow input (set by user)
  externalFlow: number    // Flow injected into this node

  // Special node type
  isOverflowSink: boolean // True for the auto-created overflow node
}

/**
 * Allocation defines how outflow is distributed
 * Same as stock model but applied to outflow instead of overflow
 */
export interface FlowAllocation {
  id: string
  sourceNodeId: string
  targetNodeId: string
  percentage: number      // 0.0 to 1.0
}

/**
 * The complete flow network
 */
export interface FlowNetwork {
  name: string
  nodes: FlowNode[]
  allocations: FlowAllocation[]

  // Network-level computed properties
  totalInflow: number      // Sum of all external flows
  totalAbsorbed: number    // Sum of all absorbed flow
  totalOutflow: number     // Sum of all outflow

  // Overflow sink
  overflowNodeId: string | null  // ID of auto-created overflow node
}

/**
 * Flow particle for animation
 * Moves along allocation arrows
 */
export interface FlowParticle {
  id: string
  allocationId: string     // Which arrow it's traveling along
  progress: number         // 0.0 to 1.0 (position along arrow)
  amount: number           // Size/color intensity
  speed: number            // How fast it moves
}

/**
 * Flow propagation result
 * Shows how flow moved through the network
 */
export interface FlowPropagationResult {
  network: FlowNetwork
  iterations: number       // How many steps to converge
  converged: boolean       // Did it reach steady state?
  particles: FlowParticle[] // Active particles for animation
}
