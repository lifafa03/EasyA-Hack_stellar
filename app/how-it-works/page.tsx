"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Briefcase, Users, DollarSign, Shield, Zap, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react"
import Link from "next/link"
import { GradientBackground } from "@/components/gradient-background"
import { StellarFAQ } from "@/components/stellar/stellar-faq"
import { StellarBadge } from "@/components/stellar"

const userTypes = [
  {
    icon: Briefcase,
    title: "For Businesses",
    description: "Post projects and get them funded",
    gradient: "from-blue-500 to-cyan-400",
    steps: [
      "Create a detailed project with milestones",
      "Set your budget and timeline",
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
      "Submit competitive bids with proposals",
      "Get selected by project owners",
      "Complete milestones and get paid",
      "Build your reputation and portfolio",
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
      "Review project details and milestones",
      "Invest any amount you're comfortable with",
      "Track project progress in real-time",
      "Earn returns based on project success",
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
    description: "Blockchain-powered payments mean freelancers get paid immediately upon milestone approval",
    gradient: "from-yellow-400 to-orange-400",
  },
  {
    icon: TrendingUp,
    title: "Transparent Progress",
    description: "All stakeholders can track project progress and fund allocation in real-time",
    gradient: "from-purple-500 to-pink-400",
  },
  {
    icon: CheckCircle2,
    title: "Milestone-Based",
    description: "Projects are broken into clear milestones, reducing risk for all parties",
    gradient: "from-[#4ade80] to-[#22c55e]",
  },
]

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <GradientBackground variant="default">
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-5xl md:text-6xl font-bold mb-6 text-balance">
                How <span className="text-[#4ade80]">StellarWork+</span> Works
              </h1>
              <p className="text-xl text-muted text-pretty">
                A revolutionary platform that combines freelance work with crowdfunding, powered by blockchain
                technology
              </p>
            </motion.div>
          </div>
        </section>
      </GradientBackground>

      {/* User Types */}
      <GradientBackground variant="minimal">
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              {userTypes.map((type, index) => (
                <motion.div
                  key={type.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-8 h-full flex flex-col">
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${type.gradient} flex items-center justify-center mb-6 shadow-lg`}
                    >
                      <type.icon className="h-8 w-8 text-white" />
                    </div>

                    <h2 className="text-2xl font-bold mb-2">{type.title}</h2>
                    <p className="text-muted mb-6">{type.description}</p>

                    <div className="space-y-3 mb-8 flex-grow">
                      {type.steps.map((step, stepIndex) => (
                        <div key={stepIndex} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-[#4ade80]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-[#22c55e] text-sm font-semibold">{stepIndex + 1}</span>
                          </div>
                          <p className="text-sm">{step}</p>
                        </div>
                      ))}
                    </div>

                    <Button className="w-full bg-[#4ade80] hover:bg-[#22c55e] text-white" asChild>
                      <Link href={type.ctaLink}>
                        {type.cta} <ArrowRight className="ml-2 h-4 w-4" />
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
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold mb-4">Why Choose StellarWork+</h2>
              <p className="text-muted text-lg max-w-2xl mx-auto">
                Built on blockchain for transparency, security, and instant payments
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6 h-full text-center">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mx-auto mb-4 shadow-md`}
                    >
                      <feature.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted text-sm">{feature.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </GradientBackground>

      {/* How Funding Works */}
      <GradientBackground variant="minimal">
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold mb-4">The Funding Process</h2>
              <p className="text-muted text-lg">How projects get funded and completed</p>
            </motion.div>

            <div className="space-y-6">
              {[
                {
                  step: 1,
                  title: "Project Posted",
                  description:
                    "Business posts a project with detailed requirements, budget, and milestones. The project becomes visible to freelancers and investors.",
                },
                {
                  step: 2,
                  title: "Bids & Funding",
                  description:
                    "Freelancers submit bids while investors can crowdfund the project. Multiple investors can pool funds together to support promising projects.",
                },
                {
                  step: 3,
                  title: "Work Begins",
                  description:
                    "Once a freelancer is selected and funding is secured, work begins. Funds are held in smart contract escrow for security.",
                },
                {
                  step: 4,
                  title: "Milestone Completion",
                  description:
                    "As each milestone is completed and approved, funds are automatically released to the freelancer. Investors can track progress in real-time.",
                },
                {
                  step: 5,
                  title: "Project Success",
                  description:
                    "Upon successful completion, all parties benefit: businesses get their product, freelancers get paid, and investors earn returns.",
                },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#4ade80] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xl font-bold">{item.step}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-xl mb-2">{item.title}</h3>
                        <p className="text-muted">{item.description}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </GradientBackground>

      {/* Stellar Education Section */}
      <GradientBackground variant="surface">
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <div className="flex justify-center mb-4">
                <StellarBadge />
              </div>
              <h2 className="text-4xl font-bold mb-4">Built on Stellar Blockchain</h2>
              <p className="text-muted text-lg">
                Fast, secure, and transparent transactions powered by cutting-edge blockchain technology
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <Card className="p-6">
                <h3 className="font-bold text-xl mb-3">⚡ Lightning Fast</h3>
                <p className="text-muted mb-4">
                  Stellar processes transactions in just 5-7 seconds. No more waiting days for payments to clear.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Instant payment confirmations</li>
                  <li>• Real-time balance updates</li>
                  <li>• No banking delays</li>
                </ul>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-xl mb-3">💰 Minimal Fees</h3>
                <p className="text-muted mb-4">
                  Transaction fees are just fractions of a cent, meaning more money stays in your pocket.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 0.00001 XLM per transaction</li>
                  <li>• No hidden charges</li>
                  <li>• Transparent fee structure</li>
                </ul>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-xl mb-3">🔒 Secure & Trustless</h3>
                <p className="text-muted mb-4">
                  Smart contracts automatically enforce agreements without requiring trust between parties.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Funds locked in escrow</li>
                  <li>• Automatic milestone releases</li>
                  <li>• Dispute protection built-in</li>
                </ul>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-xl mb-3">🌍 Global & Accessible</h3>
                <p className="text-muted mb-4">
                  Work with anyone, anywhere. Stellar enables borderless payments with fiat on/off-ramps.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Support for multiple currencies</li>
                  <li>• Easy fiat conversion</li>
                  <li>• No geographic restrictions</li>
                </ul>
              </Card>
            </div>

            <StellarFAQ />
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
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">Ready to Get Started?</h2>
            <p className="text-xl mb-8 text-white/90 text-pretty">
              Join the future of decentralized work and funding today
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
                <Link href="/browse">Browse Projects</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
