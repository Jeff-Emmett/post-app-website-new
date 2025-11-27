/**
 * Sample flow networks for demonstration
 */

import type { FlowNetwork, FlowNode } from './types'
import { updateFlowNodeProperties, calculateFlowNetworkTotals } from './utils'

/**
 * Create a simple linear flow: A → B → C
 * Flow enters A, passes through to C
 */
export function createLinearFlowNetwork(): FlowNetwork {
  const nodes: FlowNode[] = [
    {
      id: 'alice',
      name: 'Alice',
      x: 100,
      y: 200,
      width: 120,
      height: 100,
      minAbsorption: 10,
      maxAbsorption: 50,
      inflow: 100, // Start with 100 flow
      absorbed: 0,
      outflow: 0,
      status: 'healthy',
      externalFlow: 100,
      isOverflowSink: false,
    },
    {
      id: 'bob',
      name: 'Bob',
      x: 300,
      y: 200,
      width: 120,
      height: 100,
      minAbsorption: 10,
      maxAbsorption: 30,
      inflow: 0,
      absorbed: 0,
      outflow: 0,
      status: 'starved',
      externalFlow: 0,
      isOverflowSink: false,
    },
    {
      id: 'carol',
      name: 'Carol',
      x: 500,
      y: 200,
      width: 120,
      height: 100,
      minAbsorption: 10,
      maxAbsorption: 40,
      inflow: 0,
      absorbed: 0,
      outflow: 0,
      status: 'starved',
      externalFlow: 0,
      isOverflowSink: false,
    },
  ]

  const allocations = [
    { id: 'alloc_1', sourceNodeId: 'alice', targetNodeId: 'bob', percentage: 1.0 },
    { id: 'alloc_2', sourceNodeId: 'bob', targetNodeId: 'carol', percentage: 1.0 },
  ]

  return calculateFlowNetworkTotals({
    name: 'Linear Flow (A → B → C)',
    nodes: nodes.map(updateFlowNodeProperties),
    allocations,
    totalInflow: 0,
    totalAbsorbed: 0,
    totalOutflow: 0,
    overflowNodeId: null,
  })
}

/**
 * Create a split flow: A → B and C
 * Flow enters A, splits between B and C
 */
export function createSplitFlowNetwork(): FlowNetwork {
  const nodes: FlowNode[] = [
    {
      id: 'source',
      name: 'Source',
      x: 100,
      y: 200,
      width: 120,
      height: 100,
      minAbsorption: 5,
      maxAbsorption: 20,
      inflow: 100,
      absorbed: 0,
      outflow: 0,
      status: 'healthy',
      externalFlow: 100,
      isOverflowSink: false,
    },
    {
      id: 'project_a',
      name: 'Project A',
      x: 300,
      y: 100,
      width: 120,
      height: 100,
      minAbsorption: 15,
      maxAbsorption: 40,
      inflow: 0,
      absorbed: 0,
      outflow: 0,
      status: 'starved',
      externalFlow: 0,
      isOverflowSink: false,
    },
    {
      id: 'project_b',
      name: 'Project B',
      x: 300,
      y: 300,
      width: 120,
      height: 100,
      minAbsorption: 15,
      maxAbsorption: 40,
      inflow: 0,
      absorbed: 0,
      outflow: 0,
      status: 'starved',
      externalFlow: 0,
      isOverflowSink: false,
    },
    {
      id: 'commons',
      name: 'Commons',
      x: 500,
      y: 200,
      width: 120,
      height: 100,
      minAbsorption: 10,
      maxAbsorption: 30,
      inflow: 0,
      absorbed: 0,
      outflow: 0,
      status: 'starved',
      externalFlow: 0,
      isOverflowSink: false,
    },
  ]

  const allocations = [
    { id: 'alloc_1', sourceNodeId: 'source', targetNodeId: 'project_a', percentage: 0.6 },
    { id: 'alloc_2', sourceNodeId: 'source', targetNodeId: 'project_b', percentage: 0.4 },
    { id: 'alloc_3', sourceNodeId: 'project_a', targetNodeId: 'commons', percentage: 1.0 },
    { id: 'alloc_4', sourceNodeId: 'project_b', targetNodeId: 'commons', percentage: 1.0 },
  ]

  return calculateFlowNetworkTotals({
    name: 'Split Flow (Source → Projects → Commons)',
    nodes: nodes.map(updateFlowNodeProperties),
    allocations,
    totalInflow: 0,
    totalAbsorbed: 0,
    totalOutflow: 0,
    overflowNodeId: null,
  })
}

/**
 * Create a circular flow: A → B → C → A
 * Flow circulates through the network
 */
export function createCircularFlowNetwork(): FlowNetwork {
  const centerX = 350
  const centerY = 250
  const radius = 150

  const nodes: FlowNode[] = [
    {
      id: 'alice',
      name: 'Alice',
      x: centerX + radius * Math.cos(0) - 60,
      y: centerY + radius * Math.sin(0) - 50,
      width: 120,
      height: 100,
      minAbsorption: 10,
      maxAbsorption: 30,
      inflow: 50,
      absorbed: 0,
      outflow: 0,
      status: 'healthy',
      externalFlow: 50,
      isOverflowSink: false,
    },
    {
      id: 'bob',
      name: 'Bob',
      x: centerX + radius * Math.cos((2 * Math.PI) / 3) - 60,
      y: centerY + radius * Math.sin((2 * Math.PI) / 3) - 50,
      width: 120,
      height: 100,
      minAbsorption: 10,
      maxAbsorption: 30,
      inflow: 0,
      absorbed: 0,
      outflow: 0,
      status: 'starved',
      externalFlow: 0,
      isOverflowSink: false,
    },
    {
      id: 'carol',
      name: 'Carol',
      x: centerX + radius * Math.cos((4 * Math.PI) / 3) - 60,
      y: centerY + radius * Math.sin((4 * Math.PI) / 3) - 50,
      width: 120,
      height: 100,
      minAbsorption: 10,
      maxAbsorption: 30,
      inflow: 0,
      absorbed: 0,
      outflow: 0,
      status: 'starved',
      externalFlow: 0,
      isOverflowSink: false,
    },
  ]

  const allocations = [
    { id: 'alloc_1', sourceNodeId: 'alice', targetNodeId: 'bob', percentage: 1.0 },
    { id: 'alloc_2', sourceNodeId: 'bob', targetNodeId: 'carol', percentage: 1.0 },
    { id: 'alloc_3', sourceNodeId: 'carol', targetNodeId: 'alice', percentage: 1.0 },
  ]

  return calculateFlowNetworkTotals({
    name: 'Circular Flow (A → B → C → A)',
    nodes: nodes.map(updateFlowNodeProperties),
    allocations,
    totalInflow: 0,
    totalAbsorbed: 0,
    totalOutflow: 0,
    overflowNodeId: null,
  })
}

/**
 * Create an empty network for user to build
 */
export function createEmptyFlowNetwork(): FlowNetwork {
  const nodes: FlowNode[] = [
    {
      id: 'node1',
      name: 'Node 1',
      x: 150,
      y: 150,
      width: 120,
      height: 100,
      minAbsorption: 10,
      maxAbsorption: 50,
      inflow: 0,
      absorbed: 0,
      outflow: 0,
      status: 'starved',
      externalFlow: 0,
      isOverflowSink: false,
    },
    {
      id: 'node2',
      name: 'Node 2',
      x: 350,
      y: 150,
      width: 120,
      height: 100,
      minAbsorption: 10,
      maxAbsorption: 50,
      inflow: 0,
      absorbed: 0,
      outflow: 0,
      status: 'starved',
      externalFlow: 0,
      isOverflowSink: false,
    },
    {
      id: 'node3',
      name: 'Node 3',
      x: 250,
      y: 300,
      width: 120,
      height: 100,
      minAbsorption: 10,
      maxAbsorption: 50,
      inflow: 0,
      absorbed: 0,
      outflow: 0,
      status: 'starved',
      externalFlow: 0,
      isOverflowSink: false,
    },
  ]

  return calculateFlowNetworkTotals({
    name: 'Empty Network (Set flows to begin)',
    nodes: nodes.map(updateFlowNodeProperties),
    allocations: [],
    totalInflow: 0,
    totalAbsorbed: 0,
    totalOutflow: 0,
    overflowNodeId: null,
  })
}

export const flowSampleNetworks = {
  linear: createLinearFlowNetwork(),
  split: createSplitFlowNetwork(),
  circular: createCircularFlowNetwork(),
  empty: createEmptyFlowNetwork(),
}

export const flowNetworkOptions = [
  { value: 'linear', label: 'Linear Flow (A → B → C)' },
  { value: 'split', label: 'Split Flow (Projects + Commons)' },
  { value: 'circular', label: 'Circular Flow (A ↔ B ↔ C)' },
  { value: 'empty', label: 'Empty Network' },
]

export function getFlowSampleNetwork(key: keyof typeof flowSampleNetworks): FlowNetwork {
  return flowSampleNetworks[key]
}
