import { Lock, Zap, TrendingDown } from "lucide-react"
import { Card } from "@/components/ui/card"

export function ProblemSection() {
  return (
    <section className="py-24 md:py-32 border-b border-border">
      <div className="container px-4 mx-auto max-w-6xl">
        <div className="space-y-16">
          <div className="max-w-3xl">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">The Tyranny of App Silos</h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Why do we need 10 different apps to talk to the same friends? App silos create terrible UX, fragmenting
              our digital identities, data, and workflows. But this isn't an accident—it's a feature of{" "}
              <span className="text-primary font-semibold">appitalism</span> (and ultimately of capitalism).
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-8 bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-colors">
              <Lock className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Artificial Enclosure</h3>
              <p className="text-muted-foreground leading-relaxed">
                Data locked behind walled gardens, controlled by vendors who prioritize lock-in over user empowerment.
              </p>
            </Card>

            <Card className="p-8 bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-colors">
              <TrendingDown className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Short Time Horizons</h3>
              <p className="text-muted-foreground leading-relaxed">
                Consumer apps expire like plastic products. Your data becomes useless when these corporations inevitably
                shut down.
              </p>
            </Card>

            <Card className="p-8 bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-colors">
              <Zap className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Structural Enforcement</h3>
              <p className="text-muted-foreground leading-relaxed">
                These aren't bugs—they're features. Business models depend on artificial scarcity and producer control.
              </p>
            </Card>
          </div>

          <div className="bg-muted/30 border border-border rounded-lg p-8 md:p-12">
            <blockquote className="text-2xl md:text-3xl font-medium text-balance leading-relaxed">
              "App silos are not accidental but structurally enforced by business models that prioritize{" "}
              <span className="text-primary">enclosure, lock-in, and artificial scarcity</span> over user empowerment."
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  )
}
