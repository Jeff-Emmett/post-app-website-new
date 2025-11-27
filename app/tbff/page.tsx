"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import type { FlowFundingNetwork, Allocation } from "@/lib/tbff/types"
import { renderNetwork } from "@/lib/tbff/rendering"
import { sampleNetworks, networkOptions, getSampleNetwork } from "@/lib/tbff/sample-networks"
import { formatCurrency, getStatusColorClass, normalizeAllocations, calculateNetworkTotals, updateAccountComputedProperties } from "@/lib/tbff/utils"
import { initialDistribution, getDistributionSummary } from "@/lib/tbff/algorithms"

type Tool = 'select' | 'create-allocation'

export default function TBFFPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [network, setNetwork] = useState<FlowFundingNetwork>(sampleNetworks.statesDemo)
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [selectedAllocationId, setSelectedAllocationId] = useState<string | null>(null)
  const [selectedNetworkKey, setSelectedNetworkKey] = useState<string>('statesDemo')
  const [tool, setTool] = useState<Tool>('select')
  const [allocationSourceId, setAllocationSourceId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedAccountId, setDraggedAccountId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [mouseDownPos, setMouseDownPos] = useState<{ x: number; y: number } | null>(null)
  const [fundingAmount, setFundingAmount] = useState(1000)
  const [lastDistribution, setLastDistribution] = useState<{
    totalDistributed: number
    accountsChanged: number
    changes: Array<{ accountId: string; name: string; before: number; after: number; delta: number }>
  } | null>(null)

  // Render canvas whenever network changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Render the network
    renderNetwork(ctx, network, canvas.width, canvas.height, selectedAccountId, selectedAllocationId)
  }, [network, selectedAccountId, selectedAllocationId])

  // Handle mouse down - record position for all interactions
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Always record mouse down position
    setMouseDownPos({ x, y })

    // Find clicked account
    const clickedAccount = network.accounts.find(
      (acc) =>
        x >= acc.x &&
        x <= acc.x + acc.width &&
        y >= acc.y &&
        y <= acc.y + acc.height
    )

    // Prepare for potential drag (only in select mode)
    if (tool === 'select' && clickedAccount) {
      setDraggedAccountId(clickedAccount.id)
      setDragOffset({
        x: x - clickedAccount.x,
        y: y - clickedAccount.y,
      })
    }
  }

  // Handle mouse move - start drag if threshold exceeded (select mode only)
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Only handle dragging in select mode
    if (tool === 'select' && mouseDownPos && draggedAccountId && !isDragging) {
      const dx = x - mouseDownPos.x
      const dy = y - mouseDownPos.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      // Start drag if moved more than 5 pixels
      if (distance > 5) {
        setIsDragging(true)
      }
    }

    // If dragging, update position
    if (isDragging && draggedAccountId) {
      const updatedNetwork = calculateNetworkTotals({
        ...network,
        accounts: network.accounts.map((acc) =>
          acc.id === draggedAccountId
            ? updateAccountComputedProperties({
                ...acc,
                x: x - dragOffset.x,
                y: y - dragOffset.y,
              })
            : acc
        ),
      })

      setNetwork(updatedNetwork)
    }
  }

  // Handle mouse up - end dragging or handle click
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // If was dragging, just end drag
    if (isDragging) {
      setIsDragging(false)
      setDraggedAccountId(null)
      setMouseDownPos(null)
      return
    }

    // Clear drag-related state
    setDraggedAccountId(null)
    setMouseDownPos(null)

    // Find what was clicked
    const clickedAccount = network.accounts.find(
      (acc) =>
        x >= acc.x &&
        x <= acc.x + acc.width &&
        y >= acc.y &&
        y <= acc.y + acc.height
    )

    // Handle based on current tool
    if (tool === 'select') {
      if (clickedAccount) {
        setSelectedAccountId(clickedAccount.id)
        setSelectedAllocationId(null)
      } else {
        // Check if clicked on an allocation arrow
        const clickedAllocation = findAllocationAtPoint(x, y)
        if (clickedAllocation) {
          setSelectedAllocationId(clickedAllocation.id)
          setSelectedAccountId(null)
        } else {
          setSelectedAccountId(null)
          setSelectedAllocationId(null)
        }
      }
    } else if (tool === 'create-allocation') {
      if (clickedAccount) {
        if (!allocationSourceId) {
          // First click - set source
          setAllocationSourceId(clickedAccount.id)
        } else {
          // Second click - create allocation
          if (clickedAccount.id !== allocationSourceId) {
            createAllocation(allocationSourceId, clickedAccount.id)
          }
          setAllocationSourceId(null)
        }
      }
    }
  }

  // Handle mouse leave - only cancel drag, don't deselect
  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false)
    }
    setDraggedAccountId(null)
    setMouseDownPos(null)
  }

  // Find allocation at point (simple distance check)
  const findAllocationAtPoint = (x: number, y: number): Allocation | null => {
    const tolerance = 15

    for (const allocation of network.allocations) {
      const source = network.accounts.find(a => a.id === allocation.sourceAccountId)
      const target = network.accounts.find(a => a.id === allocation.targetAccountId)

      if (!source || !target) continue

      const sourceCenter = { x: source.x + source.width / 2, y: source.y + source.height / 2 }
      const targetCenter = { x: target.x + target.width / 2, y: target.y + target.height / 2 }

      const distance = pointToLineDistance(x, y, sourceCenter.x, sourceCenter.y, targetCenter.x, targetCenter.y)

      if (distance < tolerance) {
        return allocation
      }
    }

    return null
  }

  // Point to line distance calculation
  const pointToLineDistance = (
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number => {
    const A = px - x1
    const B = py - y1
    const C = x2 - x1
    const D = y2 - y1

    const dot = A * C + B * D
    const lenSq = C * C + D * D
    let param = -1

    if (lenSq !== 0) {
      param = dot / lenSq
    }

    let xx, yy

    if (param < 0) {
      xx = x1
      yy = y1
    } else if (param > 1) {
      xx = x2
      yy = y2
    } else {
      xx = x1 + param * C
      yy = y1 + param * D
    }

    const dx = px - xx
    const dy = py - yy

    return Math.sqrt(dx * dx + dy * dy)
  }

  // Create new allocation
  const createAllocation = (sourceId: string, targetId: string) => {
    const newAllocation: Allocation = {
      id: `alloc_${Date.now()}`,
      sourceAccountId: sourceId,
      targetAccountId: targetId,
      percentage: 0.5, // Default 50%
    }

    // Add allocation and normalize
    const updatedAllocations = [...network.allocations, newAllocation]
    const sourceAllocations = updatedAllocations.filter(a => a.sourceAccountId === sourceId)
    const normalized = normalizeAllocations(sourceAllocations)

    // Replace source allocations with normalized ones
    const finalAllocations = updatedAllocations.map(a => {
      const normalizedVersion = normalized.find(n => n.id === a.id)
      return normalizedVersion || a
    })

    const updatedNetwork = calculateNetworkTotals({
      ...network,
      allocations: finalAllocations,
    })

    setNetwork(updatedNetwork)
    setSelectedAllocationId(newAllocation.id)
  }

  // Update allocation percentage
  const updateAllocationPercentage = (allocationId: string, newPercentage: number) => {
    const allocation = network.allocations.find(a => a.id === allocationId)
    if (!allocation) return

    const updatedAllocations = network.allocations.map(a =>
      a.id === allocationId ? { ...a, percentage: Math.max(0, Math.min(1, newPercentage)) } : a
    )

    // Normalize all allocations from the same source
    const sourceAllocations = updatedAllocations.filter(
      a => a.sourceAccountId === allocation.sourceAccountId
    )
    const normalized = normalizeAllocations(sourceAllocations)

    // Replace source allocations with normalized ones
    const finalAllocations = updatedAllocations.map(a => {
      const normalizedVersion = normalized.find(n => n.id === a.id)
      return normalizedVersion || a
    })

    const updatedNetwork = calculateNetworkTotals({
      ...network,
      allocations: finalAllocations,
    })

    setNetwork(updatedNetwork)
  }

  // Delete allocation
  const deleteAllocation = (allocationId: string) => {
    const allocation = network.allocations.find(a => a.id === allocationId)
    if (!allocation) return

    const updatedAllocations = network.allocations.filter(a => a.id !== allocationId)

    // Normalize remaining allocations from the same source
    const sourceAllocations = updatedAllocations.filter(
      a => a.sourceAccountId === allocation.sourceAccountId
    )
    const normalized = normalizeAllocations(sourceAllocations)

    // Replace source allocations with normalized ones
    const finalAllocations = updatedAllocations.map(a => {
      const normalizedVersion = normalized.find(n => n.id === a.id)
      return normalizedVersion || a
    })

    const updatedNetwork = calculateNetworkTotals({
      ...network,
      allocations: finalAllocations,
    })

    setNetwork(updatedNetwork)
    setSelectedAllocationId(null)
  }

  // Load different network
  const handleLoadNetwork = (key: string) => {
    setSelectedNetworkKey(key)
    const newNetwork = getSampleNetwork(key as keyof typeof sampleNetworks)
    setNetwork(newNetwork)
    setSelectedAccountId(null)
    setSelectedAllocationId(null)
    setAllocationSourceId(null)
    setTool('select')
  }

  // Add funding to network
  const handleAddFunding = () => {
    if (fundingAmount <= 0) {
      console.warn('⚠️ Funding amount must be positive')
      return
    }

    const beforeNetwork = network
    const afterNetwork = initialDistribution(network, fundingAmount)
    const summary = getDistributionSummary(beforeNetwork, afterNetwork)

    setNetwork(afterNetwork)
    setLastDistribution(summary)

    console.log(`\n✅ Distribution Complete`)
    console.log(`Total distributed: ${summary.totalDistributed.toFixed(0)}`)
    console.log(`Accounts changed: ${summary.accountsChanged}`)
  }

  // Get selected account/allocation details
  const selectedAccount = selectedAccountId
    ? network.accounts.find((a) => a.id === selectedAccountId)
    : null

  const selectedAllocation = selectedAllocationId
    ? network.allocations.find((a) => a.id === selectedAllocationId)
    : null

  // Get allocations from selected account
  const outgoingAllocations = selectedAccount
    ? network.allocations.filter(a => a.sourceAccountId === selectedAccount.id)
    : []

  // Get allocations from selected allocation's source (for checking if single)
  const selectedAllocationSiblings = selectedAllocation
    ? network.allocations.filter(a => a.sourceAccountId === selectedAllocation.sourceAccountId)
    : []

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTool('select')
        setAllocationSourceId(null)
        setSelectedAccountId(null)
        setSelectedAllocationId(null)
      } else if (e.key === 'Delete' && selectedAllocationId) {
        deleteAllocation(selectedAllocationId)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedAllocationId])

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-slate-700">
        <div>
          <h1 className="text-2xl font-bold text-cyan-400">
            Threshold-Based Flow Funding
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Milestone 3: Initial Distribution
          </p>
        </div>
        <Link href="/" className="text-cyan-400 hover:text-cyan-300 transition-colors">
          ← Back to Home
        </Link>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Canvas */}
        <div className="flex-1 relative">
          <canvas
            ref={canvasRef}
            className={`w-full h-full ${
              tool === 'create-allocation'
                ? 'cursor-crosshair'
                : isDragging
                ? 'cursor-grabbing'
                : 'cursor-grab'
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          />

          {/* Tool indicator */}
          {allocationSourceId && (
            <div className="absolute top-4 left-4 bg-cyan-600 px-4 py-2 rounded-lg text-sm font-medium">
              Click target account to create allocation
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-slate-800 p-6 space-y-6 overflow-y-auto">
          {/* Tools */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-400">Tools</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setTool('select')
                  setAllocationSourceId(null)
                }}
                className={`px-3 py-2 rounded text-sm transition-colors ${
                  tool === 'select'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                Select
              </button>
              <button
                onClick={() => setTool('create-allocation')}
                className={`px-3 py-2 rounded text-sm transition-colors ${
                  tool === 'create-allocation'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                Create Arrow
              </button>
            </div>
          </div>

          {/* Network Selector */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-400">Select Network</h3>
            <select
              value={selectedNetworkKey}
              onChange={(e) => handleLoadNetwork(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 rounded text-sm"
            >
              {networkOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Network Info */}
          <div className="bg-slate-700 p-4 rounded">
            <h3 className="font-semibold text-cyan-400 mb-3">{network.name}</h3>
            <div className="text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Accounts:</span>
                <span className="text-white">{network.accounts.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Allocations:</span>
                <span className="text-white">{network.allocations.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Funds:</span>
                <span className="text-white">{formatCurrency(network.totalFunds)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-400">Shortfall:</span>
                <span className="text-red-400">{formatCurrency(network.totalShortfall)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-400">Capacity:</span>
                <span className="text-yellow-400">{formatCurrency(network.totalCapacity)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-400">Overflow:</span>
                <span className="text-green-400">{formatCurrency(network.totalOverflow)}</span>
              </div>
            </div>
          </div>

          {/* Funding Controls */}
          <div className="bg-green-900/30 border border-green-500/30 p-4 rounded">
            <h3 className="font-semibold text-green-400 mb-3">💰 Add Funding</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Funding Amount
                </label>
                <input
                  type="number"
                  value={fundingAmount}
                  onChange={(e) => setFundingAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-700 rounded text-sm"
                  min="0"
                  step="100"
                />
              </div>
              <button
                onClick={handleAddFunding}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition-colors"
              >
                Distribute Funding
              </button>
            </div>

            {/* Distribution Summary */}
            {lastDistribution && (
              <div className="mt-4 pt-4 border-t border-green-500/30">
                <div className="text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Distributed:</span>
                    <span className="text-green-400 font-medium">
                      {formatCurrency(lastDistribution.totalDistributed)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Accounts Changed:</span>
                    <span className="text-white">{lastDistribution.accountsChanged}</span>
                  </div>
                  {lastDistribution.changes.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <div className="text-slate-400 text-[10px] mb-1">Changes:</div>
                      {lastDistribution.changes.map((change) => (
                        <div
                          key={change.accountId}
                          className="flex justify-between items-center bg-slate-800/50 p-1.5 rounded"
                        >
                          <span className="text-white text-[11px]">{change.name}</span>
                          <span className="text-green-400 text-[11px] font-mono">
                            +{formatCurrency(change.delta)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Selected Allocation Editor */}
          {selectedAllocation && (
            <div className="bg-slate-700 p-4 rounded">
              <h3 className="font-semibold text-cyan-400 mb-3">Edit Allocation</h3>
              <div className="text-xs space-y-3">
                <div>
                  <span className="text-slate-400">From: </span>
                  <span className="text-white font-medium">
                    {network.accounts.find(a => a.id === selectedAllocation.sourceAccountId)?.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">To: </span>
                  <span className="text-white font-medium">
                    {network.accounts.find(a => a.id === selectedAllocation.targetAccountId)?.name}
                  </span>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">
                    Percentage: {Math.round(selectedAllocation.percentage * 100)}%
                  </label>
                  {selectedAllocationSiblings.length === 1 ? (
                    <div className="text-[10px] text-yellow-400 bg-slate-800 p-2 rounded">
                      Single allocation must be 100%. Create additional allocations to split overflow.
                    </div>
                  ) : (
                    <>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={selectedAllocation.percentage * 100}
                        onChange={(e) =>
                          updateAllocationPercentage(
                            selectedAllocation.id,
                            parseFloat(e.target.value) / 100
                          )
                        }
                        className="w-full"
                      />
                      <div className="text-[10px] text-slate-500 mt-1">
                        Note: Percentages auto-normalize with other allocations from same source
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={() => deleteAllocation(selectedAllocation.id)}
                  className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
                >
                  Delete Allocation
                </button>
              </div>
            </div>
          )}

          {/* Selected Account Details */}
          {selectedAccount && (
            <div className="bg-slate-700 p-4 rounded">
              <h3 className="font-semibold text-cyan-400 mb-3">Account Details</h3>
              <div className="text-xs space-y-2">
                <div>
                  <span className="text-slate-400">Name: </span>
                  <span className="text-white font-medium">{selectedAccount.name}</span>
                </div>
                <div>
                  <span className="text-slate-400">Status: </span>
                  <span className={`font-medium ${getStatusColorClass(selectedAccount.status)}`}>
                    {selectedAccount.status.toUpperCase()}
                  </span>
                </div>
                <div className="pt-2 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Balance:</span>
                    <span className="text-white font-mono">
                      {formatCurrency(selectedAccount.balance)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Min Threshold:</span>
                    <span className="text-white font-mono">
                      {formatCurrency(selectedAccount.minThreshold)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Max Threshold:</span>
                    <span className="text-white font-mono">
                      {formatCurrency(selectedAccount.maxThreshold)}
                    </span>
                  </div>
                </div>

                {/* Outgoing Allocations */}
                {outgoingAllocations.length > 0 && (
                  <div className="pt-3 border-t border-slate-600">
                    <div className="text-slate-400 mb-2">Outgoing Allocations:</div>
                    {outgoingAllocations.map((alloc) => {
                      const target = network.accounts.find(a => a.id === alloc.targetAccountId)
                      return (
                        <div
                          key={alloc.id}
                          className="flex justify-between items-center mb-1 cursor-pointer hover:bg-slate-600 p-1 rounded"
                          onClick={() => setSelectedAllocationId(alloc.id)}
                        >
                          <span className="text-white">→ {target?.name}</span>
                          <span className="text-cyan-400 font-mono">
                            {Math.round(alloc.percentage * 100)}%
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Account List */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-400">All Accounts</h3>
            <div className="space-y-1 text-xs">
              {network.accounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => {
                    setSelectedAccountId(acc.id)
                    setSelectedAllocationId(null)
                  }}
                  className={`w-full p-2 rounded text-left transition-colors ${
                    selectedAccountId === acc.id
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{acc.name}</span>
                    <span className={`font-mono ${getStatusColorClass(acc.status)}`}>
                      {formatCurrency(acc.balance)}
                    </span>
                  </div>
                  <div className="text-slate-400 text-[10px] mt-1">
                    {acc.status.toUpperCase()}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="bg-slate-700 p-4 rounded">
            <h3 className="text-sm font-semibold text-slate-400 mb-3">Legend</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>Deficit - Below minimum threshold</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span>Minimum - At minimum threshold</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span>Healthy - Between thresholds</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>Overflow - Above maximum threshold</span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-slate-700 p-4 rounded text-xs text-slate-300">
            <p className="mb-2">
              <strong className="text-white">Milestone 3:</strong> Initial Distribution
            </p>
            <ul className="space-y-1 list-disc list-inside">
              <li><strong className="text-green-400">Add funding</strong> to distribute across accounts</li>
              <li><strong className="text-cyan-400">Drag</strong> accounts to reposition them</li>
              <li>Use <strong className="text-cyan-400">Create Arrow</strong> tool to draw allocations</li>
              <li>Click arrow to edit percentage</li>
              <li>Press <kbd className="px-1 bg-slate-800 rounded">Delete</kbd> to remove allocation</li>
              <li>Check console for distribution logs</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
