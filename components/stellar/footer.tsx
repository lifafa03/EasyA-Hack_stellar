"use client"

import Link from "next/link"
import { StellarBadge } from "./stellar-logo"

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black backdrop-blur-sm relative">
      {/* Subtle gradient background matching landing page */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#4ade80]/20 rounded-full blur-3xl" />
        <div className="absolute top-0 left-1/2 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center shadow-lg shadow-[#4ade80]/30">
                <span className="text-white font-bold text-sm">S+</span>
              </div>
              <span className="font-bold text-lg text-white">StellarWork+</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Decentralized marketplace powered by blockchain technology
            </p>
            <StellarBadge />
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Platform</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/browse" className="text-gray-400 hover:text-[#4ade80] transition-colors">
                  Browse Projects
                </Link>
              </li>
              <li>
                <Link href="/post-project" className="text-gray-400 hover:text-[#4ade80] transition-colors">
                  Post Project
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-gray-400 hover:text-[#4ade80] transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/how-it-works" className="text-gray-400 hover:text-[#4ade80] transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <a
                  href="https://stellar.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-[#4ade80] transition-colors"
                >
                  About Stellar
                </a>
              </li>
              <li>
                <a
                  href="https://stellar.expert"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-[#4ade80] transition-colors"
                >
                  Blockchain Explorer
                </a>
              </li>
              <li>
                <a
                  href="https://developers.stellar.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-[#4ade80] transition-colors"
                >
                  Developer Docs
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-[#4ade80] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-[#4ade80] transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} StellarWork+. All rights reserved.
          </p>
          <p className="text-xs text-gray-400">
            Built on Stellar blockchain for secure, transparent transactions
          </p>
        </div>
      </div>
    </footer>
  )
}
