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

  // Load projects from localStorage and merge with mock data
  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => {
      try {
        const storedProjectsJson = localStorage.getItem('stellar-projects')
        if (storedProjectsJson) {
          const storedProjects = JSON.parse(storedProjectsJson)
          // Transform stored projects to match the display format
          const transformedProjects = storedProjects.map((p: any) => ({
            id: p.id,
            title: p.title,
            description: p.description,
            budget: p.budget,
            funded: 0, // New projects start with 0 funding
            category: p.category.charAt(0).toUpperCase() + p.category.slice(1),
            bids: p.bids?.length || 0,
            daysLeft: p.duration,
            skills: [], // Could be extracted from description or added to form
            image: '/placeholder.svg',
          }))
          // Merge with mock projects (new projects first)
          setProjects([...transformedProjects, ...allProjects])
        } else {
          setProjects(allProjects)
        }
      } catch (error) {
        console.error('Error loading projects:', error)
        setProjects(allProjects)
      }
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
    <main className="min-h-screen bg-black relative overflow-hidden py-12">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-[#4ade80]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="inline-block mb-3 px-4 py-2 bg-linear-to-r from-purple-600/20 to-[#4ade80]/20 rounded-full border border-[#4ade80]/30 backdrop-blur-sm"
                >
                  <span className="text-[#4ade80] font-semibold text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 animate-pulse" />
                    Discover Opportunities
                  </span>
                </motion.div>
                <h1 className="text-4xl md:text-5xl font-bold mb-3 text-white">Browse Projects</h1>
                <p className="text-gray-300 text-lg leading-relaxed">
                  Find the perfect project to work on or invest in
                </p>
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="bg-linear-to-r from-[#4ade80] to-[#22c55e] hover:from-[#22c55e] hover:to-[#4ade80] text-white shadow-lg shadow-[#4ade80]/50" asChild>
                  <Link href="/post-project">Post a Project</Link>
                </Button>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="p-6 bg-white/5 backdrop-blur-sm border-white/10">
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
                    <motion.div whileHover={{ y: -5, scale: 1.05 }} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center shadow-lg shadow-[#4ade80]/30">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">{projects.length}</p>
                        <p className="text-xs text-gray-400">Active Projects</p>
                      </div>
                    </motion.div>
                    <motion.div whileHover={{ y: -5, scale: 1.05 }} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <DollarSign className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">${(totalFunding / 1000).toFixed(0)}K USDC</p>
                        <p className="text-xs text-gray-400">Total Funding</p>
                      </div>
                    </motion.div>
                    <motion.div whileHover={{ y: -5, scale: 1.05 }} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-linear-to-br from-amber-500 to-orange-400 flex items-center justify-center shadow-lg shadow-amber-500/30">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">{totalBids}</p>
                        <p className="text-xs text-gray-400">Total Bids</p>
                      </div>
                    </motion.div>
                    <motion.div whileHover={{ y: -5, scale: 1.05 }} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-linear-to-br from-purple-500 to-pink-400 flex items-center justify-center shadow-lg shadow-purple-500/30">
                        <Clock className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">
                          {Math.round(projects.reduce((sum, p) => sum + p.daysLeft, 0) / projects.length)}
                        </p>
                        <p className="text-xs text-gray-400">Avg Days Left</p>
                      </div>
                    </motion.div>
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
            <Card className="p-6 bg-white/5 backdrop-blur-sm border-white/10">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search by title, description, or skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Filter className="h-4 w-4" />
                    <span className="text-sm font-medium">Filter by:</span>
                  </div>
                  {categories.map((category) => (
                    <motion.div key={category} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant={selectedCategory === category ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
                        className={
                          selectedCategory === category
                            ? "bg-linear-to-r from-[#4ade80] to-[#22c55e] hover:from-[#22c55e] hover:to-[#4ade80] text-white border-[#4ade80] shadow-lg shadow-[#4ade80]/50"
                            : "border-white/20 bg-white/5 hover:bg-white/10 text-white backdrop-blur-sm"
                        }
                      >
                        {category}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>

          <div className="mb-6 flex items-center justify-between">
            <p className="text-gray-300">
              Showing <span className="font-bold text-white text-lg">{filteredProjects.length}</span>{" "}
              {filteredProjects.length === 1 ? "project" : "projects"}
              {selectedCategory !== "All" && (
                <span className="ml-2">
                  in <span className="font-semibold text-[#4ade80]">{selectedCategory}</span>
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
                  <Card className="p-0 h-full bg-white/5 backdrop-blur-sm border-white/10 flex flex-col overflow-hidden">
                    <Skeleton className="h-48 w-full bg-white/10" />
                    <div className="p-6 flex flex-col flex-grow space-y-4">
                      <Skeleton className="h-6 w-3/4 bg-white/10" />
                      <Skeleton className="h-4 w-full bg-white/10" />
                      <Skeleton className="h-4 w-full bg-white/10" />
                      <Skeleton className="h-4 w-2/3 bg-white/10" />
                      <div className="flex gap-2 mt-4">
                        <Skeleton className="h-6 w-16 bg-white/10" />
                        <Skeleton className="h-6 w-16 bg-white/10" />
                        <Skeleton className="h-6 w-16 bg-white/10" />
                      </div>
                      <div className="mt-auto space-y-2">
                        <Skeleton className="h-2 w-full bg-white/10" />
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-24 bg-white/10" />
                          <Skeleton className="h-4 w-24 bg-white/10" />
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
                whileHover={{ y: -10, scale: 1.02 }}
              >
                <Card className="p-0 h-full bg-white/5 backdrop-blur-sm border-white/10 hover:border-[#4ade80]/50 transition-all duration-300 hover:shadow-2xl hover:shadow-[#4ade80]/20 flex flex-col group overflow-hidden">
                  <div className="relative h-48 w-full overflow-hidden">
                    <img
                      src={project.image || "/placeholder.svg"}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
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
                    <h3 className="font-bold text-xl mb-3 text-balance text-white group-hover:text-[#4ade80] transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-3 flex-grow leading-relaxed">
                      {project.description}
                    </p>

                    <div className="space-y-4 mt-auto">
                      <div className="flex flex-wrap gap-2">
                        {project.skills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="px-2.5 py-1 bg-white/10 text-xs rounded-md font-medium text-white border border-white/20"
                          >
                            {skill}
                          </span>
                        ))}
                        {project.skills.length > 3 && (
                          <span className="px-2.5 py-1 bg-white/10 text-xs rounded-md font-medium text-gray-400 border border-white/20">
                            +{project.skills.length - 3}
                          </span>
                        )}
                      </div>

                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-400 font-medium">Funding Progress</span>
                          <span className="font-bold text-white">
                            {Math.round((project.funded / project.budget) * 100)}%
                          </span>
                        </div>
                        <div className="h-2.5 bg-white/10 rounded-full overflow-hidden mb-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(project.funded / project.budget) * 100}%` }}
                            transition={{ duration: 1, delay: 0.2 + index * 0.05 }}
                            className="h-full bg-linear-to-r from-[#4ade80] to-cyan-400 rounded-full"
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">{formatUSDC(project.funded)} raised</span>
                          <span className="font-semibold text-white">{formatUSDC(project.budget)} goal</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Users className="h-4 w-4" />
                          <span className="font-medium">{project.bids} bids</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[#4ade80] hover:text-[#22c55e] hover:bg-[#4ade80]/10 group-hover:translate-x-1 transition-transform"
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

          {filteredProjects.length === 0 && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mx-auto mb-6 flex items-center justify-center">
                <Search className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-white">No projects found</h3>
              <p className="text-gray-300 text-lg mb-6">
                Try adjusting your search or filters to find what you're looking for
              </p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  className="border-white/20 bg-white/5 hover:bg-white/10 text-white backdrop-blur-sm"
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedCategory("All")
                  }}
                >
                  Clear Filters
                </Button>
              </motion.div>
            </motion.div>
          )}
        </div>
      </main>
  )
}
