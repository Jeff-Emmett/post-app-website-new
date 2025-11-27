"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import type { FlowNetwork, FlowAllocation, FlowParticle } from "@/lib/tbff-flow/types"
import { renderFlowNetwork } from "@/lib/tbff-flow/rendering"
import {
  flowSampleNetworks,
  flowNetworkOptions,
  getFlowSampleNetwork,
} from "@/lib/tbff-flow/sample-networks"
import {
  formatFlow,
  getFlowStatusColorClass,
  normalizeFlowAllocations,
  calculateFlowNetworkTotals,
  updateFlowNodeProperties,
} from "@/lib/tbff-flow/utils"
import { propagateFlow, updateFlowParticles } from "@/lib/tbff-flow/algorithms"

type Tool = 'select' | 'create-allocation'

export default function TBFFFlowPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)

  const [network, setNetwork] = useState<FlowNetwork>(flowSampleNetworks.linear)
  const [particles, setParticles] = useState<FlowParticle[]>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedAllocationId, setSelectedAllocationId] = useState<string | null>(null)
  const [selectedNetworkKey, setSelectedNetworkKey] = useState<string>('linear')
  const [tool, setTool] = useState<Tool>('select')
  const [allocationSourceId, setAllocationSourceId] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(true)

  // Animation loop
  useEffect(() => {
    if (!isAnimating) return

    const animate = () => {
      // Update particles
      setParticles(prev => updateFlowParticles(prev))

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isAnimating])

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Render the network
    renderFlowNetwork(
      ctx,
      network,
      canvas.width,
      canvas.height,
      particles,
      selectedNodeId,
      selectedAllocationId
    )
  }, [network, particles, selectedNodeId, selectedAllocationId])

  // Propagate flow when network changes
  const handlePropagateFlow = () => {
    const result = propagateFlow(network)
    setNetwork(result.network)
    setParticles(result.particles)
  }

  // Set external flow for selected node
  const handleSetNodeFlow = (nodeId: string, flow: number) => {
    const updatedNodes = network.nodes.map(node =>
      node.id === nodeId
        ? { ...node, externalFlow: Math.max(0, flow) }
        : node
    )

    const updatedNetwork = {
      ...network,
      nodes: updatedNodes,
    }

    setNetwork(updatedNetwork)

    // Auto-propagate
    setTimeout(() => {
      const result = propagateFlow(updatedNetwork)
      setNetwork(result.network)
      setParticles(result.particles)
    }, 100)
  }

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Find clicked node
    const clickedNode = network.nodes.find(
      node =>
        x >= node.x &&
        x <= node.x + node.width &&
        y >= node.y &&
        y <= node.y + node.height
    )

    if (tool === 'select') {
      if (clickedNode) {
        setSelectedNodeId(clickedNode.id)
        setSelectedAllocationId(null)
      } else {
        // Check if clicked on allocation
        const clickedAllocation = findAllocationAtPoint(x, y)
        if (clickedAllocation) {
          setSelectedAllocationId(clickedAllocation.id)
          setSelectedNodeId(null)
        } else {
          // Deselect all
          setSelectedNodeId(null)
          setSelectedAllocationId(null)
        }
      }
    } else if (tool === 'create-allocation') {
      if (clickedNode) {
        if (!allocationSourceId) {
          // First click: set source
          setAllocationSourceId(clickedNode.id)
        } else {
          // Second click: create allocation
          if (clickedNode.id !== allocationSourceId) {
            createAllocation(allocationSourceId, clickedNode.id)
          }
          setAllocationSourceId(null)
        }
      }
    }
  }

  // Find allocation at point
  const findAllocationAtPoint = (x: number, y: number): FlowAllocation | null => {
    const tolerance = 15

    for (const allocation of network.allocations) {
      const sourceNode = network.nodes.find(n => n.id === allocation.sourceNodeId)
      const targetNode = network.nodes.find(n => n.id === allocation.targetNodeId)
      if (!sourceNode || !targetNode) continue

      const sourceCenter = {
        x: sourceNode.x + sourceNode.width / 2,
        y: sourceNode.y + sourceNode.height / 2,
      }
      const targetCenter = {
        x: targetNode.x + targetNode.width / 2,
        y: targetNode.y + targetNode.height / 2,
      }

      const distance = pointToLineDistance(
        x, y,
        sourceCenter.x, sourceCenter.y,
        targetCenter.x, targetCenter.y
      )

      if (distance < tolerance) {
        return allocation
      }
    }

    return null
  }

  // Point to line distance
  const pointToLineDistance = (
    px: number, py: number,
    x1: number, y1: number,
    x2: number, y2: number
  ): number => {
    const dot = (px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)
    const lenSq = (x2 - x1) ** 2 + (y2 - y1) ** 2
    const param = lenSq !== 0 ? dot / lenSq : -1

    let xx, yy
    if (param < 0) {
      [xx, yy] = [x1, y1]
    } else if (param > 1) {
      [xx, yy] = [x2, y2]
    } else {
      xx = x1 + param * (x2 - x1)
      yy = y1 + param * (y2 - y1)
    }

    return Math.sqrt((px - xx) ** 2 + (py - yy) ** 2)
  }

  // Create allocation
  const createAllocation = (sourceId: string, targetId: string) => {
    const newAllocation: FlowAllocation = {
      id: `alloc_${Date.now()}`,
      sourceNodeId: sourceId,
      targetNodeId: targetId,
      percentage: 0.5,
    }

    const updatedAllocations = [...network.allocations, newAllocation]
    const sourceAllocations = updatedAllocations.filter(a => a.sourceNodeId === sourceId)
    const normalized = normalizeFlowAllocations(sourceAllocations)

    const finalAllocations = updatedAllocations.map(a => {
      const normalizedVersion = normalized.find(n => n.id === a.id)
      return normalizedVersion || a
    })

    const updatedNetwork = {
      ...network,
      allocations: finalAllocations,
    }

    setNetwork(updatedNetwork)
    setSelectedAllocationId(newAllocation.id)
    setTool('select')

    // Re-propagate
    setTimeout(() => handlePropagateFlow(), 100)
  }

  // Update allocation percentage
  const updateAllocationPercentage = (allocationId: string, newPercentage: number) => {
    const allocation = network.allocations.find(a => a.id === allocationId)
    if (!allocation) return

    const updatedAllocations = network.allocations.map(a =>
      a.id === allocationId
        ? { ...a, percentage: Math.max(0, Math.min(1, newPercentage)) }
        : a
    )

    const sourceAllocations = updatedAllocations.filter(
      a => a.sourceNodeId === allocation.sourceNodeId
    )
    const normalized = normalizeFlowAllocations(sourceAllocations)

    const finalAllocations = updatedAllocations.map(a => {
      const normalizedVersion = normalized.find(n => n.id === a.id)
      return normalizedVersion || a
    })

    const updatedNetwork = {
      ...network,
      allocations: finalAllocations,
    }

    setNetwork(updatedNetwork)

    // Re-propagate
    setTimeout(() => {
      const result = propagateFlow(updatedNetwork)
      setNetwork(result.network)
      setParticles(result.particles)
    }, 100)
  }

  // Delete allocation
  const deleteAllocation = (allocationId: string) => {
    const allocation = network.allocations.find(a => a.id === allocationId)
    if (!allocation) return

    const updatedAllocations = network.allocations.filter(a => a.id !== allocationId)

    const sourceAllocations = updatedAllocations.filter(
      a => a.sourceNodeId === allocation.sourceNodeId
    )
    const normalized = normalizeFlowAllocations(sourceAllocations)

    const finalAllocations = updatedAllocations.map(a => {
      const normalizedVersion = normalized.find(n => n.id === a.id)
      return normalizedVersion || a
    })

    const updatedNetwork = {
      ...network,
      allocations: finalAllocations,
    }

    setNetwork(updatedNetwork)
    setSelectedAllocationId(null)

    // Re-propagate
    setTimeout(() => handlePropagateFlow(), 100)
  }

  // Load network
  const handleLoadNetwork = (key: string) => {
    setSelectedNetworkKey(key)
    const newNetwork = getFlowSampleNetwork(key as keyof typeof flowSampleNetworks)
    setNetwork(newNetwork)
    setSelectedNodeId(null)
    setSelectedAllocationId(null)
    setAllocationSourceId(null)
    setTool('select')

    // Propagate initial flows
    setTimeout(() => handlePropagateFlow(), 100)
  }

  // Get selected details
  const selectedNode = selectedNodeId
    ? network.nodes.find(n => n.id === selectedNodeId)
    : null

  const selectedAllocation = selectedAllocationId
    ? network.allocations.find(a => a.id === selectedAllocationId)
    : null

  const outgoingAllocations = selectedNode
    ? network.allocations.filter(a => a.sourceNodeId === selectedNode.id)
    : []

  const selectedAllocationSiblings = selectedAllocation
    ? network.allocations.filter(a => a.sourceNodeId === selectedAllocation.sourceNodeId)
    : []

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTool('select')
        setAllocationSourceId(null)
        setSelectedNodeId(null)
        setSelectedAllocationId(null)
      } else if (e.key === 'Delete' && selectedAllocationId) {
        deleteAllocation(selectedAllocationId)
      } else if (e.key === ' ') {
        e.preventDefault()
        setIsAnimating(prev => !prev)
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
            Flow-Based Flow Funding
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Resource circulation visualization
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="/tbff" className="text-cyan-400 hover:text-cyan-300 transition-colors">
            Stock Model →
          </Link>
          <Link href="/" className="text-cyan-400 hover:text-cyan-300 transition-colors">
            ← Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Canvas */}
        <div className="flex-1 relative">
          <canvas
            ref={canvasRef}
            className={`w-full h-full ${
              tool === 'create-allocation' ? 'cursor-crosshair' : 'cursor-pointer'
            }`}
            onClick={handleCanvasClick}
          />

          {/* Tool indicator */}
          {allocationSourceId && (
            <div className="absolute top-4 left-4 bg-cyan-600 px-4 py-2 rounded-lg text-sm font-medium">
              Click target node to create allocation
            </div>
          )}

          {/* Animation status */}
          <div className="absolute top-4 right-4 bg-slate-800 px-4 py-2 rounded-lg text-sm">
            {isAnimating ? '▶️ Animating' : '⏸️ Paused'} (Space to toggle)
          </div>
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
              {flowNetworkOptions.map((opt) => (
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
                <span className="text-slate-400">Nodes:</span>
                <span className="text-white">{network.nodes.filter(n => !n.isOverflowSink).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Allocations:</span>
                <span className="text-white">{network.allocations.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-400">Total Inflow:</span>
                <span className="text-blue-400">{formatFlow(network.totalInflow)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-400">Total Absorbed:</span>
                <span className="text-green-400">{formatFlow(network.totalAbsorbed)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-400">Total Outflow:</span>
                <span className="text-yellow-400">{formatFlow(network.totalOutflow)}</span>
              </div>
            </div>
          </div>

          {/* Set Flow Input */}
          {selectedNode && !selectedNode.isOverflowSink && (
            <div className="bg-green-900/30 border border-green-500/30 p-4 rounded">
              <h3 className="font-semibold text-green-400 mb-3">💧 Set Flow Input</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">
                    External Flow for {selectedNode.name}
                  </label>
                  <input
                    type="number"
                    value={selectedNode.externalFlow}
                    onChange={(e) => handleSetNodeFlow(selectedNode.id, parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-700 rounded text-sm"
                    min="0"
                    step="10"
                  />
                </div>
                <div className="text-xs text-slate-400">
                  Current inflow: {formatFlow(selectedNode.inflow)}
                  <br />
                  Absorbed: {formatFlow(selectedNode.absorbed)}
                  <br />
                  Outflow: {formatFlow(selectedNode.outflow)}
                </div>
              </div>
            </div>
          )}

          {/* Selected Allocation Editor */}
          {selectedAllocation && (
            <div className="bg-slate-700 p-4 rounded">
              <h3 className="font-semibold text-cyan-400 mb-3">Edit Allocation</h3>
              <div className="text-xs space-y-3">
                <div>
                  <span className="text-slate-400">From: </span>
                  <span className="text-white font-medium">
                    {network.nodes.find(n => n.id === selectedAllocation.sourceNodeId)?.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">To: </span>
                  <span className="text-white font-medium">
                    {network.nodes.find(n => n.id === selectedAllocation.targetNodeId)?.name}
                  </span>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">
                    Percentage: {Math.round(selectedAllocation.percentage * 100)}%
                  </label>
                  {selectedAllocationSiblings.length === 1 ? (
                    <div className="text-[10px] text-yellow-400 bg-slate-800 p-2 rounded">
                      Single allocation must be 100%.
                    </div>
                  ) : (
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

          {/* Selected Node Details */}
          {selectedNode && (
            <div className="bg-slate-700 p-4 rounded">
              <h3 className="font-semibold text-cyan-400 mb-3">Node Details</h3>
              <div className="text-xs space-y-2">
                <div>
                  <span className="text-slate-400">Name: </span>
                  <span className="text-white font-medium">{selectedNode.name}</span>
                </div>
                <div>
                  <span className="text-slate-400">Status: </span>
                  <span className={`font-medium ${getFlowStatusColorClass(selectedNode.status)}`}>
                    {selectedNode.status.toUpperCase()}
                  </span>
                </div>
                <div className="pt-2 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Inflow:</span>
                    <span className="text-blue-400 font-mono">{formatFlow(selectedNode.inflow)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Absorbed:</span>
                    <span className="text-green-400 font-mono">{formatFlow(selectedNode.absorbed)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Outflow:</span>
                    <span className="text-yellow-400 font-mono">{formatFlow(selectedNode.outflow)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Min Absorption:</span>
                    <span className="text-white font-mono">{formatFlow(selectedNode.minAbsorption)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Max Absorption:</span>
                    <span className="text-white font-mono">{formatFlow(selectedNode.maxAbsorption)}</span>
                  </div>
                </div>

                {/* Outgoing Allocations */}
                {outgoingAllocations.length > 0 && (
                  <div className="pt-3 border-t border-slate-600">
                    <div className="text-slate-400 mb-2">Outgoing Allocations:</div>
                    {outgoingAllocations.map((alloc) => {
                      const target = network.nodes.find(n => n.id === alloc.targetNodeId)
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

          {/* Legend */}
          <div className="bg-slate-700 p-4 rounded">
            <h3 className="text-sm font-semibold text-slate-400 mb-3">Legend</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>Starved - Below minimum absorption</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span>Minimum - At minimum absorption</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span>Healthy - Between min and max</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>Saturated - At maximum capacity</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-400 rounded-full"></div>
                <span>Particle - Flow animation</span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-slate-700 p-4 rounded text-xs text-slate-300">
            <p className="mb-2">
              <strong className="text-white">Flow-Based Model</strong>
            </p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Click node to select and <strong className="text-green-400">set flow</strong></li>
              <li>Use <strong className="text-cyan-400">Create Arrow</strong> to draw allocations</li>
              <li>Watch flows <strong className="text-green-400">propagate</strong> in real-time</li>
              <li>Press <kbd className="px-1 bg-slate-800 rounded">Space</kbd> to pause/play animation</li>
              <li>Overflow sink appears automatically if needed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
