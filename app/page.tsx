"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  ArrowRight, Rocket, Users, DollarSign, Shield, TrendingUp, Clock, 
  CheckCircle2, Star, Zap, Briefcase, Globe, Lock, BarChart3, Sparkles, ChevronRight
} from "lucide-react"
import { GradientBackground } from "@/components/gradient-background"
import { StellarBadge, StellarFAQ } from "@/components/stellar"
import { WalletConnectButton } from "@/components/wallet-connect"
import { AnimatedTextCycle } from "@/components/animated-text-cycle"
import { InteractiveDots } from "@/components/interactive-dots"

const stats = [
  { label: "Active Projects", value: "2,500+", icon: Rocket },
  { label: "Freelancers", value: "15,000+", icon: Users },
  { label: "Total Funded", value: "$12M+ USDC", icon: DollarSign },
  { label: "Success Rate", value: "94%", icon: TrendingUp },
]

const userJourneys = [
  {
    icon: Briefcase,
    title: "For Businesses",
    description: "Fund projects and ship faster",
    gradient: "from-blue-500 to-cyan-400",
    steps: [
      "Create detailed project with milestones",
      "Set budget and timeline",
      "Receive bids from talented freelancers",
      "Get crowdfunding from investors",
      "Release payments as milestones complete",
    ],
    cta: "Fund a Project",
    ctaLink: "/post-project",
  },
  {
    icon: Users,
    title: "For Freelancers",
    description: "Find projects and get paid instantly",
    gradient: "from-purple-500 to-pink-400",
    steps: [
      "Browse available projects",
      "Submit competitive bids",
      "Get selected by project owners",
      "Complete milestones and get paid instantly",
      "Build reputation and portfolio",
    ],
    cta: "Find Projects",
    ctaLink: "/browse",
  },
  {
    icon: DollarSign,
    title: "For Investors",
    description: "Fund projects and earn returns",
    gradient: "from-[#4ade80] to-[#22c55e]",
    steps: [
      "Discover promising projects",
      "Review details and milestones",
      "Invest any amount you're comfortable with",
      "Track progress in real-time",
      "Earn returns on project success",
    ],
    cta: "Start Investing",
    ctaLink: "/browse",
  },
]

const features = [
  {
    icon: Shield,
    title: "Secure Escrow",
    description: "Smart contracts hold funds safely until milestones are completed and verified",
    gradient: "from-orange-500 to-red-400",
  },
  {
    icon: Zap,
    title: "Instant Payments",
    description: "Blockchain-powered payments mean freelancers get paid immediately upon approval",
    gradient: "from-yellow-400 to-orange-400",
  },
  {
    icon: Lock,
    title: "Trustless System",
    description: "No intermediaries needed. Smart contracts automatically enforce agreements",
    gradient: "from-purple-500 to-pink-400",
  },
  {
    icon: Globe,
    title: "Global Access",
    description: "Work with anyone, anywhere. Borderless payments with fiat on/off-ramps",
    gradient: "from-cyan-500 to-blue-400",
  },
  {
    icon: Clock,
    title: "Real-Time Tracking",
    description: "All stakeholders can track project progress and fund allocation instantly",
    gradient: "from-indigo-500 to-purple-400",
  },
  {
    icon: BarChart3,
    title: "Transparent Progress",
    description: "Every transaction and milestone is recorded on the blockchain for full transparency",
    gradient: "from-[#4ade80] to-[#22c55e]",
  },
]

const featuredProjects = [
  {
    id: 1,
    title: "Mobile App Development for E-commerce",
    description: "Need a React Native developer to build a cross-platform shopping app with payment integration.",
    budget: 5000,
    funded: 3200,
    category: "Development",
    bids: 12,
    daysLeft: 14,
    image: "/ecommerce-mobile-app.png",
  },
  {
    id: 2,
    title: "Brand Identity Design for Tech Startup",
    description: "Looking for a creative designer to develop our complete brand identity including logo, colors, and guidelines.",
    budget: 2500,
    funded: 2500,
    category: "Design",
    bids: 8,
    daysLeft: 7,
    image: "/colorful-modern-logo.png",
  },
  {
    id: 3,
    title: "AI-Powered Content Platform",
    description: "Building an AI content generation platform. Need full-stack developers and ML engineers.",
    budget: 15000,
    funded: 8900,
    category: "AI/ML",
    bids: 24,
    daysLeft: 21,
    image: "/ai-content-generator.png",
  },
]

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Startup Founder",
    content: "StellarWork+ helped us find amazing developers and secure funding simultaneously. Game changer!",
    avatar: "/professional-woman-diverse.png",
    rating: 5,
  },
  {
    name: "Marcus Rodriguez",
    role: "Freelance Developer",
    content: "The milestone-based payment system gives me confidence. I've completed 20+ projects here.",
    avatar: "/professional-man.jpg",
    rating: 5,
  },
  {
    name: "Emily Watson",
    role: "Angel Investor",
    content: "Finally, a platform where I can invest in projects with real talent attached. Transparency is incredible.",
    avatar: "/confident-business-woman.png",
    rating: 5,
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-black">
      {/* Hero Section with Interactive Background */}
      <div className="relative min-h-screen">
        <InteractiveDots />
        
        {/* Enhanced gradient overlays */}
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/20 to-black z-1 pointer-events-none" />
        <div className="absolute inset-0 z-1 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-[#4ade80]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        </div>

        <section className="relative z-10 py-24 md:py-32 min-h-screen flex items-center">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-6xl mx-auto text-center"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 mb-8 px-5 py-2.5 bg-linear-to-r from-purple-600/20 to-[#4ade80]/20 border border-[#4ade80]/30 rounded-full backdrop-blur-sm"
              >
                <Sparkles className="w-4 h-4 text-[#4ade80] animate-pulse" />
                <span className="text-[#4ade80] font-semibold text-sm">Powered by Stellar Blockchain</span>
                <div className="w-2 h-2 bg-[#4ade80] rounded-full animate-pulse" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-5xl sm:text-6xl lg:text-8xl font-bold leading-tight mb-8"
              >
                <span className="text-white">The Future of{" "}</span>
                <span className="inline-block h-[1.2em] overflow-hidden align-bottom">
                  <AnimatedTextCycle
                    words={["Crowdfunding", "Freelancing", "Work", "Collaboration", "Innovation"]}
                    className="bg-linear-to-r from-purple-400 via-[#4ade80] to-cyan-400 bg-clip-text text-transparent"
                  />
                </span>
                <br />
                <span className="bg-linear-to-r from-purple-400 via-pink-500 to-[#4ade80] bg-clip-text text-transparent">
                  Starts Here
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-lg sm:text-xl lg:text-2xl text-gray-300 max-w-4xl mx-auto mb-10 leading-relaxed"
              >
                Where <span className="text-[#4ade80] font-semibold">Kickstarter meets Upwork</span>. Fund projects, hire talent, and build the future—all on a decentralized, transparent blockchain platform.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="lg"
                    className="group relative overflow-hidden bg-linear-to-r from-purple-600 to-[#4ade80] hover:from-purple-500 hover:to-[#22c55e] text-white text-lg px-10 py-7 shadow-lg shadow-[#4ade80]/50"
                    asChild
                  >
                    <Link href="/browse" className="flex items-center gap-2">
                      <Rocket className="w-5 h-5" />
                      Launch Your Project
                      <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/20 bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white text-lg px-10 py-7"
                    asChild
                  >
                    <Link href="/post-project" className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Find Talent
                    </Link>
                </Button>
                </motion.div>
              </motion.div>

              {/* Enhanced Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto"
              >
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    whileHover={{ y: -5, scale: 1.05 }}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-[#4ade80]/50 transition-all"
                  >
                    <stat.icon className="w-10 h-10 text-[#4ade80] mb-3 mx-auto" />
                    <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Platform Preview */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.9 }}
                className="mt-20 w-full max-w-6xl mx-auto"
              >
                <div className="relative rounded-2xl overflow-hidden border border-[#4ade80]/30 shadow-2xl shadow-[#4ade80]/20">
                  <div className="absolute inset-0 bg-linear-to-br from-purple-600/20 to-[#4ade80]/20 backdrop-blur-sm z-10" />
                  <img
                    src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&h=675&fit=crop"
                    alt="Decentralized marketplace interface"
                    className="w-full h-auto object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent z-10" />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </div>

      {/* How It Works */}
      <div className="bg-linear-to-b from-black via-gray-900 to-black relative">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-10 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-[#4ade80]/20 rounded-full blur-3xl" />
        </div>
        <section className="py-24 relative z-10">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl md:text-6xl font-bold mb-6 text-white"
              >
                How It <span className="bg-linear-to-r from-[#4ade80] via-cyan-400 to-purple-400 bg-clip-text text-transparent">Works</span>
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-gray-300 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed"
              >
                Whether you're funding, building, or investing—get started in minutes
              </motion.p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {userJourneys.map((journey, index) => (
                <motion.div
                  key={journey.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                >
                  <Card className="p-8 h-full flex flex-col bg-white/5 backdrop-blur-sm border-white/10 hover:border-[#4ade80]/50 transition-all duration-300 hover:shadow-2xl hover:shadow-[#4ade80]/20">
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                      className={`w-16 h-16 rounded-2xl bg-linear-to-br ${journey.gradient} flex items-center justify-center mb-6 shadow-lg`}
                    >
                      <journey.icon className="h-8 w-8 text-white" />
                    </motion.div>

                    <h3 className="text-2xl font-bold mb-2 text-white">{journey.title}</h3>
                    <p className="text-gray-400 mb-6">{journey.description}</p>

                    <div className="space-y-3 mb-8 grow">
                      {journey.steps.map((step, stepIndex) => (
                        <motion.div 
                          key={stepIndex} 
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.4 + stepIndex * 0.1 }}
                          className="flex items-start gap-3"
                        >
                          <div className="w-6 h-6 rounded-full bg-[#4ade80]/20 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-[#4ade80] text-sm font-semibold">{stepIndex + 1}</span>
                          </div>
                          <p className="text-sm text-gray-400 leading-relaxed">{step}</p>
                        </motion.div>
                      ))}
                    </div>

                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button className="w-full bg-linear-to-r from-[#4ade80] to-[#22c55e] hover:from-[#22c55e] hover:to-[#4ade80] text-white shadow-lg shadow-[#4ade80]/50" asChild>
                      <Link href={journey.ctaLink}>
                        {journey.cta} <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    </motion.div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Key Features */}
      <div className="bg-black relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 left-10 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl" />
        </div>
        <section className="py-24 relative z-10">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <motion.h2 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="text-4xl md:text-6xl font-bold mb-4 text-white"
              >
                Why Choose <span className="bg-linear-to-r from-[#4ade80] to-cyan-400 bg-clip-text text-transparent">StellarWork+</span>
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-gray-300 text-lg md:text-xl max-w-3xl mx-auto"
              >
                Built on blockchain for transparency, security, and instant payments
              </motion.p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.03 }}
                >
                  <Card className="p-6 h-full bg-white/5 backdrop-blur-sm border-white/10 hover:border-[#4ade80]/50 transition-all group hover:shadow-xl hover:shadow-[#4ade80]/20">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className={`w-14 h-14 rounded-2xl bg-linear-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-md`}
                    >
                      <feature.icon className="h-7 w-7 text-white" />
                    </motion.div>
                    <h3 className="font-bold text-lg mb-2 text-white group-hover:text-[#4ade80] transition-colors">{feature.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Featured Projects */}
      <div className="bg-linear-to-b from-black via-gray-900 to-black relative">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#4ade80]/20 rounded-full blur-3xl" />
        </div>
        <section className="py-24 relative z-10">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-4">
              <div>
                <motion.h2 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="text-4xl md:text-5xl font-bold mb-2 text-white"
                >
                  Featured Projects
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="text-gray-400 text-lg"
                >
                  Discover opportunities and invest in innovation
                </motion.p>
              </div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
              >
                <Button variant="outline" className="border-white/20 bg-white/5 hover:bg-white/10 text-white backdrop-blur-sm" asChild>
                <Link href="/browse">View All</Link>
              </Button>
              </motion.div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {featuredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                >
                  <Card className="p-0 h-full bg-white/5 backdrop-blur-sm border-white/10 hover:border-[#4ade80]/50 overflow-hidden group transition-all duration-300 hover:shadow-2xl hover:shadow-[#4ade80]/20">
                    <div className="relative h-48 w-full overflow-hidden">
                      <img
                        src={project.image || "/placeholder.svg"}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-[#4ade80]/90 backdrop-blur-sm text-white text-xs font-semibold rounded-full">
                          {project.category}
                        </span>
                      </div>
                      <div className="absolute top-4 right-4 text-sm bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full font-medium">
                        {project.daysLeft} days left
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="font-bold text-lg mb-2 text-balance text-white group-hover:text-[#4ade80] transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>

                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-500">Funded</span>
                            <span className="font-semibold text-white">
                              ${project.funded.toLocaleString()} / ${project.budget.toLocaleString()} USDC
                            </span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${(project.funded / project.budget) * 100}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 1, delay: 0.2 }}
                              className="h-full bg-linear-to-r from-[#4ade80] to-cyan-400 rounded-full"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-white/10">
                          <span className="text-sm text-gray-400">{project.bids} bids</span>
                          <Button size="sm" variant="ghost" className="text-[#4ade80] hover:text-[#22c55e] hover:bg-[#4ade80]/10" asChild>
                            <Link href={`/project/${project.id}`}>
                              View Details <ArrowRight className="ml-1 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Stellar Benefits */}
      <div className="bg-black relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#4ade80]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl" />
        </div>
        <section className="py-24 relative z-10">
          <div className="container mx-auto px-4 max-w-6xl">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <motion.div 
                className="flex justify-center mb-6"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-[#4ade80]/20 blur-xl rounded-full" />
                <StellarBadge />
              </div>
              </motion.div>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl md:text-6xl font-bold mb-4 text-white"
              >
                Built on <span className="bg-linear-to-r from-[#4ade80] to-cyan-400 bg-clip-text text-transparent">Stellar Blockchain</span>
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-gray-300 text-lg md:text-xl max-w-3xl mx-auto"
              >
                Fast, secure, and transparent transactions powered by cutting-edge blockchain technology
              </motion.p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {[
                {
                  icon: Zap,
                  title: "Lightning Fast",
                  description: "Stellar processes transactions in just 5-7 seconds. No more waiting days for payments to clear.",
                  features: ["Instant payment confirmations", "Real-time balance updates", "No banking delays"],
                  gradient: "from-yellow-400 to-orange-400",
                },
                {
                  icon: DollarSign,
                  title: "Minimal Fees",
                  description: "Transaction fees are just fractions of a cent, meaning more money stays in your pocket.",
                  features: ["0.00001 XLM per transaction", "No hidden charges", "Transparent fee structure"],
                  gradient: "from-[#4ade80] to-[#22c55e]",
                },
                {
                  icon: Lock,
                  title: "Secure & Trustless",
                  description: "Smart contracts automatically enforce agreements without requiring trust between parties.",
                  features: ["Funds locked in escrow", "Automatic milestone releases", "Dispute protection built-in"],
                  gradient: "from-orange-500 to-red-400",
                },
                {
                  icon: Globe,
                  title: "Global & Accessible",
                  description: "Work with anyone, anywhere. Stellar enables borderless payments with fiat on/off-ramps.",
                  features: ["Support for multiple currencies", "Easy fiat conversion", "No geographic restrictions"],
                  gradient: "from-cyan-500 to-blue-400",
                },
              ].map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <Card className="p-6 h-full bg-white/5 backdrop-blur-sm border-white/10 hover:border-[#4ade80]/50 transition-all hover:shadow-xl hover:shadow-[#4ade80]/20">
                    <motion.div 
                      className={`w-12 h-12 rounded-xl bg-linear-to-br ${benefit.gradient} flex items-center justify-center mb-4`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <benefit.icon className="h-6 w-6 text-white" />
                    </motion.div>
                    <h3 className="font-bold text-xl mb-3 text-white">{benefit.title}</h3>
                    <p className="text-gray-400 mb-4 leading-relaxed">{benefit.description}</p>
                    <ul className="space-y-2">
                      {benefit.features.map((feature, i) => (
                        <motion.li 
                          key={i} 
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.1 + i * 0.05 }}
                          className="flex items-start gap-2 text-sm text-gray-400"
                        >
                          <CheckCircle2 className="h-4 w-4 text-[#4ade80] shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* FAQ Section */}
      <div className="bg-linear-to-b from-black via-gray-900 to-black relative">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
        </div>
        <section className="py-24 relative z-10">
          <div className="container mx-auto px-4 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl md:text-5xl font-bold mb-4 text-white"
              >
                Frequently Asked <span className="bg-linear-to-r from-[#4ade80] to-cyan-400 bg-clip-text text-transparent">Questions</span>
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-gray-300 text-lg max-w-2xl mx-auto"
              >
                Everything you need to know about StellarWork+
              </motion.p>
            </motion.div>
            
            <StellarFAQ />
          </div>
        </section>
      </div>

      {/* Testimonials */}
      <div className="bg-linear-to-b from-black via-gray-900 to-black relative">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        </div>
        <section className="py-24 relative z-10">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <motion.h2 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="text-4xl md:text-6xl font-bold mb-4 text-white"
              >
                Trusted by <span className="bg-linear-to-r from-[#4ade80] to-cyan-400 bg-clip-text text-transparent">Thousands</span>
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-gray-300 text-lg md:text-xl max-w-3xl mx-auto"
              >
                See what our community has to say about their experience
              </motion.p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.03 }}
                >
                  <Card className="p-6 h-full bg-white/5 backdrop-blur-sm border-white/10 hover:border-[#4ade80]/50 transition-all hover:shadow-xl hover:shadow-[#4ade80]/20">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.2 + i * 0.05 }}
                        >
                          <Star className="h-5 w-5 fill-[#fbbf24] text-[#fbbf24]" />
                        </motion.div>
                      ))}
                    </div>
                    <p className="text-gray-300 mb-6 leading-relaxed italic">"{testimonial.content}"</p>
                    <div className="flex items-center gap-3">
                      <motion.img
                        whileHover={{ scale: 1.1 }}
                        src={testimonial.avatar || "/placeholder.svg"}
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-[#4ade80]/50"
                      />
                      <div>
                        <div className="font-semibold text-white">{testimonial.name}</div>
                        <div className="text-sm text-gray-400">{testimonial.role}</div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* CTA Section */}
      <div className="bg-black relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-linear-to-r from-[#4ade80]/20 via-purple-600/20 to-cyan-500/20 rounded-full blur-3xl" />
        </div>
        <section className="py-32 relative z-10">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 200 }}
                className="mb-8"
              >
                <div className="inline-flex items-center gap-2 bg-linear-to-r from-purple-600/20 to-[#4ade80]/20 border border-[#4ade80]/30 rounded-full px-6 py-3 backdrop-blur-sm">
                  <Sparkles className="w-5 h-5 text-[#4ade80] animate-pulse" />
                  <span className="text-[#4ade80] font-semibold">Start Building Today</span>
                </div>
              </motion.div>

              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-5xl md:text-7xl font-bold mb-6 text-balance leading-tight"
              >
                <span className="text-white">Ready to Start Your</span>
                <br />
                <span className="bg-linear-to-r from-[#4ade80] via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Journey?
                </span>
              </motion.h2>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-xl md:text-2xl mb-12 text-gray-300 text-pretty leading-relaxed max-w-2xl mx-auto"
              >
                Join thousands of businesses, freelancers, and investors building the <span className="text-[#4ade80] font-semibold">future of work</span>
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    size="lg" 
                    className="group bg-linear-to-r from-[#4ade80] to-[#22c55e] hover:from-[#22c55e] hover:to-[#4ade80] text-white text-lg px-10 py-7 shadow-lg shadow-[#4ade80]/50" 
                    asChild
                  >
                    <Link href="/signup" className="flex items-center gap-2">
                      <Rocket className="w-5 h-5" />
                      Create Account
                      <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  variant="outline"
                    className="border-white/20 bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white text-lg px-10 py-7"
                  asChild
                >
                  <Link href="/browse">Find Projects</Link>
                </Button>
                </motion.div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-gray-400"
              >
                {[
                  { icon: CheckCircle2, text: "No credit card required" },
                  { icon: CheckCircle2, text: "Free to join" },
                  { icon: CheckCircle2, text: "Start in minutes" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="flex items-center gap-2"
                  >
                    <item.icon className="h-5 w-5 text-[#4ade80]" />
                    <span className="text-sm">{item.text}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>
      </div>
    </main>
  )
}
