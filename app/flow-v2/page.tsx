'use client'

/**
 * Flow Funding V2 - Continuous Flow Dynamics Demo
 *
 * Interactive visualization of progressive outflow zones and
 * steady-state flow equilibrium
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { FlowNode, FlowNetwork, ScenarioV2 } from '../../lib/flow-v2/types'
import {
  calculateSteadyState,
  getFlowZone,
  cloneNodes,
  updateBalances,
  perSecondToPerMonth,
} from '../../lib/flow-v2/engine-v2'
import {
  ALL_SCENARIOS_V2,
  linearChainV2,
} from '../../lib/flow-v2/scenarios-v2'

/**
 * Flow particle for animation
 */
interface FlowParticle {
  id: string
  sourceId: string
  targetId: string
  progress: number  // 0 to 1
  startTime: number
}

/**
 * Main component
 */
export default function FlowFundingV2() {
  // Scenario selection
  const [currentScenario, setCurrentScenario] = useState<ScenarioV2>(linearChainV2)

  // Node state (with adjustable external inflows)
  const [nodes, setNodes] = useState<FlowNode[]>(() =>
    cloneNodes(currentScenario.nodes)
  )

  // Network state (calculated)
  const [network, setNetwork] = useState<FlowNetwork | null>(null)

  // Animation state
  const [particles, setParticles] = useState<FlowParticle[]>([])
  const [isPlaying, setIsPlaying] = useState(true)
  const [simulationTime, setSimulationTime] = useState(0)

  // UI state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [showMetrics, setShowMetrics] = useState(true)

  /**
   * Recalculate network whenever nodes change
   */
  useEffect(() => {
    try {
      const result = calculateSteadyState(cloneNodes(nodes), {
        verbose: false,
      })
      setNetwork(result)
    } catch (error) {
      console.error('Failed to calculate steady state:', error)
    }
  }, [nodes])

  /**
   * Handle scenario change
   */
  const handleScenarioChange = useCallback((scenario: ScenarioV2) => {
    setCurrentScenario(scenario)
    setNodes(cloneNodes(scenario.nodes))
    setSelectedNodeId(null)
    setSimulationTime(0)
  }, [])

  /**
   * Handle external inflow adjustment
   */
  const handleInflowChange = useCallback(
    (nodeId: string, newInflow: number) => {
      setNodes(prev =>
        prev.map(n =>
          n.id === nodeId ? { ...n, externalInflow: newInflow } : n
        )
      )
    },
    []
  )

  /**
   * Animation loop - update balances and particles
   */
  useEffect(() => {
    if (!isPlaying || !network) return

    let lastTime = performance.now()
    let animationFrameId: number

    const animate = (currentTime: number) => {
      const deltaMs = currentTime - lastTime
      lastTime = currentTime

      const deltaSeconds = deltaMs / 1000

      // Update simulation time
      setSimulationTime(prev => prev + deltaSeconds)

      // Update node balances (for visualization)
      const updatedNodes = cloneNodes(nodes)

      // Set total inflows/outflows from network calculation
      if (network?.nodes) {
        updatedNodes.forEach(node => {
          const networkNode = network.nodes.get(node.id)
          if (networkNode) {
            node.totalInflow = networkNode.totalInflow
            node.totalOutflow = networkNode.totalOutflow
          }
        })
      }

      updateBalances(updatedNodes, deltaSeconds)
      setNodes(updatedNodes)

      // Update particles
      setParticles(prev => {
        const updated = prev
          .map(p => ({
            ...p,
            progress: p.progress + deltaSeconds / 2, // 2 second transit time
          }))
          .filter(p => p.progress < 1)

        // Spawn new particles
        const now = currentTime / 1000
        if (network?.edges) {
          network.edges.forEach(edge => {
            // Spawn rate based on flow amount
            const spawnRate = Math.min(2, Math.max(0.2, edge.flowRate / 500))
            const shouldSpawn = Math.random() < spawnRate * deltaSeconds

            if (shouldSpawn) {
              updated.push({
                id: `${edge.source}-${edge.target}-${now}-${Math.random()}`,
                sourceId: edge.source,
                targetId: edge.target,
                progress: 0,
                startTime: now,
              })
            }
          })
        }

        return updated
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [isPlaying, network, nodes])

  /**
   * Get node position
   */
  const getNodePos = useCallback(
    (nodeId: string): { x: number; y: number } => {
      return currentScenario.layout.get(nodeId) || { x: 0, y: 0 }
    },
    [currentScenario]
  )

  /**
   * Get color for flow zone
   */
  const getZoneColor = useCallback((node: FlowNode): string => {
    const zone = getFlowZone(node)
    switch (zone) {
      case 'deficit':
        return '#ef4444' // red
      case 'building':
        return '#f59e0b' // amber
      case 'capacity':
        return '#10b981' // green
    }
  }, [])

  /**
   * Render network SVG
   */
  const renderNetwork = useMemo(() => {
    if (!network) return null

    const svgWidth = 800
    const svgHeight = 650

    return (
      <svg
        width={svgWidth}
        height={svgHeight}
        className="border border-gray-700 rounded-lg bg-gray-900"
      >
        {/* Edges */}
        {network.edges.map(edge => {
          const source = getNodePos(edge.source)
          const target = getNodePos(edge.target)

          // Edge width based on flow rate (logarithmic scale)
          const baseWidth = 2
          const maxWidth = 12
          const flowWidth =
            baseWidth +
            (maxWidth - baseWidth) *
              Math.min(1, Math.log(edge.flowRate + 1) / Math.log(1000))

          return (
            <g key={`${edge.source}-${edge.target}`}>
              {/* Edge line */}
              <line
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke="#4b5563"
                strokeWidth={flowWidth}
                strokeOpacity={0.6}
                markerEnd="url(#arrowhead)"
              />

              {/* Flow label */}
              <text
                x={(source.x + target.x) / 2}
                y={(source.y + target.y) / 2 - 5}
                fill="#9ca3af"
                fontSize="11"
                textAnchor="middle"
                className="pointer-events-none"
              >
                ${edge.flowRate.toFixed(0)}/mo
              </text>
            </g>
          )
        })}

        {/* Flow particles */}
        {particles.map(particle => {
          const source = getNodePos(particle.sourceId)
          const target = getNodePos(particle.targetId)

          const x = source.x + (target.x - source.x) * particle.progress
          const y = source.y + (target.y - source.y) * particle.progress

          return (
            <circle
              key={particle.id}
              cx={x}
              cy={y}
              r={3}
              fill="#3b82f6"
              opacity={0.8}
            />
          )
        })}

        {/* Nodes */}
        {Array.from(network.nodes.values()).map(node => {
          const pos = getNodePos(node.id)
          const zone = getFlowZone(node)
          const color = getZoneColor(node)
          const isSelected = selectedNodeId === node.id

          const totalInflow = node.totalInflow || 0
          const totalOutflow = node.totalOutflow || 0
          const retention = totalInflow - totalOutflow

          return (
            <g
              key={node.id}
              onClick={() => setSelectedNodeId(node.id)}
              className="cursor-pointer"
            >
              {/* Selection ring */}
              {isSelected && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={38}
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth={3}
                  opacity={0.8}
                />
              )}

              {/* Node circle */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={30}
                fill={color}
                fillOpacity={0.2}
                stroke={color}
                strokeWidth={2}
              />

              {/* Node label */}
              <text
                x={pos.x}
                y={pos.y - 5}
                fill="white"
                fontSize="13"
                fontWeight="bold"
                textAnchor="middle"
                className="pointer-events-none"
              >
                {node.name}
              </text>

              {/* Zone indicator */}
              <text
                x={pos.x}
                y={pos.y + 8}
                fill={color}
                fontSize="10"
                textAnchor="middle"
                className="pointer-events-none"
              >
                {zone}
              </text>

              {/* Retention rate */}
              <text
                x={pos.x}
                y={pos.y + 20}
                fill="#9ca3af"
                fontSize="9"
                textAnchor="middle"
                className="pointer-events-none"
              >
                +${retention.toFixed(0)}/mo
              </text>
            </g>
          )
        })}

        {/* Overflow node */}
        {network.overflowNode && (
          <g>
            <circle
              cx={svgWidth - 80}
              cy={svgHeight - 80}
              r={30}
              fill="#6b7280"
              fillOpacity={0.2}
              stroke="#6b7280"
              strokeWidth={2}
            />
            <text
              x={svgWidth - 80}
              y={svgHeight - 85}
              fill="white"
              fontSize="11"
              fontWeight="bold"
              textAnchor="middle"
            >
              Overflow
            </text>
            <text
              x={svgWidth - 80}
              y={svgHeight - 72}
              fill="#9ca3af"
              fontSize="9"
              textAnchor="middle"
            >
              ${network.overflowNode.totalInflow.toFixed(0)}/mo
            </text>
          </g>
        )}

        {/* Arrow marker definition */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#4b5563" />
          </marker>
        </defs>
      </svg>
    )
  }, [network, particles, selectedNodeId, getNodePos, getZoneColor, currentScenario])

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Flow Funding V2
          </h1>
          <p className="text-gray-400 text-lg">
            Continuous flow dynamics with progressive outflow zones
          </p>
        </header>

        {/* Controls */}
        <div className="mb-6 flex gap-4 items-center flex-wrap">
          {/* Scenario selector */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Scenario
            </label>
            <select
              value={currentScenario.id}
              onChange={e => {
                const scenario = ALL_SCENARIOS_V2.find(
                  s => s.id === e.target.value
                )
                if (scenario) handleScenarioChange(scenario)
              }}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
            >
              {ALL_SCENARIOS_V2.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Play/pause */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Animation
            </label>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded px-4 py-2"
            >
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
          </div>

          {/* Metrics toggle */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Display
            </label>
            <button
              onClick={() => setShowMetrics(!showMetrics)}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded px-4 py-2"
            >
              {showMetrics ? '📊 Metrics On' : '📊 Metrics Off'}
            </button>
          </div>

          {/* Simulation time */}
          <div className="ml-auto">
            <label className="block text-sm text-gray-400 mb-1">
              Simulation Time
            </label>
            <div className="text-lg font-mono">
              {simulationTime.toFixed(1)}s
            </div>
          </div>
        </div>

        {/* Scenario description */}
        <div className="mb-6 p-4 bg-gray-900 border border-gray-800 rounded-lg">
          <p className="text-gray-300">{currentScenario.description}</p>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Network visualization */}
          <div className="lg:col-span-2">
            {renderNetwork}
          </div>

          {/* Control panel */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold mb-4">External Inflows</h3>

            {/* Node inflow sliders */}
            {nodes.map(node => {
              const networkNode = network?.nodes.get(node.id)
              const zone = networkNode ? getFlowZone(networkNode) : 'deficit'
              const color = networkNode ? getZoneColor(networkNode) : '#ef4444'

              return (
                <div
                  key={node.id}
                  className={`p-4 rounded-lg border-2 ${
                    selectedNodeId === node.id
                      ? 'border-purple-500 bg-purple-950/20'
                      : 'border-gray-800 bg-gray-900'
                  }`}
                >
                  {/* Node name and zone */}
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">{node.name}</span>
                    <span
                      className="text-xs px-2 py-1 rounded"
                      style={{ backgroundColor: color + '40', color }}
                    >
                      {zone}
                    </span>
                  </div>

                  {/* External inflow slider */}
                  <div className="mb-2">
                    <label className="text-xs text-gray-400 block mb-1">
                      External Inflow: ${node.externalInflow.toFixed(0)}/mo
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={2000}
                      step={50}
                      value={node.externalInflow}
                      onChange={e =>
                        handleInflowChange(node.id, parseFloat(e.target.value))
                      }
                      className="w-full"
                    />
                  </div>

                  {/* Thresholds */}
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Min: ${node.minThreshold}/mo</div>
                    <div>Max: ${node.maxThreshold}/mo</div>
                  </div>

                  {/* Flow metrics */}
                  {showMetrics && networkNode && (
                    <div className="mt-3 pt-3 border-t border-gray-800 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total In:</span>
                        <span className="text-green-400">
                          ${(networkNode.totalInflow || 0).toFixed(0)}/mo
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Out:</span>
                        <span className="text-red-400">
                          ${(networkNode.totalOutflow || 0).toFixed(0)}/mo
                        </span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span className="text-gray-400">Retained:</span>
                        <span className="text-blue-400">
                          $
                          {(
                            (networkNode.totalInflow || 0) -
                            (networkNode.totalOutflow || 0)
                          ).toFixed(0)}
                          /mo
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Balance:</span>
                        <span className="text-gray-300">
                          ${(networkNode.balance || 0).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Network totals */}
            {showMetrics && network && (
              <div className="p-4 bg-gray-900 border-2 border-gray-800 rounded-lg">
                <h4 className="font-semibold mb-3">Network Totals</h4>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">External Inflow:</span>
                    <span className="text-green-400">
                      ${network.totalExternalInflow.toFixed(0)}/mo
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Network Needs:</span>
                    <span className="text-amber-400">
                      ${network.totalNetworkNeeds.toFixed(0)}/mo
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Network Capacity:</span>
                    <span className="text-blue-400">
                      ${network.totalNetworkCapacity.toFixed(0)}/mo
                    </span>
                  </div>
                  {network.overflowNode && (
                    <div className="flex justify-between pt-2 border-t border-gray-800">
                      <span className="text-gray-400">Overflow:</span>
                      <span className="text-gray-400">
                        ${network.overflowNode.totalInflow.toFixed(0)}/mo
                      </span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-800">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Converged:</span>
                      <span
                        className={
                          network.converged ? 'text-green-400' : 'text-red-400'
                        }
                      >
                        {network.converged ? '✓ Yes' : '✗ No'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {network.iterations} iterations
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-8 p-4 bg-gray-900 border border-gray-800 rounded-lg">
          <h4 className="font-semibold mb-3">Flow Zones</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 mt-0.5 rounded-full bg-red-500"></div>
              <div>
                <div className="font-semibold text-red-400">Deficit Zone</div>
                <div className="text-gray-400 text-xs">
                  Inflow below min threshold. Keep everything (0% outflow).
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 mt-0.5 rounded-full bg-amber-500"></div>
              <div>
                <div className="font-semibold text-amber-400">Building Zone</div>
                <div className="text-gray-400 text-xs">
                  Between min and max. Progressive sharing based on capacity.
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 mt-0.5 rounded-full bg-green-500"></div>
              <div>
                <div className="font-semibold text-green-400">Capacity Zone</div>
                <div className="text-gray-400 text-xs">
                  Above max threshold. Redirect 100% of excess.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
