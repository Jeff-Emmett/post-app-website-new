/**
 * Canvas rendering functions for Flow Funding visualization
 */

import type { FlowFundingAccount, FlowFundingNetwork, Allocation } from './types'
import { getStatusColor, getAccountCenter, formatCurrency, formatPercentage } from './utils'

/**
 * Draw threshold line inside account rectangle
 */
function drawThresholdLine(
  ctx: CanvasRenderingContext2D,
  account: FlowFundingAccount,
  threshold: number,
  color: string,
  label: string
) {
  if (threshold <= 0) return

  const thresholdRatio = threshold / account.maxThreshold
  const lineY = account.y + account.height - thresholdRatio * account.height

  // Draw dashed line
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.setLineDash([5, 5])
  ctx.beginPath()
  ctx.moveTo(account.x, lineY)
  ctx.lineTo(account.x + account.width, lineY)
  ctx.stroke()
  ctx.setLineDash([])

  // Draw label
  ctx.fillStyle = color
  ctx.font = 'bold 10px sans-serif'
  ctx.fillText(label, account.x + 5, lineY - 3)
}

/**
 * Render a Flow Funding account as a colored rectangle
 */
export function renderAccount(
  ctx: CanvasRenderingContext2D,
  account: FlowFundingAccount,
  isSelected: boolean = false
) {
  // Draw border (thicker if selected)
  ctx.strokeStyle = isSelected ? '#22d3ee' : getStatusColor(account.status)
  ctx.lineWidth = isSelected ? 4 : 3
  ctx.strokeRect(account.x, account.y, account.width, account.height)

  // Calculate fill height based on balance
  const fillRatio = Math.min(account.balance / account.maxThreshold, 1)
  const fillHeight = fillRatio * account.height
  const fillY = account.y + account.height - fillHeight

  // Draw fill with gradient
  const gradient = ctx.createLinearGradient(
    account.x,
    account.y,
    account.x,
    account.y + account.height
  )
  gradient.addColorStop(0, getStatusColor(account.status, 0.2))
  gradient.addColorStop(1, getStatusColor(account.status, 0.6))

  ctx.fillStyle = gradient
  ctx.fillRect(account.x, fillY, account.width, fillHeight)

  // Draw threshold lines
  if (account.minThreshold > 0) {
    drawThresholdLine(ctx, account, account.minThreshold, '#ef4444', 'Min')
  }
  drawThresholdLine(ctx, account, account.maxThreshold, '#10b981', 'Max')

  // Draw text labels
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 16px sans-serif'
  ctx.fillText(account.name, account.x + 10, account.y + 25)

  ctx.font = '13px monospace'
  ctx.fillStyle = '#e2e8f0'
  ctx.fillText(`Balance: ${formatCurrency(account.balance)}`, account.x + 10, account.y + 50)

  ctx.font = '11px sans-serif'
  ctx.fillStyle = '#cbd5e1'
  ctx.fillText(`Min: ${formatCurrency(account.minThreshold)}`, account.x + 10, account.y + 70)
  ctx.fillText(`Max: ${formatCurrency(account.maxThreshold)}`, account.x + 10, account.y + 85)

  // Show status badge
  const statusColors = {
    deficit: '#ef4444',
    minimum: '#eab308',
    healthy: '#6366f1',
    overflow: '#10b981',
  }
  const statusLabels = {
    deficit: 'DEFICIT',
    minimum: 'AT MIN',
    healthy: 'HEALTHY',
    overflow: 'OVERFLOW',
  }

  ctx.fillStyle = statusColors[account.status]
  ctx.font = 'bold 10px sans-serif'
  const statusText = statusLabels[account.status]
  const statusWidth = ctx.measureText(statusText).width
  ctx.fillRect(account.x + account.width - statusWidth - 15, account.y + 8, statusWidth + 10, 18)
  ctx.fillStyle = '#ffffff'
  ctx.fillText(statusText, account.x + account.width - statusWidth - 10, account.y + 20)

  // Show overflow/shortfall amount if significant
  if (account.overflow > 0) {
    ctx.fillStyle = '#10b981'
    ctx.font = 'bold 12px sans-serif'
    ctx.fillText(
      `+${formatCurrency(account.overflow)} overflow`,
      account.x + 10,
      account.y + account.height - 10
    )
  } else if (account.shortfall > 0) {
    ctx.fillStyle = '#ef4444'
    ctx.font = 'bold 12px sans-serif'
    ctx.fillText(
      `-${formatCurrency(account.shortfall)} needed`,
      account.x + 10,
      account.y + account.height - 10
    )
  }

  // Draw center dot (connection point)
  const center = getAccountCenter(account)
  ctx.fillStyle = '#22d3ee'
  ctx.beginPath()
  ctx.arc(center.x, center.y, 4, 0, 2 * Math.PI)
  ctx.fill()
}

/**
 * Draw arrowhead at end of line
 */
function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  size: number = 15
) {
  const angle = Math.atan2(y2 - y1, x2 - x1)

  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(
    x2 - size * Math.cos(angle - Math.PI / 6),
    y2 - size * Math.sin(angle - Math.PI / 6)
  )
  ctx.lineTo(
    x2 - size * Math.cos(angle + Math.PI / 6),
    y2 - size * Math.sin(angle + Math.PI / 6)
  )
  ctx.closePath()
  ctx.fill()
}

/**
 * Render an allocation arrow between accounts
 */
export function renderAllocation(
  ctx: CanvasRenderingContext2D,
  allocation: Allocation,
  sourceAccount: FlowFundingAccount,
  targetAccount: FlowFundingAccount,
  isSelected: boolean = false
) {
  const start = getAccountCenter(sourceAccount)
  const end = getAccountCenter(targetAccount)

  // Line thickness based on percentage
  const baseWidth = 2
  const maxWidth = 10
  const width = baseWidth + allocation.percentage * (maxWidth - baseWidth)

  // Color based on whether source has overflow
  const hasOverflow = sourceAccount.balance > sourceAccount.maxThreshold
  const color = hasOverflow ? '#10b981' : isSelected ? '#22d3ee' : '#64748b'
  const alpha = hasOverflow ? 1.0 : isSelected ? 1.0 : 0.5

  // Draw arrow line
  ctx.strokeStyle = color
  ctx.globalAlpha = alpha
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.moveTo(start.x, start.y)
  ctx.lineTo(end.x, end.y)
  ctx.stroke()

  // Draw arrowhead
  drawArrowhead(ctx, start.x, start.y, end.x, end.y, color, width * 1.8)

  // Draw percentage label at midpoint
  const midX = (start.x + end.x) / 2
  const midY = (start.y + end.y) / 2

  // Background for label
  ctx.globalAlpha = 0.8
  ctx.fillStyle = '#1e293b'
  const labelText = formatPercentage(allocation.percentage)
  const textMetrics = ctx.measureText(labelText)
  ctx.fillRect(midX - 2, midY - 18, textMetrics.width + 8, 20)

  // Label text
  ctx.globalAlpha = 1.0
  ctx.fillStyle = color
  ctx.font = 'bold 12px sans-serif'
  ctx.fillText(labelText, midX + 2, midY - 3)

  ctx.globalAlpha = 1.0
}

/**
 * Clear and render entire network
 */
export function renderNetwork(
  ctx: CanvasRenderingContext2D,
  network: FlowFundingNetwork,
  canvasWidth: number,
  canvasHeight: number,
  selectedAccountId: string | null = null,
  selectedAllocationId: string | null = null
) {
  // Clear canvas
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // Draw allocations first (so they appear behind accounts)
  network.allocations.forEach((allocation) => {
    const sourceAccount = network.accounts.find((a) => a.id === allocation.sourceAccountId)
    const targetAccount = network.accounts.find((a) => a.id === allocation.targetAccountId)

    if (sourceAccount && targetAccount) {
      renderAllocation(
        ctx,
        allocation,
        sourceAccount,
        targetAccount,
        allocation.id === selectedAllocationId
      )
    }
  })

  // Draw accounts
  network.accounts.forEach((account) => {
    renderAccount(ctx, account, account.id === selectedAccountId)
  })

  // Draw network stats in corner
  drawNetworkStats(ctx, network, canvasWidth)
}

/**
 * Draw network statistics in top-right corner
 */
function drawNetworkStats(
  ctx: CanvasRenderingContext2D,
  network: FlowFundingNetwork,
  canvasWidth: number
) {
  const padding = 15
  const lineHeight = 20
  const x = canvasWidth - 200

  ctx.fillStyle = 'rgba(30, 41, 59, 0.9)'
  ctx.fillRect(x - 10, padding - 5, 210, lineHeight * 5 + 10)

  ctx.fillStyle = '#22d3ee'
  ctx.font = 'bold 14px sans-serif'
  ctx.fillText('Network Stats', x, padding + lineHeight * 0)

  ctx.font = '12px monospace'
  ctx.fillStyle = '#94a3b8'
  ctx.fillText(`Total Funds: ${formatCurrency(network.totalFunds)}`, x, padding + lineHeight * 1)

  ctx.fillStyle = '#ef4444'
  ctx.fillText(
    `Shortfall: ${formatCurrency(network.totalShortfall)}`,
    x,
    padding + lineHeight * 2
  )

  ctx.fillStyle = '#eab308'
  ctx.fillText(`Capacity: ${formatCurrency(network.totalCapacity)}`, x, padding + lineHeight * 3)

  ctx.fillStyle = '#10b981'
  ctx.fillText(`Overflow: ${formatCurrency(network.totalOverflow)}`, x, padding + lineHeight * 4)
}
