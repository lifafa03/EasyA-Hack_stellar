"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar, DollarSign, Users, Clock, CheckCircle2 } from "lucide-react"
import React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { GradientBackground } from "@/components/gradient-background"

// Mock project data
const projectData = {
  id: 1,
  title: "Mobile App Development for E-commerce",
  description:
    "We are looking for an experienced React Native developer to build a cross-platform mobile shopping application. The app needs to support iOS and Android, integrate with our existing backend API, and include features like product browsing, cart management, secure checkout, and order tracking.",
  category: "Development",
  budget: 5000,
  funded: 3200,
  bids: 12,
  daysLeft: 14,
  postedDate: "2025-01-10",
  skills: ["React Native", "Node.js", "Payment APIs", "REST API", "Mobile UI/UX"],
  milestones: [
    { title: "UI/UX Design & Wireframes", budget: 1000, status: "completed" },
    { title: "Core App Development", budget: 2500, status: "in-progress" },
    { title: "Payment Integration", budget: 1000, status: "pending" },
    { title: "Testing & Deployment", budget: 500, status: "pending" },
  ],
  client: {
    name: "TechCorp Inc.",
    avatar: "/diverse-company-team.png",
    rating: 4.8,
    projectsPosted: 23,
  },
  topBids: [
    {
      id: 1,
      freelancer: "Sarah Chen",
      avatar: "/developer-working.png",
      amount: 4800,
      deliveryDays: 30,
      rating: 4.9,
    },
    {
      id: 2,
      freelancer: "Mike Johnson",
      avatar: "/coder.png",
      amount: 5200,
      deliveryDays: 25,
      rating: 4.7,
    },
    {
      id: 3,
      freelancer: "Alex Kumar",
      avatar: "/programmer.png",
      amount: 4500,
      deliveryDays: 35,
      rating: 4.8,
    },
  ],
}

export default function ProjectDetailPage() {
  const fundedPercentage = (projectData.funded / projectData.budget) * 100
  const [bidDialogOpen, setBidDialogOpen] = React.useState(false)
  const [fundDialogOpen, setFundDialogOpen] = React.useState(false)

  const handleBidSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Bid submitted")
    setBidDialogOpen(false)
  }

  const handleFundSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Funding submitted")
    setFundDialogOpen(false)
  }

  return (
    <GradientBackground variant="default">
      <main className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center gap-3 mb-4">
                  <Badge className="bg-[#4ade80]/10 text-[#22c55e] hover:bg-[#4ade80]/20">{projectData.category}</Badge>
                  <span className="text-sm text-muted flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Posted on {new Date(projectData.postedDate).toLocaleDateString()}
                  </span>
                </div>

                <h1 className="text-4xl font-bold mb-4 text-balance">{projectData.title}</h1>

                <div className="flex flex-wrap gap-4 text-sm text-muted mb-6">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {projectData.daysLeft} days left
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {projectData.bids} bids
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />${projectData.budget.toLocaleString()} budget
                  </span>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Project Description</h2>
                  <p className="text-muted leading-relaxed mb-6">{projectData.description}</p>

                  <h3 className="font-semibold mb-3">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {projectData.skills.map((skill) => (
                      <span key={skill} className="px-3 py-1 bg-surface-dark rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Project Milestones</h2>
                  <div className="space-y-4">
                    {projectData.milestones.map((milestone, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 bg-surface-dark rounded-lg">
                        <div
                          className={`mt-1 ${
                            milestone.status === "completed"
                              ? "text-[#4ade80]"
                              : milestone.status === "in-progress"
                                ? "text-[#fbbf24]"
                                : "text-muted"
                          }`}
                        >
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold">{milestone.title}</h4>
                            <span className="text-sm font-semibold">${milestone.budget.toLocaleString()}</span>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              milestone.status === "completed"
                                ? "bg-[#4ade80]/10 text-[#22c55e]"
                                : milestone.status === "in-progress"
                                  ? "bg-[#fbbf24]/10 text-[#fbbf24]"
                                  : "bg-surface text-muted"
                            }`}
                          >
                            {milestone.status.replace("-", " ")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Top Bids</h2>
                  <div className="space-y-4">
                    {projectData.topBids.map((bid) => (
                      <div key={bid.id} className="flex items-center justify-between p-4 bg-surface-dark rounded-lg">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <img src={bid.avatar || "/placeholder.svg"} alt={bid.freelancer} />
                          </Avatar>
                          <div>
                            <h4 className="font-semibold">{bid.freelancer}</h4>
                            <p className="text-sm text-muted">⭐ {bid.rating} rating</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">${bid.amount.toLocaleString()}</p>
                          <p className="text-sm text-muted">{bid.deliveryDays} days</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                <Card className="p-6 sticky top-24">
                  <h3 className="font-bold text-lg mb-4">Funding Progress</h3>

                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-[#22c55e]">${projectData.funded.toLocaleString()}</span>
                      <span className="text-muted">of ${projectData.budget.toLocaleString()}</span>
                    </div>
                    <div className="h-3 bg-surface-dark rounded-full overflow-hidden mb-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${fundedPercentage}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="h-full bg-[#4ade80] rounded-full"
                      />
                    </div>
                    <p className="text-sm text-muted">{fundedPercentage.toFixed(0)}% funded</p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <Dialog open={bidDialogOpen} onOpenChange={setBidDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-[#4ade80] hover:bg-[#22c55e] text-white" size="lg">
                          Place a Bid
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Submit Your Bid</DialogTitle>
                          <DialogDescription>
                            Provide details about your proposal and how you'll deliver this project
                          </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleBidSubmit} className="space-y-4 mt-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="bid-amount">Bid Amount (USD) *</Label>
                              <div className="relative mt-2">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                                <Input id="bid-amount" type="number" placeholder="4500" required className="pl-9" />
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="delivery-time">Delivery Time (days) *</Label>
                              <div className="relative mt-2">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                                <Input id="delivery-time" type="number" placeholder="30" required className="pl-9" />
                              </div>
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="proposal">Your Proposal *</Label>
                            <Textarea
                              id="proposal"
                              placeholder="Explain your approach, relevant experience, and why you're the best fit for this project..."
                              required
                              className="mt-2 min-h-32"
                            />
                          </div>

                          <div>
                            <Label htmlFor="portfolio">Portfolio Links</Label>
                            <Input id="portfolio" type="url" placeholder="https://yourportfolio.com" className="mt-2" />
                          </div>

                          <div>
                            <Label htmlFor="milestones-approach">Milestone Approach</Label>
                            <Textarea
                              id="milestones-approach"
                              placeholder="How will you tackle each milestone? What's your timeline for each phase?"
                              className="mt-2 min-h-24"
                            />
                          </div>

                          <div className="flex gap-3 pt-4">
                            <Button type="submit" className="flex-1 bg-[#4ade80] hover:bg-[#22c55e] text-white">
                              Submit Bid
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setBidDialogOpen(false)}>
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={fundDialogOpen} onOpenChange={setFundDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-transparent" variant="outline" size="lg">
                          Fund This Project
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Fund This Project</DialogTitle>
                          <DialogDescription>
                            Invest in this project and help bring it to life. You'll receive updates on progress.
                          </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleFundSubmit} className="space-y-4 mt-4">
                          <div>
                            <Label htmlFor="fund-amount">Funding Amount (USD) *</Label>
                            <div className="relative mt-2">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                              <Input id="fund-amount" type="number" placeholder="500" required className="pl-9" />
                            </div>
                            <p className="text-xs text-muted mt-2">
                              Remaining to fund: ${(projectData.budget - projectData.funded).toLocaleString()}
                            </p>
                          </div>

                          <div>
                            <Label htmlFor="fund-message">Message to Project Owner (Optional)</Label>
                            <Textarea
                              id="fund-message"
                              placeholder="Share why you're excited about this project..."
                              className="mt-2 min-h-24"
                            />
                          </div>

                          <div className="bg-surface-dark p-4 rounded-lg">
                            <h4 className="font-semibold mb-2 text-sm">Funding Details</h4>
                            <ul className="text-sm text-muted space-y-1">
                              <li>• Funds held in secure escrow</li>
                              <li>• Released upon milestone completion</li>
                              <li>• Full transparency on blockchain</li>
                            </ul>
                          </div>

                          <div className="flex gap-3 pt-4">
                            <Button type="submit" className="flex-1 bg-[#4ade80] hover:bg-[#22c55e] text-white">
                              Confirm Funding
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setFundDialogOpen(false)}>
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="pt-6 border-t border-border">
                    <h4 className="font-semibold mb-3">Posted by</h4>
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="h-12 w-12">
                        <img src={projectData.client.avatar || "/placeholder.svg"} alt={projectData.client.name} />
                      </Avatar>
                      <div>
                        <p className="font-semibold">{projectData.client.name}</p>
                        <p className="text-sm text-muted">⭐ {projectData.client.rating} rating</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted">{projectData.client.projectsPosted} projects posted</p>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </GradientBackground>
  )
}
