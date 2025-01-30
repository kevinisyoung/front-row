import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import SupabaseProvider from "./supabase-provider"
import "./globals.css"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "FrontRow",
  description: "Post-concert photo gallery platform",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  try {
    console.log("RootLayout rendered")
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      console.log("No session found, signing in anonymously...")
      await supabase.auth.signInAnonymously()
      console.log("Signed in anonymously")
    }

    return (
      <html lang="en">
        <body>
          <SupabaseProvider session={session}>{children}</SupabaseProvider>
        </body>
      </html>
    )
  } catch (error) {
    console.error("Error in RootLayout:", error)
    // Still render the layout even if there's an error
    return (
      <html lang="en">
        <body>
          <SupabaseProvider session={null}>{children}</SupabaseProvider>
        </body>
      </html>
    )
  }
}

