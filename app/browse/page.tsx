"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Filter, ArrowRight, TrendingUp, Clock, Users, DollarSign, Sparkles } from "lucide-react"
import Link from "next/link"
import { GradientBackground } from "@/components/gradient-background"

const allProjects = [
  {
    id: 1,
    title: "Mobile App Development for E-commerce",
    description:
      "Need a React Native developer to build a cross-platform shopping app with payment integration and real-time inventory management.",
    budget: 5000,
    funded: 3200,
    category: "Development",
    bids: 12,
    daysLeft: 14,
    skills: ["React Native", "Node.js", "Payment APIs"],
    image: "/ecommerce-mobile-app.png",
  },
  {
    id: 2,
    title: "Brand Identity Design for Tech Startup",
    description:
      "Looking for a creative designer to develop our complete brand identity including logo, colors, typography, and brand guidelines.",
    budget: 2500,
    funded: 2500,
    category: "Design",
    bids: 8,
    daysLeft: 7,
    skills: ["Branding", "Logo Design", "Figma"],
    image: "/colorful-modern-logo.png",
  },
  {
    id: 3,
    title: "AI-Powered Content Platform",
    description:
      "Building an AI content generation platform. Need full-stack developers and ML engineers to help build the MVP.",
    budget: 15000,
    funded: 8900,
    category: "AI/ML",
    bids: 24,
    daysLeft: 21,
    skills: ["Python", "TensorFlow", "React", "AWS"],
    image: "/ai-content-generator.png",
  },
  {
    id: 4,
    title: "Marketing Campaign for SaaS Product",
    description:
      "Need a marketing expert to plan and execute a comprehensive digital marketing campaign for our B2B SaaS product launch.",
    budget: 3500,
    funded: 1200,
    category: "Marketing",
    bids: 15,
    daysLeft: 10,
    skills: ["SEO", "Content Marketing", "Social Media"],
    image: "/digital-marketing-campaign-social-media-analytics.jpg",
  },
  {
    id: 5,
    title: "Blockchain Smart Contract Development",
    description: "Seeking experienced Solidity developer to create and audit smart contracts for our DeFi protocol.",
    budget: 8000,
    funded: 4500,
    category: "Blockchain",
    bids: 6,
    daysLeft: 18,
    skills: ["Solidity", "Web3", "Smart Contracts"],
    image: "/defi-trading-platform.jpg",
  },
  {
    id: 6,
    title: "Video Production for Product Launch",
    description: "Need a video production team to create a high-quality promotional video for our new product launch.",
    budget: 4000,
    funded: 2800,
    category: "Video",
    bids: 9,
    daysLeft: 12,
    skills: ["Video Editing", "Motion Graphics", "Storytelling"],
    image: "/video-production-camera-equipment-studio.jpg",
  },
]

const categories = ["All", "Development", "Design", "AI/ML", "Marketing", "Blockchain", "Video"]

// Helper function to format USDC amounts
const formatUSDC = (amount: number): string => {
  return `$${amount.toLocaleString()} USDC`
}

export default function BrowsePage() {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState(allProjects)

  // Simulate loading projects
  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => {
      setProjects(allProjects)
      setLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  const filteredProjects = projects.filter((project) => {
    const matchesCategory = selectedCategory === "All" || project.category === selectedCategory
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const totalFunding = projects.reduce((sum, project) => sum + project.funded, 0)
  const totalBids = projects.reduce((sum, project) => sum + project.bids, 0)

  return (
    <GradientBackground variant="default">
      <main className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="inline-block mb-3 px-4 py-2 bg-[#4ade80]/10 rounded-full border border-[#4ade80]/20"
                >
                  <span className="text-[#22c55e] font-semibold text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Discover Opportunities
                  </span>
                </motion.div>
                <h1 className="text-4xl md:text-5xl font-bold mb-3 text-foreground">Browse Projects</h1>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Find the perfect project to work on or invest in
                </p>
              </div>
              <Button className="bg-[#4ade80] hover:bg-[#22c55e] text-white" asChild>
                <Link href="/post-project">Post a Project</Link>
              </Button>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="p-6 bg-gradient-to-br from-card to-surface border-border">
                {loading ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="w-12 h-12 rounded-xl" />
                        <div className="space-y-2">
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center shadow-md">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{projects.length}</p>
                        <p className="text-xs text-muted-foreground">Active Projects</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-md">
                        <DollarSign className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">${(totalFunding / 1000).toFixed(0)}K USDC</p>
                        <p className="text-xs text-muted-foreground">Total Funding</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center shadow-md">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{totalBids}</p>
                        <p className="text-xs text-muted-foreground">Total Bids</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center shadow-md">
                        <Clock className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">
                          {Math.round(projects.reduce((sum, p) => sum + p.daysLeft, 0) / projects.length)}
                        </p>
                        <p className="text-xs text-muted-foreground">Avg Days Left</p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <Card className="p-6 bg-card border-border">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by title, description, or skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 bg-background border-border text-foreground"
                  />
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Filter className="h-4 w-4" />
                    <span className="text-sm font-medium">Filter by:</span>
                  </div>
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className={
                        selectedCategory === category
                          ? "bg-[#4ade80] hover:bg-[#22c55e] text-white border-[#4ade80]"
                          : "border-border bg-transparent hover:bg-surface"
                      }
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>

          <div className="mb-6 flex items-center justify-between">
            <p className="text-muted-foreground">
              Showing <span className="font-bold text-foreground text-lg">{filteredProjects.length}</span>{" "}
              {filteredProjects.length === 1 ? "project" : "projects"}
              {selectedCategory !== "All" && (
                <span className="ml-2">
                  in <span className="font-semibold text-foreground">{selectedCategory}</span>
                </span>
              )}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              // Loading skeleton cards
              [...Array(6)].map((_, index) => (
                <motion.div
                  key={`skeleton-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-0 h-full border-border bg-card flex flex-col overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <div className="p-6 flex flex-col flex-grow space-y-4">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                      <div className="flex gap-2 mt-4">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                      <div className="mt-auto space-y-2">
                        <Skeleton className="h-2 w-full" />
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            ) : (
              filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-0 h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-border bg-card flex flex-col group overflow-hidden">
                  <div className="relative h-48 w-full overflow-hidden bg-surface">
                    <img
                      src={project.image || "/placeholder.svg"}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-[#4ade80]/90 backdrop-blur-sm text-white border-[#4ade80]/20 hover:bg-[#4ade80]">
                        {project.category}
                      </Badge>
                    </div>
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 text-sm bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">{project.daysLeft}d left</span>
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="font-bold text-xl mb-3 text-balance text-foreground group-hover:text-[#22c55e] transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-3 flex-grow leading-relaxed">
                      {project.description}
                    </p>

                    <div className="space-y-4 mt-auto">
                      <div className="flex flex-wrap gap-2">
                        {project.skills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="px-2.5 py-1 bg-surface text-xs rounded-md font-medium text-foreground border border-border"
                          >
                            {skill}
                          </span>
                        ))}
                        {project.skills.length > 3 && (
                          <span className="px-2.5 py-1 bg-surface text-xs rounded-md font-medium text-muted-foreground border border-border">
                            +{project.skills.length - 3}
                          </span>
                        )}
                      </div>

                      <div className="p-4 bg-surface rounded-lg border border-border">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-muted-foreground font-medium">Funding Progress</span>
                          <span className="font-bold text-foreground">
                            {Math.round((project.funded / project.budget) * 100)}%
                          </span>
                        </div>
                        <div className="h-2.5 bg-muted rounded-full overflow-hidden mb-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(project.funded / project.budget) * 100}%` }}
                            transition={{ duration: 1, delay: 0.2 + index * 0.05 }}
                            className="h-full bg-gradient-to-r from-[#4ade80] to-[#22c55e] rounded-full"
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{formatUSDC(project.funded)} raised</span>
                          <span className="font-semibold text-foreground">{formatUSDC(project.budget)} goal</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span className="font-medium">{project.bids} bids</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[#22c55e] hover:text-[#4ade80] hover:bg-[#4ade80]/10 group-hover:translate-x-1 transition-transform"
                          asChild
                        >
                          <Link href={`/project/${project.id}`}>
                            View Details <ArrowRight className="ml-1 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
              ))
            )}
          </div>

          {filteredProjects.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-surface mx-auto mb-6 flex items-center justify-center">
                <Search className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-foreground">No projects found</h3>
              <p className="text-muted-foreground text-lg mb-6">
                Try adjusting your search or filters to find what you're looking for
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory("All")
                }}
              >
                Clear Filters
              </Button>
            </motion.div>
          )}
        </div>
      </main>
    </GradientBackground>
  )
}
