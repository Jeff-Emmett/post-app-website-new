/**
 * Utility functions for Flow Funding calculations
 */

import type { FlowFundingAccount, AccountStatus, FlowFundingNetwork, Allocation } from './types'

/**
 * Calculate account status based on balance vs thresholds
 */
export function getAccountStatus(account: FlowFundingAccount): AccountStatus {
  if (account.balance < account.minThreshold) return 'deficit'
  if (account.balance >= account.maxThreshold) return 'overflow'
  if (Math.abs(account.balance - account.minThreshold) < 0.01) return 'minimum'
  return 'healthy'
}

/**
 * Calculate shortfall (funds needed to reach minimum)
 */
export function calculateShortfall(account: FlowFundingAccount): number {
  return Math.max(0, account.minThreshold - account.balance)
}

/**
 * Calculate capacity (funds that can be added before reaching maximum)
 */
export function calculateCapacity(account: FlowFundingAccount): number {
  return Math.max(0, account.maxThreshold - account.balance)
}

/**
 * Calculate overflow (funds beyond maximum threshold)
 */
export function calculateOverflow(account: FlowFundingAccount): number {
  return Math.max(0, account.balance - account.maxThreshold)
}

/**
 * Update computed properties on an account
 */
export function updateAccountComputedProperties(
  account: FlowFundingAccount
): FlowFundingAccount {
  return {
    ...account,
    status: getAccountStatus(account),
    shortfall: calculateShortfall(account),
    capacity: calculateCapacity(account),
    overflow: calculateOverflow(account),
  }
}

/**
 * Calculate network-level totals
 */
export function calculateNetworkTotals(network: FlowFundingNetwork): FlowFundingNetwork {
  const totalFunds = network.accounts.reduce((sum, acc) => sum + acc.balance, 0)
  const totalShortfall = network.accounts.reduce((sum, acc) => sum + acc.shortfall, 0)
  const totalCapacity = network.accounts.reduce((sum, acc) => sum + acc.capacity, 0)
  const totalOverflow = network.accounts.reduce((sum, acc) => sum + acc.overflow, 0)

  return {
    ...network,
    totalFunds,
    totalShortfall,
    totalCapacity,
    totalOverflow,
  }
}

/**
 * Normalize allocations so they sum to 1.0
 */
export function normalizeAllocations(allocations: Allocation[]): Allocation[] {
  // If only one allocation, it must be 100%
  if (allocations.length === 1) {
    return allocations.map(a => ({ ...a, percentage: 1.0 }))
  }

  const total = allocations.reduce((sum, a) => sum + a.percentage, 0)

  // If total is 0, distribute equally
  if (total === 0) {
    const equalShare = 1.0 / allocations.length
    return allocations.map((a) => ({
      ...a,
      percentage: equalShare,
    }))
  }

  // If already normalized (within tolerance), return as-is
  if (Math.abs(total - 1.0) < 0.0001) {
    return allocations
  }

  // Normalize by dividing by total
  return allocations.map((a) => ({
    ...a,
    percentage: a.percentage / total,
  }))
}

/**
 * Get center point of an account (for arrow endpoints)
 */
export function getAccountCenter(account: FlowFundingAccount): { x: number; y: number } {
  return {
    x: account.x + account.width / 2,
    y: account.y + account.height / 2,
  }
}

/**
 * Get status color for rendering
 */
export function getStatusColor(status: AccountStatus, alpha: number = 1): string {
  const colors = {
    deficit: `rgba(239, 68, 68, ${alpha})`, // Red
    minimum: `rgba(251, 191, 36, ${alpha})`, // Yellow
    healthy: `rgba(99, 102, 241, ${alpha})`, // Blue
    overflow: `rgba(16, 185, 129, ${alpha})`, // Green
  }
  return colors[status]
}

/**
 * Get status color as Tailwind class
 */
export function getStatusColorClass(status: AccountStatus): string {
  const classes = {
    deficit: 'text-red-400',
    minimum: 'text-yellow-400',
    healthy: 'text-blue-400',
    overflow: 'text-green-400',
  }
  return classes[status]
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return amount.toFixed(0)
}

/**
 * Format percentage for display
 */
export function formatPercentage(decimal: number): string {
  return `${Math.round(decimal * 100)}%`
}
