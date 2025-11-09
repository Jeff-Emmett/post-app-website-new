/**
 * Flow Funding algorithms
 * Implements the mathematical model from threshold-based-flow-funding.md
 */

import type { FlowFundingNetwork, FlowFundingAccount } from './types'
import { updateAccountComputedProperties, calculateNetworkTotals } from './utils'

/**
 * Initial distribution of external funding to accounts
 *
 * Algorithm:
 * 1. Calculate total shortfall (funds needed to reach minimums)
 * 2. If funding < shortfall: distribute proportionally to shortfalls
 * 3. If funding >= shortfall: fill all minimums first, then distribute remaining by capacity
 *
 * @param network - Current network state
 * @param externalFunding - Amount of new funding to distribute
 * @returns Updated network with new balances
 */
export function initialDistribution(
  network: FlowFundingNetwork,
  externalFunding: number
): FlowFundingNetwork {
  if (externalFunding <= 0) {
    console.warn('⚠️ No funding to distribute')
    return network
  }

  console.log(`\n💰 Initial Distribution: ${externalFunding} funding`)
  console.log('━'.repeat(50))

  // Calculate total shortfall (funds needed to reach minimums)
  const totalShortfall = network.accounts.reduce(
    (sum, acc) => sum + Math.max(0, acc.minThreshold - acc.balance),
    0
  )

  console.log(`Total shortfall: ${totalShortfall.toFixed(2)}`)

  if (externalFunding < totalShortfall) {
    // Not enough to cover all minimums - distribute proportionally
    console.log('⚠️ Insufficient funding to cover all minimums')
    console.log('Distributing proportionally by shortfall...\n')

    return distributeProportionallyByShortfall(network, externalFunding, totalShortfall)
  } else {
    // Enough funding - fill minimums first, then distribute by capacity
    console.log('✓ Sufficient funding to cover all minimums')
    console.log('Step 1: Filling all minimums...')

    const afterMinimums = fillAllMinimums(network)
    const remainingFunds = externalFunding - totalShortfall

    console.log(`Remaining funds: ${remainingFunds.toFixed(2)}`)
    console.log('Step 2: Distributing by capacity...\n')

    return distributeByCapacity(afterMinimums, remainingFunds)
  }
}

/**
 * Distribute funding proportionally to shortfalls
 * Used when funding is insufficient to cover all minimums
 */
function distributeProportionallyByShortfall(
  network: FlowFundingNetwork,
  funding: number,
  totalShortfall: number
): FlowFundingNetwork {
  const updatedAccounts = network.accounts.map((acc) => {
    const shortfall = Math.max(0, acc.minThreshold - acc.balance)
    if (shortfall === 0) return acc

    const share = (shortfall / totalShortfall) * funding
    const newBalance = acc.balance + share

    console.log(
      `  ${acc.name.padEnd(15)} ${acc.balance.toFixed(0)} → ${newBalance.toFixed(0)} (+${share.toFixed(0)})`
    )

    return updateAccountComputedProperties({
      ...acc,
      balance: newBalance,
    })
  })

  return calculateNetworkTotals({
    ...network,
    accounts: updatedAccounts,
  })
}

/**
 * Fill all accounts to their minimum thresholds
 */
function fillAllMinimums(network: FlowFundingNetwork): FlowFundingNetwork {
  const updatedAccounts = network.accounts.map((acc) => {
    const shortfall = Math.max(0, acc.minThreshold - acc.balance)
    if (shortfall === 0) {
      console.log(`  ${acc.name.padEnd(15)} ${acc.balance.toFixed(0)} (already at minimum)`)
      return acc
    }

    const newBalance = acc.minThreshold

    console.log(
      `  ${acc.name.padEnd(15)} ${acc.balance.toFixed(0)} → ${newBalance.toFixed(0)} (+${shortfall.toFixed(0)})`
    )

    return updateAccountComputedProperties({
      ...acc,
      balance: newBalance,
    })
  })

  return calculateNetworkTotals({
    ...network,
    accounts: updatedAccounts,
  })
}

/**
 * Distribute funding proportionally to account capacities
 * Capacity = max(0, maxThreshold - balance)
 */
function distributeByCapacity(
  network: FlowFundingNetwork,
  funding: number
): FlowFundingNetwork {
  if (funding <= 0) {
    console.log('  No remaining funds to distribute')
    return network
  }

  // Calculate total capacity
  const totalCapacity = network.accounts.reduce(
    (sum, acc) => sum + Math.max(0, acc.maxThreshold - acc.balance),
    0
  )

  if (totalCapacity === 0) {
    // All accounts at max - distribute evenly (will create overflow)
    console.log('  All accounts at max capacity - distributing evenly (will overflow)')
    return distributeEvenly(network, funding)
  }

  // Distribute proportionally to capacity
  const updatedAccounts = network.accounts.map((acc) => {
    const capacity = Math.max(0, acc.maxThreshold - acc.balance)
    if (capacity === 0) {
      console.log(`  ${acc.name.padEnd(15)} ${acc.balance.toFixed(0)} (at max capacity)`)
      return acc
    }

    const share = (capacity / totalCapacity) * funding
    const newBalance = acc.balance + share

    console.log(
      `  ${acc.name.padEnd(15)} ${acc.balance.toFixed(0)} → ${newBalance.toFixed(0)} (+${share.toFixed(0)})`
    )

    return updateAccountComputedProperties({
      ...acc,
      balance: newBalance,
    })
  })

  return calculateNetworkTotals({
    ...network,
    accounts: updatedAccounts,
  })
}

/**
 * Distribute funding evenly across all accounts
 * Used when all accounts are at max capacity
 */
function distributeEvenly(
  network: FlowFundingNetwork,
  funding: number
): FlowFundingNetwork {
  const perAccount = funding / network.accounts.length

  const updatedAccounts = network.accounts.map((acc) => {
    const newBalance = acc.balance + perAccount

    console.log(
      `  ${acc.name.padEnd(15)} ${acc.balance.toFixed(0)} → ${newBalance.toFixed(0)} (+${perAccount.toFixed(0)})`
    )

    return updateAccountComputedProperties({
      ...acc,
      balance: newBalance,
    })
  })

  return calculateNetworkTotals({
    ...network,
    accounts: updatedAccounts,
  })
}

/**
 * Calculate distribution summary (for UI display)
 */
export function getDistributionSummary(
  beforeNetwork: FlowFundingNetwork,
  afterNetwork: FlowFundingNetwork
): {
  totalDistributed: number
  accountsChanged: number
  changes: Array<{ accountId: string; name: string; before: number; after: number; delta: number }>
} {
  const changes = afterNetwork.accounts.map((after) => {
    const before = beforeNetwork.accounts.find((a) => a.id === after.id)!
    const delta = after.balance - before.balance

    return {
      accountId: after.id,
      name: after.name,
      before: before.balance,
      after: after.balance,
      delta,
    }
  }).filter(c => c.delta !== 0)

  const totalDistributed = changes.reduce((sum, c) => sum + c.delta, 0)
  const accountsChanged = changes.length

  return {
    totalDistributed,
    accountsChanged,
    changes,
  }
}
