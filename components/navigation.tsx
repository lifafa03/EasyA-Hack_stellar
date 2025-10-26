"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { WalletConnectButton } from "@/components/wallet-connect-kit"
import { NetworkIndicator } from "@/components/stellar"

export function Navigation() {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 bg-black backdrop-blur-xl border-b border-white/10"
    >
      {/* Subtle gradient background matching landing page */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#4ade80]/10 rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto px-4 py-4 relative z-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center shadow-lg shadow-[#4ade80]/30">
              <span className="text-white font-bold text-xl">S+</span>
            </div>
            <span className="font-bold text-xl text-white">StellarWork+</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/browse" className="text-gray-300 hover:text-[#4ade80] transition-colors">
              Find Projects
            </Link>
            <Link href="/post-project" className="text-gray-300 hover:text-[#4ade80] transition-colors">
              Fund Projects
            </Link>
            <Link href="/dashboard" className="text-gray-300 hover:text-[#4ade80] transition-colors">
              Dashboard
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <NetworkIndicator className="hidden md:flex" />
            <WalletConnectButton />
          </div>
        </div>
      </div>
    </motion.nav>
  )
}
