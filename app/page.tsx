import { HeroSection } from "@/components/hero-section"
import { ProblemSection } from "@/components/problem-section"
import { InterlaySection } from "@/components/interlay-section"
import { TechnicalSection } from "@/components/technical-section"
import { VisionSection } from "@/components/vision-section"
import { WhyNowSection } from "@/components/why-now-section"
import { CTASection } from "@/components/cta-section"
import { NewsletterSignup } from "@/components/newsletter-signup"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <HeroSection />
      <ProblemSection />
      <InterlaySection />
      <TechnicalSection />
      <VisionSection />
      <WhyNowSection />
      <CTASection />
      <NewsletterSignup />
      <Footer />
    </main>
  )
}
