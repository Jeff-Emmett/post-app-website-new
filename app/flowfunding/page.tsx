'use client'

/**
 * Flow Funding Demo - Interactive Mode
 *
 * Enhanced with:
 * - Animated flow particles
 * - Distribution timeline
 * - Auto-play with speed controls
 * - INTERACTIVE: Click accounts to add targeted funding
 */

import { useState, useEffect, useRef } from 'react'
import {
  cloneAccounts,
  runDistribution,
} from '@/lib/flow-funding/engine'
import { runTargetedDistribution } from '@/lib/flow-funding/targeted'
import type { Account, DistributionResult } from '@/lib/flow-funding/types'
import { getAccountState } from '@/lib/flow-funding/types'
import {
  ALL_SCENARIOS,
  getScenario,
  type Scenario,
} from '@/lib/flow-funding/scenarios'

// Flow particle for animation
interface FlowParticle {
  id: string
  fromX: number
  fromY: number
  toX: number
  toY: number
  progress: number // 0 to 1
  amount: number
  color: string
}

type FundingMode = 'global' | 'interactive'

export default function FlowFundingPage() {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    'mutual-aid-circle'
  )
  const [funding, setFunding] = useState<number>(1500)
  const [targetedAmount, setTargetedAmount] = useState<number>(500)
  const [result, setResult] = useState<DistributionResult | null>(null)
  const [currentIteration, setCurrentIteration] = useState<number>(0)
  const [animationSpeed, setAnimationSpeed] = useState<number>(1)
  const [particles, setParticles] = useState<FlowParticle[]>([])
  const [autoPlay, setAutoPlay] = useState(false)
  const [fundingMode, setFundingMode] = useState<FundingMode>('interactive')

  // Interactive mode state
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [currentAccounts, setCurrentAccounts] = useState<Account[]>([])

  const scenario = getScenario(selectedScenarioId)
  const animationFrameRef = useRef<number>()

  // Initialize current accounts when scenario changes
  useEffect(() => {
    if (scenario) {
      setCurrentAccounts(cloneAccounts(scenario.accounts))
      setSelectedAccountId(null)
    }
  }, [selectedScenarioId])

  // Auto-play through iterations
  useEffect(() => {
    if (!autoPlay || !result) return

    const interval = setInterval(() => {
      setCurrentIteration(prev => {
        if (prev >= result.iterations.length - 1) {
          setAutoPlay(false)
          return prev
        }
        return prev + 1
      })
    }, 1000 / animationSpeed)

    return () => clearInterval(interval)
  }, [autoPlay, result, animationSpeed])

  // Animate particles when iteration changes
  useEffect(() => {
    if (!result || !scenario) return

    const iteration = result.iterations[currentIteration]
    if (!iteration || iteration.flows.size === 0) {
      setParticles([])
      return
    }

    // Create particles for each flow
    const newParticles: FlowParticle[] = []
    let particleId = 0

    iteration.flows.forEach((amount, flowKey) => {
      const [sourceId, targetId] = flowKey.split('->')
      const sourcePos = scenario.layout.get(sourceId)
      const targetPos = scenario.layout.get(targetId)

      if (!sourcePos || !targetPos || amount <= 0) return

      const numParticles = Math.min(3, Math.max(1, Math.floor(amount / 100)))

      for (let i = 0; i < numParticles; i++) {
        newParticles.push({
          id: `${flowKey}-${particleId++}`,
          fromX: sourcePos.x,
          fromY: sourcePos.y,
          toX: targetPos.x,
          toY: targetPos.y,
          progress: i * (1 / numParticles),
          amount: amount / numParticles,
          color: '#60a5fa',
        })
      }
    })

    setParticles(newParticles)

    // Animate particles
    let startTime: number | null = null
    const duration = 1500 / animationSpeed

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)

      setParticles(prev =>
        prev.map(p => ({
          ...p,
          progress: Math.min(p.progress + progress, 1),
        }))
      )

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        setParticles([])
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [currentIteration, result, scenario, animationSpeed])

  const handleScenarioChange = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId)
    const newScenario = getScenario(scenarioId)
    if (newScenario) {
      setFunding(newScenario.suggestedFunding)
      setCurrentAccounts(cloneAccounts(newScenario.accounts))
    }
    setResult(null)
    setCurrentIteration(0)
    setAutoPlay(false)
    setParticles([])
    setSelectedAccountId(null)
  }

  const handleDistribute = () => {
    if (!scenario) return

    const accounts = cloneAccounts(scenario.accounts)
    const distributionResult = runDistribution(accounts, funding, {
      verbose: true,
      maxIterations: 100,
      epsilon: 0.01,
    })

    setCurrentAccounts(accounts)
    setResult(distributionResult)
    setCurrentIteration(0)
    setAutoPlay(true)

    console.log('Distribution complete:', distributionResult)
  }

  const handleAddTargetedFunding = () => {
    if (!selectedAccountId) return

    // Add funding to selected account
    const accounts = cloneAccounts(currentAccounts)
    const targetAccount = accounts.find(a => a.id === selectedAccountId)

    if (!targetAccount) return

    targetAccount.balance += targetedAmount

    console.log(`\n💰 Adding $${targetedAmount} to ${targetAccount.name}`)
    console.log(`New balance: $${targetAccount.balance.toFixed(2)}`)

    // Run targeted distribution
    const distributionResult = runTargetedDistribution(accounts, {
      verbose: true,
      maxIterations: 100,
      epsilon: 0.01,
    })

    setCurrentAccounts(accounts)
    setResult(distributionResult)
    setCurrentIteration(0)
    setAutoPlay(true)
  }

  const handleAccountClick = (accountId: string) => {
    if (fundingMode === 'interactive') {
      setSelectedAccountId(accountId)
    }
  }

  const handleReset = () => {
    if (scenario) {
      setCurrentAccounts(cloneAccounts(scenario.accounts))
    }
    setResult(null)
    setCurrentIteration(0)
    setAutoPlay(false)
    setParticles([])
    setSelectedAccountId(null)
  }

  const handleTimelineClick = (iteration: number) => {
    setCurrentIteration(iteration)
    setAutoPlay(false)
  }

  const handleNextStep = () => {
    if (!result || currentIteration >= result.iterations.length - 1) return
    setCurrentIteration(prev => prev + 1)
  }

  const handlePrevStep = () => {
    if (currentIteration <= 0) return
    setCurrentIteration(prev => prev - 1)
  }

  // Get current state for visualization
  const getCurrentBalances = (): Map<string, number> => {
    if (!result) {
      return new Map(currentAccounts.map(a => [a.id, a.balance]))
    }
    return result.iterations[currentIteration]?.balances || result.finalBalances
  }

  const getCurrentOverflows = (): Map<string, number> => {
    if (!result || currentIteration < 0) {
      return new Map()
    }
    return result.iterations[currentIteration]?.overflows || new Map()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Flow Funding Demo
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl">
            {fundingMode === 'interactive'
              ? '💡 Click any account to add funding and watch it propagate through the network'
              : 'Watch resources flow through the network. Thresholds create circulation.'
            }
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel: Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Mode Selector */}
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-semibold mb-4">Funding Mode</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setFundingMode('interactive')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    fundingMode === 'interactive'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  🎯 Interactive
                </button>
                <button
                  onClick={() => setFundingMode('global')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    fundingMode === 'global'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  🌐 Global
                </button>
              </div>
              <p className="mt-3 text-sm text-slate-400">
                {fundingMode === 'interactive'
                  ? 'Click accounts to add funding directly'
                  : 'Distribute funding equally to all accounts'
                }
              </p>
            </div>

            {/* Scenario Selector */}
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-semibold mb-4">Select Scenario</h2>
              <select
                value={selectedScenarioId}
                onChange={e => handleScenarioChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ALL_SCENARIOS.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              {scenario && (
                <p className="mt-4 text-sm text-slate-400">
                  {scenario.description}
                </p>
              )}
            </div>

            {/* Funding Controls */}
            {fundingMode === 'global' ? (
              <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
                <h2 className="text-xl font-semibold mb-4">Global Funding</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">
                      Amount ($)
                    </label>
                    <input
                      type="number"
                      value={funding}
                      onChange={e => setFunding(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="100"
                    />
                  </div>

                  <button
                    onClick={handleDistribute}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-lg transition-all"
                  >
                    Distribute & Animate
                  </button>

                  <button
                    onClick={handleReset}
                    className="w-full bg-slate-600 hover:bg-slate-500 text-white font-semibold py-3 px-6 rounded-lg transition-all"
                  >
                    Reset
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
                <h2 className="text-xl font-semibold mb-4">Interactive Funding</h2>
                <div className="space-y-4">
                  {selectedAccountId ? (
                    <>
                      <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
                        <div className="text-sm text-blue-300 mb-1">
                          Selected Account
                        </div>
                        <div className="text-lg font-bold text-blue-100">
                          {currentAccounts.find(a => a.id === selectedAccountId)?.name}
                        </div>
                        <div className="text-sm text-blue-300 mt-2">
                          Current: ${currentAccounts.find(a => a.id === selectedAccountId)?.balance.toFixed(0)}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-slate-400 mb-2">
                          Amount to Add ($)
                        </label>
                        <input
                          type="number"
                          value={targetedAmount}
                          onChange={e => setTargetedAmount(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                          step="100"
                        />
                      </div>

                      <button
                        onClick={handleAddTargetedFunding}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 px-6 rounded-lg transition-all"
                      >
                        💰 Add Funding & Watch Flow
                      </button>

                      <button
                        onClick={() => setSelectedAccountId(null)}
                        className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition-all"
                      >
                        Deselect
                      </button>
                    </>
                  ) : (
                    <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-6 text-center">
                      <div className="text-4xl mb-3">👆</div>
                      <div className="text-slate-300 font-semibold mb-2">
                        Click an account on the network
                      </div>
                      <div className="text-sm text-slate-400">
                        to add funding and watch it propagate
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleReset}
                    className="w-full bg-slate-600 hover:bg-slate-500 text-white font-semibold py-3 px-6 rounded-lg transition-all"
                  >
                    Reset All Balances
                  </button>
                </div>
              </div>
            )}

            {/* Playback Controls */}
            {result && (
              <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
                <h2 className="text-xl font-semibold mb-4">
                  Playback Controls
                </h2>
                <div className="space-y-4">
                  <div className="text-sm text-slate-400">
                    Iteration {currentIteration + 1} of {result.iterations.length}
                  </div>

                  <button
                    onClick={() => setAutoPlay(!autoPlay)}
                    className={`w-full font-semibold py-2 px-4 rounded-lg transition-all ${
                      autoPlay
                        ? 'bg-yellow-600 hover:bg-yellow-700'
                        : 'bg-green-600 hover:bg-green-700'
                    } text-white`}
                  >
                    {autoPlay ? '⏸ Pause' : '▶ Play'}
                  </button>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">
                      Animation Speed
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 5].map(speed => (
                        <button
                          key={speed}
                          onClick={() => setAnimationSpeed(speed)}
                          className={`flex-1 py-2 px-3 rounded-lg transition-all ${
                            animationSpeed === speed
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handlePrevStep}
                      disabled={currentIteration === 0}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-all"
                    >
                      ← Prev
                    </button>
                    <button
                      onClick={handleNextStep}
                      disabled={
                        currentIteration >= result.iterations.length - 1
                      }
                      className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-all"
                    >
                      Next →
                    </button>
                  </div>

                  {result.converged ? (
                    <div className="text-sm text-green-400 text-center">
                      ✓ Converged in {result.iterationCount} iterations
                    </div>
                  ) : (
                    <div className="text-sm text-yellow-400 text-center">
                      ⚠ Did not converge
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-semibold mb-4">Account States</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <span className="text-slate-300">
                    Below Minimum
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                  <span className="text-slate-300">
                    Sustainable
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span className="text-slate-300">At Maximum</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  <span className="text-slate-300">
                    Overflowing
                  </span>
                </div>
                {fundingMode === 'interactive' && (
                  <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-600">
                    <div className="w-4 h-4 rounded-full bg-purple-500 ring-2 ring-purple-400"></div>
                    <span className="text-slate-300">
                      Selected (click to target)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Visualization */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-8 border border-slate-700">
              <h2 className="text-2xl font-semibold mb-6">Network Visualization</h2>

              {scenario && (
                <NetworkVisualization
                  scenario={scenario}
                  balances={getCurrentBalances()}
                  overflows={getCurrentOverflows()}
                  flows={
                    result?.iterations[currentIteration]?.flows || new Map()
                  }
                  particles={particles}
                  selectedAccountId={selectedAccountId}
                  onAccountClick={handleAccountClick}
                  interactiveMode={fundingMode === 'interactive'}
                />
              )}
            </div>

            {/* Timeline */}
            {result && (
              <div className="mt-8 bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
                <h2 className="text-xl font-semibold mb-4">Distribution Timeline</h2>
                <DistributionTimeline
                  result={result}
                  currentIteration={currentIteration}
                  onIterationClick={handleTimelineClick}
                />
              </div>
            )}

            {/* Results Table */}
            {result && (
              <div className="mt-8 bg-slate-800/50 backdrop-blur rounded-xl p-8 border border-slate-700">
                <h2 className="text-2xl font-semibold mb-6">
                  Distribution Results
                </h2>
                <ResultsTable
                  scenario={scenario!}
                  result={result}
                  currentIteration={currentIteration}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Network Visualization Component with Animated Particles and Click Handlers
 */
function NetworkVisualization({
  scenario,
  balances,
  overflows,
  flows,
  particles,
  selectedAccountId,
  onAccountClick,
  interactiveMode,
}: {
  scenario: Scenario
  balances: Map<string, number>
  overflows: Map<string, number>
  flows: Map<string, number>
  particles: FlowParticle[]
  selectedAccountId: string | null
  onAccountClick: (accountId: string) => void
  interactiveMode: boolean
}) {
  const { accounts, layout } = scenario

  const padding = 80
  const maxX = Math.max(...Array.from(layout.values()).map(p => p.x)) + padding
  const maxY = Math.max(...Array.from(layout.values()).map(p => p.y)) + padding

  return (
    <svg
      width="100%"
      height={maxY}
      viewBox={`0 0 ${maxX} ${maxY}`}
      className="bg-slate-900/50 rounded-lg"
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill="#475569" />
        </marker>
        <marker
          id="arrowhead-active"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill="#60a5fa" />
        </marker>

        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Draw arrows */}
      {accounts.map(account => {
        const sourcePos = layout.get(account.id)
        if (!sourcePos) return null

        return Array.from(account.allocations.entries()).map(
          ([targetId, percentage]) => {
            const targetPos = layout.get(targetId)
            if (!targetPos) return null

            const flowKey = `${account.id}->${targetId}`
            const flowAmount = flows.get(flowKey) || 0
            const isActive = flowAmount > 0

            return (
              <g key={flowKey}>
                <line
                  x1={sourcePos.x}
                  y1={sourcePos.y}
                  x2={targetPos.x}
                  y2={targetPos.y}
                  stroke={isActive ? '#60a5fa' : '#475569'}
                  strokeWidth={isActive ? 3 : 1.5}
                  strokeOpacity={isActive ? 1 : 0.4}
                  markerEnd={`url(#${isActive ? 'arrowhead-active' : 'arrowhead'})`}
                  filter={isActive ? 'url(#glow)' : undefined}
                />
                <text
                  x={(sourcePos.x + targetPos.x) / 2}
                  y={(sourcePos.y + targetPos.y) / 2 - 5}
                  fill="#94a3b8"
                  fontSize="12"
                  textAnchor="middle"
                >
                  {percentage}%
                </text>
                {isActive && (
                  <text
                    x={(sourcePos.x + targetPos.x) / 2}
                    y={(sourcePos.y + targetPos.y) / 2 + 15}
                    fill="#60a5fa"
                    fontSize="12"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    ${flowAmount.toFixed(0)}
                  </text>
                )}
              </g>
            )
          }
        )
      })}

      {/* Draw animated particles */}
      {particles.map(particle => {
        const x = particle.fromX + (particle.toX - particle.fromX) * particle.progress
        const y = particle.fromY + (particle.toY - particle.fromY) * particle.progress
        const size = Math.max(4, Math.min(8, particle.amount / 50))

        return (
          <circle
            key={particle.id}
            cx={x}
            cy={y}
            r={size}
            fill={particle.color}
            opacity={0.8}
            filter="url(#glow)"
          />
        )
      })}

      {/* Draw accounts */}
      {accounts.map(account => {
        const pos = layout.get(account.id)
        if (!pos) return null

        const balance = balances.get(account.id) || account.balance
        const overflow = overflows.get(account.id) || 0
        const state = getAccountState(
          balance,
          account.minThreshold,
          account.maxThreshold,
          overflow > 0
        )

        const isSelected = selectedAccountId === account.id

        const stateColors = {
          'below-minimum': '#ef4444',
          sustainable: '#eab308',
          'at-maximum': '#22c55e',
          overflowing: '#3b82f6',
        }

        const color = isSelected ? '#a855f7' : stateColors[state]

        return (
          <g
            key={account.id}
            onClick={() => onAccountClick(account.id)}
            style={{ cursor: interactiveMode ? 'pointer' : 'default' }}
          >
            {/* Selection ring */}
            {isSelected && (
              <circle
                cx={pos.x}
                cy={pos.y}
                r={48}
                fill="none"
                stroke="#a855f7"
                strokeWidth={3}
                opacity={0.6}
              >
                <animate
                  attributeName="r"
                  values="48;52;48"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>
            )}

            {/* Account circle */}
            <circle
              cx={pos.x}
              cy={pos.y}
              r={40}
              fill={color}
              fillOpacity={0.2}
              stroke={color}
              strokeWidth={isSelected ? 4 : 3}
            />

            {/* Account name */}
            <text
              x={pos.x}
              y={pos.y - 5}
              fill="white"
              fontSize="14"
              fontWeight="bold"
              textAnchor="middle"
            >
              {account.name}
            </text>

            {/* Balance */}
            <text
              x={pos.x}
              y={pos.y + 10}
              fill="white"
              fontSize="12"
              textAnchor="middle"
            >
              ${balance.toFixed(0)}
            </text>

            {/* Thresholds */}
            <text
              x={pos.x}
              y={pos.y + 25}
              fill="#94a3b8"
              fontSize="10"
              textAnchor="middle"
            >
              ({account.minThreshold}–{account.maxThreshold})
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/**
 * Distribution Timeline Component
 */
function DistributionTimeline({
  result,
  currentIteration,
  onIterationClick,
}: {
  result: DistributionResult
  currentIteration: number
  onIterationClick: (iteration: number) => void
}) {
  const maxOverflow = Math.max(
    ...result.iterations.map(iter => iter.totalOverflow),
    1
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>Click any iteration to jump to that state</span>
        <span>
          Total overflow decreases over time →
        </span>
      </div>

      <div className="relative h-16 bg-slate-900/50 rounded-lg p-4">
        <div className="absolute inset-0 flex items-center justify-between px-4">
          {result.iterations.map((iter, index) => {
            const isCurrent = index === currentIteration
            const dotSize = Math.max(
              8,
              Math.min(20, (iter.totalOverflow / maxOverflow) * 20)
            )

            return (
              <button
                key={index}
                onClick={() => onIterationClick(index)}
                className="relative transition-transform hover:scale-125"
                title={`Iteration ${index + 1}: $${iter.totalOverflow.toFixed(2)} overflow`}
              >
                <div
                  className={`rounded-full transition-all ${
                    isCurrent
                      ? 'bg-blue-500 ring-4 ring-blue-400/50'
                      : iter.totalOverflow > 0.01
                      ? 'bg-yellow-500 hover:bg-yellow-400'
                      : 'bg-green-500 hover:bg-green-400'
                  }`}
                  style={{
                    width: `${dotSize}px`,
                    height: `${dotSize}px`,
                  }}
                />
                {isCurrent && (
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-blue-400 whitespace-nowrap">
                    {index + 1}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="text-slate-400">
          <span className="text-slate-300 font-semibold">Start:</span>{' '}
          ${result.iterations[0]?.totalOverflow.toFixed(2)}
        </div>
        <div className="text-slate-400 text-center">
          <span className="text-slate-300 font-semibold">Current:</span>{' '}
          ${result.iterations[currentIteration]?.totalOverflow.toFixed(2) || '0.00'}
        </div>
        <div className="text-slate-400 text-right">
          <span className="text-slate-300 font-semibold">End:</span>{' '}
          ${result.iterations[result.iterations.length - 1]?.totalOverflow.toFixed(2)}
        </div>
      </div>
    </div>
  )
}

/**
 * Results Table Component
 */
function ResultsTable({
  scenario,
  result,
  currentIteration,
}: {
  scenario: Scenario
  result: DistributionResult
  currentIteration: number
}) {
  const iteration = result.iterations[currentIteration]
  const balances = iteration?.balances || result.finalBalances

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left py-3 px-4 text-slate-400 font-semibold">
              Account
            </th>
            <th className="text-right py-3 px-4 text-slate-400 font-semibold">
              Initial
            </th>
            <th className="text-right py-3 px-4 text-slate-400 font-semibold">
              Current
            </th>
            <th className="text-right py-3 px-4 text-slate-400 font-semibold">
              Change
            </th>
            <th className="text-right py-3 px-4 text-slate-400 font-semibold">
              Min/Max
            </th>
            <th className="text-left py-3 px-4 text-slate-400 font-semibold">
              State
            </th>
          </tr>
        </thead>
        <tbody>
          {scenario.accounts.map(account => {
            const initial = result.initialBalances.get(account.id) || 0
            const current = balances.get(account.id) || 0
            const change = current - initial
            const overflow = iteration?.overflows.get(account.id) || 0
            const state = getAccountState(
              current,
              account.minThreshold,
              account.maxThreshold,
              overflow > 0
            )

            const stateLabels = {
              'below-minimum': 'Below Min',
              sustainable: 'Sustainable',
              'at-maximum': 'At Max',
              overflowing: 'Overflowing',
            }

            const stateColors = {
              'below-minimum': 'text-red-400',
              sustainable: 'text-yellow-400',
              'at-maximum': 'text-green-400',
              overflowing: 'text-blue-400',
            }

            return (
              <tr
                key={account.id}
                className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
              >
                <td className="py-3 px-4 font-medium">{account.name}</td>
                <td className="py-3 px-4 text-right text-slate-400">
                  ${initial.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-right font-semibold">
                  ${current.toFixed(2)}
                </td>
                <td
                  className={`py-3 px-4 text-right font-semibold ${
                    change >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {change >= 0 ? '+' : ''}${change.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-right text-slate-400 text-xs">
                  ${account.minThreshold} / ${account.maxThreshold}
                </td>
                <td className={`py-3 px-4 ${stateColors[state]}`}>
                  {stateLabels[state]}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
