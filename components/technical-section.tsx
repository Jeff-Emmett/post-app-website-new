import { Code2, Database, Workflow } from "lucide-react"
import { Card } from "@/components/ui/card"

export function TechnicalSection() {
  return (
    <section className="py-24 md:py-32 border-b border-border">
      <div className="container px-4 mx-auto max-w-6xl">
        <div className="space-y-16">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">Technical & Philosophical Foundations</h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              A shift from software as a tool to software as a medium—malleable, composable, and user-controlled.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 bg-card border-border">
              <Code2 className="h-12 w-12 text-primary mb-6" />
              <h3 className="text-2xl font-semibold mb-4">Computational Media</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Software that is malleable and composable, enabling users to shape their digital environments.
              </p>
              <div className="text-sm text-primary font-mono">software → medium</div>
            </Card>

            <Card className="p-8 bg-card border-border">
              <Database className="h-12 w-12 text-primary mb-6" />
              <h3 className="text-2xl font-semibold mb-4">Information Substrates</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Contextual containers like spreadsheets or canvases that support flexible interaction and data flow.
              </p>
              <div className="text-sm text-primary font-mono">containers → substrates</div>
            </Card>

            <Card className="p-8 bg-card border-border">
              <Workflow className="h-12 w-12 text-primary mb-6" />
              <h3 className="text-2xl font-semibold mb-4">Novel Primitives</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Scoped Propagators and Semantic Morphisms—new building blocks for modular, interoperable workflows.
              </p>
              <div className="text-sm text-primary font-mono">primitives → composition</div>
            </Card>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-8 md:p-12">
            <div className="max-w-3xl mx-auto space-y-6">
              <h3 className="text-3xl font-bold text-balance">FolkJS: The Computational Substrate</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                <a href="https://folkjs.org" className="text-primary hover:underline font-semibold">
                  FolkJS
                </a>{" "}
                provides the necessary computational foundation for post-appitalism. It's a malleable, user-programmable
                substrate that enables the kind of fluid, interconnected digital ecosystems we envision.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Without substrates like FolkJS, we remain trapped in vendor-controlled silos. FolkJS gives users the
                power to compose, extend, and interconnect their tools—making post-appitalist futures technically
                feasible.
              </p>
              <div className="pt-4">
                <a
                  href="https://folkjs.org"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors"
                >
                  Explore FolkJS →
                </a>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-8 md:p-12">
            <h3 className="text-2xl font-semibold mb-6">Key Concepts</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-primary mb-2">Scoped Propagators</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Enable data to flow between contexts while maintaining appropriate boundaries and transformations.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-primary mb-2">Semantic Morphisms</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Allow meaning-preserving transformations as information moves between different representational
                  systems.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-primary mb-2">Canvas Primitives</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Foundational building blocks for spatial, visual interfaces that support direct manipulation and
                  composition.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-primary mb-2">Local-First Architecture</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  User data lives on their devices first, with optional synchronization—ensuring ownership and
                  resilience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
