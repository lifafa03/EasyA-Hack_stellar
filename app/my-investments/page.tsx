"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, Calendar, ArrowRight } from "lucide-react"
import Link from "next/link"
import { GradientBackground } from "@/components/gradient-background"

const myInvestments = [
  {
    id: 1,
    projectTitle: "Mobile App Development for E-commerce",
    projectId: 1,
    amountInvested: 1000,
    totalBudget: 5000,
    currentFunding: 3200,
    status: "active",
    investedDate: "2025-01-12",
    expectedReturn: "Milestone-based returns",
    progress: 64,
  },
  {
    id: 2,
    projectTitle: "AI-Powered Content Platform",
    projectId: 3,
    amountInvested: 2500,
    totalBudget: 15000,
    currentFunding: 8900,
    status: "active",
    investedDate: "2025-01-08",
    expectedReturn: "Revenue share",
    progress: 59,
  },
  {
    id: 3,
    projectTitle: "Brand Identity Design for Tech Startup",
    projectId: 2,
    amountInvested: 500,
    totalBudget: 2500,
    currentFunding: 2500,
    status: "completed",
    investedDate: "2025-01-05",
    expectedReturn: "Fixed return",
    progress: 100,
  },
]

const statusColors = {
  active: "bg-[#4ade80]/10 text-[#22c55e]",
  completed: "bg-blue-500/10 text-blue-500",
  pending: "bg-[#fbbf24]/10 text-[#fbbf24]",
}

export default function MyInvestmentsPage() {
  const totalInvested = myInvestments.reduce((sum, inv) => sum + inv.amountInvested, 0)
  const activeInvestments = myInvestments.filter((inv) => inv.status === "active").length

  return (
    <GradientBackground variant="default">
      <main className="min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">My Investments</h1>
            <p className="text-muted text-lg mb-8">Track your portfolio and project funding</p>
          </motion.div>

          {/* Stats Overview */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-[#4ade80]/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-[#22c55e]" />
                  </div>
                  <div>
                    <p className="text-sm text-muted">Total Invested</p>
                    <p className="text-2xl font-bold">${totalInvested.toLocaleString()}</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted">Active Projects</p>
                    <p className="text-2xl font-bold">{activeInvestments}</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-[#fbbf24]/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-[#fbbf24]" />
                  </div>
                  <div>
                    <p className="text-sm text-muted">Total Projects</p>
                    <p className="text-2xl font-bold">{myInvestments.length}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Investments List */}
          <div className="space-y-4">
            {myInvestments.map((investment, index) => (
              <motion.div
                key={investment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-bold text-lg">{investment.projectTitle}</h3>
                        <Badge className={statusColors[investment.status as keyof typeof statusColors]}>
                          {investment.status.charAt(0).toUpperCase() + investment.status.slice(1)}
                        </Badge>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted mb-1">Your Investment</p>
                          <p className="text-xl font-bold text-[#22c55e]">
                            ${investment.amountInvested.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted mb-1">Expected Return</p>
                          <p className="text-sm font-semibold">{investment.expectedReturn}</p>
                        </div>
                      </div>

                      <div className="mb-2">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-muted">Project Funding Progress</span>
                          <span className="font-semibold">
                            ${investment.currentFunding.toLocaleString()} / ${investment.totalBudget.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-2 bg-surface-dark rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${investment.progress}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className="h-full bg-[#4ade80] rounded-full"
                          />
                        </div>
                      </div>

                      <p className="text-sm text-muted">
                        Invested on {new Date(investment.investedDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/project/${investment.projectId}`}>
                          View Project <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                      {investment.status === "active" && (
                        <Button size="sm" className="bg-[#4ade80] hover:bg-[#22c55e] text-white">
                          Add More Funds
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {myInvestments.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <p className="text-muted text-lg mb-4">You haven't invested in any projects yet</p>
              <Button className="bg-[#4ade80] hover:bg-[#22c55e] text-white" asChild>
                <Link href="/browse">Discover Projects</Link>
              </Button>
            </motion.div>
          )}
        </div>
      </main>
    </GradientBackground>
  )
}
