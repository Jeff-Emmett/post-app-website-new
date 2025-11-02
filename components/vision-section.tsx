import { Sprout, Users, Globe } from "lucide-react"

export function VisionSection() {
  return (
    <section className="py-24 md:py-32 border-b border-border bg-muted/20">
      <div className="container px-4 mx-auto max-w-6xl">
        <div className="space-y-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">The Post-Appitalist Horizon</h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              A paradigm where user-controlled composability replaces vendor-controlled silos. Where collaboration
              thrives beyond the constraints of platform capitalism.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Sprout className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Living Ecosystems</h3>
              <p className="text-muted-foreground leading-relaxed">
                Not plastic corporations that expire, but living, breathing, emergent ecosystems that adapt and grow.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">User Sovereignty</h3>
              <p className="text-muted-foreground leading-relaxed">
                Tools that serve people, not profit margins. Where users control their data, workflows, and digital
                futures.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Globe className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Commons-Aligned</h3>
              <p className="text-muted-foreground leading-relaxed">
                Mutualist, open-source futures where collaboration and shared resources replace extraction and
                enclosure.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-8 md:p-12">
            <div className="max-w-3xl mx-auto space-y-6">
              <h3 className="text-3xl font-bold text-balance">Beyond Apps: A Supra-Structure</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                This isn't about building another app—it's about creating the supra-structure that enables ecosystems of
                tools to self-organize and flow freely. Built on substrates like{" "}
                <a href="https://folkjs.org" className="text-primary hover:underline">
                  FolkJS
                </a>
                , where information moves as freely as ideas should.
              </p>
              <div className="pt-4">
                <div className="inline-block px-4 py-2 rounded-lg bg-background/50 border border-border text-sm font-mono">
                  infrastructure → exfrastructure → supra-structure
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
