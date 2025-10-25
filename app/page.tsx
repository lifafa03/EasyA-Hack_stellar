"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowRight, Rocket, Users, DollarSign, Shield, TrendingUp, Clock, CheckCircle2, Star } from "lucide-react"
import { GradientBackground } from "@/components/gradient-background"

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
    description:
      "Looking for a creative designer to develop our complete brand identity including logo, colors, and guidelines.",
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

const features = [
  {
    icon: Rocket,
    title: "Post Projects",
    description: "Businesses post projects with milestones and budgets",
    gradient: "from-blue-500 to-cyan-400",
    iconColor: "text-blue-500",
  },
  {
    icon: Users,
    title: "Hire Talent",
    description: "Freelancers bid on work and showcase their skills",
    gradient: "from-purple-500 to-pink-400",
    iconColor: "text-purple-500",
  },
  {
    icon: DollarSign,
    title: "Crowdfund Ideas",
    description: "Investors pool funds to support promising projects",
    gradient: "from-[#4ade80] to-[#22c55e]",
    iconColor: "text-[#22c55e]",
  },
  {
    icon: Shield,
    title: "Secure Escrow",
    description: "Smart contracts handle payments and milestone releases",
    gradient: "from-orange-500 to-red-400",
    iconColor: "text-orange-500",
  },
]

const stats = [
  {
    label: "Active Projects",
    value: "2,500+",
    icon: Rocket,
    gradient: "from-blue-500 to-cyan-400",
    iconColor: "text-blue-500",
  },
  {
    label: "Freelancers",
    value: "15,000+",
    icon: Users,
    gradient: "from-purple-500 to-pink-400",
    iconColor: "text-purple-500",
  },
  {
    label: "Total Funded",
    value: "$12M+",
    icon: DollarSign,
    gradient: "from-[#4ade80] to-[#22c55e]",
    iconColor: "text-[#22c55e]",
  },
  {
    label: "Success Rate",
    value: "94%",
    icon: TrendingUp,
    gradient: "from-orange-500 to-red-400",
    iconColor: "text-orange-500",
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
    content:
      "Finally, a platform where I can invest in projects with real talent attached. Transparency is incredible.",
    avatar: "/confident-business-woman.png",
    rating: 5,
  },
]

const benefits = [
  {
    title: "Instant Payments",
    description: "Get paid immediately when milestones are completed. No waiting, no delays.",
    icon: Clock,
    gradient: "from-cyan-500 to-blue-400",
    iconColor: "text-cyan-500",
  },
  {
    title: "Verified Talent",
    description: "All freelancers are vetted with portfolio reviews and skill assessments.",
    icon: CheckCircle2,
    gradient: "from-[#4ade80] to-[#22c55e]",
    iconColor: "text-[#22c55e]",
  },
  {
    title: "Smart Escrow",
    description: "Blockchain-powered escrow protects both clients and freelancers automatically.",
    icon: Shield,
    gradient: "from-orange-500 to-amber-400",
    iconColor: "text-orange-500",
  },
  {
    title: "Quality Guaranteed",
    description: "Milestone-based releases ensure work meets standards before payment.",
    icon: Star,
    gradient: "from-yellow-400 to-orange-400",
    iconColor: "text-yellow-500",
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <GradientBackground variant="default">
        <section className="relative py-24 md:py-32">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto text-center"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-block mb-6 px-4 py-2 bg-[#4ade80]/10 rounded-full border border-[#4ade80]/20"
              >
                <span className="text-[#22c55e] font-semibold text-sm">Where Work Meets Funding</span>
              </motion.div>

              <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance text-foreground">
                The Future of <span className="text-[#4ade80]">Decentralized</span> Work
              </h1>

              <p className="text-xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto leading-relaxed">
                Post projects, hire top talent, and crowdfund innovative ideas. All powered by blockchain technology for
                transparency and security.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Button size="lg" className="bg-[#4ade80] hover:bg-[#22c55e] text-white" asChild>
                  <Link href="/browse">
                    Browse Projects <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-border bg-transparent" asChild>
                  <Link href="/post-project">Post a Project</Link>
                </Button>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto"
              >
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="text-center"
                  >
                    <div
                      className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} mb-2 shadow-lg`}
                    >
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>
      </GradientBackground>

      {/* Benefits Section */}
      <GradientBackground variant="minimal">
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold mb-4 text-foreground">Why Choose StellarWork+</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Built for the modern workforce with cutting-edge technology
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6 h-full hover:shadow-lg transition-all hover:-translate-y-1 bg-card border-border">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center mb-4 shadow-md`}
                    >
                      <benefit.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2 text-card-foreground">{benefit.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </GradientBackground>

      {/* How It Works Section */}
      <GradientBackground variant="surface">
        <section className="py-24 relative">
          {/* Decorative background elements */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#4ade80]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#3d4a2c]/5 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                className="inline-block mb-4 px-4 py-2 bg-[#4ade80]/10 rounded-full border border-[#4ade80]/20"
              >
                <span className="text-[#22c55e] font-semibold text-sm">Simple & Transparent Process</span>
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">How It Works</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
                A seamless three-sided marketplace connecting businesses, freelancers, and investors
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15, duration: 0.5 }}
                  className="relative"
                >
                  {/* Connection line */}
                  {index < features.length - 1 && (
                    <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-[#4ade80]/30 to-transparent" />
                  )}

                  <Card className="p-8 h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-card border-border relative group">
                    {/* Step number */}
                    <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-[#4ade80] text-white font-bold flex items-center justify-center text-lg shadow-lg">
                      {index + 1}
                    </div>

                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                    >
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>

                    <h3 className="font-bold text-xl mb-3 text-card-foreground">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>

                    {/* Hover effect indicator */}
                    <div className="mt-4 flex items-center text-[#22c55e] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-sm font-semibold">Learn more</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Additional info section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto"
            >
              <Card className="p-8 md:p-12 bg-gradient-to-br from-card to-surface border-border">
                <div className="grid md:grid-cols-3 gap-8 text-center">
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center mx-auto mb-4 shadow-md">
                      <Shield className="h-7 w-7 text-white" />
                    </div>
                    <h4 className="font-bold text-lg mb-2 text-card-foreground">Blockchain Secured</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      All transactions are secured by smart contracts on the Stellar network
                    </p>
                  </div>
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-400 flex items-center justify-center mx-auto mb-4 shadow-md">
                      <Clock className="h-7 w-7 text-white" />
                    </div>
                    <h4 className="font-bold text-lg mb-2 text-card-foreground">Instant Settlements</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Payments are released automatically when milestones are approved
                    </p>
                  </div>
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center mx-auto mb-4 shadow-md">
                      <TrendingUp className="h-7 w-7 text-white" />
                    </div>
                    <h4 className="font-bold text-lg mb-2 text-card-foreground">Transparent Tracking</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Real-time updates on project progress and funding status
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>
      </GradientBackground>

      {/* Featured Projects */}
      <GradientBackground variant="minimal">
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-4xl font-bold mb-2 text-foreground">Featured Projects</h2>
                <p className="text-muted-foreground">Discover opportunities and invest in innovation</p>
              </div>
              <Button variant="outline" className="border-border bg-transparent" asChild>
                <Link href="/browse">View All</Link>
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-0 h-full hover:shadow-lg transition-all hover:-translate-y-1 bg-card border-border overflow-hidden group">
                    <div className="relative h-48 w-full overflow-hidden bg-surface">
                      <img
                        src={project.image || "/placeholder.svg"}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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

      {/* Testimonials Section */}
      <GradientBackground variant="surface">
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold mb-4 text-foreground">Trusted by Thousands</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
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
                  <Card className="p-6 h-full bg-card border-border">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-[#fbbf24] text-[#fbbf24]" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-6 leading-relaxed">"{testimonial.content}"</p>
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
      <section className="py-20 bg-gradient-to-br from-[#4ade80] to-[#22c55e] text-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">Ready to Start Your Journey?</h2>
            <p className="text-xl mb-8 text-white/90 text-pretty leading-relaxed">
              Join thousands of businesses, freelancers, and investors building the future of work
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-[#22c55e] hover:bg-white/90" asChild>
                <Link href="/signup">Create Account</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 bg-transparent"
                asChild
              >
                <Link href="/how-it-works">Learn More</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
