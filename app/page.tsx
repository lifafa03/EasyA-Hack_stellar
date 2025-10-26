"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  ArrowRight, Rocket, Users, DollarSign, Shield, TrendingUp, Clock, 
  CheckCircle2, Star, Zap, Briefcase, Globe, Lock, BarChart3
} from "lucide-react"
import { GradientBackground } from "@/components/gradient-background"
import { StellarBadge, StellarFAQ } from "@/components/stellar"
import { WalletConnectButton } from "@/components/wallet-connect"

const stats = [
  { label: "Active Projects", value: "2,500+", icon: Rocket },
  { label: "Freelancers", value: "15,000+", icon: Users },
  { label: "Total Funded", value: "$12M+", icon: DollarSign },
  { label: "Success Rate", value: "94%", icon: TrendingUp },
]

const userJourneys = [
  {
    icon: Briefcase,
    title: "For Businesses",
    description: "Post projects and get them funded",
    gradient: "from-blue-500 to-cyan-400",
    steps: [
      "Create detailed project with milestones",
      "Set budget and timeline",
      "Receive bids from talented freelancers",
      "Get crowdfunding from investors",
      "Release payments as milestones complete",
    ],
    cta: "Post a Project",
    ctaLink: "/post-project",
  },
  {
    icon: Users,
    title: "For Freelancers",
    description: "Find work and showcase your skills",
    gradient: "from-purple-500 to-pink-400",
    steps: [
      "Browse available projects",
      "Submit competitive bids",
      "Get selected by project owners",
      "Complete milestones and get paid instantly",
      "Build reputation and portfolio",
    ],
    cta: "Browse Projects",
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
    <main className="min-h-screen">
      {/* Hero Section */}
      <GradientBackground variant="default">
        <section className="relative py-24 md:py-32 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-20 right-10 w-72 h-72 bg-[#4ade80]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-[#22c55e]/10 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-5xl mx-auto text-center"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-[#4ade80]/10 rounded-full border border-[#4ade80]/20"
              >
                <div className="scale-75">
                  <StellarBadge />
                </div>
                <span className="text-[#22c55e] font-semibold text-sm">Powered by Stellar Blockchain</span>
              </motion.div>

              <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance text-foreground leading-tight">
                The Future of <span className="text-[#4ade80]">Decentralized</span> Work
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground mb-8 text-pretty max-w-3xl mx-auto leading-relaxed">
                Connect businesses, freelancers, and investors on a transparent platform powered by blockchain technology
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <Button size="lg" className="bg-[#4ade80] hover:bg-[#22c55e] text-white text-lg px-8" asChild>
                  <Link href="/browse">
                    Explore Projects <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-border bg-transparent text-lg px-8" asChild>
                  <Link href="/post-project">Post a Project</Link>
                </Button>
              </div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
              >
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#4ade80]/10 mb-3">
                      <stat.icon className="h-7 w-7 text-[#22c55e]" />
                    </div>
                    <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>
      </GradientBackground>

      {/* How It Works - User Journeys */}
      <GradientBackground variant="minimal">
        <section className="py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">How It Works</h2>
              <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto">
                A seamless three-sided marketplace connecting businesses, freelancers, and investors
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {userJourneys.map((journey, index) => (
                <motion.div
                  key={journey.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                >
                  <Card className="p-8 h-full flex flex-col hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-card border-border">
                    <div
                      className={`w-16 h-16 rounded-2xl bg-linear-to-br ${journey.gradient} flex items-center justify-center mb-6 shadow-lg`}
                    >
                      <journey.icon className="h-8 w-8 text-white" />
                    </div>

                    <h3 className="text-2xl font-bold mb-2 text-card-foreground">{journey.title}</h3>
                    <p className="text-muted-foreground mb-6">{journey.description}</p>

                    <div className="space-y-3 mb-8 grow">
                      {journey.steps.map((step, stepIndex) => (
                        <div key={stepIndex} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-[#4ade80]/20 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-[#22c55e] text-sm font-semibold">{stepIndex + 1}</span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{step}</p>
                        </div>
                      ))}
                    </div>

                    <Button className="w-full bg-[#4ade80] hover:bg-[#22c55e] text-white" asChild>
                      <Link href={journey.ctaLink}>
                        {journey.cta} <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </GradientBackground>

      {/* Key Features */}
      <GradientBackground variant="surface">
        <section className="py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">Why Choose StellarWork+</h2>
              <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto">
                Built on blockchain for transparency, security, and instant payments
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6 h-full hover:shadow-lg transition-all hover:-translate-y-1 bg-card border-border group">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-linear-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform`}
                    >
                      <feature.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-card-foreground">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </GradientBackground>

      {/* Featured Projects */}
      <GradientBackground variant="minimal">
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-4xl font-bold mb-2 text-foreground">Featured Projects</h2>
                <p className="text-muted-foreground text-lg">Discover opportunities and invest in innovation</p>
              </div>
              <Button variant="outline" className="border-border bg-transparent" asChild>
                <Link href="/browse">View All</Link>
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {featuredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-0 h-full hover:shadow-xl transition-all hover:-translate-y-2 bg-card border-border overflow-hidden group">
                    <div className="relative h-48 w-full overflow-hidden bg-surface">
                      <img
                        src={project.image || "/placeholder.svg"}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
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
                      <h3 className="font-bold text-lg mb-2 text-balance text-card-foreground group-hover:text-[#22c55e] transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>

                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Funded</span>
                            <span className="font-semibold text-card-foreground">
                              ${project.funded.toLocaleString()} / ${project.budget.toLocaleString()}
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${(project.funded / project.budget) * 100}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 1, delay: 0.2 }}
                              className="h-full bg-[#4ade80] rounded-full"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-border">
                          <span className="text-sm text-muted-foreground">{project.bids} bids</span>
                          <Button size="sm" variant="ghost" className="text-[#22c55e] hover:text-[#4ade80]" asChild>
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
      </GradientBackground>

      {/* Stellar Benefits */}
      <GradientBackground variant="surface">
        <section className="py-24">
          <div className="container mx-auto px-4 max-w-6xl">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <div className="flex justify-center mb-4">
                <StellarBadge />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">Built on Stellar Blockchain</h2>
              <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto">
                Fast, secure, and transparent transactions powered by cutting-edge blockchain technology
              </p>
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
                >
                  <Card className="p-6 h-full bg-card border-border hover:shadow-lg transition-all">
                    <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${benefit.gradient} flex items-center justify-center mb-4`}>
                      <benefit.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-bold text-xl mb-3 text-card-foreground">{benefit.title}</h3>
                    <p className="text-muted-foreground mb-4 leading-relaxed">{benefit.description}</p>
                    <ul className="space-y-2">
                      {benefit.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-[#22c55e] shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </motion.div>
              ))}
            </div>

            <StellarFAQ />
          </div>
        </section>
      </GradientBackground>

      {/* Testimonials */}
      <GradientBackground variant="minimal">
        <section className="py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">Trusted by Thousands</h2>
              <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto">
                See what our community has to say about their experience
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6 h-full bg-card border-border hover:shadow-lg transition-all">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-[#fbbf24] text-[#fbbf24]" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-6 leading-relaxed italic">"{testimonial.content}"</p>
                    <div className="flex items-center gap-3">
                      <img
                        src={testimonial.avatar || "/placeholder.svg"}
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-semibold text-card-foreground">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </GradientBackground>

      {/* CTA Section */}
      <section className="py-24 bg-linear-to-br from-[#4ade80] to-[#22c55e] text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-balance">Ready to Start Your Journey?</h2>
            <p className="text-xl md:text-2xl mb-10 text-white/90 text-pretty leading-relaxed max-w-2xl mx-auto">
              Join thousands of businesses, freelancers, and investors building the future of work
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="bg-white text-[#22c55e] hover:bg-white/90 text-lg px-8" asChild>
                <Link href="/signup">Create Account</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 bg-transparent text-lg px-8"
                asChild
              >
                <Link href="/browse">Explore Projects</Link>
              </Button>
            </div>
            
            <div className="mt-12 flex items-center justify-center gap-2 text-white/80">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm">No credit card required • Free to join • Start in minutes</span>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
