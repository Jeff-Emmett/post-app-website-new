/**
 * Canvas rendering for flow-based visualization
 */

import type { FlowNetwork, FlowNode, FlowAllocation, FlowParticle } from './types'
import { getFlowNodeCenter, getFlowStatusColor } from './utils'

/**
 * Render a flow node
 * Shows inflow, absorption, and outflow rates
 */
export function renderFlowNode(
  ctx: CanvasRenderingContext2D,
  node: FlowNode,
  isSelected: boolean = false
): void {
  const { x, y, width, height } = node

  // Background
  ctx.fillStyle = isSelected ? '#1e293b' : '#0f172a'
  ctx.fillRect(x, y, width, height)

  // Border (thicker if selected)
  ctx.strokeStyle = isSelected ? '#06b6d4' : '#334155'
  ctx.lineWidth = isSelected ? 3 : 1
  ctx.strokeRect(x, y, width, height)

  // Flow visualization bars
  const barWidth = width - 20
  const barHeight = 8
  const barX = x + 10
  let barY = y + 25

  // Inflow bar (blue)
  if (node.inflow > 0) {
    const inflowPercent = Math.min(1, node.inflow / node.maxAbsorption)
    ctx.fillStyle = 'rgba(59, 130, 246, 0.7)'
    ctx.fillRect(barX, barY, barWidth * inflowPercent, barHeight)
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)'
    ctx.strokeRect(barX, barY, barWidth, barHeight)
  }

  barY += barHeight + 4

  // Absorption bar (status color)
  if (node.absorbed > 0) {
    const absorbedPercent = Math.min(1, node.absorbed / node.maxAbsorption)
    ctx.fillStyle = getFlowStatusColor(node.status, 0.7)
    ctx.fillRect(barX, barY, barWidth * absorbedPercent, barHeight)
    ctx.strokeStyle = getFlowStatusColor(node.status, 0.5)
    ctx.strokeRect(barX, barY, barWidth, barHeight)
  }

  barY += barHeight + 4

  // Outflow bar (green)
  if (node.outflow > 0) {
    const outflowPercent = Math.min(1, node.outflow / node.maxAbsorption)
    ctx.fillStyle = 'rgba(16, 185, 129, 0.7)'
    ctx.fillRect(barX, barY, barWidth * outflowPercent, barHeight)
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)'
    ctx.strokeRect(barX, barY, barWidth, barHeight)
  }

  // Node name
  ctx.fillStyle = '#f1f5f9'
  ctx.font = 'bold 14px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(node.name, x + width / 2, y + 16)

  // Flow rates
  ctx.font = '10px monospace'
  ctx.fillStyle = '#94a3b8'
  const textX = x + width / 2
  let textY = y + height - 30

  if (node.inflow > 0) {
    ctx.fillText(`↓ ${node.inflow.toFixed(1)}`, textX, textY)
    textY += 12
  }
  if (node.absorbed > 0) {
    ctx.fillText(`⊙ ${node.absorbed.toFixed(1)}`, textX, textY)
    textY += 12
  }
  if (node.outflow > 0) {
    ctx.fillText(`↑ ${node.outflow.toFixed(1)}`, textX, textY)
  }

  // External flow indicator
  if (node.externalFlow > 0 && !node.isOverflowSink) {
    ctx.fillStyle = '#10b981'
    ctx.beginPath()
    ctx.arc(x + width - 10, y + 10, 5, 0, 2 * Math.PI)
    ctx.fill()
  }

  // Overflow sink indicator
  if (node.isOverflowSink) {
    ctx.fillStyle = '#64748b'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('SINK', x + width / 2, y + height / 2)
  }

  // Center dot for connections
  const centerX = x + width / 2
  const centerY = y + height / 2
  ctx.fillStyle = isSelected ? '#06b6d4' : '#475569'
  ctx.beginPath()
  ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI)
  ctx.fill()
}

/**
 * Render a flow allocation arrow
 * Thickness represents flow amount
 */
export function renderFlowAllocation(
  ctx: CanvasRenderingContext2D,
  allocation: FlowAllocation,
  sourceNode: FlowNode,
  targetNode: FlowNode,
  isSelected: boolean = false
): void {
  const source = getFlowNodeCenter(sourceNode)
  const target = getFlowNodeCenter(targetNode)

  // Calculate arrow properties
  const dx = target.x - source.x
  const dy = target.y - source.y
  const angle = Math.atan2(dy, dx)
  const length = Math.sqrt(dx * dx + dy * dy)

  // Shorten arrow to not overlap nodes
  const shortenStart = 60
  const shortenEnd = 60
  const startX = source.x + (shortenStart / length) * dx
  const startY = source.y + (shortenStart / length) * dy
  const endX = target.x - (shortenEnd / length) * dx
  const endY = target.y - (shortenEnd / length) * dy

  // Arrow thickness based on flow amount
  const flowAmount = sourceNode.outflow * allocation.percentage
  const thickness = Math.max(2, Math.min(12, 2 + flowAmount / 10))

  // Color based on selection and flow amount
  const hasFlow = flowAmount > 0.1
  const baseColor = isSelected ? '#06b6d4' : hasFlow ? '#10b981' : '#475569'
  const alpha = hasFlow ? 0.8 : 0.3

  // Draw arrow line
  ctx.strokeStyle = baseColor
  ctx.globalAlpha = alpha
  ctx.lineWidth = thickness
  ctx.lineCap = 'round'

  ctx.beginPath()
  ctx.moveTo(startX, startY)
  ctx.lineTo(endX, endY)
  ctx.stroke()

  // Draw arrowhead
  const headSize = 10 + thickness
  ctx.fillStyle = baseColor
  ctx.beginPath()
  ctx.moveTo(endX, endY)
  ctx.lineTo(
    endX - headSize * Math.cos(angle - Math.PI / 6),
    endY - headSize * Math.sin(angle - Math.PI / 6)
  )
  ctx.lineTo(
    endX - headSize * Math.cos(angle + Math.PI / 6),
    endY - headSize * Math.sin(angle + Math.PI / 6)
  )
  ctx.closePath()
  ctx.fill()

  ctx.globalAlpha = 1.0

  // Label with flow amount
  if (hasFlow || isSelected) {
    const midX = (startX + endX) / 2
    const midY = (startY + endY) / 2

    // Background for text
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(midX - 20, midY - 8, 40, 16)

    // Text
    ctx.fillStyle = baseColor
    ctx.font = '11px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(flowAmount.toFixed(1), midX, midY)
  }
}

/**
 * Render flow particles moving along allocations
 */
export function renderFlowParticles(
  ctx: CanvasRenderingContext2D,
  particles: FlowParticle[],
  network: FlowNetwork
): void {
  particles.forEach(particle => {
    // Find the allocation
    const allocation = network.allocations.find(a => a.id === particle.allocationId)
    if (!allocation) {
      // Handle virtual overflow allocations
      if (particle.allocationId.startsWith('virtual_')) {
        const sourceNodeId = particle.allocationId.split('_')[1]
        const sourceNode = network.nodes.find(n => n.id === sourceNodeId)
        const overflowNode = network.nodes.find(n => n.isOverflowSink)
        if (sourceNode && overflowNode) {
          renderParticle(ctx, particle, sourceNode, overflowNode)
        }
      }
      return
    }

    const sourceNode = network.nodes.find(n => n.id === allocation.sourceNodeId)
    const targetNode = network.nodes.find(n => n.id === allocation.targetNodeId)

    if (!sourceNode || !targetNode) return

    renderParticle(ctx, particle, sourceNode, targetNode)
  })
}

/**
 * Render a single particle
 */
function renderParticle(
  ctx: CanvasRenderingContext2D,
  particle: FlowParticle,
  sourceNode: FlowNode,
  targetNode: FlowNode
): void {
  const source = getFlowNodeCenter(sourceNode)
  const target = getFlowNodeCenter(targetNode)

  // Interpolate position
  const x = source.x + (target.x - source.x) * particle.progress
  const y = source.y + (target.y - source.y) * particle.progress

  // Particle size based on amount
  const size = Math.max(3, Math.min(8, particle.amount / 10))

  // Draw particle
  ctx.fillStyle = '#10b981'
  ctx.globalAlpha = 0.8
  ctx.beginPath()
  ctx.arc(x, y, size, 0, 2 * Math.PI)
  ctx.fill()
  ctx.globalAlpha = 1.0

  // Glow effect
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2)
  gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)')
  gradient.addColorStop(1, 'rgba(16, 185, 129, 0)')
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(x, y, size * 2, 0, 2 * Math.PI)
  ctx.fill()
}

/**
 * Render entire flow network
 */
export function renderFlowNetwork(
  ctx: CanvasRenderingContext2D,
  network: FlowNetwork,
  canvasWidth: number,
  canvasHeight: number,
  particles: FlowParticle[],
  selectedNodeId: string | null = null,
  selectedAllocationId: string | null = null
): void {
  // Clear canvas
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // Draw allocations (arrows) first
  network.allocations.forEach(allocation => {
    const sourceNode = network.nodes.find(n => n.id === allocation.sourceNodeId)
    const targetNode = network.nodes.find(n => n.id === allocation.targetNodeId)
    if (sourceNode && targetNode) {
      renderFlowAllocation(
        ctx,
        allocation,
        sourceNode,
        targetNode,
        allocation.id === selectedAllocationId
      )
    }
  })

  // Draw particles
  renderFlowParticles(ctx, particles, network)

  // Draw nodes on top
  network.nodes.forEach(node => {
    renderFlowNode(ctx, node, node.id === selectedNodeId)
  })

  // Draw network stats in corner
  ctx.fillStyle = '#f1f5f9'
  ctx.font = '12px monospace'
  ctx.textAlign = 'left'
  const statsX = 10
  let statsY = 20

  ctx.fillText(`Inflow: ${network.totalInflow.toFixed(1)}`, statsX, statsY)
  statsY += 16
  ctx.fillText(`Absorbed: ${network.totalAbsorbed.toFixed(1)}`, statsX, statsY)
  statsY += 16
  ctx.fillText(`Outflow: ${network.totalOutflow.toFixed(1)}`, statsX, statsY)
}
