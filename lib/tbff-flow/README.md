# Flow-Based Flow Funding Module

**Status**: Initial Implementation Complete ✅
**Route**: `/tbff-flow`
**Last Updated**: 2025-11-09

---

## Overview

This module implements a **flow-based** visualization of Flow Funding, focusing on resource circulation rather than accumulation. Unlike the stock-based model (`/tbff`), this visualizes how resources move through networks in real-time.

## Core Concepts

### Flow vs Stock

**Stock Model** (`/tbff`):
- Accounts have balances (accumulated resources)
- Distribution adds to balances
- Thresholds define states (deficit, healthy, overflow)
- Overflow triggers redistribution

**Flow Model** (`/tbff-flow`):
- Nodes have flow rates (resources in motion)
- Flow continuously circulates
- Thresholds define absorption capacity
- Real-time animation shows circulation

### 1. Flow Node

Each node receives flow, absorbs what it needs, and passes excess onward.

**Properties**:
- `minAbsorption`: Minimum flow needed to function (survival level)
- `maxAbsorption`: Maximum flow that can be absorbed (capacity)
- `externalFlow`: Flow injected by user (source)
- `inflow`: Total flow entering (external + from allocations)
- `absorbed`: Amount kept (between min and max)
- `outflow`: Excess flow leaving (to allocations)

**Status**:
- 🔴 **Starved**: absorbed < minAbsorption
- 🟡 **Minimum**: absorbed ≈ minAbsorption
- 🔵 **Healthy**: minAbsorption < absorbed < maxAbsorption
- 🟢 **Saturated**: absorbed ≥ maxAbsorption

### 2. Flow Propagation

**Algorithm**:
1. Start with external flows (user-set inputs)
2. For each iteration:
   - Calculate absorption: `min(inflow, maxAbsorption)`
   - Calculate outflow: `max(0, inflow - absorbed)`
   - Distribute outflow via allocations
   - Update inflows for next iteration
3. Repeat until convergence (flows stabilize)
4. Create overflow sink if needed

**Convergence**: Flows change by less than 0.01 between iterations

### 3. Overflow Sink

**Auto-created** when network has unallocated outflow.

**Purpose**: Capture excess flow that has nowhere to go

**Behavior**:
- Appears automatically when needed
- Disappears when no longer needed
- Infinite absorption capacity
- Visualized with "SINK" label

### 4. Flow Particles

**Animation**: Particles move along allocation arrows

**Properties**:
- Position along arrow (0.0 to 1.0)
- Amount (affects size and color)
- Speed (faster for higher flow)
- Continuous loop (resets at end)

**Purpose**: Visual feedback of resource circulation

---

## Module Structure

```
lib/tbff-flow/
├── types.ts              # Flow-based types (FlowNode, FlowNetwork, etc.)
├── utils.ts              # Utility functions (absorption, status, etc.)
├── algorithms.ts         # Flow propagation algorithm
├── rendering.ts          # Canvas rendering with particles
├── sample-networks.ts    # Demo networks (linear, split, circular)
└── README.md            # This file

app/tbff-flow/
└── page.tsx             # Main page with real-time animation
```

---

## Features

### ✅ Implemented

1. **Flow Propagation Algorithm**
   - Iterative flow distribution
   - Convergence detection
   - Comprehensive console logging
   - Automatic overflow node creation

2. **Real-Time Animation**
   - Continuous particle movement
   - Pause/play with spacebar
   - Smooth 60fps rendering
   - Visual flow indicators

3. **Interactive Controls**
   - Click node to set external flow
   - Create allocations with arrow tool
   - Edit allocation percentages
   - Delete allocations

4. **Sample Networks**
   - Linear Flow (A → B → C)
   - Split Flow (Projects + Commons)
   - Circular Flow (A ↔ B ↔ C)
   - Empty Network (build your own)

5. **Visual Design**
   - Flow bars show inflow/absorption/outflow
   - Status colors (red/yellow/blue/green)
   - Arrow thickness = flow amount
   - Particle density = flow volume
   - External flow indicators (green dots)

---

## Usage

### Setting Flow

1. Select a node (click on it)
2. Enter external flow value in sidebar
3. Watch flow propagate automatically
4. See particles animate along arrows

### Creating Allocations

1. Click "Create Arrow" tool
2. Click source node
3. Click target node
4. Allocation created with 50% default
5. Flow re-propagates automatically

### Observing Flow

- **Inflow bars** (blue): Total flow entering
- **Absorption bars** (status color): Amount kept
- **Outflow bars** (green): Excess leaving
- **Particles**: Moving resources
- **Arrow thickness**: Flow amount

### Keyboard Shortcuts

- **Space**: Pause/play animation
- **Escape**: Cancel creation, deselect
- **Delete**: Remove selected allocation

---

## Sample Networks

### 1. Linear Flow

**Structure**: A → B → C

**Setup**: Alice receives 100 flow, passes excess to Bob, who passes to Carol

**Demonstrates**: Sequential absorption and propagation

### 2. Split Flow

**Structure**: Source → Projects (A, B) → Commons

**Setup**: Source splits 60/40 between projects, which merge at Commons

**Demonstrates**: Branching and merging flows

### 3. Circular Flow

**Structure**: A → B → C → A

**Setup**: Alice injects 50 flow, which circulates continuously

**Demonstrates**: Circular resource circulation

### 4. Empty Network

**Structure**: 3 unconnected nodes

**Purpose**: Build custom flow patterns from scratch

---

## Algorithm Details

### Flow Propagation Example

```
Initial State:
  Alice: externalFlow = 100, maxAbsorption = 50
  Bob: externalFlow = 0, maxAbsorption = 30
  Alice → Bob (100%)

Iteration 1:
  Alice: inflow = 100, absorbed = 50, outflow = 50
  Bob: inflow = 0 (not yet received)

Iteration 2:
  Alice: inflow = 100, absorbed = 50, outflow = 50
  Bob: inflow = 50, absorbed = 30, outflow = 20

Iteration 3 onwards:
  (Converged - no change)

Result:
  Alice absorbs 50, passes 50 to Bob
  Bob absorbs 30, has 20 outflow (needs overflow node)
```

### Convergence

**Condition**: `max(|inflow[i] - inflow[i-1]|) < 0.01` for all nodes

**Max Iterations**: 100

**Typical**: Converges in 10-20 iterations for most networks

---

## Technical Implementation

### State Management

```typescript
const [network, setNetwork] = useState<FlowNetwork>(...)
const [particles, setParticles] = useState<FlowParticle[]>([])
const [isAnimating, setIsAnimating] = useState(true)
```

### Animation Loop

```typescript
useEffect(() => {
  const animate = () => {
    setParticles(prev => updateFlowParticles(prev))
    requestAnimationFrame(animate)
  }
  requestAnimationFrame(animate)
}, [isAnimating])
```

### Canvas Rendering

```typescript
useEffect(() => {
  renderFlowNetwork(ctx, network, width, height, particles, ...)
}, [network, particles, selectedNodeId, selectedAllocationId])
```

### Flow Propagation Trigger

- On network load
- On external flow change
- On allocation create/update/delete
- Automatic 100ms after change

---

## Design Decisions

### 1. Why Separate from Stock Model?

**Decision**: Create `/tbff-flow` as separate route

**Reasoning**:
- Different mental models (flow vs stock)
- Different visualizations (particles vs bars)
- Different algorithms (propagation vs distribution)
- Users can compare both approaches

### 2. Why Real-Time Continuous Animation?

**Decision**: Particles move continuously at 60fps

**Reasoning**:
- Emphasizes circulation over states
- More engaging and dynamic
- Matches "flow" concept intuitively
- Educational - see resources in motion

**Trade-off**: More CPU usage vs better UX

### 3. Why Auto-Create Overflow Node?

**Decision**: Automatically create/remove overflow sink

**Reasoning**:
- Unallocated outflow needs destination
- Prevents "leaking" flow
- Conserves resources (total inflow = absorbed + overflow)
- User shouldn't have to manually manage

### 4. Why Absorption Thresholds?

**Decision**: Min/max thresholds define absorption capacity

**Reasoning**:
- Maps to real resource needs (minimum to function, maximum to benefit)
- Similar to stock model (easy to understand)
- Allows partial absorption (not all-or-nothing)
- Generates meaningful outflow for circulation

---

## Comparison with Stock Model

| Aspect | Stock Model (`/tbff`) | Flow Model (`/tbff-flow`) |
|--------|----------------------|---------------------------|
| **Core Metric** | Balance (accumulated) | Flow rate (per time) |
| **Visualization** | Fill height | Flow bars + particles |
| **Input** | Add funding (one-time) | Set flow (continuous) |
| **Algorithm** | Initial distribution | Flow propagation |
| **Animation** | Static (for now) | Real-time particles |
| **Overflow** | Triggers redistribution | Continuous outflow |
| **Use Case** | Budget allocation | Resource circulation |

---

## Future Enhancements

### Phase 2

- [ ] Variable particle colors (by source)
- [ ] Flow rate history graphs
- [ ] Equilibrium detection indicator
- [ ] Save/load custom networks
- [ ] Export flow data (CSV, JSON)

### Phase 3

- [ ] Multiple simultaneous external flows
- [ ] Time-varying flows (pulses, waves)
- [ ] Flow constraints (min/max on arrows)
- [ ] Network analysis (bottlenecks, unutilized capacity)

### Phase 4

- [ ] Combine stock and flow models
- [ ] Hybrid visualization
- [ ] Round-based simulation mode
- [ ] Multi-network comparison

---

## Resources

- **Stock Model**: `/lib/tbff/README.md`
- **Design Session**: `/.claude/journal/FLOW_FUNDING_DESIGN_SESSION.md`
- **Academic Paper**: `../../../threshold-based-flow-funding.md`

---

## Testing Checklist

- [x] Load default network (Linear Flow)
- [x] Switch between sample networks
- [x] Set external flow on node
- [x] Watch flow propagate
- [x] See particles animate
- [x] Create allocation with arrow tool
- [x] Edit allocation percentage
- [x] Delete allocation
- [x] Pause/play animation with Space
- [x] See overflow node appear when needed
- [x] See overflow node disappear when not needed
- [x] Check console for propagation logs
- [x] Verify convergence
- [x] Test circular flow network

---

**Built with**: TypeScript, React, Next.js, Canvas API, requestAnimationFrame

**Module Owner**: TBFF Flow Team

**Philosophy**: "Resources are meant to circulate, not accumulate."

---

*Flow where needed, absorb what's needed, pass on the rest.*
