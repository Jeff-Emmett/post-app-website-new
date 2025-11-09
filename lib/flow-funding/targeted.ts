/**
 * Targeted Funding - Add money to specific accounts and watch propagation
 */

import type { Account, DistributionResult, IterationResult } from './types'

/**
 * Run distribution starting from current account balances
 * (Skips initial distribution phase - just runs overflow redistribution)
 */
export function runTargetedDistribution(
  accounts: Account[],
  config: {
    maxIterations?: number
    epsilon?: number
    verbose?: boolean
  } = {}
): DistributionResult {
  const { maxIterations = 100, epsilon = 0.01, verbose = false } = config

  // Store initial state
  const initialBalances = new Map(accounts.map(a => [a.id, a.balance]))

  if (verbose) {
    console.log('\n📍 Targeted Distribution (from current balances)')
    accounts.forEach(a => {
      console.log(`  ${a.id}: $${a.balance.toFixed(2)}`)
    })
  }

  // Run overflow redistribution iterations
  const iterations: IterationResult[] = []
  let converged = false

  for (let i = 0; i < maxIterations; i++) {
    if (verbose) {
      console.log(`\n--- Iteration ${i} ---`)
    }

    // Calculate overflow
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

    // Record iteration state
    const flows = new Map<string, number>()
    const iteration: IterationResult = {
      iteration: i,
      balances: new Map(accounts.map(a => [a.id, a.balance])),
      overflows,
      totalOverflow,
      flows,
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
    const accountMap = new Map(accounts.map(a => [a.id, a]))

    for (const [sourceId, overflow] of overflows.entries()) {
      const source = accountMap.get(sourceId)
      if (!source) continue

      // Normalize allocations
      let totalAllocation = 0
      for (const percentage of source.allocations.values()) {
        totalAllocation += percentage
      }

      if (totalAllocation === 0) {
        if (verbose) {
          console.log(`  ${sourceId}: no allocations - overflow lost`)
        }
        continue
      }

      // Distribute overflow
      for (const [targetId, percentage] of source.allocations.entries()) {
        const target = accountMap.get(targetId)
        if (!target) continue

        const normalizedPercentage = percentage / totalAllocation
        const amount = overflow * normalizedPercentage

        target.balance += amount
        flows.set(`${sourceId}->${targetId}`, amount)

        if (verbose) {
          console.log(
            `  ${sourceId} → ${targetId}: $${amount.toFixed(2)} (${percentage}%)`
          )
        }
      }
    }

    iteration.flows = flows
    iterations.push(iteration)
  }

  if (!converged && verbose) {
    console.log(`\n⚠️  Did not converge within ${maxIterations} iterations`)
  }

  const finalBalances = new Map(accounts.map(a => [a.id, a.balance]))

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
    totalFunding: 0, // Not applicable for targeted
    iterationCount: iterations.length,
  }
}
