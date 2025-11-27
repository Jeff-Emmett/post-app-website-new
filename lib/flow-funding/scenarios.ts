/**
 * Preset Flow Funding Scenarios
 *
 * Each scenario demonstrates different network topologies and flow patterns
 */

import type { Account } from './types'

export interface Scenario {
  id: string
  name: string
  description: string
  accounts: Account[]
  suggestedFunding: number
  /** Visual layout positions for rendering (x, y in pixels) */
  layout: Map<string, { x: number; y: number }>
}

/**
 * Scenario 1: Linear Chain
 * A → B → C → D
 *
 * Demonstrates simple cascading flow
 */
export const linearChain: Scenario = {
  id: 'linear-chain',
  name: 'Linear Chain',
  description:
    'A simple chain showing funds flowing from left to right. ' +
    'Overflow from each account flows to the next in line.',
  suggestedFunding: 1000,
  accounts: [
    {
      id: 'A',
      name: 'Alice',
      balance: 0,
      minThreshold: 100,
      maxThreshold: 300,
      allocations: new Map([['B', 100]]),
    },
    {
      id: 'B',
      name: 'Bob',
      balance: 0,
      minThreshold: 150,
      maxThreshold: 350,
      allocations: new Map([['C', 100]]),
    },
    {
      id: 'C',
      name: 'Carol',
      balance: 0,
      minThreshold: 100,
      maxThreshold: 300,
      allocations: new Map([['D', 100]]),
    },
    {
      id: 'D',
      name: 'David',
      balance: 0,
      minThreshold: 200,
      maxThreshold: 400,
      allocations: new Map(), // End of chain
    },
  ],
  layout: new Map([
    ['A', { x: 100, y: 250 }],
    ['B', { x: 250, y: 250 }],
    ['C', { x: 400, y: 250 }],
    ['D', { x: 550, y: 250 }],
  ]),
}

/**
 * Scenario 2: Mutual Aid Circle
 * A ↔ B ↔ C ↔ A
 *
 * Demonstrates circular solidarity and equilibrium
 */
export const mutualAidCircle: Scenario = {
  id: 'mutual-aid-circle',
  name: 'Mutual Aid Circle',
  description:
    'Three people in a circular mutual aid network. Each person allocates their ' +
    'overflow to help the next person in the circle, creating a self-balancing system.',
  suggestedFunding: 1500,
  accounts: [
    {
      id: 'A',
      name: 'Alice',
      balance: 0,
      minThreshold: 200,
      maxThreshold: 400,
      allocations: new Map([['B', 100]]),
    },
    {
      id: 'B',
      name: 'Bob',
      balance: 0,
      minThreshold: 200,
      maxThreshold: 400,
      allocations: new Map([['C', 100]]),
    },
    {
      id: 'C',
      name: 'Carol',
      balance: 0,
      minThreshold: 200,
      maxThreshold: 400,
      allocations: new Map([['A', 100]]),
    },
  ],
  layout: new Map([
    ['A', { x: 325, y: 150 }],
    ['B', { x: 475, y: 320 }],
    ['C', { x: 175, y: 320 }],
  ]),
}

/**
 * Scenario 3: Hub and Spoke
 * Center → {A, B, C, D}
 *
 * Demonstrates redistribution from a central fund
 */
export const hubAndSpoke: Scenario = {
  id: 'hub-and-spoke',
  name: 'Hub and Spoke',
  description:
    'A central redistribution hub that allocates overflow evenly to four ' +
    'peripheral accounts. Models a community fund or mutual aid pool.',
  suggestedFunding: 2000,
  accounts: [
    {
      id: 'Hub',
      name: 'Community Fund',
      balance: 0,
      minThreshold: 100,
      maxThreshold: 300,
      allocations: new Map([
        ['A', 25],
        ['B', 25],
        ['C', 25],
        ['D', 25],
      ]),
    },
    {
      id: 'A',
      name: 'Alice',
      balance: 0,
      minThreshold: 200,
      maxThreshold: 500,
      allocations: new Map(), // Could flow back to hub
    },
    {
      id: 'B',
      name: 'Bob',
      balance: 0,
      minThreshold: 250,
      maxThreshold: 550,
      allocations: new Map(),
    },
    {
      id: 'C',
      name: 'Carol',
      balance: 0,
      minThreshold: 150,
      maxThreshold: 450,
      allocations: new Map(),
    },
    {
      id: 'D',
      name: 'David',
      balance: 0,
      minThreshold: 200,
      maxThreshold: 500,
      allocations: new Map(),
    },
  ],
  layout: new Map([
    ['Hub', { x: 325, y: 250 }],
    ['A', { x: 325, y: 100 }],
    ['B', { x: 525, y: 250 }],
    ['C', { x: 325, y: 400 }],
    ['D', { x: 125, y: 250 }],
  ]),
}

/**
 * Scenario 4: Complex Network
 * Multi-hop redistribution with various allocation strategies
 */
export const complexNetwork: Scenario = {
  id: 'complex-network',
  name: 'Complex Network',
  description:
    'A realistic network with 8 accounts showing various allocation strategies: ' +
    'some split overflow evenly, others prioritize specific recipients. ' +
    'Demonstrates emergence of flow patterns.',
  suggestedFunding: 5000,
  accounts: [
    {
      id: 'A',
      name: 'Alice',
      balance: 100,
      minThreshold: 300,
      maxThreshold: 600,
      allocations: new Map([
        ['B', 50],
        ['C', 50],
      ]),
    },
    {
      id: 'B',
      name: 'Bob',
      balance: 50,
      minThreshold: 250,
      maxThreshold: 500,
      allocations: new Map([
        ['D', 30],
        ['E', 70],
      ]),
    },
    {
      id: 'C',
      name: 'Carol',
      balance: 0,
      minThreshold: 200,
      maxThreshold: 450,
      allocations: new Map([
        ['F', 100],
      ]),
    },
    {
      id: 'D',
      name: 'David',
      balance: 200,
      minThreshold: 300,
      maxThreshold: 550,
      allocations: new Map([
        ['G', 40],
        ['H', 60],
      ]),
    },
    {
      id: 'E',
      name: 'Eve',
      balance: 0,
      minThreshold: 250,
      maxThreshold: 500,
      allocations: new Map([
        ['F', 50],
        ['G', 50],
      ]),
    },
    {
      id: 'F',
      name: 'Frank',
      balance: 150,
      minThreshold: 200,
      maxThreshold: 400,
      allocations: new Map([
        ['H', 100],
      ]),
    },
    {
      id: 'G',
      name: 'Grace',
      balance: 0,
      minThreshold: 300,
      maxThreshold: 600,
      allocations: new Map([
        ['A', 30],
        ['H', 70],
      ]),
    },
    {
      id: 'H',
      name: 'Henry',
      balance: 50,
      minThreshold: 350,
      maxThreshold: 700,
      allocations: new Map([
        ['A', 20],
        ['E', 80],
      ]),
    },
  ],
  layout: new Map([
    ['A', { x: 150, y: 150 }],
    ['B', { x: 350, y: 100 }],
    ['C', { x: 350, y: 200 }],
    ['D', { x: 550, y: 150 }],
    ['E', { x: 550, y: 300 }],
    ['F', { x: 350, y: 350 }],
    ['G', { x: 150, y: 350 }],
    ['H', { x: 150, y: 500 }],
  ]),
}

/**
 * Scenario 5: Worker Cooperative
 * Models a worker coop with shared risk pool
 */
export const workerCoop: Scenario = {
  id: 'worker-coop',
  name: 'Worker Cooperative',
  description:
    'Five workers in a cooperative. Each worker\'s overflow goes partly to a shared ' +
    'risk pool and partly to supporting other workers, creating solidarity and resilience.',
  suggestedFunding: 3000,
  accounts: [
    {
      id: 'Pool',
      name: 'Risk Pool',
      balance: 500,
      minThreshold: 1000,
      maxThreshold: 2000,
      allocations: new Map([
        ['W1', 20],
        ['W2', 20],
        ['W3', 20],
        ['W4', 20],
        ['W5', 20],
      ]),
    },
    {
      id: 'W1',
      name: 'Worker 1',
      balance: 0,
      minThreshold: 300,
      maxThreshold: 500,
      allocations: new Map([
        ['Pool', 50],
        ['W2', 50],
      ]),
    },
    {
      id: 'W2',
      name: 'Worker 2',
      balance: 0,
      minThreshold: 300,
      maxThreshold: 500,
      allocations: new Map([
        ['Pool', 50],
        ['W3', 50],
      ]),
    },
    {
      id: 'W3',
      name: 'Worker 3',
      balance: 0,
      minThreshold: 300,
      maxThreshold: 500,
      allocations: new Map([
        ['Pool', 50],
        ['W4', 50],
      ]),
    },
    {
      id: 'W4',
      name: 'Worker 4',
      balance: 0,
      minThreshold: 300,
      maxThreshold: 500,
      allocations: new Map([
        ['Pool', 50],
        ['W5', 50],
      ]),
    },
    {
      id: 'W5',
      name: 'Worker 5',
      balance: 0,
      minThreshold: 300,
      maxThreshold: 500,
      allocations: new Map([
        ['Pool', 50],
        ['W1', 50],
      ]),
    },
  ],
  layout: new Map([
    ['Pool', { x: 325, y: 250 }],
    ['W1', { x: 325, y: 100 }],
    ['W2', { x: 510, y: 175 }],
    ['W3', { x: 510, y: 325 }],
    ['W4', { x: 325, y: 400 }],
    ['W5', { x: 140, y: 325 }],
  ]),
}

/**
 * All available scenarios
 */
export const ALL_SCENARIOS: Scenario[] = [
  linearChain,
  mutualAidCircle,
  hubAndSpoke,
  complexNetwork,
  workerCoop,
]

/**
 * Get scenario by ID
 */
export function getScenario(id: string): Scenario | undefined {
  return ALL_SCENARIOS.find(s => s.id === id)
}
