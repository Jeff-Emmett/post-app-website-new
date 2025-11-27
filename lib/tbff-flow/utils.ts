/**
 * Utility functions for flow-based calculations
 */

import type { FlowNode, FlowNodeStatus, FlowNetwork, FlowAllocation } from './types'

/**
 * Calculate node status based on absorbed flow vs thresholds
 */
export function getFlowNodeStatus(node: FlowNode): FlowNodeStatus {
  if (node.absorbed < node.minAbsorption) return 'starved'
  if (node.absorbed >= node.maxAbsorption) return 'saturated'
  if (Math.abs(node.absorbed - node.minAbsorption) < 0.01) return 'minimum'
  return 'healthy'
}

/**
 * Calculate how much flow a node absorbs given inflow
 * Absorbs between min and max thresholds
 */
export function calculateAbsorption(inflow: number, minAbsorption: number, maxAbsorption: number): number {
  // Absorb as much as possible, up to max
  return Math.min(inflow, maxAbsorption)
}

/**
 * Calculate outflow (excess that couldn't be absorbed)
 */
export function calculateOutflow(inflow: number, absorbed: number): number {
  return Math.max(0, inflow - absorbed)
}

/**
 * Update all computed properties on a node
 */
export function updateFlowNodeProperties(node: FlowNode): FlowNode {
  const absorbed = calculateAbsorption(node.inflow, node.minAbsorption, node.maxAbsorption)
  const outflow = calculateOutflow(node.inflow, absorbed)
  const status = getFlowNodeStatus({ ...node, absorbed })

  return {
    ...node,
    absorbed,
    outflow,
    status,
  }
}

/**
 * Calculate network-level totals
 */
export function calculateFlowNetworkTotals(network: FlowNetwork): FlowNetwork {
  const totalInflow = network.nodes.reduce((sum, node) => sum + node.externalFlow, 0)
  const totalAbsorbed = network.nodes.reduce((sum, node) => sum + node.absorbed, 0)
  const totalOutflow = network.nodes.reduce((sum, node) => sum + node.outflow, 0)

  return {
    ...network,
    totalInflow,
    totalAbsorbed,
    totalOutflow,
  }
}

/**
 * Normalize allocations so they sum to 1.0
 * Same as stock model
 */
export function normalizeFlowAllocations(allocations: FlowAllocation[]): FlowAllocation[] {
  if (allocations.length === 1) {
    return allocations.map(a => ({ ...a, percentage: 1.0 }))
  }

  const total = allocations.reduce((sum, a) => sum + a.percentage, 0)

  if (total === 0) {
    const equalShare = 1.0 / allocations.length
    return allocations.map((a) => ({ ...a, percentage: equalShare }))
  }

  if (Math.abs(total - 1.0) < 0.0001) {
    return allocations
  }

  return allocations.map((a) => ({
    ...a,
    percentage: a.percentage / total,
  }))
}

/**
 * Get center point of a node (for arrow endpoints)
 */
export function getFlowNodeCenter(node: FlowNode): { x: number; y: number } {
  return {
    x: node.x + node.width / 2,
    y: node.y + node.height / 2,
  }
}

/**
 * Get status color for rendering
 */
export function getFlowStatusColor(status: FlowNodeStatus, alpha: number = 1): string {
  const colors = {
    starved: `rgba(239, 68, 68, ${alpha})`,    // Red
    minimum: `rgba(251, 191, 36, ${alpha})`,   // Yellow
    healthy: `rgba(99, 102, 241, ${alpha})`,   // Blue
    saturated: `rgba(16, 185, 129, ${alpha})`, // Green
  }
  return colors[status]
}

/**
 * Get status color as Tailwind class
 */
export function getFlowStatusColorClass(status: FlowNodeStatus): string {
  const classes = {
    starved: 'text-red-400',
    minimum: 'text-yellow-400',
    healthy: 'text-blue-400',
    saturated: 'text-green-400',
  }
  return classes[status]
}

/**
 * Format flow rate for display
 */
export function formatFlow(rate: number): string {
  return rate.toFixed(1)
}

/**
 * Format percentage for display
 */
export function formatPercentage(decimal: number): string {
  return `${Math.round(decimal * 100)}%`
}

/**
 * Create the overflow sink node
 */
export function createOverflowNode(x: number, y: number): FlowNode {
  return {
    id: 'overflow-sink',
    name: 'Overflow',
    x,
    y,
    width: 120,
    height: 80,
    minAbsorption: 0,        // Can absorb any amount
    maxAbsorption: Infinity, // No limit
    inflow: 0,
    absorbed: 0,
    outflow: 0,
    status: 'healthy',
    externalFlow: 0,
    isOverflowSink: true,
  }
}

/**
 * Check if network needs an overflow node
 * Returns true if any node has outflow with no allocations
 */
export function needsOverflowNode(network: FlowNetwork): boolean {
  return network.nodes.some(node => {
    if (node.isOverflowSink) return false

    const hasOutflow = node.outflow > 0.01
    const hasAllocations = network.allocations.some(a => a.sourceNodeId === node.id)

    return hasOutflow && !hasAllocations
  })
}
