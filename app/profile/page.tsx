"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Camera, Star, Briefcase, DollarSign, Award } from "lucide-react"
import React from "react"
import { GradientBackground } from "@/components/gradient-background"

const profileData = {
  name: "Alex Johnson",
  email: "alex@example.com",
  bio: "Full-stack developer with 8+ years of experience in React, Node.js, and blockchain technologies. Passionate about building decentralized applications and helping startups bring their ideas to life.",
  location: "San Francisco, CA",
  website: "https://alexjohnson.dev",
  avatar: "/programmer.png",
  rating: 4.8,
  totalReviews: 24,
  skills: ["React", "Node.js", "Blockchain", "Smart Contracts", "TypeScript", "Python", "AWS"],
  stats: {
    projectsCompleted: 8,
    totalEarned: 12500,
    successRate: 95,
  },
  portfolio: [
    {
      id: 1,
      title: "DeFi Trading Platform",
      description: "Built a decentralized trading platform with smart contract integration",
      image: "/defi-trading-platform.jpg",
    },
    {
      id: 2,
      title: "E-commerce Mobile App",
      description: "React Native app with payment processing and real-time inventory",
      image: "/ecommerce-mobile-app.png",
    },
    {
      id: 3,
      title: "AI Content Generator",
      description: "Full-stack application using GPT-4 for automated content creation",
      image: "/ai-content-generator.png",
    },
  ],
}

export default function ProfilePage() {
  const [isEditing, setIsEditing] = React.useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Profile saved")
    setIsEditing(false)
  }

  return (
    <GradientBackground variant="default">
      <main className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center justify-between">
              <h1 className="text-4xl font-bold">Profile</h1>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} className="bg-[#4ade80] hover:bg-[#22c55e] text-white">
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleSave} className="bg-[#4ade80] hover:bg-[#22c55e] text-white">
                    Save Changes
                  </Button>
                  <Button onClick={() => setIsEditing(false)} variant="outline">
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Profile Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="p-8 mb-8">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Avatar Section */}
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <Avatar className="h-32 w-32">
                      <img src={profileData.avatar || "/placeholder.svg"} alt={profileData.name} />
                    </Avatar>
                    {isEditing && (
                      <button className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-[#4ade80] flex items-center justify-center text-white hover:bg-[#22c55e] transition-colors">
                        <Camera className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  <div className="mt-4 text-center">
                    <div className="flex items-center gap-2 justify-center mb-2">
                      <Star className="h-5 w-5 text-[#fbbf24] fill-[#fbbf24]" />
                      <span className="font-bold text-lg">{profileData.rating}</span>
                      <span className="text-muted text-sm">({profileData.totalReviews} reviews)</span>
                    </div>
                  </div>
                </div>

                {/* Info Section */}
                <div className="flex-grow">
                  {isEditing ? (
                    <form className="space-y-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" defaultValue={profileData.name} className="mt-2" />
                      </div>

                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" defaultValue={profileData.email} className="mt-2" />
                      </div>

                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input id="location" defaultValue={profileData.location} className="mt-2" />
                      </div>

                      <div>
                        <Label htmlFor="website">Website</Label>
                        <Input id="website" type="url" defaultValue={profileData.website} className="mt-2" />
                      </div>

                      <div>
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea id="bio" defaultValue={profileData.bio} className="mt-2 min-h-24" />
                      </div>
                    </form>
                  ) : (
                    <div>
                      <h2 className="text-3xl font-bold mb-2">{profileData.name}</h2>
                      <p className="text-muted mb-4">{profileData.email}</p>
                      <p className="text-foreground leading-relaxed mb-4">{profileData.bio}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted">
                        <span>📍 {profileData.location}</span>
                        <span>
                          🌐{" "}
                          <a href={profileData.website} className="text-[#22c55e] hover:underline">
                            {profileData.website}
                          </a>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#4ade80]/10 flex items-center justify-center">
                    <Briefcase className="h-6 w-6 text-[#22c55e]" />
                  </div>
                  <div>
                    <p className="text-sm text-muted">Projects Completed</p>
                    <p className="text-2xl font-bold">{profileData.stats.projectsCompleted}</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted">Total Earned</p>
                    <p className="text-2xl font-bold">${profileData.stats.totalEarned.toLocaleString()}</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#fbbf24]/10 flex items-center justify-center">
                    <Award className="h-6 w-6 text-[#fbbf24]" />
                  </div>
                  <div>
                    <p className="text-sm text-muted">Success Rate</p>
                    <p className="text-2xl font-bold">{profileData.stats.successRate}%</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Skills */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {profileData.skills.map((skill) => (
                  <Badge key={skill} className="bg-[#4ade80]/10 text-[#22c55e] hover:bg-[#4ade80]/20 px-4 py-2">
                    {skill}
                  </Badge>
                ))}
                {isEditing && (
                  <Button variant="outline" size="sm">
                    + Add Skill
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Portfolio */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Portfolio</h2>
                {isEditing && (
                  <Button variant="outline" size="sm">
                    + Add Project
                  </Button>
                )}
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profileData.portfolio.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="group cursor-pointer"
                  >
                    <div className="relative overflow-hidden rounded-lg mb-3">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.title}
                        className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted">{item.description}</p>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </main>
    </GradientBackground>
  )
}
