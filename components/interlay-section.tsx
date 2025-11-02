import { Network, Layers, Sparkles } from "lucide-react"

export function InterlaySection() {
  return (
    <section className="py-16 md:py-24 border-b border-border bg-muted/20">
      <div className="container px-4 mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary mb-4">
                The Solution
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">The Space Between the Apps</h2>
            </div>

            <p className="text-xl text-muted-foreground leading-relaxed">
              A research initiative to decompose app silos by creating an
              <span className="text-foreground font-semibold"> interface integration domain</span>. Not another app—a
              supra-structure for interoperation, built on{" "}
              <a href="https://folkjs.org" className="text-primary hover:underline">
                FolkJS
              </a>{" "}
              as the computational substrate.
            </p>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Network className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Networked Topology</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Contrast to app-centric software. Emphasizing interconnectivity and user agency over vendor control.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Layers className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Exfrastructure</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Like mycelium binding ecosystems together—decentralized, adaptive networks operating beyond
                    traditional infrastructure.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Emergent Interconnections</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Named for "leylines"—a metaphor for emergent connections across digital domains that self-organize
                    and flow freely.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-primary/20 p-8 flex items-center justify-center">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                {/* Central node */}
                <circle cx="100" cy="100" r="8" fill="currentColor" className="text-primary" />

                {/* Outer nodes */}
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                  const rad = (angle * Math.PI) / 180
                  const x = 100 + 60 * Math.cos(rad)
                  const y = 100 + 60 * Math.sin(rad)
                  return (
                    <g key={i}>
                      <line
                        x1="100"
                        y1="100"
                        x2={x}
                        y2={y}
                        stroke="currentColor"
                        strokeWidth="1"
                        className="text-primary/30"
                      />
                      <circle cx={x} cy={y} r="6" fill="currentColor" className="text-primary/70" />
                    </g>
                  )
                })}

                {/* Connecting lines between outer nodes */}
                {[0, 90, 180, 270].map((angle, i) => {
                  const rad1 = (angle * Math.PI) / 180
                  const rad2 = ((angle + 90) * Math.PI) / 180
                  const x1 = 100 + 60 * Math.cos(rad1)
                  const y1 = 100 + 60 * Math.sin(rad1)
                  const x2 = 100 + 60 * Math.cos(rad2)
                  const y2 = 100 + 60 * Math.sin(rad2)
                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="currentColor"
                      strokeWidth="0.5"
                      className="text-primary/20"
                    />
                  )
                })}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
