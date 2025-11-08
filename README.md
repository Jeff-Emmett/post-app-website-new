# Post-Appitalism Website

Interactive website and canvas demo for **Threshold-Based Flow Funding** - a novel resource allocation mechanism for decentralized networks.

[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/s5q7XzkHh6S)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/jeff-emmetts-projects/v0-post-appitalism-website)

---

## Quick Start

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Open browser
http://localhost:3000
```

**Main Pages:**
- `/` - Marketing site with vision, technical details, and call-to-action
- `/italism` - Interactive canvas demo with live propagators

---

## Project Structure

```
post-app-website-new/
├── app/
│   ├── page.tsx                    # Main marketing landing page
│   ├── italism/page.tsx            # Interactive canvas demo (769 lines)
│   └── layout.tsx
├── components/
│   ├── hero-section.tsx            # Marketing sections
│   ├── problem-section.tsx
│   ├── interlay-section.tsx
│   ├── technical-section.tsx
│   ├── vision-section.tsx
│   └── ui/                         # shadcn/ui components
├── CANVAS_DEVELOPMENT_GUIDE.md     # ⭐ Complete technical documentation
└── README.md                       # This file
```

---

## What Is This?

This project is part of the **Post-Appitalism** movement, demonstrating principles of:

- **Malleable Software**: Users reshape tools to their needs
- **Flow-Based Economics**: Resource allocation via threshold-based overflow
- **Collaborative Creation**: Multiple authors, shared artifacts
- **Open & Inspectable**: Transparent, remixable, hackable

### The `/italism` Canvas

An interactive demo embodying these principles through a **live programming canvas** where:

- **Arrows are functional connections** that propagate data between shapes
- **Visual = Executable**: What you draw is what computes
- **Scoped Propagators**: Computation happens on edges (connections), not just nodes
- **Flow Funding Visualization**: Simulate resource allocation networks

**Status**: Phase 1 Complete ✅
- Draw arrows between shapes
- Set values on shapes
- Propagate values through arrows
- Expression editing (basic)

See **[CANVAS_DEVELOPMENT_GUIDE.md](./CANVAS_DEVELOPMENT_GUIDE.md)** for complete technical details.

---

## Technology Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **Language**: TypeScript 5
- **Package Manager**: pnpm
- **Canvas**: HTML5 Canvas with custom event system
- **Propagators**: Inline FolkJS-inspired implementation (future: migrate to `@folkjs/propagators`)

---

## Key Features

### Marketing Site (/)

- Hero section with vision statement
- Problem/solution narrative
- Interlay integration details
- Technical deep-dive on Flow Funding
- Vision for the future
- Call-to-action for early access

### Interactive Canvas (/italism)

**Tools:**
- **Select**: Click shapes to select, drag to move
- **Draw**: Freeform lines
- **Rectangle**: Draw rectangles (any direction)
- **Arrow**: Connect shapes with functional arrows
- **Text**: Add text labels
- **Erase**: Delete shapes (cleans up propagators)

**Features:**
- Shape value editor (set numeric values)
- Arrow expression editor (define transformations)
- Test Propagation button (trigger data flow)
- Visual arrow highlighting on selection
- Snap-to-center arrow endpoints
- Fullscreen mode

---

## Development

### Commands

```bash
pnpm dev        # Run dev server (http://localhost:3000)
pnpm build      # Build for production
pnpm start      # Run production server
pnpm lint       # Lint code
```

### Making Changes to Canvas

1. **Read the guide**: [CANVAS_DEVELOPMENT_GUIDE.md](./CANVAS_DEVELOPMENT_GUIDE.md)
2. **File to edit**: `app/italism/page.tsx`
3. **Key discoveries**: State management patterns, hit detection algorithms, debugging techniques
4. **Testing workflow**: Make ONE change, test, commit, repeat

### Known Issues & Solutions

See "Known Issues & Solutions" section in [CANVAS_DEVELOPMENT_GUIDE.md](./CANVAS_DEVELOPMENT_GUIDE.md).

---

## Roadmap

### Phase 1: Live Arrows ✅ (Current)
- Arrow drawing and selection
- Propagator system
- Value propagation
- Expression editing

### Phase 2: Enhanced Propagators
- Expression parser (evaluate `"value: from.value * 2"`)
- Arrow auto-update when shapes move
- Visual flow animation
- Bi-directional propagation

### Phase 3: Polish & UX
- Keyboard shortcuts
- Undo/redo system
- Persistence (localStorage/JSON export)
- Color picker
- Improved text editing

### Phase 4: FolkJS Migration
- Use real `@folkjs/propagators` package
- Migrate to `@folkjs/canvas` (DOM-based shapes)
- Integrate `@folkjs/geometry`
- Add `@folkjs/collab` for real-time collaboration

### Phase 5: Flow Funding Visualization
- Visual balance/threshold display
- Overflow animation
- Network simulation
- Integration with actual Flow Funding contracts

### Phase 6: Scoped Propagators
- Edge-based computation
- Local state on arrows
- Constraint satisfaction
- Complex data transformations

---

## Philosophy

This project aligns with the **CLAUDE.md** ultrathink methodology:

> "Technology alone is not enough. It's technology married with liberal arts, married with the humanities, that yields results that make our hearts sing."

Every feature should:
- Work seamlessly with human workflow
- Feel intuitive, not mechanical
- Solve the **real** problem, not just the stated one
- Leave the codebase better than we found it

See `../../../CLAUDE.md` for complete development philosophy.

---

## Related Resources

- **FolkJS Library**: `../../folkjs/` (propagators, canvas, geometry packages)
- **Flow Funding Paper**: `../../../threshold-based-flow-funding.md`
- **FolkJS Demos**: `../../folkjs/website/demos/propagators/`
- **Scoped Propagators Article**: https://www.orionreed.com/posts/scoped-propagators

---

## Deployment

**Live Site**: https://vercel.com/jeff-emmetts-projects/v0-post-appitalism-website

**v0 Chat**: https://v0.app/chat/s5q7XzkHh6S

Changes deployed via v0.app are automatically synced to this repository and deployed via Vercel.

---

## Contributing

This project demonstrates principles of **malleable, collaborative software**. To contribute:

1. Read [CANVAS_DEVELOPMENT_GUIDE.md](./CANVAS_DEVELOPMENT_GUIDE.md)
2. Understand the philosophy in `../../../CLAUDE.md`
3. Make changes that embody Post-Appitalism principles
4. Test thoroughly (one change at a time!)
5. Document your discoveries

---

## License

See repository root for license information.

---

**Remember**: This isn't just a drawing app. It's a demonstration of **what software could be** - malleable, collaborative, and alive. A tool that makes the abstract concrete, the invisible visible, and the future tangible.
