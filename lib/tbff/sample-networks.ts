/**
 * Sample Flow Funding networks for demonstration and testing
 */

import type { FlowFundingNetwork, FlowFundingAccount } from './types'
import {
  updateAccountComputedProperties,
  calculateNetworkTotals,
} from './utils'

/**
 * Create an account with computed properties
 */
function createAccount(data: {
  id: string
  name: string
  balance: number
  minThreshold: number
  maxThreshold: number
  x: number
  y: number
  width?: number
  height?: number
}): FlowFundingAccount {
  return updateAccountComputedProperties({
    ...data,
    width: data.width || 160,
    height: data.height || 140,
    status: 'deficit', // Will be computed
    shortfall: 0, // Will be computed
    capacity: 0, // Will be computed
    overflow: 0, // Will be computed
  })
}

/**
 * Example 1: Simple Linear Flow (A → B → C)
 * Demonstrates basic flow through a chain
 */
export const simpleLinearNetwork: FlowFundingNetwork = calculateNetworkTotals({
  name: 'Simple Linear Flow',
  accounts: [
    createAccount({
      id: 'alice',
      name: 'Alice',
      balance: 0,
      minThreshold: 100,
      maxThreshold: 300,
      x: 100,
      y: 200,
    }),
    createAccount({
      id: 'bob',
      name: 'Bob',
      balance: 0,
      minThreshold: 50,
      maxThreshold: 200,
      x: 400,
      y: 200,
    }),
    createAccount({
      id: 'carol',
      name: 'Carol',
      balance: 0,
      minThreshold: 75,
      maxThreshold: 250,
      x: 700,
      y: 200,
    }),
  ],
  allocations: [
    { id: 'a1', sourceAccountId: 'alice', targetAccountId: 'bob', percentage: 1.0 },
    { id: 'a2', sourceAccountId: 'bob', targetAccountId: 'carol', percentage: 1.0 },
  ],
  totalFunds: 0,
  totalShortfall: 0,
  totalCapacity: 0,
  totalOverflow: 0,
})

/**
 * Example 2: Mutual Aid Circle (A ↔ B ↔ C ↔ A)
 * Demonstrates circular support network
 */
export const mutualAidCircle: FlowFundingNetwork = calculateNetworkTotals({
  name: 'Mutual Aid Circle',
  accounts: [
    createAccount({
      id: 'alice',
      name: 'Alice',
      balance: 50,
      minThreshold: 100,
      maxThreshold: 200,
      x: 400,
      y: 100,
    }),
    createAccount({
      id: 'bob',
      name: 'Bob',
      balance: 150,
      minThreshold: 100,
      maxThreshold: 200,
      x: 600,
      y: 300,
    }),
    createAccount({
      id: 'carol',
      name: 'Carol',
      balance: 250,
      minThreshold: 100,
      maxThreshold: 200,
      x: 200,
      y: 300,
    }),
  ],
  allocations: [
    { id: 'a1', sourceAccountId: 'alice', targetAccountId: 'bob', percentage: 1.0 },
    { id: 'a2', sourceAccountId: 'bob', targetAccountId: 'carol', percentage: 1.0 },
    { id: 'a3', sourceAccountId: 'carol', targetAccountId: 'alice', percentage: 1.0 },
  ],
  totalFunds: 0,
  totalShortfall: 0,
  totalCapacity: 0,
  totalOverflow: 0,
})

/**
 * Example 3: Commons Pool Redistribution
 * Everyone contributes to pool, pool redistributes equally
 */
export const commonsPool: FlowFundingNetwork = calculateNetworkTotals({
  name: 'Commons Pool',
  accounts: [
    createAccount({
      id: 'pool',
      name: 'Commons Pool',
      balance: 0,
      minThreshold: 0,
      maxThreshold: 500,
      x: 400,
      y: 150,
    }),
    createAccount({
      id: 'alice',
      name: 'Alice',
      balance: 0,
      minThreshold: 100,
      maxThreshold: 200,
      x: 150,
      y: 350,
    }),
    createAccount({
      id: 'bob',
      name: 'Bob',
      balance: 0,
      minThreshold: 100,
      maxThreshold: 200,
      x: 400,
      y: 400,
    }),
    createAccount({
      id: 'carol',
      name: 'Carol',
      balance: 0,
      minThreshold: 100,
      maxThreshold: 200,
      x: 650,
      y: 350,
    }),
  ],
  allocations: [
    // Contributors to pool
    { id: 'a1', sourceAccountId: 'alice', targetAccountId: 'pool', percentage: 1.0 },
    { id: 'a2', sourceAccountId: 'bob', targetAccountId: 'pool', percentage: 1.0 },
    { id: 'a3', sourceAccountId: 'carol', targetAccountId: 'pool', percentage: 1.0 },
    // Pool redistributes
    { id: 'a4', sourceAccountId: 'pool', targetAccountId: 'alice', percentage: 0.33 },
    { id: 'a5', sourceAccountId: 'pool', targetAccountId: 'bob', percentage: 0.33 },
    { id: 'a6', sourceAccountId: 'pool', targetAccountId: 'carol', percentage: 0.34 },
  ],
  totalFunds: 0,
  totalShortfall: 0,
  totalCapacity: 0,
  totalOverflow: 0,
})

/**
 * Example 4: Different States Demo
 * Shows all four account states at once
 */
export const statesDemo: FlowFundingNetwork = calculateNetworkTotals({
  name: 'Account States Demo',
  accounts: [
    createAccount({
      id: 'deficit',
      name: 'Deficit',
      balance: 30,
      minThreshold: 100,
      maxThreshold: 200,
      x: 100,
      y: 100,
    }),
    createAccount({
      id: 'minimum',
      name: 'Minimum',
      balance: 100,
      minThreshold: 100,
      maxThreshold: 200,
      x: 350,
      y: 100,
    }),
    createAccount({
      id: 'healthy',
      name: 'Healthy',
      balance: 150,
      minThreshold: 100,
      maxThreshold: 200,
      x: 600,
      y: 100,
    }),
    createAccount({
      id: 'overflow',
      name: 'Overflow',
      balance: 250,
      minThreshold: 100,
      maxThreshold: 200,
      x: 850,
      y: 100,
    }),
  ],
  allocations: [
    { id: 'a1', sourceAccountId: 'overflow', targetAccountId: 'deficit', percentage: 1.0 },
  ],
  totalFunds: 0,
  totalShortfall: 0,
  totalCapacity: 0,
  totalOverflow: 0,
})

/**
 * Get all sample networks
 */
export const sampleNetworks = {
  simpleLinear: simpleLinearNetwork,
  mutualAid: mutualAidCircle,
  commonsPool: commonsPool,
  statesDemo: statesDemo,
}

/**
 * Get network by key
 */
export function getSampleNetwork(key: keyof typeof sampleNetworks): FlowFundingNetwork {
  return sampleNetworks[key]
}

/**
 * Get list of network options for UI
 */
export const networkOptions = [
  { value: 'simpleLinear', label: 'Simple Linear Flow (A → B → C)' },
  { value: 'mutualAid', label: 'Mutual Aid Circle (A ↔ B ↔ C)' },
  { value: 'commonsPool', label: 'Commons Pool Redistribution' },
  { value: 'statesDemo', label: 'Account States Demo' },
] as const
