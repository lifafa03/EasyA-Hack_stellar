"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, DollarSign, Calendar } from "lucide-react"
import Link from "next/link"
import { GradientBackground } from "@/components/gradient-background"

const myBids = [
  {
    id: 1,
    projectTitle: "Mobile App Development for E-commerce",
    projectId: 1,
    bidAmount: 4800,
    deliveryDays: 30,
    status: "pending",
    submittedDate: "2025-01-15",
    totalBids: 12,
  },
  {
    id: 2,
    projectTitle: "AI-Powered Content Platform",
    projectId: 3,
    bidAmount: 14500,
    deliveryDays: 45,
    status: "accepted",
    submittedDate: "2025-01-12",
    totalBids: 24,
  },
  {
    id: 3,
    projectTitle: "Blockchain Smart Contract Development",
    projectId: 5,
    bidAmount: 7800,
    deliveryDays: 25,
    status: "rejected",
    submittedDate: "2025-01-10",
    totalBids: 6,
  },
]

const statusColors = {
  pending: "bg-[#fbbf24]/10 text-[#fbbf24]",
  accepted: "bg-[#4ade80]/10 text-[#22c55e]",
  rejected: "bg-red-500/10 text-red-500",
}

export default function MyBidsPage() {
  return (
    <GradientBackground variant="default">
      <main className="min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">My Bids</h1>
            <p className="text-muted text-lg mb-8">Track all your project proposals and their status</p>
          </motion.div>

          <div className="space-y-4">
            {myBids.map((bid, index) => (
              <motion.div
                key={bid.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg">{bid.projectTitle}</h3>
                        <Badge className={statusColors[bid.status as keyof typeof statusColors]}>
                          {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-muted">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          Bid: ${bid.bidAmount.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {bid.deliveryDays} days
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Submitted {new Date(bid.submittedDate).toLocaleDateString()}
                        </span>
                        <span>Competing with {bid.totalBids - 1} other bids</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/project/${bid.projectId}`}>View Project</Link>
                      </Button>
                      {bid.status === "pending" && (
                        <Button variant="ghost" size="sm" className="text-[#22c55e] hover:text-[#4ade80]">
                          Edit Bid
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {myBids.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <p className="text-muted text-lg mb-4">You haven't placed any bids yet</p>
              <Button className="bg-[#4ade80] hover:bg-[#22c55e] text-white" asChild>
                <Link href="/browse">Browse Projects</Link>
              </Button>
            </motion.div>
          )}
        </div>
      </main>
    </GradientBackground>
  )
}
