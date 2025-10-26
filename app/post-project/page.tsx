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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, X, DollarSign, Calendar, Loader2, CheckCircle2, ExternalLink, AlertCircle, Shield } from "lucide-react"
import { useRouter } from "next/navigation"
import { GradientBackground } from "@/components/gradient-background"
import { useWalletKit } from "@/hooks/use-wallet-kit"
import { toast } from "sonner"

interface Milestone {
  title: string
  budget: string
}

interface FormData {
  title: string
  category: string
  description: string
  budget: string
  duration: string
}

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

export default function PostProjectPage() {
  const router = useRouter()
  const wallet = useWalletKit()
  
  const [formData, setFormData] = useState<FormData>({
    title: "",
    category: "",
    description: "",
    budget: "",
    duration: "",
  })
  
  const [milestones, setMilestones] = useState<Milestone[]>([
    { title: "", budget: "" },
    { title: "", budget: "" }
  ])
  
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const addMilestone = () => {
    if (milestones.length < 5) {
      setMilestones([...milestones, { title: "", budget: "" }])
    }
  }

  const removeMilestone = (index: number) => {
    if (milestones.length > 2) {
      setMilestones(milestones.filter((_, i) => i !== index))
    }
  }

  const updateMilestone = (index: number, field: keyof Milestone, value: string) => {
    const updated = [...milestones]
    updated[index][field] = value
    setMilestones(updated)
  }

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      toast.error('Please enter a project title')
      return false
    }
    if (!formData.category) {
      toast.error('Please select a category')
      return false
    }
    if (!formData.description.trim() || formData.description.length < 50) {
      toast.error('Description must be at least 50 characters')
      return false
    }
    if (!formData.budget || parseFloat(formData.budget) <= 0) {
      toast.error('Please enter a valid budget')
      return false
    }
    if (!formData.duration || parseInt(formData.duration) <= 0) {
      toast.error('Please enter a valid duration')
      return false
    }

    // Validate milestones
    const filledMilestones = milestones.filter(m => m.title.trim() && m.budget)
    if (filledMilestones.length < 2) {
      toast.error('Please add at least 2 milestones')
      return false
    }

    const totalMilestoneBudget = filledMilestones.reduce((sum, m) => sum + parseFloat(m.budget || '0'), 0)
    const projectBudget = parseFloat(formData.budget || '0')
    
    if (Math.abs(totalMilestoneBudget - projectBudget) > 0.01) {
      toast.error(`Milestones must total ${projectBudget} USDC (currently ${totalMilestoneBudget.toFixed(2)})`)
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setErrorMessage(null)

      if (!wallet.connected) {
        toast.error('Please connect your wallet first')
        return
      }

      if (!validateForm()) {
        return
      }

      setSubmitState('submitting')

      // Simulate project creation
      await new Promise(resolve => setTimeout(resolve, 2000))

      const projectId = `project-${Date.now()}`
      
      // Store project data
      const projectData = {
        ...formData,
        milestones: milestones.filter(m => m.title.trim() && m.budget),
        createdAt: new Date().toISOString(),
        clientAddress: wallet.publicKey,
      }
      localStorage.setItem(projectId, JSON.stringify(projectData))

      setSubmitState('success')
      toast.success('Project created successfully!')

      setTimeout(() => {
        router.push('/browse')
      }, 2000)

    } catch (error: any) {
      console.error('Error creating project:', error)
      setErrorMessage(error.message || 'Failed to create project')
      setSubmitState('error')
      toast.error('Failed to create project')
    }
  }

  const isSubmitting = submitState === 'submitting'

  return (
    <GradientBackground variant="default">
      <main className="min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Post a Project</h1>
            <p className="text-muted text-lg mb-8">
              Share your project and connect with talented freelancers
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Project Details */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Project Details</h2>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Project Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Build a Mobile App for E-commerce"
                    required
                    className="mt-2"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select 
                    required
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="ai-ml">AI/ML</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="blockchain">Blockchain</SelectItem>
                      <SelectItem value="writing">Writing</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what you need built, key features, and your expectations..."
                    required
                    className="mt-2 min-h-32"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted mt-1">
                    {formData.description.length}/50 characters minimum
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="budget">Budget (USDC) *</Label>
                    <div className="relative mt-2">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                      <Input 
                        id="budget" 
                        type="number" 
                        placeholder="5000" 
                        required 
                        className="pl-9"
                        value={formData.budget}
                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                        disabled={isSubmitting}
                        min="1"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="duration">Duration (days) *</Label>
                    <div className="relative mt-2">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                      <Input 
                        id="duration" 
                        type="number" 
                        placeholder="30" 
                        required 
                        className="pl-9"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        disabled={isSubmitting}
                        min="1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Milestones */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Payment Milestones</h2>
                  <p className="text-sm text-muted mt-1">Break your project into 2-5 payment phases</p>
                </div>
                <Button 
                  type="button" 
                  onClick={addMilestone} 
                  variant="outline" 
                  size="sm"
                  disabled={isSubmitting || milestones.length >= 5}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>

              <div className="space-y-3">
                {milestones.map((milestone, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-surface-dark rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm">Milestone {index + 1}</h3>
                      {milestones.length > 2 && (
                        <Button
                          type="button"
                          onClick={() => removeMilestone(index)}
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive h-8 w-8 p-0"
                          disabled={isSubmitting}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-3">
                      <Input
                        placeholder="e.g., Initial Design"
                        value={milestone.title}
                        onChange={(e) => updateMilestone(index, "title", e.target.value)}
                        disabled={isSubmitting}
                        required
                      />
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                        <Input
                          type="number"
                          placeholder="Amount"
                          value={milestone.budget}
                          onChange={(e) => updateMilestone(index, "budget", e.target.value)}
                          disabled={isSubmitting}
                          required
                          min="0"
                          step="0.01"
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <Alert className="mt-4 border-[#4ade80]/50 bg-[#4ade80]/10">
                <Shield className="h-4 w-4 text-[#22c55e]" />
                <AlertDescription className="text-sm">
                  Payments are secured in escrow and released as you approve each milestone
                </AlertDescription>
              </Alert>
            </Card>

            {/* Wallet Connection Alert */}
            {!wallet.connected && (
              <Alert className="border-yellow-500/50 bg-yellow-500/10">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <AlertDescription>
                  Connect your wallet to post a project with secure escrow protection
                </AlertDescription>
              </Alert>
            )}

            {/* Success State */}
            {submitState === 'success' && (
              <Alert className="border-[#22c55e]/50 bg-[#22c55e]/10">
                <CheckCircle2 className="h-4 w-4 text-[#22c55e]" />
                <AlertDescription>
                  <p className="font-semibold">Project created successfully!</p>
                  <p className="text-sm mt-1">Redirecting to browse page...</p>
                </AlertDescription>
              </Alert>
            )}

            {/* Error State */}
            {submitState === 'error' && errorMessage && (
              <Alert className="border-destructive/50 bg-destructive/10">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <AlertDescription>
                  <p className="font-semibold">Error creating project</p>
                  <p className="text-sm mt-1">{errorMessage}</p>
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <Button 
                type="submit" 
                size="lg" 
                className="flex-1 bg-[#4ade80] hover:bg-[#22c55e] text-white"
                disabled={isSubmitting || submitState === 'success' || !wallet.connected}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Project...
                  </>
                ) : submitState === 'success' ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Project Created!
                  </>
                ) : (
                  'Post Project'
                )}
              </Button>
              <Button 
                type="button" 
                size="lg" 
                variant="outline" 
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </motion.form>
        </div>
      </main>
    </GradientBackground>
  )
}
