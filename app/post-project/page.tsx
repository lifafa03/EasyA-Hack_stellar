"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, X, DollarSign, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"
import { GradientBackground } from "@/components/gradient-background"

interface Milestone {
  title: string
  budget: string
  description: string
}

export default function PostProjectPage() {
  const router = useRouter()
  const [milestones, setMilestones] = useState<Milestone[]>([{ title: "", budget: "", description: "" }])
  const [skills, setSkills] = useState<string[]>([])
  const [currentSkill, setCurrentSkill] = useState("")

  const addMilestone = () => {
    setMilestones([...milestones, { title: "", budget: "", description: "" }])
  }

  const removeMilestone = (index: number) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter((_, i) => i !== index))
    }
  }

  const updateMilestone = (index: number, field: keyof Milestone, value: string) => {
    const updated = [...milestones]
    updated[index][field] = value
    setMilestones(updated)
  }

  const addSkill = () => {
    if (currentSkill.trim() && !skills.includes(currentSkill.trim())) {
      setSkills([...skills, currentSkill.trim()])
      setCurrentSkill("")
    }
  }

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would submit to an API
    console.log("[v0] Project submitted")
    router.push("/browse")
  }

  return (
    <GradientBackground variant="default">
      <main className="min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Post a Project</h1>
            <p className="text-muted text-lg mb-8">
              Share your project details and connect with talented freelancers and investors
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Basic Information */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Basic Information</h2>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Project Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Mobile App Development for E-commerce"
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select required>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="ai-ml">AI/ML</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="blockchain">Blockchain</SelectItem>
                      <SelectItem value="video">Video Production</SelectItem>
                      <SelectItem value="writing">Writing</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Project Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your project in detail. What are you building? What problems does it solve? What are your expectations?"
                    required
                    className="mt-2 min-h-32"
                  />
                </div>
              </div>
            </Card>

            {/* Budget & Timeline */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Budget & Timeline</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget">Total Budget (USD) *</Label>
                  <div className="relative mt-2">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                    <Input id="budget" type="number" placeholder="5000" required className="pl-9" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="duration">Project Duration (days) *</Label>
                  <div className="relative mt-2">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                    <Input id="duration" type="number" placeholder="30" required className="pl-9" />
                  </div>
                </div>
              </div>
            </Card>

            {/* Milestones */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Project Milestones</h2>
                  <p className="text-sm text-muted mt-1">Break your project into manageable phases</p>
                </div>
                <Button type="button" onClick={addMilestone} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Milestone
                </Button>
              </div>

              <div className="space-y-4">
                {milestones.map((milestone, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-surface-dark rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Milestone {index + 1}</h3>
                      {milestones.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeMilestone(index)}
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-3">
                      <Input
                        placeholder="Milestone title"
                        value={milestone.title}
                        onChange={(e) => updateMilestone(index, "title", e.target.value)}
                        required
                      />
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                        <Input
                          type="number"
                          placeholder="Budget"
                          value={milestone.budget}
                          onChange={(e) => updateMilestone(index, "budget", e.target.value)}
                          required
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <Textarea
                      placeholder="Milestone description"
                      value={milestone.description}
                      onChange={(e) => updateMilestone(index, "description", e.target.value)}
                      className="min-h-20"
                    />
                  </motion.div>
                ))}
              </div>
            </Card>

            {/* Required Skills */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Required Skills</h2>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a skill (e.g., React, Node.js, Figma)"
                    value={currentSkill}
                    onChange={(e) => setCurrentSkill(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addSkill()
                      }
                    }}
                  />
                  <Button type="button" onClick={addSkill} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <motion.span
                        key={skill}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="px-3 py-1 bg-[#4ade80]/10 text-[#22c55e] rounded-full text-sm flex items-center gap-2"
                      >
                        {skill}
                        <button type="button" onClick={() => removeSkill(skill)} className="hover:text-[#4ade80]">
                          <X className="h-3 w-3" />
                        </button>
                      </motion.span>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Additional Details */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Additional Details</h2>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="attachments">Attachments (Optional)</Label>
                  <Input id="attachments" type="file" multiple className="mt-2" />
                  <p className="text-xs text-muted mt-2">Upload any relevant documents, designs, or specifications</p>
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any other information freelancers or investors should know..."
                    className="mt-2 min-h-24"
                  />
                </div>
              </div>
            </Card>

            {/* Submit */}
            <div className="flex gap-4">
              <Button type="submit" size="lg" className="flex-1 bg-[#4ade80] hover:bg-[#22c55e] text-white">
                Publish Project
              </Button>
              <Button type="button" size="lg" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </motion.form>
        </div>
      </main>
    </GradientBackground>
  )
}
