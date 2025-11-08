# Canvas Development Guide - /italism Interactive Demo

**Last Updated**: 2025-11-07
**Status**: Phase 1 Complete ✅ - Live Arrows with Propagators Working

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [What We Built](#what-we-built)
3. [Key Technical Discoveries](#key-technical-discoveries)
4. [Architecture Overview](#architecture-overview)
5. [Known Issues & Solutions](#known-issues--solutions)
6. [Next Steps](#next-steps)
7. [FolkJS Integration Roadmap](#folkjs-integration-roadmap)

---

## Quick Start

```bash
# Run dev server
pnpm dev

# Open browser
http://localhost:3000/italism

# Test the full workflow
1. Select a rectangle (click with select tool)
2. Set a value in "Shape Properties" panel (e.g., 100)
3. Use arrow tool to click source rectangle, then target rectangle
4. Select the arrow (click it with select tool)
5. Click "Test Propagation" button
6. See value appear on target rectangle
```

---

## What We Built

### Phase 1: Live Arrows with Propagators ✅

Transformed the canvas from a static drawing tool into an **interactive data flow visualization** where arrows become functional connections that propagate values between shapes.

**Working Features:**
- ✅ Arrow drawing with snap-to-shape centers
- ✅ Arrow selection with visual highlighting (cyan, 4px)
- ✅ Propagator system (inline FolkJS-inspired implementation)
- ✅ Value propagation: source → target via arrows
- ✅ Expression editing (basic text input, not parsed yet)
- ✅ EventTarget-based event system
- ✅ Shape value editor in sidebar
- ✅ Rectangle drawing with negative dimension handling
- ✅ Shape dragging (rectangles, text, ellipses)
- ✅ Erase tool with propagator cleanup
- ✅ Text tool

**File**: `app/italism/page.tsx` (769 lines)

---

## Key Technical Discoveries

### 1. React State Immutability & EventTarget Storage

**Problem**: EventTargets stored directly on shape objects were lost when React state updated.

```typescript
// ❌ BROKEN - EventTarget lost on state update
(sourceShape as any)._eventTarget = mockSource
setShapes([...shapes]) // Creates NEW shape objects!
```

**Solution**: Store EventTargets in separate Map
```typescript
const [eventTargets, setEventTargets] = useState<Map<string, { source: EventTarget; target: EventTarget }>>(new Map())

// Store by arrow ID
setEventTargets((prev) => {
  const next = new Map(prev)
  next.set(arrow.id, { source: mockSource, target: mockTarget })
  return next
})

// Retrieve when needed
const targets = eventTargets.get(arrow.id)
```

**Location**: `app/italism/page.tsx:161, 244-248, 715`

---

### 2. Stale Closure in Event Handlers

**Problem**: Propagator handlers captured `shapes` array from when arrow was created, not current state.

```typescript
// ❌ BROKEN - Captures stale shapes array
handler: (from, to) => {
  const currentSourceShape = shapes.find(...) // OLD shapes!
  setShapes((prevShapes) => prevShapes.map(...))
}
```

**Solution**: Use functional setState to access current state
```typescript
// ✅ WORKS - Gets current shapes at runtime
handler: (from, to) => {
  setShapes((currentShapes) => {
    const currentSourceShape = currentShapes.find(...) // CURRENT shapes!
    return currentShapes.map((s) =>
      s.id === targetId ? { ...s, value: sourceValue } : s
    )
  })
}
```

**Location**: `app/italism/page.tsx:233-251`

**Key Learning**: Always use functional setState `setState((current) => ...)` when accessing state inside closures that outlive the component render (event handlers, intervals, etc.)

---

### 3. Negative Dimensions Bug

**Problem**: Drawing rectangles by dragging upward creates negative height, breaking hit detection.

```typescript
// User drags from (100, 500) to (100, 300)
// Result: { x: 100, y: 500, width: 100, height: -200 }

// Hit detection fails:
y >= shape.y && y <= shape.y + shape.height
// becomes: y >= 500 && y <= 300 (impossible!)
```

**Solution**: Normalize rectangles after drawing
```typescript
if (newShape.type === "rectangle" && newShape.width !== undefined && newShape.height !== undefined) {
  if (newShape.width < 0) {
    newShape.x = newShape.x + newShape.width
    newShape.width = Math.abs(newShape.width)
  }
  if (newShape.height < 0) {
    newShape.y = newShape.y + newShape.height
    newShape.height = Math.abs(newShape.height)
  }
}
```

**Location**: `app/italism/page.tsx:597-607`

---

### 4. Line/Arrow Hit Detection

**Problem**: Clicking arrows requires proximity detection, not exact pixel match.

**Solution**: Point-to-line distance using vector projection
```typescript
function pointToLineDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
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

// Use with tolerance
const HIT_TOLERANCE = 10 // pixels
if (pointToLineDistance(x, y, shape.x, shape.y, shape.x2, shape.y2) < HIT_TOLERANCE) {
  // Arrow clicked!
}
```

**Location**: `app/italism/page.tsx:69-100, 103`

---

### 5. Code Organization Best Practices

**Extract Duplicate Logic**:
```typescript
// Before: Duplicated in select tool, erase tool
const clicked = shapes.find((shape) => {
  if (shape.width && shape.height) {
    return x >= shape.x && x <= shape.x + shape.width && y >= shape.y && y <= shape.y + shape.height
  } else if (shape.type === "text" && shape.text) {
    // ... 15 more lines
  }
})

// After: Single helper function
const isPointInShape = (x: number, y: number, shape: Shape): boolean => {
  // All hit detection logic here
}

const clicked = shapes.find((shape) => isPointInShape(x, y, shape))
```

**Use Constants**:
```typescript
const HIT_TOLERANCE = 10 // Not magic number scattered everywhere
```

**Cleanup Resources**:
```typescript
// When deleting an arrow, dispose propagator
if (clicked.type === "arrow") {
  const propagator = propagators.get(clicked.id)
  if (propagator) {
    propagator.dispose() // Removes event listeners
    setPropagators((prev) => { /* remove */ })
  }
  setEventTargets((prev) => { /* remove */ })
}
```

**Location**: `app/italism/page.tsx:194-207, 435-460`

---

## Architecture Overview

### State Management

```typescript
// Canvas shapes (rectangles, arrows, text, etc.)
const [shapes, setShapes] = useState<Shape[]>([...])

// Active propagator instances (arrow.id → Propagator)
const [propagators, setPropagators] = useState<Map<string, Propagator>>(new Map())

// EventTargets for arrows (arrow.id → { source, target })
const [eventTargets, setEventTargets] = useState<Map<string, { source: EventTarget; target: EventTarget }>>(new Map())

// UI state
const [tool, setTool] = useState<Tool>("select")
const [selectedShape, setSelectedShape] = useState<string | null>(null)
const [isDrawing, setIsDrawing] = useState(false)
const [isDragging, setIsDragging] = useState(false)
```

### Shape Interface

```typescript
interface Shape {
  id: string
  type: "rectangle" | "ellipse" | "line" | "text" | "arrow"
  x: number
  y: number
  width?: number
  height?: number
  x2?: number
  y2?: number
  text?: string
  color: string

  // Arrow-specific
  sourceShapeId?: string
  targetShapeId?: string
  expression?: string // "value: from.value * 2"

  // Data
  value?: number
}
```

### Propagator Class (Inline Implementation)

```typescript
class Propagator {
  private source: EventTarget | null = null
  private target: EventTarget | null = null
  private eventName: string | null = null
  private handler: PropagatorFunction | null = null

  constructor(options: PropagatorOptions)
  propagate(event?: Event): void
  dispose(): void // Cleanup event listeners
}
```

**Why Inline?** The `@folkjs/propagators` package exists but isn't properly configured for Next.js import. We implemented a simplified version inline. Future: migrate to actual FolkJS package.

### Data Flow

```
User sets value on Rectangle A (value: 100)
    ↓
User creates arrow from A to B
    ↓
createPropagatorForArrow() called
    ↓
EventTargets created & stored in Map
    ↓
Propagator instance created with handler
    ↓
User clicks "Test Propagation"
    ↓
source.dispatchEvent(new Event("update"))
    ↓
Handler fires: setShapes((current) => ...)
    ↓
Finds Rectangle A in current state
    ↓
Updates Rectangle B with value: 100
    ↓
Canvas re-renders, shows "100" on Rectangle B
```

---

## Known Issues & Solutions

### Issue: "Test Propagation" Does Nothing

**Symptoms**: Click button, nothing happens, console shows warnings

**Debugging Steps**:
1. Check console: Do you see "⚠️ No source value to propagate"?
   - **Fix**: Set a value on the source rectangle first
2. Check console: Do you see "⚠️ No EventTarget found"?
   - **Fix**: Delete arrow and recreate it (propagator wasn't initialized)
3. Check console: Do you see "✅ Propagating..." but no visual change?
   - **Fix**: Check if you're looking at the right target shape

### Issue: Can't Click Arrows

**Symptoms**: Arrow exists but clicking doesn't select it

**Cause**: Hit detection tolerance too small or `isPointInShape` not called

**Fix**: Verify `HIT_TOLERANCE = 10` and selection uses `isPointInShape()`

### Issue: Rectangles Disappear When Drawn Upward

**Symptoms**: Draw rectangle by dragging up → rectangle not clickable

**Cause**: Negative height dimensions

**Fix**: Already implemented in `handleMouseUp:597-607`, check it's still there

### Issue: Arrow Points Wrong Direction After Dragging Shape

**Symptoms**: Move a rectangle → arrow endpoint doesn't follow

**Current Status**: **Not implemented** - arrows have fixed coordinates, don't update when shapes move

**Future Fix**:
```typescript
// In render loop, calculate arrow endpoints from source/target shapes
if (shape.type === "arrow" && shape.sourceShapeId && shape.targetShapeId) {
  const source = shapes.find(s => s.id === shape.sourceShapeId)
  const target = shapes.find(s => s.id === shape.targetShapeId)
  if (source && target) {
    const startCenter = getShapeCenter(source)
    const endCenter = getShapeCenter(target)
    // Draw from startCenter to endCenter
  }
}
```

---

## Next Steps

### Immediate Priorities

1. **Expression Parser** (Medium Priority)
   - Currently expressions like `"value: from.value * 2"` are stored but not parsed
   - Need to implement safe expression evaluation
   - Options:
     - Simple string replace: `"from.value"` → `sourceValue`
     - Use Function constructor (unsafe)
     - Use a library like `expr-eval` or `mathjs`

2. **Arrow Auto-Update on Shape Move** (High Priority)
   - When shapes move, arrows should stay connected
   - Calculate endpoints dynamically from source/target shapes

3. **Visual Flow Animation** (Medium Priority)
   - Show animated "pulse" along arrow when propagation happens
   - Use canvas path animation or particles

### Phase 2: Enhanced Propagators

4. **Bi-directional Propagation**
   - Currently one-way (source → target)
   - Allow target changes to flow back

5. **Multi-Source Aggregation**
   - Multiple arrows pointing to same target
   - Aggregate values (sum, average, max, etc.)

6. **Conditional Propagation**
   - Only propagate if condition met
   - Example: `if (from.value > 100) to.value = from.value`

### Phase 3: Polish & UX

7. **Keyboard Shortcuts**
   - Delete key for selected shape
   - Escape to deselect
   - Ctrl+Z for undo

8. **Undo/Redo System**
   - History stack for shapes
   - Implement command pattern

9. **Persistence**
   - Save canvas to localStorage
   - Export/import JSON
   - URL state encoding

10. **Color Picker**
    - Let users choose shape colors
    - Arrow color based on data type/state

---

## FolkJS Integration Roadmap

### Current State: Inline Propagator

We have a simplified Propagator class inline in `page.tsx`. This is sufficient for Phase 1 but limits us.

### Phase 4: Migrate to Real FolkJS

**Goals**:
1. Use actual `@folkjs/propagators` package
2. Integrate `@folkjs/canvas` for DOM-based shapes (instead of `<canvas>`)
3. Use `@folkjs/geometry` for calculations

**Benefits**:
- Built-in spatial transformations (pan, zoom)
- Gizmos for resize/rotate
- Better performance with DOM elements
- Native collaboration support via `@folkjs/collab`

**Migration Steps**:

1. **Install FolkJS packages**:
   ```bash
   cd /home/ygg/Workspace/sandbox/FlowFunding/v2/lib/post-app-website-new
   pnpm add ../folkjs/packages/propagators
   pnpm add ../folkjs/packages/canvas
   pnpm add ../folkjs/packages/geometry
   ```

2. **Replace inline Propagator**:
   ```typescript
   import { Propagator } from '@folkjs/propagators'
   // Remove inline class definition
   ```

3. **Convert canvas shapes to folk-shape elements**:
   ```typescript
   // Instead of drawing rectangles on canvas
   const folkShape = document.createElement('folk-shape')
   folkShape.setAttribute('x', shape.x.toString())
   folkShape.setAttribute('width', shape.width.toString())
   ```

4. **Use folk-event-propagator for arrows**:
   ```typescript
   <folk-event-propagator
     source="#rect1"
     target="#rect2"
     trigger="change"
     expression="value: from.value * 2"
   />
   ```

See `FOLKJS_INTEGRATION.md` for detailed integration plan.

### Phase 5: Flow Funding Visualization

**Connect to actual Flow Funding data model**:

```typescript
interface FlowFundingAccount extends Shape {
  type: "rectangle"
  accountId: string
  balance: number
  minThreshold: number
  maxThreshold: number
  allocations: LiveArrow[]
}

// Visual: Fill rectangle based on balance/thresholds
const fillHeight = (account.balance / account.maxThreshold) * account.height

// Color coding
if (account.balance < account.minThreshold) {
  ctx.fillStyle = "#ef4444" // Red: underfunded
} else if (account.balance > account.maxThreshold) {
  ctx.fillStyle = "#10b981" // Green: overflow, ready to redistribute
} else {
  ctx.fillStyle = "#6366f1" // Blue: healthy
}
```

**Animate overflow redistribution**:
```typescript
const animateFlowFunding = (accounts: FlowFundingAccount[]) => {
  accounts.forEach(account => {
    if (account.balance > account.maxThreshold) {
      const overflow = account.balance - account.maxThreshold

      account.allocations.forEach(arrow => {
        const allocation = overflow * arrow.allocationPercentage
        animateParticleFlow(arrow, allocation) // Visual animation
        arrow.propagator?.propagate({ type: 'funding', detail: { amount: allocation } })
      })
    }
  })
}
```

### Phase 6: Scoped Propagators (Advanced)

**Orion Reed's vision: Computation on edges, not nodes**

```typescript
interface ScopedPropagatorArrow extends LiveArrow {
  scope: {
    variables: Record<string, any>    // Local state on the edge
    computations: string[]            // Functions defined on this edge
    constraints: string[]             // Rules that must hold
  }
}

// Example: Arrow that computes transfer fee
const feeArrow: ScopedPropagatorArrow = {
  type: "arrow",
  sourceShapeId: "account1",
  targetShapeId: "account2",
  scope: {
    variables: {
      feeRate: 0.02,  // 2% fee
      history: []     // Track all transfers
    },
    computations: [
      "fee = amount * feeRate",
      "netTransfer = amount - fee",
      "history.push({amount, fee, timestamp: Date.now()})"
    ],
    constraints: [
      "amount > 0",
      "netTransfer <= source.balance"
    ]
  }
}
```

---

## Development Best Practices Learned

### 1. Never Make Multiple Changes Without Testing

**Bad Workflow**:
```
Change 1: Fix EventTarget storage
Change 2: Fix propagator handler
Change 3: Add arrow selection
Change 4: Add visual highlighting
Test all at once → Everything broken, can't isolate issue
```

**Good Workflow**:
```
Change 1: Fix EventTarget storage
Test → Works ✅
Change 2: Fix propagator handler
Test → Works ✅
Change 3: Add arrow selection
Test → Works ✅
```

### 2. Systematic Debugging with Progressive Logging

When something doesn't work:

1. **Add high-level logging**:
   ```typescript
   console.log("🎯 Arrow tool: Looking for shape at", x, y)
   ```

2. **Ask user for output, analyze**

3. **Add detailed logging**:
   ```typescript
   console.log("📦 Available shapes:", shapes.map(s => ({...})))
   ```

4. **Identify pattern** → Form hypothesis

5. **Add targeted logging**:
   ```typescript
   console.log("Shape bounds:", shape.width, shape.height, shape.x, shape.y)
   ```

6. **User provides data** → Root cause revealed (negative dimensions!)

7. **Apply minimal fix**

8. **Remove debug logging**

### 3. Use Git Strategically

When things break badly:
```bash
# Check what changed
git status
git diff app/italism/page.tsx

# Revert to known good state
git restore app/italism/page.tsx

# Or: User manually reverts to their last known working version
```

---

## Technical Debt

### Current

1. **Inline Propagator class** - Should use `@folkjs/propagators` package
2. **No expression parsing** - Expressions stored but not evaluated
3. **Magic strings** - Tool names as strings, should be enum
4. **No tests** - Should have unit tests for calculations
5. **Performance** - Canvas redraws everything on every change
6. **No accessibility** - Keyboard navigation, ARIA labels needed

### Future

1. **Component extraction** - Split into Canvas, Toolbar, Sidebar
2. **Custom hooks** - `useCanvas`, `useShapeManipulation`, etc.
3. **State management** - Consider Zustand or Jotai for global state
4. **Canvas optimization** - Use `requestAnimationFrame`, debounce mousemove
5. **Type safety** - Remove `any` types, stricter TypeScript

---

## Philosophical Connection

This implementation embodies **Post-Appitalism** principles:

### Malleable Software
- Users can freely create, modify, delete shapes
- No rigid application structure
- Direct manipulation of visual elements
- Arrows can be edited at runtime

### Flow-Based Economics
- **Arrows = Resource Flows**: Visual metaphor for allocation preferences
- **Nodes = Accounts**: Shapes represent participants
- **Canvas = Network**: Spatial representation of economic relationships
- **Propagation = Value Transfer**: Data flows like money

### Scoped Propagators (Future)
- Arrows become **edge-based computations**
- Rather than compute on nodes, compute **on the connections**
- Aligns with Orion Reed's vision of propagators as mappings along edges
- See: https://www.orionreed.com/posts/scoped-propagators

---

## Resources

- **FolkJS Demos**: `../../folkjs/website/demos/propagators/`
- **Flow Funding Paper**: `../../../threshold-based-flow-funding.md`
- **Project Philosophy**: `../../../CLAUDE.md`
- **Scoped Propagators Article**: https://www.orionreed.com/posts/scoped-propagators

---

## Summary: What Makes This Special

This isn't just a drawing app. It's a **live, interactive, programmable canvas** where:

1. **Arrows are functional**, not decorative
2. **Data flows visually** through the network
3. **Edges have computation**, not just nodes
4. **Users can reprogram** connections at runtime
5. **Visual = Executable** - what you see is what computes

**Result**: A tool that lets people **design, visualize, and simulate** Flow Funding networks before deploying them, making the abstract concept of threshold-based resource allocation **tangible and interactive**.

The canvas demonstrates Post-Appitalism by being Post-App: **malleable, open, collaborative, and alive**.
