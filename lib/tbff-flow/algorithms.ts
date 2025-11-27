/**
 * Flow propagation algorithms
 *
 * Models how flow circulates through the network:
 * 1. Flow enters nodes (external + from allocations)
 * 2. Nodes absorb what they can (up to max threshold)
 * 3. Excess flows out via allocations
 * 4. Repeat until steady state
 */

import type { FlowNetwork, FlowNode, FlowParticle, FlowPropagationResult } from './types'
import { updateFlowNodeProperties, calculateFlowNetworkTotals, createOverflowNode, needsOverflowNode } from './utils'

const MAX_ITERATIONS = 100
const CONVERGENCE_THRESHOLD = 0.01

/**
 * Propagate flow through the network
 *
 * Algorithm:
 * 1. Reset all inflows to external flow only
 * 2. For each iteration:
 *    a. Calculate absorption and outflow for each node
 *    b. Distribute outflow via allocations
 *    c. Update inflows for next iteration
 * 3. Repeat until flows stabilize or max iterations
 * 4. Create overflow node if needed
 * 5. Generate flow particles for animation
 *
 * @param network - Current network state
 * @returns Updated network with flow propagation results
 */
export function propagateFlow(network: FlowNetwork): FlowPropagationResult {
  console.log('\n🌊 Flow Propagation Started')
  console.log('━'.repeat(50))

  let currentNetwork = { ...network }
  let iterations = 0
  let converged = false

  // Initialize: set inflow to external flow
  let nodes = currentNetwork.nodes.map(node => ({
    ...node,
    inflow: node.externalFlow,
  }))

  console.log('Initial external flows:')
  nodes.forEach(node => {
    if (node.externalFlow > 0) {
      console.log(`  ${node.name}: ${node.externalFlow.toFixed(1)}`)
    }
  })

  // Iterate until convergence
  while (iterations < MAX_ITERATIONS && !converged) {
    iterations++

    // Step 1: Calculate absorption and outflow for each node
    nodes = nodes.map(updateFlowNodeProperties)

    // Step 2: Calculate new inflows from allocations
    const newInflows = new Map<string, number>()

    // Initialize with external flows
    nodes.forEach(node => {
      newInflows.set(node.id, node.externalFlow)
    })

    // Add flow from allocations
    nodes.forEach(sourceNode => {
      if (sourceNode.outflow <= 0) return

      // Get allocations from this node
      const allocations = currentNetwork.allocations.filter(
        a => a.sourceNodeId === sourceNode.id
      )

      if (allocations.length === 0) {
        // No allocations - this flow will need overflow node
        return
      }

      // Distribute outflow via allocations
      allocations.forEach(allocation => {
        const flowToTarget = sourceNode.outflow * allocation.percentage
        const currentInflow = newInflows.get(allocation.targetNodeId) || 0
        newInflows.set(allocation.targetNodeId, currentInflow + flowToTarget)
      })
    })

    // Step 3: Check for convergence
    let maxChange = 0
    nodes.forEach(node => {
      const newInflow = newInflows.get(node.id) || node.externalFlow
      const change = Math.abs(newInflow - node.inflow)
      maxChange = Math.max(maxChange, change)
    })

    converged = maxChange < CONVERGENCE_THRESHOLD

    // Step 4: Update inflows for next iteration
    nodes = nodes.map(node => ({
      ...node,
      inflow: newInflows.get(node.id) || node.externalFlow,
    }))

    if (iterations % 10 === 0 || converged) {
      console.log(`Iteration ${iterations}: max change = ${maxChange.toFixed(3)}`)
    }
  }

  console.log(`\n${converged ? '✓' : '⚠️'} ${converged ? 'Converged' : 'Max iterations reached'} after ${iterations} iterations`)

  // Final property update
  nodes = nodes.map(updateFlowNodeProperties)

  // Check if we need an overflow node
  let finalNodes = nodes
  let overflowNodeId: string | null = currentNetwork.overflowNodeId

  const needsOverflow = needsOverflowNode({ ...currentNetwork, nodes })

  if (needsOverflow && !overflowNodeId) {
    // Create overflow node
    const overflowNode = createOverflowNode(600, 300)
    finalNodes = [...nodes, overflowNode]
    overflowNodeId = overflowNode.id

    console.log('\n💧 Created overflow sink node')

    // Calculate total unallocated outflow
    let totalUnallocated = 0
    nodes.forEach(node => {
      const hasAllocations = currentNetwork.allocations.some(a => a.sourceNodeId === node.id)
      if (!hasAllocations && node.outflow > 0) {
        totalUnallocated += node.outflow
      }
    })

    // Update overflow node
    const overflowNode2 = finalNodes.find(n => n.id === overflowNodeId)!
    const updatedOverflowNode = updateFlowNodeProperties({
      ...overflowNode2,
      inflow: totalUnallocated,
    })

    finalNodes = finalNodes.map(n => n.id === overflowNodeId ? updatedOverflowNode : n)

    console.log(`  Receiving ${totalUnallocated.toFixed(1)} unallocated flow`)
  } else if (!needsOverflow && overflowNodeId) {
    // Remove overflow node
    finalNodes = nodes.filter(n => !n.isOverflowSink)
    overflowNodeId = null
    console.log('\n🗑️ Removed overflow sink node (no longer needed)')
  }

  // Generate flow particles for animation
  const particles = generateFlowParticles(currentNetwork, finalNodes)

  // Build final network
  const finalNetwork = calculateFlowNetworkTotals({
    ...currentNetwork,
    nodes: finalNodes,
    overflowNodeId,
  })

  console.log('\n📊 Final State:')
  console.log(`  Total inflow: ${finalNetwork.totalInflow.toFixed(1)}`)
  console.log(`  Total absorbed: ${finalNetwork.totalAbsorbed.toFixed(1)}`)
  console.log(`  Total outflow: ${finalNetwork.totalOutflow.toFixed(1)}`)

  console.log('\n🎯 Node States:')
  finalNodes.forEach(node => {
    if (node.inflow > 0 || node.absorbed > 0 || node.outflow > 0) {
      console.log(
        `  ${node.name.padEnd(15)} ` +
        `in: ${node.inflow.toFixed(1).padStart(6)} ` +
        `abs: ${node.absorbed.toFixed(1).padStart(6)} ` +
        `out: ${node.outflow.toFixed(1).padStart(6)} ` +
        `[${node.status}]`
      )
    }
  })

  return {
    network: finalNetwork,
    iterations,
    converged,
    particles,
  }
}

/**
 * Generate flow particles for animation
 * Creates particles traveling along allocations based on flow amount
 */
function generateFlowParticles(network: FlowNetwork, nodes: FlowNode[]): FlowParticle[] {
  const particles: FlowParticle[] = []
  let particleId = 0

  // Create particles for each allocation based on flow amount
  network.allocations.forEach(allocation => {
    const sourceNode = nodes.find(n => n.id === allocation.sourceNodeId)
    if (!sourceNode || sourceNode.outflow <= 0) return

    const flowAmount = sourceNode.outflow * allocation.percentage

    // Create particles proportional to flow amount
    // More flow = more particles
    const particleCount = Math.min(10, Math.max(1, Math.floor(flowAmount / 10)))

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        id: `particle_${particleId++}`,
        allocationId: allocation.id,
        progress: i / particleCount, // Spread along arrow
        amount: flowAmount / particleCount,
        speed: 0.01 + (flowAmount / 1000), // Faster for more flow
      })
    }
  })

  // Create particles for overflow node flows
  nodes.forEach(node => {
    if (node.outflow > 0) {
      const hasAllocations = network.allocations.some(a => a.sourceNodeId === node.id)
      if (!hasAllocations && network.overflowNodeId) {
        // Create virtual allocation to overflow node
        const particleCount = Math.min(5, Math.max(1, Math.floor(node.outflow / 20)))
        for (let i = 0; i < particleCount; i++) {
          particles.push({
            id: `particle_overflow_${particleId++}`,
            allocationId: `virtual_${node.id}_overflow`,
            progress: i / particleCount,
            amount: node.outflow / particleCount,
            speed: 0.01,
          })
        }
      }
    }
  })

  return particles
}

/**
 * Update particles animation
 * Moves particles along their paths
 */
export function updateFlowParticles(particles: FlowParticle[]): FlowParticle[] {
  return particles.map(particle => {
    const newProgress = particle.progress + particle.speed

    // If particle reached end, reset to beginning
    if (newProgress >= 1.0) {
      return {
        ...particle,
        progress: 0,
      }
    }

    return {
      ...particle,
      progress: newProgress,
    }
  })
}
