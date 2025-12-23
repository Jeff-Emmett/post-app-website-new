"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

const NEWSLETTER_API = "https://newsletter.jeffemmett.com/api/subscribe"
const LIST_UUID = "0a4810a2-13c7-4ba9-a65b-bc2251283298" // Post-Appitalism list

export function NewsletterSignup() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) return

    setStatus("loading")

    try {
      const response = await fetch(`${NEWSLETTER_API}/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          list_uuid: LIST_UUID,
        }),
      })

      if (response.ok) {
        setStatus("success")
        setMessage("Welcome to the post-app era. Big things loading...")
        setEmail("")
      } else {
        throw new Error("Subscription failed")
      }
    } catch {
      setStatus("error")
      setMessage("Something went wrong. Please try again.")
    }
  }

  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">
              Join the Post-Appitalism Movement
            </h2>
            <p className="text-muted-foreground">
              Subscribe for updates on building post-capitalist applications
              and regenerative digital infrastructure.
            </p>
          </div>

          {status === "success" ? (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400">
              {message}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <Button
                type="submit"
                disabled={status === "loading"}
                className="px-6"
              >
                {status === "loading" ? "Subscribing..." : "Subscribe"}
              </Button>
            </form>
          )}

          {status === "error" && (
            <p className="text-sm text-red-500">{message}</p>
          )}

          <p className="text-xs text-muted-foreground">
            No spam, unsubscribe anytime. We respect your privacy.
          </p>
        </div>
      </div>
    </section>
  )
}
