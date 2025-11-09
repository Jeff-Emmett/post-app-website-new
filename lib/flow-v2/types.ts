/**
 * Flow Funding V2 - Continuous Flow Dynamics
 *
 * Core types for the flow-oriented funding mechanism
 */

/**
 * Flow Node - A participant in the flow network
 *
 * Each node has:
 * - External inflow ($/month) - what funders contribute
 * - Min threshold ($/month) - needs level
 * - Max threshold ($/month) - capacity level
 * - Allocations - where overflow flows to
 */
export interface FlowNode {
  id: string
  name: string

  // Flow rates ($/month for UI, converted to $/second for simulation)
  externalInflow: number  // From funders/sliders
  minThreshold: number    // Needs level
  maxThreshold: number    // Capacity level

  // Where overflow flows to (percentages sum to ≤100)
  allocations: Map<string, number>

  // Computed during steady-state calculation
  totalInflow?: number    // External + incoming from other nodes
  totalOutflow?: number   // Sent to other nodes
  balance?: number        // Accumulated balance (for visualization only)
}

/**
 * Progressive Outflow Zones
 *
 * Deficit Zone (totalInflow < min): Keep everything, outflow = 0
 * Building Zone (min ≤ totalInflow ≤ max): Progressive sharing
 * Capacity Zone (totalInflow > max): Redirect all excess
 */
export type FlowZone = 'deficit' | 'building' | 'capacity'

/**
 * Flow between two nodes
 */
export interface FlowEdge {
  source: string
  target: string
  flowRate: number  // $/month
  percentage: number  // Allocation percentage
}

/**
 * Network Overflow Node
 *
 * Pure sink that absorbs unallocatable overflow
 * Created when total external inflow > total network capacity
 */
export interface OverflowNode {
  id: 'overflow'
  totalInflow: number  // $/month
}

/**
 * Complete network state
 */
export interface FlowNetwork {
  nodes: Map<string, FlowNode>
  edges: FlowEdge[]
  overflowNode: OverflowNode | null

  // Network-level metrics
  totalExternalInflow: number   // Sum of all external inflows
  totalNetworkCapacity: number  // Sum of all max thresholds
  totalNetworkNeeds: number     // Sum of all min thresholds

  // Convergence info
  converged: boolean
  iterations: number
}

/**
 * Simulation state (per-frame)
 */
export interface SimulationState {
  timestamp: number  // Simulation time in seconds
  network: FlowNetwork

  // Per-node state
  nodeStates: Map<string, {
    zone: FlowZone
    inflows: Map<string, number>   // From specific sources
    outflows: Map<string, number>  // To specific targets
    balance: number
  }>
}

/**
 * Scenario preset
 */
export interface ScenarioV2 {
  id: string
  name: string
  description: string
  nodes: FlowNode[]
  layout: Map<string, { x: number; y: number }>
  suggestedTotalInflow: number  // $/month
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}
