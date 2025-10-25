"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Briefcase, DollarSign, TrendingUp, Clock, FileText, Users, Target, Star, Award, Calendar } from "lucide-react"
import Link from "next/link"
import { GradientBackground } from "@/components/gradient-background"

const dashboardData = {
  user: {
    name: "Alex Johnson",
    email: "alex@example.com",
    avatar: "/programmer.png",
    role: "Freelancer & Investor",
    memberSince: "2024-12-01",
    rating: 4.8,
  },
  stats: {
    activeProjects: 3,
    totalEarned: 12500,
    totalInvested: 4000,
    completedProjects: 8,
  },
  recentBids: [
    {
      id: 1,
      projectTitle: "Mobile App Development",
      amount: 4800,
      status: "pending",
      date: "2025-01-15",
    },
    {
      id: 2,
      projectTitle: "AI Content Platform",
      amount: 14500,
      status: "accepted",
      date: "2025-01-12",
    },
  ],
  recentInvestments: [
    {
      id: 1,
      projectTitle: "E-commerce Mobile App",
      amount: 1000,
      progress: 64,
      date: "2025-01-12",
    },
    {
      id: 2,
      projectTitle: "AI-Powered Platform",
      amount: 2500,
      progress: 59,
      date: "2025-01-08",
    },
  ],
  activeProjects: [
    {
      id: 1,
      title: "Website Redesign for SaaS",
      type: "Working On",
      budget: 3500,
      progress: 75,
      dueDate: "2025-02-15",
    },
    {
      id: 2,
      title: "Mobile Game Development",
      type: "Posted",
      budget: 8000,
      bids: 15,
      daysLeft: 12,
    },
  ],
}

const statusColors = {
  pending: "bg-[#fbbf24]/10 text-[#fbbf24]",
  accepted: "bg-[#4ade80]/10 text-[#22c55e]",
  rejected: "bg-red-500/10 text-red-500",
}

export default function DashboardPage() {
  return (
    <GradientBackground variant="default">
      <main className="min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <Card className="p-6 md:p-8 bg-gradient-to-br from-card to-surface border-border">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-20 w-20 border-4 border-[#4ade80]/20">
                      <img
                        src={dashboardData.user.avatar || "/placeholder.svg"}
                        alt={dashboardData.user.name}
                        className="object-cover"
                      />
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#4ade80] rounded-full flex items-center justify-center border-2 border-background">
                      <Award className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-foreground mb-1">{dashboardData.user.name}</h1>
                    <p className="text-muted-foreground mb-2">{dashboardData.user.role}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-[#fbbf24] text-[#fbbf24]" />
                        <span className="font-semibold text-foreground">{dashboardData.user.rating}</span>
                        <span className="text-muted-foreground">rating</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Member since{" "}
                          {new Date(dashboardData.user.memberSince).toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="border-border bg-transparent" asChild>
                    <Link href="/profile">Edit Profile</Link>
                  </Button>
                  <Button className="bg-[#4ade80] hover:bg-[#22c55e] text-white" asChild>
                    <Link href="/post-project">
                      <FileText className="mr-2 h-4 w-4" />
                      New Project
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card border-border">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center shadow-md">
                    <Briefcase className="h-7 w-7 text-white" />
                  </div>
                  <Badge variant="outline" className="bg-[#4ade80]/10 text-[#22c55e] border-[#4ade80]/20">
                    Active
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Active Projects</p>
                <p className="text-3xl font-bold text-foreground">{dashboardData.stats.activeProjects}</p>
                <p className="text-xs text-muted-foreground mt-2">+2 from last month</p>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card border-border">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-md">
                    <DollarSign className="h-7 w-7 text-white" />
                  </div>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                    Earnings
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Total Earned</p>
                <p className="text-3xl font-bold text-foreground">
                  ${dashboardData.stats.totalEarned.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-2">+$3,200 this month</p>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card border-border">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center shadow-md">
                    <TrendingUp className="h-7 w-7 text-white" />
                  </div>
                  <Badge variant="outline" className="bg-[#fbbf24]/10 text-[#fbbf24] border-[#fbbf24]/20">
                    Portfolio
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Total Invested</p>
                <p className="text-3xl font-bold text-foreground">
                  ${dashboardData.stats.totalInvested.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-2">Across 3 projects</p>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card border-border">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center shadow-md">
                    <Target className="h-7 w-7 text-white" />
                  </div>
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                    Success
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Completed Projects</p>
                <p className="text-3xl font-bold text-foreground">{dashboardData.stats.completedProjects}</p>
                <p className="text-xs text-muted-foreground mt-2">94% success rate</p>
              </Card>
            </motion.div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card className="p-6 md:p-8 bg-card border-border">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-1">Active Projects</h2>
                    <p className="text-sm text-muted-foreground">Track your ongoing work</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-[#22c55e] hover:text-[#4ade80]" asChild>
                    <Link href="/browse">View All</Link>
                  </Button>
                </div>

                <div className="space-y-4">
                  {dashboardData.activeProjects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="p-5 bg-surface rounded-xl border border-border hover:shadow-md transition-all hover:border-[#4ade80]/30"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-grow">
                          <h3 className="font-semibold text-lg mb-2 text-foreground">{project.title}</h3>
                          <Badge
                            variant="outline"
                            className="text-xs bg-[#4ade80]/10 text-[#22c55e] border-[#4ade80]/20"
                          >
                            {project.type}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-bold text-[#22c55e]">${project.budget.toLocaleString()}</span>
                          <p className="text-xs text-muted-foreground">Budget</p>
                        </div>
                      </div>

                      {project.progress !== undefined ? (
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-muted-foreground font-medium">Progress</span>
                            <span className="font-bold text-foreground">{project.progress}%</span>
                          </div>
                          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${project.progress}%` }}
                              transition={{ duration: 1, delay: 0.8 }}
                              className="h-full bg-gradient-to-r from-[#4ade80] to-[#22c55e] rounded-full"
                            />
                          </div>
                          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Due: {project.dueDate}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span className="font-medium">{project.bids} bids received</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{project.daysLeft} days left</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Recent Bids</h2>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/my-bids">View All</Link>
                  </Button>
                </div>

                <div className="space-y-4">
                  {dashboardData.recentBids.map((bid) => (
                    <div key={bid.id} className="p-4 bg-surface-dark rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-grow">
                          <h3 className="font-semibold mb-2">{bid.projectTitle}</h3>
                          <div className="flex items-center gap-2">
                            <Badge className={statusColors[bid.status as keyof typeof statusColors]}>
                              {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                            </Badge>
                            <span className="text-sm text-muted">{new Date(bid.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <span className="text-lg font-bold text-[#22c55e]">${bid.amount.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Recent Investments</h2>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/my-investments">View All</Link>
                  </Button>
                </div>

                <div className="space-y-4">
                  {dashboardData.recentInvestments.map((investment) => (
                    <div key={investment.id} className="p-4 bg-surface-dark rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold mb-1">{investment.projectTitle}</h3>
                          <span className="text-sm text-muted">{new Date(investment.date).toLocaleDateString()}</span>
                        </div>
                        <span className="text-lg font-bold text-[#22c55e]">${investment.amount.toLocaleString()}</span>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-muted">Funding Progress</span>
                          <span className="font-semibold">{investment.progress}%</span>
                        </div>
                        <div className="h-2 bg-surface rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#4ade80] rounded-full"
                            style={{ width: `${investment.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-6">Quick Actions</h2>

                <div className="space-y-3">
                  <Button className="w-full justify-start bg-[#4ade80] hover:bg-[#22c55e] text-white" asChild>
                    <Link href="/post-project">
                      <FileText className="mr-2 h-5 w-5" />
                      Post a New Project
                    </Link>
                  </Button>

                  <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
                    <Link href="/browse">
                      <Users className="mr-2 h-5 w-5" />
                      Browse Projects
                    </Link>
                  </Button>

                  <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
                    <Link href="/my-bids">
                      <Clock className="mr-2 h-5 w-5" />
                      View My Bids
                    </Link>
                  </Button>

                  <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
                    <Link href="/my-investments">
                      <TrendingUp className="mr-2 h-5 w-5" />
                      My Investments
                    </Link>
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </GradientBackground>
  )
}
