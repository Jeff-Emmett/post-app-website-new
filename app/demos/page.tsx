'use client'

import { useState } from 'react'

interface Demo {
  number: number
  title: string
  description: string
  path: string
  type: string
  status: 'complete' | 'beta' | 'prototype'
  features: string[]
  milestone?: string
  screenshot?: string
}

const demos: Record<string, Demo[]> = {
  tbff: [
    {
      number: 1,
      title: 'Threshold-Based Flow Funding (Interactive)',
      description: 'Complete interactive demo with Milestones 1-3: Static visualization, interactive allocations, and initial distribution algorithm. Create accounts, draw allocation arrows, add funding, and watch resources flow.',
      path: '/tbff',
      type: 'Interactive Simulation',
      status: 'complete',
      milestone: 'Milestones 1-3 Complete',
      screenshot: '/screenshots/tbff.png',
      features: [
        'Visual threshold-based coloring',
        'Interactive allocation creation',
        'Automatic normalization',
        'Initial distribution algorithm',
        'Multiple sample networks',
        'Real-time balance updates'
      ]
    },
    {
      number: 2,
      title: 'TBFF Flow Simulation',
      description: 'Alternative implementation exploring continuous flow dynamics with progressive outflow ratios.',
      path: '/tbff-flow',
      type: 'Flow Simulation',
      status: 'beta',
      screenshot: '/screenshots/tbff-flow.png',
      features: [
        'Continuous flow mechanics',
        'Progressive outflow',
        'Network equilibrium',
        'Visual flow indicators'
      ]
    }
  ],
  flowV2: [
    {
      number: 3,
      title: 'Flow Funding V2: Continuous Flow Dynamics',
      description: 'Redesigned as continuous per-second flow simulation with per-month UI. Features progressive outflow formula ensuring monotonic increase in sharing as accounts approach "enough".',
      path: '/flow-v2',
      type: 'Continuous Flow',
      status: 'complete',
      screenshot: '/screenshots/flow-v2.png',
      features: [
        'Per-second simulation engine',
        'Progressive outflow formula (fixed)',
        'Network overflow node',
        'Smooth 60 FPS rendering',
        'Animated flow particles',
        'Time-scale architecture'
      ]
    }
  ],
  canvas: [
    {
      number: 4,
      title: 'Italism: Interactive Canvas with Propagators',
      description: 'Original canvas demo with live propagators. Draw shapes, connect them with arrows, and watch data flow through the network. Foundation for malleable software vision.',
      path: '/italism',
      type: 'Live Programming Canvas',
      status: 'complete',
      screenshot: '/screenshots/italism.png',
      features: [
        'Live arrow propagators',
        'Shape drawing and editing',
        'Expression-based connections',
        'Undo/redo functionality',
        'Real-time data flow',
        'FolkJS-inspired architecture'
      ]
    }
  ],
  prototypes: [
    {
      number: 5,
      title: 'Flow Funding (Original)',
      description: 'Earlier prototype exploring initial flow funding concepts.',
      path: '/flowfunding',
      type: 'Prototype',
      status: 'prototype',
      screenshot: '/screenshots/flowfunding.png',
      features: [
        'Basic flow mechanics',
        'Threshold visualization',
        'Network simulation'
      ]
    }
  ]
}

export default function DemosPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  const allDemos = Object.values(demos).flat()
  const totalDemos = allDemos.length
  const completeDemos = allDemos.filter(d => d.status === 'complete').length
  const betaDemos = allDemos.filter(d => d.status === 'beta').length

  const categories = [
    { id: 'all', label: 'All Demos', count: totalDemos },
    { id: 'tbff', label: 'TBFF Interactive', count: demos.tbff.length, icon: '🎯' },
    { id: 'flowV2', label: 'Flow Dynamics V2', count: demos.flowV2.length, icon: '🌊' },
    { id: 'canvas', label: 'Interactive Canvas', count: demos.canvas.length, icon: '🎨' },
    { id: 'prototypes', label: 'Prototypes', count: demos.prototypes.length, icon: '🔬' }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-500'
      case 'beta': return 'bg-yellow-500'
      case 'prototype': return 'bg-gray-500'
      default: return 'bg-gray-400'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'complete': return 'Complete'
      case 'beta': return 'Beta'
      case 'prototype': return 'Prototype'
      default: return status
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-lg rounded-3xl p-8 mb-10 shadow-2xl">
          <div className="text-center">
            <h1 className="text-5xl font-extrabold mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              💧 Flow Funding Demos
            </h1>
            <p className="text-xl text-gray-600 mb-4">
              Exploring Threshold-Based Resource Allocation & Post-Appitalism
            </p>
            <p className="text-gray-500 text-sm max-w-3xl mx-auto">
              Interactive demonstrations of flow funding mechanisms, from threshold-based redistribution to continuous flow dynamics.
              Experience economics as living, breathing systems.
            </p>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {totalDemos}
            </div>
            <div className="text-gray-600 text-sm uppercase tracking-wider mt-2">Total Demos</div>
          </div>
          <div className="bg-white rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {completeDemos}
            </div>
            <div className="text-gray-600 text-sm uppercase tracking-wider mt-2">Complete</div>
          </div>
          <div className="bg-white rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
              {betaDemos}
            </div>
            <div className="text-gray-600 text-sm uppercase tracking-wider mt-2">Beta</div>
          </div>
          <div className="bg-white rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              3
            </div>
            <div className="text-gray-600 text-sm uppercase tracking-wider mt-2">Categories</div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg">
          <div className="mb-6">
            <input
              type="text"
              placeholder="🔍 Search demos by name, type, or feature..."
              className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl text-lg focus:outline-none focus:border-purple-500 transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.id)}
                className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all ${
                  activeFilter === cat.id
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.icon && <span className="mr-2">{cat.icon}</span>}
                {cat.label} <span className="ml-1 opacity-75">({cat.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Demo Categories */}
        {Object.entries(demos).map(([categoryKey, categoryDemos]) => {
          if (activeFilter !== 'all' && activeFilter !== categoryKey) return null

          const categoryInfo = {
            tbff: { title: 'Threshold-Based Flow Funding', icon: '🎯', desc: 'Interactive demos with allocation creation and distribution algorithms' },
            flowV2: { title: 'Flow Dynamics V2', icon: '🌊', desc: 'Continuous per-second flow simulation with progressive outflow' },
            canvas: { title: 'Interactive Canvas', icon: '🎨', desc: 'Live programming environment with propagator networks' },
            prototypes: { title: 'Early Prototypes', icon: '🔬', desc: 'Initial explorations and concept validation' }
          }[categoryKey] || { title: categoryKey, icon: '📁', desc: '' }

          return (
            <div key={categoryKey} className="mb-12">
              <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-3xl shadow-lg">
                    {categoryInfo.icon}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-800">{categoryInfo.title}</h2>
                    <p className="text-gray-600 text-sm">{categoryInfo.desc}</p>
                  </div>
                  <div className="bg-gray-100 px-4 py-2 rounded-full font-semibold text-purple-600">
                    {categoryDemos.length} {categoryDemos.length === 1 ? 'demo' : 'demos'}
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {categoryDemos
                  .filter(demo => {
                    if (!searchTerm) return true
                    const searchLower = searchTerm.toLowerCase()
                    return (
                      demo.title.toLowerCase().includes(searchLower) ||
                      demo.description.toLowerCase().includes(searchLower) ||
                      demo.type.toLowerCase().includes(searchLower) ||
                      demo.features.some(f => f.toLowerCase().includes(searchLower))
                    )
                  })
                  .map(demo => (
                    <a
                      key={demo.number}
                      href={demo.path}
                      className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2"
                    >
                      {/* Screenshot Preview */}
                      {demo.screenshot && (
                        <div className="relative h-48 bg-gradient-to-br from-purple-100 to-blue-100 overflow-hidden">
                          <img
                            src={demo.screenshot}
                            alt={`${demo.title} screenshot`}
                            className="w-full h-full object-cover object-top transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <span className="bg-white text-purple-600 px-4 py-2 rounded-full font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                              👁️ Click to view
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Card Header */}
                      <div className="h-4 bg-gradient-to-r from-purple-500 to-blue-500"></div>

                      {/* Card Content */}
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <span className="inline-block bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                            #{demo.number}
                          </span>
                          <span className={`inline-block ${getStatusColor(demo.status)} text-white px-3 py-1 rounded-full text-xs font-bold`}>
                            {getStatusLabel(demo.status)}
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors">
                          {demo.title}
                        </h3>

                        {demo.milestone && (
                          <div className="mb-3 inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                            ✅ {demo.milestone}
                          </div>
                        )}

                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {demo.description}
                        </p>

                        <div className="mb-4">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            Key Features:
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {demo.features.slice(0, 3).map((feature, idx) => (
                              <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {feature}
                              </span>
                            ))}
                            {demo.features.length > 3 && (
                              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
                                +{demo.features.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <span className="text-xs text-gray-500 font-medium">{demo.type}</span>
                          <span className="text-purple-600 font-semibold text-sm group-hover:gap-2 flex items-center gap-1 transition-all">
                            Launch Demo →
                          </span>
                        </div>
                      </div>
                    </a>
                  ))}
              </div>
            </div>
          )
        })}

        {/* Footer */}
        <footer className="bg-white/95 backdrop-blur-lg rounded-3xl p-8 mt-12 shadow-xl text-center">
          <p className="text-gray-800 font-semibold mb-2">Flow Funding Demos - Post-Appitalism Project</p>
          <p className="text-gray-600 text-sm mb-4">
            Exploring threshold-based resource allocation and continuous flow dynamics
          </p>
          <div className="flex justify-center gap-6 text-sm">
            <a href="/" className="text-purple-600 font-semibold hover:underline">
              📖 Project Home
            </a>
            <span className="text-gray-400">•</span>
            <a href="/italism" className="text-purple-600 font-semibold hover:underline">
              🎨 Interactive Canvas
            </a>
            <span className="text-gray-400">•</span>
            <a href="/tbff" className="text-purple-600 font-semibold hover:underline">
              🎯 TBFF Demo
            </a>
          </div>
        </footer>
      </div>
    </div>
  )
}
