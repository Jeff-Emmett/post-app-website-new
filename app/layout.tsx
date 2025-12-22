import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL("https://post-app.net"),
  title: "Project Interlay | Post-Appitalism",
  description: "Weaving a post-appitalist future. Decomposing the data silos of capitalist business models.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌊</text></svg>",
        type: "image/svg+xml",
      },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://post-app.net",
    title: "Project Interlay | Post-Appitalism",
    description: "Weaving a post-appitalist future. Decomposing the data silos of capitalist business models.",
    siteName: "Project Interlay",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Project Interlay - Weaving a post-appitalist future",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Project Interlay | Post-Appitalism",
    description: "Weaving a post-appitalist future. Decomposing the data silos of capitalist business models.",
    images: ["/og-image.jpg"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
