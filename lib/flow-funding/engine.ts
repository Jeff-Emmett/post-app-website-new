/**
 * Flow Funding Algorithm Engine
 *
 * Implements the threshold-based flow funding mechanism as specified in
 * threshold-based-flow-funding.md
 *
 * Algorithm phases:
 * 1. Initial Distribution: Prioritize minimum thresholds, then fill capacity
 * 2. Overflow Calculation: Identify funds exceeding maximum thresholds
 * 3. Overflow Redistribution: Redistribute overflow according to allocations
 * 4. Recursive Processing: Repeat until convergence
 */

import type {
  Account,
  DistributionResult,
  IterationResult,
  ValidationResult,
} from './types'

/**
 * Configuration for the distribution algorithm
 */
export interface DistributionConfig {
  /** Maximum iterations before stopping (default: 100) */
  maxIterations?: number
  /** Convergence threshold - stop when total overflow < epsilon (default: 0.01) */
  epsilon?: number
  /** Enable detailed logging (default: false) */
  verbose?: boolean
}

const DEFAULT_CONFIG: Required<DistributionConfig> = {
  maxIterations: 100,
  epsilon: 0.01,
  verbose: false,
}

/**
 * Validates a flow funding network
 */
export function validateNetwork(accounts: Account[]): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (accounts.length === 0) {
    errors.push('Network must contain at least one account')
    return { valid: false, errors, warnings }
  }

  const accountIds = new Set(accounts.map(a => a.id))

  for (const account of accounts) {
    // Check threshold validity
    if (account.minThreshold < 0) {
      errors.push(`Account ${account.id}: minimum threshold must be non-negative`)
    }
    if (account.maxThreshold < 0) {
      errors.push(`Account ${account.id}: maximum threshold must be non-negative`)
    }
    if (account.minThreshold > account.maxThreshold) {
      errors.push(
        `Account ${account.id}: minimum threshold (${account.minThreshold}) ` +
        `exceeds maximum threshold (${account.maxThreshold})`
      )
    }

    // Check balance validity
    if (account.balance < 0) {
      errors.push(`Account ${account.id}: balance must be non-negative`)
    }

    // Check allocations
    let totalAllocation = 0
    for (const [targetId, percentage] of account.allocations.entries()) {
      if (percentage < 0 || percentage > 100) {
        errors.push(
          `Account ${account.id}: allocation to ${targetId} must be between 0 and 100`
        )
      }
      if (!accountIds.has(targetId)) {
        errors.push(
          `Account ${account.id}: allocation target ${targetId} does not exist`
        )
      }
      if (targetId === account.id) {
        errors.push(`Account ${account.id}: cannot allocate to itself`)
      }
      totalAllocation += percentage
    }

    if (totalAllocation > 100.01) { // Allow small floating point error
      errors.push(
        `Account ${account.id}: total allocations (${totalAllocation}%) exceed 100%`
      )
    }

    // Warnings
    if (account.allocations.size === 0 && accounts.length > 1) {
      warnings.push(
        `Account ${account.id}: has no outgoing allocations (overflow will be lost)`
      )
    }

    const hasIncoming = accounts.some(a =>
      Array.from(a.allocations.keys()).includes(account.id)
    )
    if (!hasIncoming && account.balance === 0) {
      warnings.push(
        `Account ${account.id}: has no incoming allocations and zero balance ` +
        `(will never receive funds)`
      )
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Phase 1: Initial Distribution
 *
 * Distributes external funding, prioritizing minimum thresholds
 * then filling remaining capacity up to maximum thresholds
 */
function distributeInitial(
  accounts: Account[],
  funding: number,
  verbose: boolean
): void {
  if (verbose) {
    console.log(`\n=== Initial Distribution: $${funding.toFixed(2)} ===`)
  }

  // Calculate total minimum requirement
  let totalMinRequired = 0
  const minShortfalls = new Map<string, number>()

  for (const account of accounts) {
    const shortfall = Math.max(0, account.minThreshold - account.balance)
    if (shortfall > 0) {
      minShortfalls.set(account.id, shortfall)
      totalMinRequired += shortfall
    }
  }

  if (verbose) {
    console.log(`Total minimum requirement: $${totalMinRequired.toFixed(2)}`)
  }

  // Case 1: Insufficient funds to meet all minimums
  if (funding < totalMinRequired) {
    if (verbose) {
      console.log('Insufficient funds - distributing proportionally to minimums')
    }

    for (const account of accounts) {
      const shortfall = minShortfalls.get(account.id) || 0
      if (shortfall > 0) {
        const allocation = (shortfall / totalMinRequired) * funding
        account.balance += allocation

        if (verbose) {
          console.log(
            `  ${account.id}: +$${allocation.toFixed(2)} ` +
            `(${((shortfall / totalMinRequired) * 100).toFixed(1)}% of funding)`
          )
        }
      }
    }
    return
  }

  // Case 2: Can meet all minimums
  if (verbose) {
    console.log('Sufficient funds - meeting all minimums first')
  }

  // Step 1: Fill all minimums
  for (const account of accounts) {
    const shortfall = minShortfalls.get(account.id) || 0
    if (shortfall > 0) {
      account.balance = account.minThreshold
      if (verbose) {
        console.log(`  ${account.id}: filled to minimum ($${account.minThreshold.toFixed(2)})`)
      }
    }
  }

  // Step 2: Distribute remaining funds based on capacity
  const remaining = funding - totalMinRequired
  if (remaining <= 0) return

  if (verbose) {
    console.log(`\nDistributing remaining $${remaining.toFixed(2)} based on capacity`)
  }

  // Calculate total remaining capacity
  let totalCapacity = 0
  const capacities = new Map<string, number>()

  for (const account of accounts) {
    const capacity = Math.max(0, account.maxThreshold - account.balance)
    if (capacity > 0) {
      capacities.set(account.id, capacity)
      totalCapacity += capacity
    }
  }

  if (totalCapacity === 0) {
    if (verbose) {
      console.log('No remaining capacity - all accounts at maximum')
    }
    return
  }

  // Distribute proportionally to capacity
  for (const account of accounts) {
    const capacity = capacities.get(account.id) || 0
    if (capacity > 0) {
      const allocation = (capacity / totalCapacity) * remaining
      account.balance += allocation

      if (verbose) {
        console.log(
          `  ${account.id}: +$${allocation.toFixed(2)} ` +
          `(${((capacity / totalCapacity) * 100).toFixed(1)}% of remaining)`
        )
      }
    }
  }
}

/**
 * Phase 2: Calculate Overflow
 *
 * Identifies funds exceeding maximum thresholds
 * Returns overflow amounts and adjusts balances
 */
function calculateOverflow(
  accounts: Account[],
  verbose: boolean
): Map<string, number> {
  const overflows = new Map<string, number>()
  let totalOverflow = 0

  for (const account of accounts) {
    const overflow = Math.max(0, account.balance - account.maxThreshold)
    if (overflow > 0) {
      overflows.set(account.id, overflow)
      totalOverflow += overflow
      // Adjust balance to maximum
      account.balance = account.maxThreshold

      if (verbose) {
        console.log(`  ${account.id}: overflow $${overflow.toFixed(2)}`)
      }
    }
  }

  if (verbose && totalOverflow > 0) {
    console.log(`Total overflow: $${totalOverflow.toFixed(2)}`)
  }

  return overflows
}

/**
 * Phase 3: Redistribute Overflow
 *
 * Redistributes overflow according to allocation preferences
 * Returns true if any redistribution occurred
 */
function redistributeOverflow(
  accounts: Account[],
  overflows: Map<string, number>,
  verbose: boolean
): Map<string, number> {
  const accountMap = new Map(accounts.map(a => [a.id, a]))
  const flows = new Map<string, number>()

  if (verbose && overflows.size > 0) {
    console.log('\n  Redistributing overflow:')
  }

  for (const [sourceId, overflow] of overflows.entries()) {
    const source = accountMap.get(sourceId)
    if (!source) continue

    // Normalize allocations (should sum to ≤100%)
    let totalAllocation = 0
    for (const percentage of source.allocations.values()) {
      totalAllocation += percentage
    }

    if (totalAllocation === 0) {
      if (verbose) {
        console.log(`    ${sourceId}: no allocations - overflow lost`)
      }
      continue
    }

    // Distribute overflow according to allocations
    for (const [targetId, percentage] of source.allocations.entries()) {
      const target = accountMap.get(targetId)
      if (!target) continue

      const normalizedPercentage = percentage / totalAllocation
      const amount = overflow * normalizedPercentage

      target.balance += amount
      flows.set(`${sourceId}->${targetId}`, amount)

      if (verbose) {
        console.log(
          `    ${sourceId} → ${targetId}: $${amount.toFixed(2)} ` +
          `(${percentage}% of overflow)`
        )
      }
    }
  }

  return flows
}

/**
 * Main distribution function
 *
 * Runs the complete flow funding algorithm:
 * 1. Initial distribution
 * 2. Iterative overflow redistribution until convergence
 */
export function runDistribution(
  accounts: Account[],
  funding: number,
  config: DistributionConfig = {}
): DistributionResult {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const { maxIterations, epsilon, verbose } = cfg

  // Validate network
  const validation = validateNetwork(accounts)
  if (!validation.valid) {
    throw new Error(
      `Invalid network:\n${validation.errors.join('\n')}`
    )
  }

  if (verbose && validation.warnings.length > 0) {
    console.log('⚠️  Warnings:')
    validation.warnings.forEach(w => console.log(`  ${w}`))
  }

  // Store initial state
  const initialBalances = new Map(
    accounts.map(a => [a.id, a.balance])
  )

  if (verbose) {
    console.log('\n📊 Initial State:')
    accounts.forEach(a => {
      console.log(
        `  ${a.id}: $${a.balance.toFixed(2)} ` +
        `(min: $${a.minThreshold.toFixed(2)}, max: $${a.maxThreshold.toFixed(2)})`
      )
    })
  }

  // Phase 1: Initial distribution
  distributeInitial(accounts, funding, verbose)

  // Phase 2-4: Iterative overflow redistribution
  const iterations: IterationResult[] = []
  let converged = false

  for (let i = 0; i < maxIterations; i++) {
    if (verbose) {
      console.log(`\n--- Iteration ${i} ---`)
    }

    // Calculate overflow
    const overflows = calculateOverflow(accounts, verbose)
    const totalOverflow = Array.from(overflows.values()).reduce(
      (sum, o) => sum + o,
      0
    )

    // Record iteration state
    const iteration: IterationResult = {
      iteration: i,
      balances: new Map(accounts.map(a => [a.id, a.balance])),
      overflows,
      totalOverflow,
      flows: new Map(),
      converged: totalOverflow < epsilon,
    }

    // Check convergence
    if (totalOverflow < epsilon) {
      if (verbose) {
        console.log(`✓ Converged (overflow < ${epsilon})`)
      }
      converged = true
      iterations.push(iteration)
      break
    }

    // Redistribute overflow
    const flows = redistributeOverflow(accounts, overflows, verbose)
    iteration.flows = flows

    iterations.push(iteration)

    if (verbose) {
      console.log('\n  Balances after redistribution:')
      accounts.forEach(a => {
        console.log(`    ${a.id}: $${a.balance.toFixed(2)}`)
      })
    }
  }

  if (!converged && verbose) {
    console.log(`\n⚠️  Did not converge within ${maxIterations} iterations`)
  }

  // Final state
  const finalBalances = new Map(
    accounts.map(a => [a.id, a.balance])
  )

  if (verbose) {
    console.log('\n🎯 Final State:')
    accounts.forEach(a => {
      const initial = initialBalances.get(a.id) || 0
      const change = a.balance - initial
      console.log(
        `  ${a.id}: $${a.balance.toFixed(2)} ` +
        `(${change >= 0 ? '+' : ''}$${change.toFixed(2)})`
      )
    })
  }

  return {
    initialBalances,
    finalBalances,
    iterations,
    converged,
    totalFunding: funding,
    iterationCount: iterations.length,
  }
}

/**
 * Helper: Create a deep copy of accounts for simulation
 */
export function cloneAccounts(accounts: Account[]): Account[] {
  return accounts.map(a => ({
    ...a,
    allocations: new Map(a.allocations),
  }))
}
