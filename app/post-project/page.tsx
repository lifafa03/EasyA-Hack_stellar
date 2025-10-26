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
import { Plus, X, DollarSign, Calendar, Loader2, CheckCircle2, ExternalLink, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { GradientBackground } from "@/components/gradient-background"
import { useWallet } from "@/hooks/use-wallet"
import { createEscrow } from "@/lib/stellar/trustless-work"
import { validateEscrowCreation, executeWithRetry } from "@/lib/stellar/validation"
import { checkUSDCTrustline } from "@/lib/stellar/payments"
import { toast } from "sonner"

interface Milestone {
  title: string
  budget: string
  description: string
}

interface FormData {
  title: string
  category: string
  description: string
  budget: string
  duration: string
  notes: string
}

type SubmitState = 'idle' | 'validating' | 'checking-trustline' | 'preparing' | 'signing' | 'submitting' | 'success' | 'error'

export default function PostProjectPage() {
  const router = useRouter()
  const wallet = useWallet()
  
  const [formData, setFormData] = useState<FormData>({
    title: "",
    category: "",
    description: "",
    budget: "",
    duration: "",
    notes: "",
  })
  
  const [milestones, setMilestones] = useState<Milestone[]>([{ title: "", budget: "", description: "" }])
  const [skills, setSkills] = useState<string[]>([])
  const [currentSkill, setCurrentSkill] = useState("")
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [escrowId, setEscrowId] = useState<string | null>(null)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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

  // ✅ CHECKPOINT 1: Validate wallet connection
  const checkWalletConnection = (): boolean => {
    if (!wallet.connected || !wallet.publicKey) {
      toast.error('Wallet Not Connected', {
        description: 'Please connect your Stellar wallet to post a project',
      })
      return false
    }
    return true
  }

  // ✅ CHECKPOINT 2: Validate form data
  const validateFormData = (): boolean => {
    if (!formData.title.trim()) {
      toast.error('Missing Project Title')
      return false
    }
    if (!formData.category) {
      toast.error('Please Select a Category')
      return false
    }
    if (!formData.description.trim() || formData.description.length < 50) {
      toast.error('Project Description Too Short', {
        description: 'Please provide at least 50 characters',
      })
      return false
    }
    if (!formData.budget || parseFloat(formData.budget) <= 0) {
      toast.error('Invalid Budget Amount')
      return false
    }
    if (!formData.duration || parseInt(formData.duration) <= 0) {
      toast.error('Invalid Project Duration')
      return false
    }
    return true
  }

  // ✅ CHECKPOINT 3: Validate milestones
  const validateMilestones = (): boolean => {
    if (milestones.length === 0) {
      toast.error('At Least 1 Milestone Required')
      return false
    }
    
    if (milestones.length > 10) {
      toast.error('Maximum 10 Milestones Allowed')
      return false
    }

    for (let i = 0; i < milestones.length; i++) {
      const m = milestones[i]
      if (!m.title.trim()) {
        toast.error(`Milestone ${i + 1} Missing Title`)
        return false
      }
      if (!m.budget || parseFloat(m.budget) <= 0) {
        toast.error(`Milestone ${i + 1} Invalid Budget`)
        return false
      }
      if (!m.description.trim()) {
        toast.error(`Milestone ${i + 1} Missing Description`)
        return false
      }
    }

    // Check if milestones sum to total budget
    const totalMilestoneBudget = milestones.reduce((sum, m) => sum + parseFloat(m.budget || '0'), 0)
    const projectBudget = parseFloat(formData.budget || '0')
    
    if (Math.abs(totalMilestoneBudget - projectBudget) > 0.01) {
      toast.error('Budget Mismatch', {
        description: `Milestones total $${totalMilestoneBudget.toFixed(2)} but project budget is $${projectBudget.toFixed(2)}`,
      })
      return false
    }

    return true
  }

  // ✅ CHECKPOINT 4: Check USDC trustline
  const checkUSDCTrustlineStatus = async (): Promise<boolean> => {
    if (!wallet.publicKey) return false

    try {
      setSubmitState('checking-trustline')
      const trustline = await checkUSDCTrustline(wallet.publicKey)
      
      if (!trustline) {
        toast.error('USDC Trustline Not Found', {
          description: 'Please set up USDC on your account first',
          action: {
            label: 'Setup USDC',
            onClick: () => router.push('/profile'), // Assuming USDC setup is in profile
          },
        })
        return false
      }

      toast.success('✅ USDC Trustline Verified')
      return true
    } catch (error: any) {
      console.error('Error checking trustline:', error)
      toast.error('Trustline Check Failed', {
        description: error.message,
      })
      return false
    }
  }

  // ✅ CHECKPOINT 5: Create escrow with validation
  const createProjectEscrow = async () => {
    if (!wallet.publicKey || !wallet.walletType) {
      throw new Error('Wallet not connected')
    }

    setSubmitState('preparing')
    toast.info('Preparing Escrow Contract...')

    // Prepare escrow parameters
    const escrowParams = {
      clientAddress: wallet.publicKey,
      freelancerAddress: '', // Will be set when bid is accepted
      totalBudget: parseFloat(formData.budget),
      milestones: milestones.map((m, index) => ({
        id: `milestone-${index + 1}`,
        title: m.title,
        description: m.description,
        budget: parseFloat(m.budget),
        status: 'pending' as const,
      })),
      projectId: `project-${Date.now()}`,
      currency: 'USDC' as const,
      enableYield: true, // Enable yield-bearing escrow
    }

    // Validate escrow parameters
    const validation = await validateEscrowCreation({
      clientAddress: escrowParams.clientAddress,
      freelancerAddress: escrowParams.freelancerAddress,
      budget: escrowParams.totalBudget,
      milestones: escrowParams.milestones,
    })
    if (!validation.success) {
      throw new Error(validation.message || 'Escrow validation failed')
    }

    toast.success('✅ Escrow Parameters Validated')

    // Create escrow with auto-retry
    setSubmitState('signing')
    toast.info('Please Sign Transaction in Your Wallet...')

    const result = await executeWithRetry(
      () => createEscrow(escrowParams, wallet.walletType!)
    )

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create escrow')
    }

    return result.data
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setErrorMessage(null)

      // ✅ CHECKPOINT 1: Wallet Connection
      setSubmitState('validating')
      if (!checkWalletConnection()) {
        setSubmitState('idle')
        return
      }

      // ✅ CHECKPOINT 2: Form Data
      if (!validateFormData()) {
        setSubmitState('idle')
        return
      }

      // ✅ CHECKPOINT 3: Milestones
      if (!validateMilestones()) {
        setSubmitState('idle')
        return
      }

      // ✅ CHECKPOINT 4: USDC Trustline
      const trustlineOk = await checkUSDCTrustlineStatus()
      if (!trustlineOk) {
        setSubmitState('idle')
        return
      }

      // ✅ CHECKPOINT 5: Create Escrow
      setSubmitState('submitting')
      const escrowData = await createProjectEscrow()

      // Success!
      setEscrowId(escrowData.escrowId)
      setTransactionHash(escrowData.transaction?.hash || null)
      setSubmitState('success')

      // Store project metadata temporarily
      const projectData = {
        ...formData,
        milestones,
        skills,
        escrowId: escrowData.escrowId,
        contractAddress: escrowData.contractAddress,
        createdAt: new Date().toISOString(),
      }
      localStorage.setItem(`project-${escrowData.escrowId}`, JSON.stringify(projectData))

      toast.success('Project Created Successfully!', {
        description: `Escrow ID: ${escrowData.escrowId}`,
      })

      // Redirect to project page after 3 seconds
      setTimeout(() => {
        router.push(`/project/${escrowData.escrowId}`)
      }, 3000)

    } catch (error: any) {
      console.error('Error creating project:', error)
      setErrorMessage(error.message || 'Failed to create project')
      setSubmitState('error')
      
      toast.error('Project Creation Failed', {
        description: error.message,
        action: {
          label: 'Retry',
          onClick: () => handleSubmit(e),
        },
      })
    }
  }

  const isSubmitting = ['validating', 'checking-trustline', 'preparing', 'signing', 'submitting'].includes(submitState)

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
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted mt-1">{formData.description.length}/50 characters minimum</p>
                </div>
              </div>
            </Card>

            {/* Budget & Timeline */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Budget & Timeline</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget">Total Budget (USDC) *</Label>
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
                  <p className="text-xs text-muted mt-1">Budget in USDC (stablecoin)</p>
                </div>

                <div>
                  <Label htmlFor="duration">Project Duration (days) *</Label>
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
            </Card>

            {/* Milestones */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Project Milestones</h2>
                  <p className="text-sm text-muted mt-1">Break your project into manageable phases</p>
                </div>
                <Button 
                  type="button" 
                  onClick={addMilestone} 
                  variant="outline" 
                  size="sm"
                  disabled={isSubmitting || milestones.length >= 10}
                >
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
                          disabled={isSubmitting}
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
                        disabled={isSubmitting}
                        required
                      />
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                        <Input
                          type="number"
                          placeholder="Budget (USDC)"
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

                    <Textarea
                      placeholder="Milestone description"
                      value={milestone.description}
                      onChange={(e) => updateMilestone(index, "description", e.target.value)}
                      disabled={isSubmitting}
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
                    disabled={isSubmitting}
                  />
                  <Button 
                    type="button" 
                    onClick={addSkill} 
                    variant="outline"
                    disabled={isSubmitting}
                  >
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
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </Card>

            {/* Wallet Connection Alert */}
            {!wallet.connected && (
              <Alert className="border-yellow-500/50 bg-yellow-500/10">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <AlertDescription>
                  You need to connect your Stellar wallet to post a project with blockchain escrow.
                </AlertDescription>
              </Alert>
            )}

            {/* Submission Status */}
            {submitState === 'validating' && (
              <Alert className="border-blue-500/50 bg-blue-500/10">
                <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                <AlertDescription>
                  ✅ Checkpoint 1/5: Validating form data...
                </AlertDescription>
              </Alert>
            )}

            {submitState === 'checking-trustline' && (
              <Alert className="border-blue-500/50 bg-blue-500/10">
                <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                <AlertDescription>
                  ✅ Checkpoint 2/5: Checking USDC trustline...
                </AlertDescription>
              </Alert>
            )}

            {submitState === 'preparing' && (
              <Alert className="border-blue-500/50 bg-blue-500/10">
                <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                <AlertDescription>
                  ✅ Checkpoint 3/5: Preparing escrow contract...
                </AlertDescription>
              </Alert>
            )}

            {submitState === 'signing' && (
              <Alert className="border-purple-500/50 bg-purple-500/10">
                <Loader2 className="h-4 w-4 text-purple-500 animate-spin" />
                <AlertDescription>
                  ✅ Checkpoint 4/5: Please sign the transaction in your wallet...
                </AlertDescription>
              </Alert>
            )}

            {submitState === 'submitting' && (
              <Alert className="border-blue-500/50 bg-blue-500/10">
                <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                <AlertDescription>
                  ✅ Checkpoint 5/5: Submitting to Stellar blockchain...
                </AlertDescription>
              </Alert>
            )}

            {submitState === 'success' && escrowId && (
              <Alert className="border-[#22c55e]/50 bg-[#22c55e]/10">
                <CheckCircle2 className="h-4 w-4 text-[#22c55e]" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold">✅ Project Created Successfully!</p>
                    <p className="text-sm">Escrow ID: {escrowId}</p>
                    {transactionHash && (
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#4ade80] hover:underline text-sm flex items-center gap-1"
                      >
                        View on Blockchain <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    <p className="text-xs text-muted">Redirecting to project page...</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {submitState === 'error' && errorMessage && (
              <Alert className="border-destructive/50 bg-destructive/10">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <AlertDescription>
                  <p className="font-semibold">❌ Error Creating Project</p>
                  <p className="text-sm mt-1">{errorMessage}</p>
                  <p className="text-xs text-muted mt-2">Click Publish Project to retry with auto-correction</p>
                </AlertDescription>
              </Alert>
            )}

            {/* Submit */}
            <div className="flex gap-4">
              <Button 
                type="submit" 
                size="lg" 
                className="flex-1 bg-[#4ade80] hover:bg-[#22c55e] text-white"
                disabled={isSubmitting || submitState === 'success'}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {submitState === 'validating' && 'Validating...'}
                    {submitState === 'checking-trustline' && 'Checking Trustline...'}
                    {submitState === 'preparing' && 'Preparing Escrow...'}
                    {submitState === 'signing' && 'Waiting for Signature...'}
                    {submitState === 'submitting' && 'Submitting Transaction...'}
                  </>
                ) : submitState === 'success' ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Project Created!
                  </>
                ) : (
                  'Publish Project'
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
