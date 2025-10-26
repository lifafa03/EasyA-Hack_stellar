"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Plus, ArrowDownToLine } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { WalletConnectButton } from "@/components/wallet-connect-kit"
import { NetworkIndicator } from "@/components/stellar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useWallet } from "@/hooks/use-wallet"

export function Navigation() {
  const { theme, toggleTheme } = useTheme()
  const { publicKey } = useWallet()

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/50"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center">
              <span className="text-white font-bold text-xl">S+</span>
            </div>
            <span className="font-bold text-xl text-foreground">StellarWork+</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/browse" className="text-muted-foreground hover:text-foreground transition-colors">
              Browse Projects
            </Link>
            <Link href="/post-project" className="text-muted-foreground hover:text-foreground transition-colors">
              Post Project
            </Link>
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <NetworkIndicator className="hidden md:flex" />
            
            {publicKey && (
              <>
                <Button variant="default" size="sm" asChild className="hidden md:flex">
                  <Link href="/profile?tab=deposit">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Funds
                  </Link>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="hidden md:flex">
                      <ArrowDownToLine className="h-4 w-4 mr-2" />
                      Withdraw
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/profile?tab=withdraw" className="cursor-pointer">
                        Withdraw to Bank Account
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
            
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            <WalletConnectButton />
          </div>
        </div>
      </div>
    </motion.nav>
  )
}
