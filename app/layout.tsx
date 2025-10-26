import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navigation } from "@/components/navigation"
import { ThemeProvider } from "@/components/theme-provider"
import { WalletKitProvider } from "@/hooks/use-wallet-kit"
import { WalletProvider } from "@/hooks/use-wallet"
import { Toaster } from "@/components/ui/sonner"
import { Footer } from "@/components/stellar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "StellarWork+ | Decentralized Marketplace",
  description: "Where work meets funding - Post projects, hire talent, crowdfund ideas",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className="bg-black">
      <head>
        <link rel="stylesheet" href="https://unpkg.com/@creit.tech/stellar-wallets-kit/build/stellar-wallets-kit.min.css" />
      </head>
      <body className={`${inter.className} bg-black min-h-screen flex flex-col`}>
        <ThemeProvider>
          <WalletKitProvider>
            <WalletProvider>
              <Navigation />
              <div className="flex-1">
                {children}
              </div>
              <Footer />
              <Toaster position="top-right" richColors />
            </WalletProvider>
          </WalletKitProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
