/**
 * Type definitions for Threshold-Based Flow Funding
 * These types model the academic paper's mathematical concepts
 */

export type AccountStatus = 'deficit' | 'minimum' | 'healthy' | 'overflow'

/**
 * FlowFundingAccount represents a participant in the network
 * Each account has:
 * - balance: current funds held
 * - minThreshold: minimum viable funding (survival level)
 * - maxThreshold: overflow point (beyond which funds redistribute)
 */
export interface FlowFundingAccount {
  // Identity
  id: string
  name: string

  // Financial State
  balance: number
  minThreshold: number
  maxThreshold: number

  // Visual Position (for canvas rendering)
  x: number
  y: number
  width: number
  height: number

  // Computed properties (derived from balance vs thresholds)
  status: AccountStatus
  shortfall: number  // max(0, minThreshold - balance)
  capacity: number   // max(0, maxThreshold - balance)
  overflow: number   // max(0, balance - maxThreshold)
}

/**
 * Allocation represents where overflow goes
 * When source account exceeds maxThreshold, overflow flows to target
 * based on allocation percentage
 */
export interface Allocation {
  id: string
  sourceAccountId: string
  targetAccountId: string
  percentage: number  // 0.0 to 1.0 (e.g., 0.5 = 50%)

  // Visual (calculated dynamically from account positions)
  x1?: number
  y1?: number
  x2?: number
  y2?: number
}

/**
 * FlowFundingNetwork represents the complete system
 */
export interface FlowFundingNetwork {
  name: string
  accounts: FlowFundingAccount[]
  allocations: Allocation[]

  // Computed network-level properties
  totalFunds: number
  totalShortfall: number
  totalCapacity: number
  totalOverflow: number
}

/**
 * FlowParticle represents an animated particle flowing along an allocation
 * Used to visualize fund transfers during redistribution
 */
export interface FlowParticle {
  allocationId: string
  progress: number      // 0.0 to 1.0 along the path
  amount: number        // Funds being transferred
  startTime: number     // timestamp when particle was created
  duration: number      // milliseconds for animation
}

/**
 * RedistributionStep captures one iteration of the overflow redistribution process
 */
export interface RedistributionStep {
  iteration: number
  overflows: Array<{ accountId: string; amount: number }>
  deltas: Record<string, number>  // accountId -> balance change
  flowParticles: FlowParticle[]
}

/**
 * FundingStep represents a step in the funding round process
 * Used for animation/visualization callbacks
 */
export type FundingStep =
  | { type: 'initial-distribution'; amount: number }
  | { type: 'overflow-redistribution' }
  | { type: 'redistribution-step'; iteration: number; flowParticles: FlowParticle[] }
  | { type: 'complete' }

/**
 * ValidationResult for network validation
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}
