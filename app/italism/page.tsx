"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

// Inline Propagator class (simplified from @folkjs/propagators)
type PropagatorFunction = (source: EventTarget, target: EventTarget, event: Event) => any

interface PropagatorOptions {
  source?: EventTarget | null
  target?: EventTarget | null
  event?: string | null
  handler?: PropagatorFunction | null
}

class Propagator {
  private source: EventTarget | null = null
  private target: EventTarget | null = null
  private eventName: string | null = null
  private handler: PropagatorFunction | null = null

  constructor(options: PropagatorOptions = {}) {
    const { source = null, target = null, event = null, handler = null } = options

    this.source = source
    this.target = target
    this.eventName = event
    this.handler = handler

    // Add listener if we have all necessary parts
    if (this.source && this.eventName) {
      this.source.addEventListener(this.eventName, this.handleEvent)
    }
  }

  private handleEvent = (event: Event) => {
    if (!this.source || !this.target || !this.handler) return

    try {
      this.handler(this.source, this.target, event)
    } catch (error) {
      console.error("Error in propagator handler:", error)
    }
  }

  propagate(event?: Event): void {
    if (!event && this.eventName) {
      event = new Event(this.eventName)
    }
    if (!event) return
    this.handleEvent(event)
  }

  dispose(): void {
    if (this.source && this.eventName) {
      this.source.removeEventListener(this.eventName, this.handleEvent)
    }
    this.source = null
    this.target = null
    this.handler = null
  }
}

type Tool = "select" | "draw" | "erase" | "rectangle" | "text" | "arrow"

// Helper function to calculate distance from point to line segment
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

// Constants
const HIT_TOLERANCE = 10 // pixels - for line/arrow hit detection

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
  // For arrows that connect shapes
  sourceShapeId?: string
  targetShapeId?: string
  // Propagator expression for live arrows
  expression?: string
  // Data value for shapes (used in propagation)
  value?: number
}

export default function ItalismPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<Tool>("select")
  const [shapes, setShapes] = useState<Shape[]>([
    {
      id: "1",
      type: "rectangle",
      x: 100,
      y: 100,
      width: 750,
      height: 50,
      color: "#6366f1",
      text: "Digital Liberation",
    },
    { id: "2", type: "rectangle", x: 360, y: 180, width: 480, height: 50, color: "#6366f1", text: "Post-Appitalism" },
    {
      id: "3",
      type: "rectangle",
      x: 50,
      y: 340,
      width: 1110,
      height: 50,
      color: "#10b981",
      text: "Collaborative Economy",
    },
    { id: "4", type: "ellipse", x: 270, y: 430, width: 1020, height: 40, color: "#10b981", text: "Decentralized" },
    { id: "5", type: "ellipse", x: 310, y: 530, width: 1110, height: 40, color: "#10b981", text: "Future" },
    { id: "6", type: "rectangle", x: 80, y: 605, width: 1110, height: 50, color: "#6366f1", text: "Community" },
    { id: "7", type: "rectangle", x: 290, y: 710, width: 630, height: 50, color: "#8b5cf6", text: "Innovation" },
  ])
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentShape, setCurrentShape] = useState<Partial<Shape> | null>(null)
  const [selectedShape, setSelectedShape] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [arrowStartShape, setArrowStartShape] = useState<string | null>(null)
  const [propagators, setPropagators] = useState<Map<string, Propagator>>(new Map())
  const [editingArrow, setEditingArrow] = useState<string | null>(null)
  const [eventTargets, setEventTargets] = useState<Map<string, { source: EventTarget; target: EventTarget }>>(new Map())

  // Undo/Redo state - using useRef to avoid stale closure issues
  const historyRef = useRef<Shape[][]>([])
  const historyIndexRef = useRef(-1)
  const [, forceUpdate] = useState({})
  const isInitialized = useRef(false)

  // Initialize history with current shapes on mount
  useEffect(() => {
    if (!isInitialized.current) {
      historyRef.current = [JSON.parse(JSON.stringify(shapes))]
      historyIndexRef.current = 0
      isInitialized.current = true
    }
  }, [])

  // Save state to history (called after any shape modification)
  const saveToHistory = (newShapes: Shape[]) => {
    if (!isInitialized.current) return

    // Truncate history after current index (discard redo states)
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1)

    // Add new state (deep clone to prevent reference issues)
    historyRef.current.push(JSON.parse(JSON.stringify(newShapes)))

    // Limit to 50 states to prevent memory issues
    if (historyRef.current.length > 50) {
      historyRef.current.shift()
    } else {
      historyIndexRef.current++
    }

    setShapes(newShapes)
  }

  // Undo function - go back one state
  const undo = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--
      const previousState = historyRef.current[historyIndexRef.current]
      setShapes(previousState)
      forceUpdate({}) // Force re-render to update button states
    }
  }

  // Redo function - go forward one state
  const redo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++
      const nextState = historyRef.current[historyIndexRef.current]
      setShapes(nextState)
      forceUpdate({}) // Force re-render to update button states
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
      // Ctrl+Shift+Z or Cmd+Shift+Z for redo
      else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ' && e.shiftKey) {
        e.preventDefault()
        redo()
      }
      // Delete key to delete selected shape
      else if (e.key === 'Delete' && selectedShape) {
        e.preventDefault()
        const clicked = shapes.find(s => s.id === selectedShape)
        if (clicked) {
          // Cleanup propagator if deleting an arrow
          if (clicked.type === "arrow") {
            const propagator = propagators.get(clicked.id)
            if (propagator) {
              propagator.dispose()
              setPropagators((prev) => {
                const next = new Map(prev)
                next.delete(clicked.id)
                return next
              })
            }
            setEventTargets((prev) => {
              const next = new Map(prev)
              next.delete(clicked.id)
              return next
            })
          }
          const newShapes = shapes.filter((shape) => shape.id !== clicked.id)
          saveToHistory(newShapes)
          setSelectedShape(null)
        }
      }
      // Escape to deselect
      else if (e.key === 'Escape') {
        e.preventDefault()
        setSelectedShape(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedShape, shapes, propagators])

  // Helper function to get the center of a shape
  const getShapeCenter = (shape: Shape): { x: number; y: number } => {
    if (shape.width && shape.height) {
      return {
        x: shape.x + shape.width / 2,
        y: shape.y + shape.height / 2,
      }
    }
    return { x: shape.x, y: shape.y }
  }

  // Helper function to find shape at coordinates (excludes arrows/lines - used for arrow tool)
  const findShapeAt = (x: number, y: number): Shape | null => {
    return (
      shapes.find((shape) => {
        if (shape.type === "arrow" || shape.type === "line") return false
        if (shape.width && shape.height) {
          return x >= shape.x && x <= shape.x + shape.width && y >= shape.y && y <= shape.y + shape.height
        } else if (shape.type === "text" && shape.text) {
          const textWidth = shape.text.length * 12
          const textHeight = 20
          return x >= shape.x && x <= shape.x + textWidth && y >= shape.y - textHeight && y <= shape.y
        }
        return false
      }) || null
    )
  }

  // Helper function to check if a point is inside/near a shape (includes all shape types)
  const isPointInShape = (x: number, y: number, shape: Shape): boolean => {
    if (shape.width && shape.height) {
      return x >= shape.x && x <= shape.x + shape.width && y >= shape.y && y <= shape.y + shape.height
    } else if (shape.type === "text" && shape.text) {
      const textWidth = shape.text.length * 12
      const textHeight = 20
      return x >= shape.x && x <= shape.x + textWidth && y >= shape.y - textHeight && y <= shape.y
    } else if ((shape.type === "line" || shape.type === "arrow") && shape.x2 && shape.y2) {
      const distance = pointToLineDistance(x, y, shape.x, shape.y, shape.x2, shape.y2)
      return distance < HIT_TOLERANCE
    }
    return false
  }

  // Create a simple propagator for an arrow
  const createPropagatorForArrow = (arrow: Shape) => {
    if (!arrow.sourceShapeId || !arrow.targetShapeId) return

    const sourceShape = shapes.find((s) => s.id === arrow.sourceShapeId)
    const targetShape = shapes.find((s) => s.id === arrow.targetShapeId)

    if (!sourceShape || !targetShape) return

    // Create EventTargets for the connection
    const mockSource = new EventTarget()
    const mockTarget = new EventTarget()

    // Store shape IDs on EventTargets so handler can reference them
    ;(mockSource as any)._shapeId = arrow.sourceShapeId
    ;(mockTarget as any)._shapeId = arrow.targetShapeId

    const expression = arrow.expression || "value: from.value"

    try {
      const propagator = new Propagator({
        source: mockSource,
        target: mockTarget,
        event: "update",
        handler: (from: any, to: any) => {
          // Use setShapes with function to get CURRENT state (avoid stale closure)
          setShapes((currentShapes) => {
            const currentSourceShape = currentShapes.find((s) => s.id === (from as any)._shapeId)
            if (!currentSourceShape || currentSourceShape.value === undefined) {
              console.log("⚠️ No source value to propagate")
              return currentShapes // return unchanged
            }

            const sourceValue = currentSourceShape.value
            const targetId = (to as any)._shapeId

            console.log(`✅ Propagating from ${(from as any)._shapeId} to ${targetId}: ${sourceValue}`)

            // Update target shape with value
            return currentShapes.map((s) =>
              s.id === targetId ? { ...s, value: sourceValue } : s
            )
          })
        },
      })

      // Store both propagator and EventTargets in their respective Maps
      setPropagators((prev) => {
        const next = new Map(prev)
        next.set(arrow.id, propagator)
        return next
      })

      setEventTargets((prev) => {
        const next = new Map(prev)
        next.set(arrow.id, { source: mockSource, target: mockTarget })
        return next
      })
    } catch (error) {
      console.error("Failed to create propagator:", error)
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Clear canvas
    ctx.fillStyle = "#0f172a"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Helper function to draw arrowhead
    const drawArrowhead = (x1: number, y1: number, x2: number, y2: number, color: string) => {
      const headLength = 15
      const angle = Math.atan2(y2 - y1, x2 - x1)

      ctx.fillStyle = color
      ctx.beginPath()
      ctx.moveTo(x2, y2)
      ctx.lineTo(
        x2 - headLength * Math.cos(angle - Math.PI / 6),
        y2 - headLength * Math.sin(angle - Math.PI / 6)
      )
      ctx.lineTo(
        x2 - headLength * Math.cos(angle + Math.PI / 6),
        y2 - headLength * Math.sin(angle + Math.PI / 6)
      )
      ctx.closePath()
      ctx.fill()
    }

    // Draw shapes
    shapes.forEach((shape) => {
      ctx.strokeStyle = shape.color
      ctx.lineWidth = 2
      ctx.fillStyle = shape.color
      ctx.font = "16px sans-serif"

      if (shape.type === "rectangle" && shape.width && shape.height) {
        ctx.strokeRect(shape.x, shape.y, shape.width, shape.height)
        if (shape.text) {
          ctx.fillText(shape.text, shape.x + 10, shape.y + shape.height / 2 + 5)
        }
      } else if (shape.type === "ellipse" && shape.width && shape.height) {
        ctx.beginPath()
        ctx.ellipse(
          shape.x + shape.width / 2,
          shape.y + shape.height / 2,
          shape.width / 2,
          shape.height / 2,
          0,
          0,
          2 * Math.PI,
        )
        ctx.stroke()
        if (shape.text) {
          ctx.fillText(shape.text, shape.x + shape.width / 2 - 50, shape.y + shape.height / 2 + 5)
        }
      } else if (shape.type === "line" && shape.x2 && shape.y2) {
        ctx.beginPath()
        ctx.moveTo(shape.x, shape.y)
        ctx.lineTo(shape.x2, shape.y2)
        ctx.stroke()
      } else if (shape.type === "arrow" && shape.x2 && shape.y2) {
        // Draw arrow line with highlight if selected
        const isSelected = selectedShape === shape.id
        ctx.strokeStyle = isSelected ? "#22d3ee" : shape.color
        ctx.lineWidth = isSelected ? 4 : 2
        ctx.beginPath()
        ctx.moveTo(shape.x, shape.y)
        ctx.lineTo(shape.x2, shape.y2)
        ctx.stroke()
        // Draw arrowhead
        drawArrowhead(shape.x, shape.y, shape.x2, shape.y2, isSelected ? "#22d3ee" : shape.color)
        // Reset line width
        ctx.lineWidth = 2
      } else if (shape.type === "text" && shape.text) {
        ctx.font = "20px sans-serif"
        ctx.fillStyle = shape.color
        ctx.fillText(shape.text, shape.x, shape.y)
      }

      // Highlight selected shape
      if (selectedShape === shape.id && shape.width && shape.height) {
        ctx.strokeStyle = "#22d3ee"
        ctx.lineWidth = 3
        ctx.strokeRect(shape.x - 5, shape.y - 5, shape.width + 10, shape.height + 10)
      }

      // Show connection point (center dot) for shapes that can be connected
      if (shape.type !== "arrow" && shape.type !== "line" && (shape.width || shape.height)) {
        const center = getShapeCenter(shape)
        ctx.fillStyle = "#22d3ee"
        ctx.beginPath()
        ctx.arc(center.x, center.y, 3, 0, 2 * Math.PI)
        ctx.fill()
      }

      // Show value label if shape has a value
      if (shape.value !== undefined && shape.type !== "arrow") {
        ctx.fillStyle = "#fbbf24"
        ctx.font = "bold 12px sans-serif"
        ctx.fillText(`${shape.value}`, shape.x + 5, shape.y - 5)
      }
    })

    // Draw current shape being drawn
    if (currentShape && isDrawing) {
      ctx.strokeStyle = currentShape.color || "#6366f1"
      ctx.lineWidth = 2
      ctx.fillStyle = currentShape.color || "#6366f1"
      ctx.setLineDash([5, 5]) // Dashed line for preview

      if (currentShape.type === "rectangle" && currentShape.width && currentShape.height) {
        ctx.strokeRect(currentShape.x || 0, currentShape.y || 0, currentShape.width, currentShape.height)
      } else if (currentShape.type === "line" && currentShape.x2 && currentShape.y2) {
        ctx.beginPath()
        ctx.moveTo(currentShape.x || 0, currentShape.y || 0)
        ctx.lineTo(currentShape.x2, currentShape.y2)
        ctx.stroke()
      } else if (currentShape.type === "arrow" && currentShape.x2 && currentShape.y2) {
        ctx.beginPath()
        ctx.moveTo(currentShape.x || 0, currentShape.y || 0)
        ctx.lineTo(currentShape.x2, currentShape.y2)
        ctx.stroke()
        drawArrowhead(currentShape.x || 0, currentShape.y || 0, currentShape.x2, currentShape.y2, currentShape.color || "#6366f1")
      }

      ctx.setLineDash([]) // Reset to solid line
    }
  }, [shapes, selectedShape, currentShape, isDrawing])

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (tool === "select") {
      // Find clicked shape (including arrows)
      const clicked = shapes.find((shape) => isPointInShape(x, y, shape))
      setSelectedShape(clicked?.id || null)

      // If a shape was clicked, prepare for dragging (but not for arrows - they're connections)
      if (clicked && clicked.type !== "arrow" && clicked.type !== "line") {
        setIsDragging(true)
        setDragOffset({
          x: x - clicked.x,
          y: y - clicked.y,
        })
      }
    } else if (tool === "erase") {
      // Find and delete clicked shape
      const clicked = shapes.find((shape) => isPointInShape(x, y, shape))

      if (clicked) {
        // Cleanup propagator if deleting an arrow
        if (clicked.type === "arrow") {
          const propagator = propagators.get(clicked.id)
          if (propagator) {
            propagator.dispose()
            setPropagators((prev) => {
              const next = new Map(prev)
              next.delete(clicked.id)
              return next
            })
          }
          setEventTargets((prev) => {
            const next = new Map(prev)
            next.delete(clicked.id)
            return next
          })
        }
        const newShapes = shapes.filter((shape) => shape.id !== clicked.id)
        saveToHistory(newShapes)
        setSelectedShape(null)
      }
    } else if (tool === "text") {
      // Prompt for text input
      const text = prompt("Enter text:")
      if (text) {
        const newShape: Shape = {
          id: Date.now().toString(),
          type: "text",
          x,
          y,
          text,
          color: "#6366f1",
        }
        saveToHistory([...shapes, newShape])
      }
    } else if (tool === "arrow") {
      // Special handling for arrow tool - snap to shapes
      const shapeAtClick = findShapeAt(x, y)

      if (shapeAtClick) {
        // Clicked on a shape - start arrow from its center
        setArrowStartShape(shapeAtClick.id)
        const center = getShapeCenter(shapeAtClick)
        setIsDrawing(true)
        setCurrentShape({
          id: Date.now().toString(),
          type: "arrow",
          x: center.x,
          y: center.y,
          color: "#6366f1",
          sourceShapeId: shapeAtClick.id,
        })
      }
    } else if (tool === "draw" || tool === "rectangle") {
      setIsDrawing(true)
      setCurrentShape({
        id: Date.now().toString(),
        type: tool === "rectangle" ? "rectangle" : "line",
        x,
        y,
        color: "#6366f1",
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Handle dragging selected shape
    if (isDragging && selectedShape && tool === "select") {
      setShapes(
        shapes.map((shape) => {
          if (shape.id === selectedShape) {
            const newX = x - dragOffset.x
            const newY = y - dragOffset.y

            // For lines and arrows, also update the end points
            if ((shape.type === "line" || shape.type === "arrow") && shape.x2 !== undefined && shape.y2 !== undefined) {
              const dx = newX - shape.x
              const dy = newY - shape.y
              return {
                ...shape,
                x: newX,
                y: newY,
                x2: shape.x2 + dx,
                y2: shape.y2 + dy,
              }
            }

            return {
              ...shape,
              x: newX,
              y: newY,
            }
          }
          return shape
        })
      )
      return
    }

    // Handle drawing new shapes
    if (isDrawing && currentShape) {
      if (currentShape.type === "rectangle") {
        setCurrentShape({
          ...currentShape,
          width: x - (currentShape.x || 0),
          height: y - (currentShape.y || 0),
        })
      } else if (currentShape.type === "arrow") {
        // For arrows, snap to target shape center if hovering over one
        const shapeAtMouse = findShapeAt(x, y)
        if (shapeAtMouse && shapeAtMouse.id !== arrowStartShape) {
          const center = getShapeCenter(shapeAtMouse)
          setCurrentShape({
            ...currentShape,
            x2: center.x,
            y2: center.y,
            targetShapeId: shapeAtMouse.id,
          })
        } else {
          setCurrentShape({
            ...currentShape,
            x2: x,
            y2: y,
            targetShapeId: undefined,
          })
        }
      } else if (currentShape.type === "line") {
        setCurrentShape({
          ...currentShape,
          x2: x,
          y2: y,
        })
      }
    }
  }

  const handleMouseUp = () => {
    if (isDrawing && currentShape) {
      let newShape = currentShape as Shape

      // Normalize rectangles with negative dimensions (drawn upward/leftward)
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

      // If it's an arrow with both source and target, create a propagator
      const newShapesArray = [...shapes, newShape]
      if (newShape.type === "arrow" && newShape.sourceShapeId && newShape.targetShapeId) {
        newShape.expression = "value: from.value"  // Default expression
        saveToHistory(newShapesArray)
        // Create propagator for this arrow
        setTimeout(() => createPropagatorForArrow(newShape), 0)
      } else {
        saveToHistory(newShapesArray)
      }

      setCurrentShape(null)
    } else if (isDragging) {
      // Save to history when dragging stops
      saveToHistory(shapes)
    }
    setIsDrawing(false)
    setIsDragging(false)
    setArrowStartShape(null)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-slate-700">
        <h1 className="text-xl font-semibold text-cyan-400">Interactive Canvas</h1>
        <Link href="/" className="text-cyan-400 hover:text-cyan-300 transition-colors">
          ← Back to Home
        </Link>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Canvas */}
        <div className="flex-1 relative">
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
          {currentShape && (
            <div className="absolute top-4 left-4 bg-slate-800 px-4 py-2 rounded-lg text-sm">
              Drawing {currentShape.type}...
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-slate-800 p-6 space-y-6 overflow-y-auto">
          <div>
            <h2 className="text-lg font-semibold text-cyan-400 mb-4">FolkJS Canvas</h2>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                • Use toolbar to <span className="text-white font-medium">draw</span> and create shapes
              </li>
              <li>
                • Click and drag to <span className="text-white font-medium">move</span> elements
              </li>
              <li>
                • Double-click text to <span className="text-white font-medium">edit</span>
              </li>
              <li>
                • Use <span className="text-white font-medium">select</span> tool to interact
              </li>
              <li>
                • Press <kbd className="px-2 py-1 bg-slate-700 rounded text-xs">Space</kbd> for{" "}
                <span className="text-white font-medium">fullscreen</span>
              </li>
            </ul>
          </div>

          {/* Toolbar */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-400">Tools</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "select", label: "Select" },
                { id: "draw", label: "Draw" },
                { id: "erase", label: "Erase" },
                { id: "rectangle", label: "Rectangle" },
                { id: "text", label: "Text" },
                { id: "arrow", label: "Arrow" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTool(t.id as Tool)}
                  className={`px-3 py-2 rounded text-sm transition-colors ${
                    tool === t.id ? "bg-cyan-500 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Arrow Expression Editor */}
          {selectedShape && shapes.find((s) => s.id === selectedShape)?.type === "arrow" && (
            <div className="space-y-2 p-4 bg-slate-700 rounded">
              <h3 className="text-sm font-semibold text-cyan-400">Live Arrow Properties</h3>
              {(() => {
                const arrow = shapes.find((s) => s.id === selectedShape)
                if (!arrow) return null

                const sourceShape = arrow.sourceShapeId
                  ? shapes.find((s) => s.id === arrow.sourceShapeId)
                  : null
                const targetShape = arrow.targetShapeId
                  ? shapes.find((s) => s.id === arrow.targetShapeId)
                  : null

                return (
                  <div className="space-y-2 text-xs">
                    <div className="text-slate-300">
                      <span className="text-white font-medium">From:</span>{" "}
                      {sourceShape?.text || sourceShape?.id || "None"}
                    </div>
                    <div className="text-slate-300">
                      <span className="text-white font-medium">To:</span>{" "}
                      {targetShape?.text || targetShape?.id || "None"}
                    </div>
                    {arrow.sourceShapeId && arrow.targetShapeId && (
                      <>
                        <div className="text-slate-300">
                          <label className="text-white font-medium block mb-1">Expression:</label>
                          <input
                            type="text"
                            value={arrow.expression || "value: from.value"}
                            onChange={(e) => {
                              setShapes(
                                shapes.map((s) =>
                                  s.id === arrow.id ? { ...s, expression: e.target.value } : s,
                                ),
                              )
                            }}
                            onBlur={() => {
                              // Save to history when user finishes editing
                              saveToHistory(shapes)
                            }}
                            className="w-full px-2 py-1 bg-slate-800 text-white rounded text-xs"
                            placeholder="value: from.value * 2"
                          />
                        </div>
                        <button
                          onClick={() => {
                            // Get EventTargets from the Map
                            const targets = eventTargets.get(arrow.id)
                            const sourceShape = shapes.find((s) => s.id === arrow.sourceShapeId)

                            if (!targets) {
                              console.warn("⚠️ No EventTarget found. Arrow may need to be re-created.")
                              alert("This arrow needs to be re-drawn. Please delete and create it again.")
                              return
                            }

                            if (!sourceShape || sourceShape.value === undefined) {
                              console.warn("⚠️ Source shape has no value set")
                              alert(`Please set a value on "${sourceShape?.text || "the source shape"}" first.`)
                              return
                            }

                            // Trigger the propagation
                            targets.source.dispatchEvent(new Event("update"))
                          }}
                          className="w-full px-2 py-1 bg-cyan-600 hover:bg-cyan-700 rounded text-xs transition-colors"
                        >
                          Test Propagation
                        </button>
                      </>
                    )}
                  </div>
                )
              })()}
            </div>
          )}

          {/* Shape Value Editor */}
          {selectedShape && shapes.find((s) => s.id === selectedShape)?.type !== "arrow" && (
            <div className="space-y-2 p-4 bg-slate-700 rounded">
              <h3 className="text-sm font-semibold text-cyan-400">Shape Properties</h3>
              {(() => {
                const shape = shapes.find((s) => s.id === selectedShape)
                if (!shape) return null

                return (
                  <div className="space-y-2 text-xs">
                    <div className="text-slate-300">
                      <label className="text-white font-medium block mb-1">Value:</label>
                      <input
                        type="number"
                        value={shape.value || 0}
                        onChange={(e) => {
                          setShapes(
                            shapes.map((s) =>
                              s.id === shape.id ? { ...s, value: parseFloat(e.target.value) || 0 } : s,
                            ),
                          )
                        }}
                        onBlur={() => {
                          // Save to history when user finishes editing
                          saveToHistory(shapes)
                        }}
                        className="w-full px-2 py-1 bg-slate-800 text-white rounded text-xs"
                      />
                    </div>
                    <div className="text-slate-300 text-xs">
                      Arrows connected from this shape will propagate this value.
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                onClick={undo}
                disabled={historyIndexRef.current <= 0}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed rounded text-sm transition-colors"
                title="Undo (Ctrl+Z)"
              >
                ↶ Undo
              </button>
              <button
                onClick={redo}
                disabled={historyIndexRef.current >= historyRef.current.length - 1}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed rounded text-sm transition-colors"
                title="Redo (Ctrl+Shift+Z)"
              >
                ↷ Redo
              </button>
            </div>
            <button
              onClick={toggleFullscreen}
              className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors"
            >
              {isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            </button>
            <button
              onClick={() => saveToHistory([])}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
            >
              Clear Canvas
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
