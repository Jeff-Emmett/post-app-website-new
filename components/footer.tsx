import { Github, Twitter, Mail } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/20">
      <div className="container px-4 py-12 mx-auto max-w-6xl">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Post-Appitalism</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Building the exfrastructure for interconnected digital ecosystems.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Research</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Technical Memo
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Canvas Primitives
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Publications
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">FolkJS</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="https://folkjs.org" className="hover:text-primary transition-colors">
                  FolkJS.org
                </a>
              </li>
              <li>
                <a href="https://folkjs.org/docs" className="hover:text-primary transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="https://github.com/folk-systems" className="hover:text-primary transition-colors">
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Connect</h4>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© 2025 Post-Appitalism Research. Open source and commons-aligned.</p>
          <p className="text-xs">No venture capital was harmed in the making of this website.</p>
        </div>
      </div>
    </footer>
  )
}
