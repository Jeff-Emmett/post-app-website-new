/**
 * Flow Funding V2 - Preset Scenarios
 *
 * Demonstrates various network topologies with continuous flow dynamics
 */

import type { FlowNode, ScenarioV2 } from './types'

/**
 * Scenario 1: Linear Chain
 * A → B → C → D
 *
 * Demonstrates cascading progressive flow
 */
export const linearChainV2: ScenarioV2 = {
  id: 'linear-chain-v2',
  name: 'Linear Chain',
  description:
    'A simple chain showing progressive flow from left to right. ' +
    'Watch how funding to A cascades through the network as each node ' +
    'enters different flow zones.',
  suggestedTotalInflow: 1200,
  nodes: [
    {
      id: 'A',
      name: 'Alice',
      externalInflow: 800,
      minThreshold: 200,
      maxThreshold: 500,
      allocations: new Map([['B', 100]]),
    },
    {
      id: 'B',
      name: 'Bob',
      externalInflow: 0,
      minThreshold: 300,
      maxThreshold: 600,
      allocations: new Map([['C', 100]]),
    },
    {
      id: 'C',
      name: 'Carol',
      externalInflow: 0,
      minThreshold: 200,
      maxThreshold: 500,
      allocations: new Map([['D', 100]]),
    },
    {
      id: 'D',
      name: 'David',
      externalInflow: 0,
      minThreshold: 400,
      maxThreshold: 800,
      allocations: new Map(),
    },
  ],
  layout: new Map([
    ['A', { x: 100, y: 300 }],
    ['B', { x: 280, y: 300 }],
    ['C', { x: 460, y: 300 }],
    ['D', { x: 640, y: 300 }],
  ]),
}

/**
 * Scenario 2: Mutual Aid Circle
 * A ↔ B ↔ C ↔ A
 *
 * Demonstrates circular solidarity and dynamic equilibrium
 */
export const mutualAidCircleV2: ScenarioV2 = {
  id: 'mutual-aid-circle-v2',
  name: 'Mutual Aid Circle',
  description:
    'Three people in a circular mutual aid network. Each person shares ' +
    'their overflow with the next person, creating a self-balancing system. ' +
    'Adjust inflows to see how the network finds equilibrium.',
  suggestedTotalInflow: 1500,
  nodes: [
    {
      id: 'A',
      name: 'Alice',
      externalInflow: 500,
      minThreshold: 300,
      maxThreshold: 600,
      allocations: new Map([['B', 100]]),
    },
    {
      id: 'B',
      name: 'Bob',
      externalInflow: 500,
      minThreshold: 300,
      maxThreshold: 600,
      allocations: new Map([['C', 100]]),
    },
    {
      id: 'C',
      name: 'Carol',
      externalInflow: 500,
      minThreshold: 300,
      maxThreshold: 600,
      allocations: new Map([['A', 100]]),
    },
  ],
  layout: new Map([
    ['A', { x: 370, y: 150 }],
    ['B', { x: 520, y: 380 }],
    ['C', { x: 220, y: 380 }],
  ]),
}

/**
 * Scenario 3: Hub and Spoke
 * Center → {A, B, C, D}
 *
 * Demonstrates redistribution from a central fund
 */
export const hubAndSpokeV2: ScenarioV2 = {
  id: 'hub-and-spoke-v2',
  name: 'Hub and Spoke',
  description:
    'A central redistribution hub that shares overflow evenly to four ' +
    'peripheral accounts. Models a community fund or mutual aid pool. ' +
    'Try adjusting the hub\'s external funding.',
  suggestedTotalInflow: 2000,
  nodes: [
    {
      id: 'Hub',
      name: 'Community Fund',
      externalInflow: 2000,
      minThreshold: 200,
      maxThreshold: 500,
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
      externalInflow: 0,
      minThreshold: 400,
      maxThreshold: 800,
      allocations: new Map(),
    },
    {
      id: 'B',
      name: 'Bob',
      externalInflow: 0,
      minThreshold: 500,
      maxThreshold: 1000,
      allocations: new Map(),
    },
    {
      id: 'C',
      name: 'Carol',
      externalInflow: 0,
      minThreshold: 300,
      maxThreshold: 700,
      allocations: new Map(),
    },
    {
      id: 'D',
      name: 'David',
      externalInflow: 0,
      minThreshold: 400,
      maxThreshold: 800,
      allocations: new Map(),
    },
  ],
  layout: new Map([
    ['Hub', { x: 370, y: 300 }],
    ['A', { x: 370, y: 120 }],
    ['B', { x: 580, y: 300 }],
    ['C', { x: 370, y: 480 }],
    ['D', { x: 160, y: 300 }],
  ]),
}

/**
 * Scenario 4: Complex Network
 * Multi-hop redistribution with various strategies
 */
export const complexNetworkV2: ScenarioV2 = {
  id: 'complex-network-v2',
  name: 'Complex Network',
  description:
    'A realistic network with 8 accounts showing various allocation strategies: ' +
    'some split overflow evenly, others prioritize specific recipients. ' +
    'Watch emergent flow patterns and steady-state behavior.',
  suggestedTotalInflow: 5000,
  nodes: [
    {
      id: 'A',
      name: 'Alice',
      externalInflow: 1200,
      minThreshold: 500,
      maxThreshold: 1000,
      allocations: new Map([
        ['B', 50],
        ['C', 50],
      ]),
    },
    {
      id: 'B',
      name: 'Bob',
      externalInflow: 800,
      minThreshold: 400,
      maxThreshold: 800,
      allocations: new Map([
        ['D', 30],
        ['E', 70],
      ]),
    },
    {
      id: 'C',
      name: 'Carol',
      externalInflow: 600,
      minThreshold: 300,
      maxThreshold: 700,
      allocations: new Map([['F', 100]]),
    },
    {
      id: 'D',
      name: 'David',
      externalInflow: 1000,
      minThreshold: 500,
      maxThreshold: 900,
      allocations: new Map([
        ['G', 40],
        ['H', 60],
      ]),
    },
    {
      id: 'E',
      name: 'Eve',
      externalInflow: 400,
      minThreshold: 400,
      maxThreshold: 800,
      allocations: new Map([
        ['F', 50],
        ['G', 50],
      ]),
    },
    {
      id: 'F',
      name: 'Frank',
      externalInflow: 500,
      minThreshold: 300,
      maxThreshold: 600,
      allocations: new Map([['H', 100]]),
    },
    {
      id: 'G',
      name: 'Grace',
      externalInflow: 300,
      minThreshold: 500,
      maxThreshold: 1000,
      allocations: new Map([
        ['A', 30],
        ['H', 70],
      ]),
    },
    {
      id: 'H',
      name: 'Henry',
      externalInflow: 200,
      minThreshold: 600,
      maxThreshold: 1200,
      allocations: new Map([
        ['A', 20],
        ['E', 80],
      ]),
    },
  ],
  layout: new Map([
    ['A', { x: 150, y: 150 }],
    ['B', { x: 380, y: 100 }],
    ['C', { x: 380, y: 200 }],
    ['D', { x: 610, y: 150 }],
    ['E', { x: 610, y: 350 }],
    ['F', { x: 380, y: 400 }],
    ['G', { x: 150, y: 400 }],
    ['H', { x: 150, y: 550 }],
  ]),
}

/**
 * Scenario 5: Worker Cooperative
 * Models a worker coop with shared risk pool
 */
export const workerCoopV2: ScenarioV2 = {
  id: 'worker-coop-v2',
  name: 'Worker Cooperative',
  description:
    'Five workers in a cooperative. Each worker\'s overflow goes partly to a shared ' +
    'risk pool and partly to supporting other workers, creating solidarity and resilience. ' +
    'The pool redistributes evenly to all workers.',
  suggestedTotalInflow: 3000,
  nodes: [
    {
      id: 'Pool',
      name: 'Risk Pool',
      externalInflow: 1000,
      minThreshold: 1500,
      maxThreshold: 3000,
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
      externalInflow: 400,
      minThreshold: 500,
      maxThreshold: 800,
      allocations: new Map([
        ['Pool', 50],
        ['W2', 50],
      ]),
    },
    {
      id: 'W2',
      name: 'Worker 2',
      externalInflow: 400,
      minThreshold: 500,
      maxThreshold: 800,
      allocations: new Map([
        ['Pool', 50],
        ['W3', 50],
      ]),
    },
    {
      id: 'W3',
      name: 'Worker 3',
      externalInflow: 400,
      minThreshold: 500,
      maxThreshold: 800,
      allocations: new Map([
        ['Pool', 50],
        ['W4', 50],
      ]),
    },
    {
      id: 'W4',
      name: 'Worker 4',
      externalInflow: 400,
      minThreshold: 500,
      maxThreshold: 800,
      allocations: new Map([
        ['Pool', 50],
        ['W5', 50],
      ]),
    },
    {
      id: 'W5',
      name: 'Worker 5',
      externalInflow: 400,
      minThreshold: 500,
      maxThreshold: 800,
      allocations: new Map([
        ['Pool', 50],
        ['W1', 50],
      ]),
    },
  ],
  layout: new Map([
    ['Pool', { x: 370, y: 300 }],
    ['W1', { x: 370, y: 120 }],
    ['W2', { x: 570, y: 210 }],
    ['W3', { x: 570, y: 390 }],
    ['W4', { x: 370, y: 480 }],
    ['W5', { x: 170, y: 390 }],
  ]),
}

/**
 * All available scenarios
 */
export const ALL_SCENARIOS_V2: ScenarioV2[] = [
  linearChainV2,
  mutualAidCircleV2,
  hubAndSpokeV2,
  complexNetworkV2,
  workerCoopV2,
]

/**
 * Get scenario by ID
 */
export function getScenarioV2(id: string): ScenarioV2 | undefined {
  return ALL_SCENARIOS_V2.find(s => s.id === id)
}
