/**
 * Flow Funding Core Types
 * Isolated module for threshold-based flow funding mechanism
 */

/**
 * Represents an account in the flow funding network
 */
export interface Account {
  id: string
  /** Display name for the account */
  name: string
  /** Current balance */
  balance: number
  /** Minimum sustainable funding level */
  minThreshold: number
  /** Maximum threshold - beyond this, funds overflow */
  maxThreshold: number
  /** Allocation preferences: map of target account ID to percentage (0-100) */
  allocations: Map<string, number>
}

/**
 * Result of a single redistribution iteration
 */
export interface IterationResult {
  /** Iteration number (0-indexed) */
  iteration: number
  /** Account balances after this iteration */
  balances: Map<string, number>
  /** Overflow amounts per account */
  overflows: Map<string, number>
  /** Total overflow in the system */
  totalOverflow: number
  /** Flows from account to account (sourceId-targetId -> amount) */
  flows: Map<string, number>
  /** Whether the system converged in this iteration */
  converged: boolean
}

/**
 * Complete result of running the flow funding distribution
 */
export interface DistributionResult {
  /** Initial state before distribution */
  initialBalances: Map<string, number>
  /** Final balances after convergence */
  finalBalances: Map<string, number>
  /** History of each iteration */
  iterations: IterationResult[]
  /** Whether the distribution converged */
  converged: boolean
  /** Total external funding added */
  totalFunding: number
  /** Number of iterations to convergence */
  iterationCount: number
}

/**
 * Account state for threshold visualization
 */
export type AccountState =
  | 'below-minimum'    // balance < minThreshold (red)
  | 'sustainable'      // minThreshold <= balance < maxThreshold (yellow)
  | 'at-maximum'       // balance >= maxThreshold (green)
  | 'overflowing'      // balance > maxThreshold in current iteration (blue)

/**
 * Helper to determine account state
 */
export function getAccountState(
  balance: number,
  minThreshold: number,
  maxThreshold: number,
  hasOverflow: boolean
): AccountState {
  if (hasOverflow) return 'overflowing'
  if (balance >= maxThreshold) return 'at-maximum'
  if (balance >= minThreshold) return 'sustainable'
  return 'below-minimum'
}

/**
 * Validation result for a flow funding network
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}
