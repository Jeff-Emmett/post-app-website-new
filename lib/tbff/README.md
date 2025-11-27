# Threshold-Based Flow Funding (TBFF) Module

**Status**: Milestone 3 Complete ✅
**Route**: `/tbff`
**Last Updated**: 2025-11-09

---

## Overview

This module implements the Threshold-Based Flow Funding mechanism described in `threshold-based-flow-funding.md`. It's built as a **self-contained, modular system** that can evolve independently without affecting other parts of the application.

## Module Structure

```
lib/tbff/
├── types.ts                # TypeScript interfaces and types
├── utils.ts                # Utility functions (status calculations, formatting)
├── sample-networks.ts      # Pre-configured demo networks
├── rendering.ts            # Canvas rendering functions
├── algorithms.ts           # Flow funding algorithms (future)
└── README.md              # This file

app/tbff/
└── page.tsx               # Main page component
```

## Core Concepts

### 1. Account (Participant)

Each account has:
- **Balance**: Current funds held
- **Min Threshold**: Minimum viable funding (survival level)
- **Max Threshold**: Overflow point (abundance level)
- **Status**: Derived state (deficit, minimum, healthy, overflow)

**Visual Representation**: Rectangle with fill height showing balance vs thresholds.

**Color Coding**:
- 🔴 Red (Deficit): balance < minThreshold
- 🟡 Yellow (Minimum): balance ≈ minThreshold
- 🔵 Blue (Healthy): minThreshold < balance < maxThreshold
- 🟢 Green (Overflow): balance ≥ maxThreshold

### 2. Allocation (Connection)

Represents where overflow flows when an account exceeds its maximum threshold.

**Properties**:
- `sourceAccountId`: Account that overflows
- `targetAccountId`: Account that receives overflow
- `percentage`: Portion of overflow to send (0.0 to 1.0)

**Visual Representation**: Arrow with thickness based on percentage.

### 3. Network

Collection of accounts and their allocations, forming a resource flow network.

**Computed Properties**:
- Total Funds: Sum of all balances
- Total Shortfall: Sum of all deficits
- Total Capacity: Sum of all remaining capacity
- Total Overflow: Sum of all overflows

## Current Implementation (Milestone 1-3)

### ✅ What's Working

1. **Static Visualization**
   - Accounts rendered as colored rectangles
   - Fill height shows balance vs max threshold
   - Threshold lines (dashed) show min/max
   - Status badges show current state
   - Center dots show connection points

2. **Allocations**
   - Arrows between accounts
   - Thickness based on allocation percentage
   - Color indicates if source has overflow
   - Percentage labels at midpoint

3. **Interactive Selection**
   - Click accounts to select
   - Click arrows to select allocations
   - Sidebar shows detailed info
   - Account list for quick navigation
   - Keyboard shortcuts (Delete, Escape)

4. **Interactive Allocation Creation** ✨ New in M2
   - Two-tool system (Select, Create Arrow)
   - Click source, then target to create allocation
   - Default 50% percentage
   - Auto-normalization with existing allocations
   - Visual feedback during creation

5. **Allocation Editing** ✨ New in M2
   - Select arrow to edit
   - Percentage slider (0-100%)
   - Real-time updates
   - Auto-normalization
   - Delete button
   - Delete key shortcut

6. **Sample Networks**
   - **States Demo**: Shows all 4 account states
   - **Simple Linear**: A → B → C flow
   - **Mutual Aid Circle**: A ↔ B ↔ C circular support
   - **Commons Pool**: Everyone → Pool → Everyone

7. **Initial Distribution Algorithm** ✨ New in M3
   - Add external funding input field
   - "Distribute Funding" button
   - Algorithm fills minimums first, then distributes by capacity
   - Distribution summary shows changes
   - Console logging for debugging
   - Real-time balance updates

8. **Network Stats**
   - Real-time totals displayed in corner
   - Sidebar shows aggregated metrics

### 📋 What's Not Yet Implemented

- ❌ Overflow redistribution algorithm
- ❌ Animated flow particles
- ❌ Adding/editing accounts
- ❌ Editing account balances/thresholds
- ❌ Multi-round simulation with overflow
- ❌ Persistence (save/load)

## Sample Networks

### 1. States Demo (Default)

Four accounts showing all possible states:
- Deficit (balance: 30, min: 100, max: 200)
- Minimum (balance: 100, min: 100, max: 200)
- Healthy (balance: 150, min: 100, max: 200)
- Overflow (balance: 250, min: 100, max: 200)

**Purpose**: Understand visual language and status colors.

### 2. Simple Linear Flow

Three accounts in a chain: Alice → Bob → Carol

**Purpose**: Demonstrates basic flow through a linear network.

### 3. Mutual Aid Circle

Three accounts in circular support: Alice ↔ Bob ↔ Carol ↔ Alice

**Purpose**: Shows how resources can circulate through mutual aid relationships.

### 4. Commons Pool

Four accounts where everyone contributes to a central pool, which redistributes equally.

**Purpose**: Demonstrates hub-and-spoke pattern with commons-based allocation.

## API Reference

### Types (`types.ts`)

```typescript
interface FlowFundingAccount {
  id: string
  name: string
  balance: number
  minThreshold: number
  maxThreshold: number
  x: number
  y: number
  width: number
  height: number
  status: AccountStatus
  shortfall: number
  capacity: number
  overflow: number
}

interface Allocation {
  id: string
  sourceAccountId: string
  targetAccountId: string
  percentage: number
}

interface FlowFundingNetwork {
  name: string
  accounts: FlowFundingAccount[]
  allocations: Allocation[]
  totalFunds: number
  totalShortfall: number
  totalCapacity: number
  totalOverflow: number
}
```

### Utils (`utils.ts`)

```typescript
// Status calculation
getAccountStatus(account: FlowFundingAccount): AccountStatus
updateAccountComputedProperties(account: FlowFundingAccount): FlowFundingAccount

// Network calculations
calculateNetworkTotals(network: FlowFundingNetwork): FlowFundingNetwork

// Allocation helpers
normalizeAllocations(allocations: Allocation[]): Allocation[]

// Visual helpers
getAccountCenter(account: FlowFundingAccount): { x: number; y: number }
getStatusColor(status: AccountStatus, alpha?: number): string
```

### Rendering (`rendering.ts`)

```typescript
// Render individual elements
renderAccount(ctx: CanvasRenderingContext2D, account: FlowFundingAccount, isSelected?: boolean): void
renderAllocation(ctx: CanvasRenderingContext2D, allocation: Allocation, source: FlowFundingAccount, target: FlowFundingAccount, isSelected?: boolean): void

// Render entire network
renderNetwork(ctx: CanvasRenderingContext2D, network: FlowFundingNetwork, width: number, height: number, selectedAccountId?: string | null): void
```

## Next Steps (Milestone 2+)

### ✅ Milestone 2: Add Allocations (Interactive) - COMPLETE
**Goal**: Draw arrows between accounts, edit percentages

**Tasks**:
- [x] Arrow drawing tool (click source, click target)
- [x] Allocation percentage editor in sidebar
- [x] Delete allocations
- [x] Normalize allocations automatically

### ✅ Milestone 3: Initial Distribution - COMPLETE
**Goal**: Add external funding and watch it distribute

**Tasks**:
- [x] Implement `initialDistribution()` algorithm
- [x] Add "Add Funding" input + button
- [x] Distribution summary display
- [x] Console logging for debugging
- [ ] Animate balance changes (number tweening) - Future enhancement

### Milestone 4: Overflow Redistribution
**Goal**: Trigger overflow and watch funds flow

**Tasks**:
- [ ] Implement `redistributeOverflow()` algorithm
- [ ] Create `FlowParticle` animation system
- [ ] Animate particles along arrows
- [ ] Show iteration count and convergence
- [ ] "Run Redistribution" button

### Milestone 5: Interactive Creation
**Goal**: Build custom networks from scratch

**Tasks**:
- [ ] "Create Account" tool with threshold inputs
- [ ] Drag accounts to reposition
- [ ] Edit account thresholds
- [ ] Edit account balances
- [ ] Save/load network (localStorage)

### Milestone 6: Scenarios & Presets
**Goal**: Curated examples with explanations

**Tasks**:
- [ ] More complex preset networks
- [ ] Guided tour / tooltips
- [ ] Scenario descriptions
- [ ] Expected outcomes documentation

### Milestone 7: Polish
**Goal**: Production-ready demo

**Tasks**:
- [ ] Keyboard shortcuts (Delete, Esc, etc.)
- [ ] Undo/redo for edits
- [ ] Mobile responsive sidebar
- [ ] Performance optimization
- [ ] Error handling
- [ ] Demo video recording

## Integration Points

### With Existing Canvas (`/italism`)

This module is **completely separate** from the existing `/italism` canvas. No shared code, no dependencies.

**Future**: Could potentially merge propagator concepts, but for now they remain independent.

### With Academic Paper

This implementation directly models the concepts from `threshold-based-flow-funding.md`:

- **Section 2.1**: Mathematical Model → `types.ts` interfaces
- **Section 2.2**: Distribution Algorithm → `algorithms.ts` (future)
- **Section 3**: Theoretical Properties → Will validate through tests

### With Post-Appitalism Vision

This embodies Post-Appitalism by:
- Making abstract economics **tangible** (visual, interactive)
- Demonstrating **resource circulation** vs extraction
- Showing **collective intelligence** (allocation networks)
- Creating **malleable** systems (users can experiment)

## Development Notes

### Design Decisions

1. **Separate Module**: Keeps TBFF isolated, prevents breaking existing features
2. **Canvas-based**: Performance for many accounts, smooth animations
3. **Computed Properties**: Derived from balance/thresholds, not stored separately
4. **Sample Data**: Hardcoded networks for quick demos, easier testing

### Known Limitations

1. **No persistence**: Refresh loses changes (Milestone 5)
2. **Static only**: No algorithm execution yet (Milestone 3-4)
3. **No validation**: Can't detect invalid networks yet
4. **No tests**: Should add unit tests for algorithms

### Performance Considerations

- Canvas redraws entire scene on change (acceptable for <50 accounts)
- Could optimize with dirty rectangles if needed
- Animations will use `requestAnimationFrame`

## Testing

### Manual Testing Checklist

**Milestone 1:**
- [x] Load default network (States Demo)
- [x] Switch between networks via dropdown
- [x] Click accounts to select
- [x] View account details in sidebar
- [x] See color coding for different states
- [x] See threshold lines in accounts
- [x] See allocation arrows with percentages
- [x] See network stats update

**Milestone 2:**
- [x] Select "Create Arrow" tool
- [x] Click source account, then target account
- [x] New allocation appears on canvas
- [x] Click arrow to select it
- [x] Selected arrow highlights in cyan
- [x] Allocation editor appears in sidebar
- [x] Drag percentage slider
- [x] See percentage update in real-time
- [x] Create second allocation from same source
- [x] See both allocations normalize
- [x] Click "Delete Allocation" button
- [x] Press Delete key to remove allocation
- [x] Press Escape to deselect
- [x] See outgoing allocations in account details

**Milestone 3:**
- [x] See "Add Funding" section in sidebar
- [x] Enter funding amount (default: 1000)
- [x] Click "Distribute Funding" button
- [x] See balances update immediately
- [x] See distribution summary appear
- [x] See list of changed accounts with deltas
- [x] Check console for detailed logs
- [x] Try insufficient funding (distributes proportionally)
- [x] Try sufficient funding (fills minimums, then by capacity)
- [x] See network totals update correctly

**Future:**
- [ ] Watch overflow redistribution (Milestone 4)
- [ ] See animated flow particles (Milestone 4)

### Future: Automated Tests

```typescript
// Example tests for Milestone 3+
describe('initialDistribution', () => {
  it('should fill minimums first when funds insufficient', () => {})
  it('should distribute by capacity when minimums met', () => {})
})

describe('redistributeOverflow', () => {
  it('should converge within max iterations', () => {})
  it('should conserve total funds', () => {})
})
```

## Resources

- **Academic Paper**: `../../../threshold-based-flow-funding.md`
- **Design Session**: `../../.claude/journal/FLOW_FUNDING_DESIGN_SESSION.md`
- **Project Vision**: `../../.claude/journal/POST_APPITALISM_VISION.md`

---

**Built with**: TypeScript, React, Next.js, Canvas API
**Module Owner**: TBFF Team
**Questions?** See design session document for detailed architecture.
