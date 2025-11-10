/**
 * Flow Funding V2 Engine - Continuous Flow Dynamics
 *
 * Implements progressive outflow zones with steady-state equilibrium
 */

import type {
  FlowNode,
  FlowEdge,
  FlowNetwork,
  FlowZone,
  OverflowNode,
  ValidationResult,
} from './types'

/**
 * Time conversion constants
 */
const SECONDS_PER_MONTH = 30 * 24 * 60 * 60 // ~2.592M seconds
const MONTHS_PER_SECOND = 1 / SECONDS_PER_MONTH

/**
 * Configuration for flow simulation
 */
export interface FlowConfig {
  maxIterations?: number
  epsilon?: number  // Convergence threshold
  verbose?: boolean
}

const DEFAULT_CONFIG: Required<FlowConfig> = {
  maxIterations: 1000,
  epsilon: 0.001,  // $0.001/month
  verbose: false,
}

/**
 * Convert $/month to $/second for internal calculation
 */
export function perMonthToPerSecond(amountPerMonth: number): number {
  return amountPerMonth * MONTHS_PER_SECOND
}

/**
 * Convert $/second to $/month for UI display
 */
export function perSecondToPerMonth(amountPerSecond: number): number {
  return amountPerSecond / MONTHS_PER_SECOND
}

/**
 * Determine which zone a node is in based on total inflow
 *
 * Capacity threshold is 1.5x the max threshold
 */
export function getFlowZone(node: FlowNode): FlowZone {
  const totalInflow = node.totalInflow || 0
  const capacityThreshold = 1.5 * node.maxThreshold

  if (totalInflow < node.minThreshold) {
    return 'deficit'
  } else if (totalInflow < capacityThreshold) {
    return 'building'
  } else {
    return 'capacity'
  }
}

/**
 * Calculate progressive outflow based on zone
 *
 * Deficit Zone (inflow < min):
 *   outflow = 0 (keep everything)
 *
 * Building Zone (min ≤ inflow < 1.5 * max):
 *   outflow = (inflow - min) × (0.5 × max) / (1.5 × max - min)
 *   Progressive sharing that smoothly increases
 *
 * Capacity Zone (inflow ≥ 1.5 * max):
 *   outflow = inflow - max
 *   Retain max, share all excess
 *
 * This ensures monotonically increasing outflow and smooth transitions.
 */
export function calculateOutflow(node: FlowNode): number {
  const totalInflow = node.totalInflow || 0
  const { minThreshold, maxThreshold } = node

  // Capacity threshold: when you start sharing all excess above max
  const capacityThreshold = 1.5 * maxThreshold

  // Deficit zone: keep everything
  if (totalInflow < minThreshold) {
    return 0
  }

  // Capacity zone: retain max, share all excess
  if (totalInflow >= capacityThreshold) {
    return totalInflow - maxThreshold
  }

  // Building zone: progressive sharing
  const buildingRange = capacityThreshold - minThreshold
  if (buildingRange === 0) {
    // Edge case: min === 1.5 * max (shouldn't happen in practice)
    return totalInflow - maxThreshold
  }

  const excess = totalInflow - minThreshold
  const targetOutflow = 0.5 * maxThreshold // What we'll share at capacity threshold

  return (excess / buildingRange) * targetOutflow
}

/**
 * Validate network structure
 */
export function validateNetwork(nodes: FlowNode[]): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (nodes.length === 0) {
    errors.push('Network must contain at least one node')
    return { valid: false, errors, warnings }
  }

  const nodeIds = new Set(nodes.map(n => n.id))

  for (const node of nodes) {
    // Check thresholds
    if (node.minThreshold < 0) {
      errors.push(`Node ${node.id}: min threshold must be non-negative`)
    }
    if (node.maxThreshold < 0) {
      errors.push(`Node ${node.id}: max threshold must be non-negative`)
    }
    if (node.minThreshold > node.maxThreshold) {
      errors.push(
        `Node ${node.id}: min threshold (${node.minThreshold}) ` +
          `exceeds max threshold (${node.maxThreshold})`
      )
    }

    // Check external inflow
    if (node.externalInflow < 0) {
      errors.push(`Node ${node.id}: external inflow must be non-negative`)
    }

    // Check allocations
    let totalAllocation = 0
    for (const [targetId, percentage] of node.allocations.entries()) {
      if (percentage < 0 || percentage > 100) {
        errors.push(
          `Node ${node.id}: allocation to ${targetId} must be 0-100`
        )
      }
      if (!nodeIds.has(targetId)) {
        errors.push(
          `Node ${node.id}: allocation target ${targetId} does not exist`
        )
      }
      if (targetId === node.id) {
        errors.push(`Node ${node.id}: cannot allocate to itself`)
      }
      totalAllocation += percentage
    }

    if (totalAllocation > 100.01) {
      errors.push(
        `Node ${node.id}: total allocations (${totalAllocation}%) exceed 100%`
      )
    }

    // Warnings
    if (node.allocations.size === 0 && nodes.length > 1) {
      warnings.push(
        `Node ${node.id}: no outgoing allocations (overflow will be lost)`
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
 * Calculate steady-state flow equilibrium
 *
 * Uses iterative convergence to find stable flow rates where
 * each node's inflow equals external inflow + allocations from other nodes
 */
export function calculateSteadyState(
  nodes: FlowNode[],
  config: FlowConfig = {}
): FlowNetwork {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const { maxIterations, epsilon, verbose } = cfg

  // Validate network
  const validation = validateNetwork(nodes)
  if (!validation.valid) {
    throw new Error(
      `Invalid network:\n${validation.errors.join('\n')}`
    )
  }

  if (verbose && validation.warnings.length > 0) {
    console.log('⚠️  Warnings:')
    validation.warnings.forEach(w => console.log(`  ${w}`))
  }

  // Create node map
  const nodeMap = new Map(nodes.map(n => [n.id, n]))

  // Initialize total inflows with external inflows
  for (const node of nodes) {
    node.totalInflow = node.externalInflow
    node.totalOutflow = 0
    node.balance = 0
  }

  if (verbose) {
    console.log('\n🌊 Starting Steady-State Calculation')
    console.log('Initial state:')
    nodes.forEach(n => {
      console.log(
        `  ${n.id}: external=$${n.externalInflow}/mo ` +
          `(min=$${n.minThreshold}, max=$${n.maxThreshold})`
      )
    })
  }

  // Iterative convergence
  let converged = false
  let iterations = 0

  for (let i = 0; i < maxIterations; i++) {
    iterations++

    // Calculate outflows for each node
    for (const node of nodes) {
      node.totalOutflow = calculateOutflow(node)
    }

    // Calculate new inflows based on allocations
    const newInflows = new Map<string, number>()

    for (const node of nodes) {
      // Start with external inflow
      newInflows.set(node.id, node.externalInflow)
    }

    // Add allocated flows
    for (const source of nodes) {
      const outflow = source.totalOutflow || 0

      if (outflow > 0) {
        // Normalize allocations
        let totalAllocation = 0
        for (const percentage of source.allocations.values()) {
          totalAllocation += percentage
        }

        if (totalAllocation > 0) {
          for (const [targetId, percentage] of source.allocations.entries()) {
            const target = nodeMap.get(targetId)
            if (!target) continue

            const normalizedPercentage = percentage / totalAllocation
            const flowAmount = outflow * normalizedPercentage

            const currentInflow = newInflows.get(targetId) || 0
            newInflows.set(targetId, currentInflow + flowAmount)
          }
        }
      }
    }

    // Check convergence
    let maxChange = 0
    for (const node of nodes) {
      const newInflow = newInflows.get(node.id) || 0
      const oldInflow = node.totalInflow || 0
      const change = Math.abs(newInflow - oldInflow)
      maxChange = Math.max(maxChange, change)

      node.totalInflow = newInflow
    }

    if (verbose && i < 5) {
      console.log(`\nIteration ${i}:`)
      nodes.forEach(n => {
        const zone = getFlowZone(n)
        console.log(
          `  ${n.id}: in=$${(n.totalInflow || 0).toFixed(2)}/mo ` +
            `out=$${(n.totalOutflow || 0).toFixed(2)}/mo [${zone}]`
        )
      })
      console.log(`  Max change: $${maxChange.toFixed(4)}/mo`)
    }

    if (maxChange < epsilon) {
      converged = true
      if (verbose) {
        console.log(`\n✓ Converged after ${iterations} iterations`)
      }
      break
    }
  }

  if (!converged && verbose) {
    console.log(`\n⚠️  Did not converge within ${maxIterations} iterations`)
  }

  // Calculate edges
  const edges: FlowEdge[] = []

  for (const source of nodes) {
    const outflow = source.totalOutflow || 0

    if (outflow > 0) {
      let totalAllocation = 0
      for (const percentage of source.allocations.values()) {
        totalAllocation += percentage
      }

      if (totalAllocation > 0) {
        for (const [targetId, percentage] of source.allocations.entries()) {
          const normalizedPercentage = percentage / totalAllocation
          const flowRate = outflow * normalizedPercentage

          if (flowRate > 0) {
            edges.push({
              source: source.id,
              target: targetId,
              flowRate,
              percentage,
            })
          }
        }
      }
    }
  }

  // Calculate overflow node
  const totalExternalInflow = nodes.reduce(
    (sum, n) => sum + n.externalInflow,
    0
  )
  const totalNetworkCapacity = nodes.reduce(
    (sum, n) => sum + n.maxThreshold,
    0
  )
  const totalNetworkNeeds = nodes.reduce(
    (sum, n) => sum + n.minThreshold,
    0
  )

  // Overflow node appears when unallocated overflow exists
  let overflowNode: OverflowNode | null = null
  let totalUnallocatedOverflow = 0

  for (const node of nodes) {
    const outflow = node.totalOutflow || 0

    // Calculate allocated overflow
    let totalAllocation = 0
    for (const percentage of node.allocations.values()) {
      totalAllocation += percentage
    }

    // Unallocated percentage
    const unallocatedPercentage = Math.max(0, 100 - totalAllocation)
    const unallocated = (outflow * unallocatedPercentage) / 100

    totalUnallocatedOverflow += unallocated
  }

  if (totalUnallocatedOverflow > epsilon) {
    overflowNode = {
      id: 'overflow',
      totalInflow: totalUnallocatedOverflow,
    }
  }

  if (verbose) {
    console.log('\n📊 Final Network State:')
    nodes.forEach(n => {
      const zone = getFlowZone(n)
      const retention = (n.totalInflow || 0) - (n.totalOutflow || 0)
      console.log(
        `  ${n.id}: ` +
          `in=$${(n.totalInflow || 0).toFixed(2)}/mo ` +
          `out=$${(n.totalOutflow || 0).toFixed(2)}/mo ` +
          `retain=$${retention.toFixed(2)}/mo ` +
          `[${zone}]`
      )
    })

    if (overflowNode) {
      console.log(
        `  Overflow: $${overflowNode.totalInflow.toFixed(2)}/mo (unallocated)`
      )
    }

    console.log(`\nNetwork totals:`)
    console.log(`  External inflow: $${totalExternalInflow.toFixed(2)}/mo`)
    console.log(`  Network needs: $${totalNetworkNeeds.toFixed(2)}/mo`)
    console.log(`  Network capacity: $${totalNetworkCapacity.toFixed(2)}/mo`)
  }

  return {
    nodes: nodeMap,
    edges,
    overflowNode,
    totalExternalInflow,
    totalNetworkCapacity,
    totalNetworkNeeds,
    converged,
    iterations,
  }
}

/**
 * Clone nodes for simulation
 */
export function cloneNodes(nodes: FlowNode[]): FlowNode[] {
  return nodes.map(n => ({
    ...n,
    allocations: new Map(n.allocations),
    totalInflow: n.totalInflow,
    totalOutflow: n.totalOutflow,
    balance: n.balance,
  }))
}

/**
 * Update node balances based on flow rates over time
 * (For visualization - accumulate balance over delta time)
 */
export function updateBalances(
  nodes: FlowNode[],
  deltaSeconds: number
): void {
  for (const node of nodes) {
    const inflowPerSecond = perMonthToPerSecond(node.totalInflow || 0)
    const outflowPerSecond = perMonthToPerSecond(node.totalOutflow || 0)
    const netFlowPerSecond = inflowPerSecond - outflowPerSecond

    node.balance = (node.balance || 0) + netFlowPerSecond * deltaSeconds
  }
}
