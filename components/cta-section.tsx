import { ArrowRight, Github, FileText, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function CTASection() {
  return (
    <section className="py-24 md:py-32">
      <div className="container px-4 mx-auto max-w-6xl">
        <div className="space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-balance">Building Necessary Infrastructure</h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              If we want to build a more open, equitable, and adaptable digital future, we need open source
              supra-structure and substrates like{" "}
              <a href="https://folkjs.org" className="text-primary hover:underline">
                FolkJS
              </a>{" "}
              that enable post-appitalism.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-8 bg-card border-border hover:border-primary/50 transition-colors group cursor-pointer">
              <Github className="h-10 w-10 text-primary mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-semibold mb-3">Explore & Contribute</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                Dive into the open source primitives we're developing. Experiment with FolkJS, fork, and build.
              </p>
              <div className="flex items-center text-primary text-sm font-medium">
                View on GitHub <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </Card>

            <Card className="p-8 bg-card border-border hover:border-primary/50 transition-colors group cursor-pointer">
              <FileText className="h-10 w-10 text-primary mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-semibold mb-3">Read the Research</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                Deep dive into the technical foundations, philosophy, and vision behind post-appitalism.
              </p>
              <div className="flex items-center text-primary text-sm font-medium">
                Read the memo <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </Card>

            <Card className="p-8 bg-card border-border hover:border-primary/50 transition-colors group cursor-pointer">
              <Mail className="h-10 w-10 text-primary mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-semibold mb-3">Support the Work</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                Interested in funding or collaborating? Let's build the future together.
              </p>
              <div className="flex items-center text-primary text-sm font-medium">
                Get in touch <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </Card>
          </div>

          <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 rounded-2xl p-12 text-center">
            <h3 className="text-3xl md:text-4xl font-bold mb-6 text-balance">
              Imagine an internet where information flows as freely as ideas
            </h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join us in building the exfrastructure for a post-appitalist future, powered by substrates like FolkJS.
            </p>
            <Button size="lg" className="text-lg px-8">
              Join the Movement
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
