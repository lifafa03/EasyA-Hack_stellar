"use client"

import React, { useState, useEffect } from "react"
import type { FormEvent } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, X, DollarSign, Calendar, Loader2, CheckCircle2, ExternalLink, AlertCircle, Shield, ArrowRightLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { GradientBackground } from "@/components/gradient-background"
import { useWalletKit } from "@/hooks/use-wallet-kit"
import { toast } from "sonner"
// Removed TrustlessWork dependency - using simple Stellar USDC instead

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
  const [showSwapSection, setShowSwapSection] = useState(false)
  const [swapAmount, setSwapAmount] = useState('')
  const [swapping, setSwapping] = useState(false)
  const [usdcBalance, setUsdcBalance] = useState<string>('0')

  // Fetch USDC balance when wallet connects
  const fetchUSDCBalance = async () => {
    if (!wallet.connected || !wallet.publicKey) return

    try {
      const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${wallet.publicKey}`)
      const account = await response.json()
      
      const usdcAsset = account.balances.find((b: any) => 
        b.asset_code === 'USDC' && 
        b.asset_issuer === 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
      )
      
      setUsdcBalance(usdcAsset ? parseFloat(usdcAsset.balance).toFixed(2) : '0')
    } catch (error) {
      console.error('Error fetching USDC balance:', error)
    }
  }

  // Swap XLM to USDC
  const handleSwap = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      toast.error('Please connect your wallet')
      return
    }

    if (!swapAmount || parseFloat(swapAmount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    try {
      setSwapping(true)

      const StellarSDK = await import('@stellar/stellar-sdk')
      const { signAndSubmitTransaction } = await import('@/lib/stellar/wallet')
      
      const server = new StellarSDK.Horizon.Server('https://horizon-testnet.stellar.org')
      
      const sourceAsset = StellarSDK.Asset.native()
      const destAsset = new StellarSDK.Asset(
        'USDC',
        'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
      )

      // Find swap path
      const paths = await server
        .strictSendPaths(sourceAsset, swapAmount, [destAsset])
        .call()

      if (!paths.records || paths.records.length === 0) {
        throw new Error('No swap path found. DEX might not have liquidity.')
      }

      const bestPath = paths.records[0]
      const account = await server.loadAccount(wallet.publicKey)

      // Build transaction
      const transaction = new StellarSDK.TransactionBuilder(account, {
        fee: StellarSDK.BASE_FEE,
        networkPassphrase: StellarSDK.Networks.TESTNET,
      })
        .addOperation(
          StellarSDK.Operation.pathPaymentStrictSend({
            sendAsset: sourceAsset,
            sendAmount: swapAmount,
            destination: wallet.publicKey,
            destAsset: destAsset,
            destMin: (parseFloat(bestPath.destination_amount) * 0.99).toFixed(7),
          })
        )
        .setTimeout(180)
        .build()

      // Sign and submit
      const result = await signAndSubmitTransaction(transaction, wallet.walletType as any)

      toast.success(`Swapped ${swapAmount} XLM → ${parseFloat(bestPath.destination_amount).toFixed(2)} USDC`)
      
      // Refresh balance
      await fetchUSDCBalance()
      setSwapAmount('')
      setShowSwapSection(false)

    } catch (error: any) {
      console.error('Swap error:', error)
      toast.error(error.message || 'Swap failed')
    } finally {
      setSwapping(false)
    }
  }

  // Fetch USDC balance on mount
  useEffect(() => {
    if (wallet.connected) {
      fetchUSDCBalance()
    }
  }, [wallet.connected, wallet.publicKey])

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

      // Check USDC balance
      const projectBudget = parseFloat(formData.budget)
      const currentBalance = parseFloat(usdcBalance)
      
      if (currentBalance < projectBudget) {
        toast.error(`Insufficient USDC balance. You have ${usdcBalance} USDC but need ${projectBudget} USDC`)
        setShowSwapSection(true)
        return
      }

      setSubmitState('submitting')
      toast.info('Creating project with USDC escrow...')

      const projectId = `project-${Date.now()}`
      
      // Prepare milestones
      const projectMilestones = milestones
        .filter(m => m.title.trim() && m.budget)
        .map((m, index) => ({
          id: index,
          title: m.title,
          description: '',
          amount: parseFloat(m.budget),
          status: 'pending' as const,
          completedAt: null,
        }))

      // Store project data
      const projectData = {
        id: projectId,
        ...formData,
        budget: parseFloat(formData.budget),
        duration: parseInt(formData.duration),
        milestones: projectMilestones,
        createdAt: new Date().toISOString(),
        clientAddress: wallet.publicKey,
        status: 'open' as const,
        bids: [],
        escrowStatus: 'pending' as const,
      }
      
      // Get existing projects from localStorage
      const existingProjectsJson = localStorage.getItem('stellar-projects')
      const existingProjects = existingProjectsJson ? JSON.parse(existingProjectsJson) : []
      
      // Add new project
      existingProjects.push(projectData)
      
      // Store updated projects list
      localStorage.setItem('stellar-projects', JSON.stringify(existingProjects))
      
      // Also store individual project for easy access
      localStorage.setItem(`project-${projectId}`, JSON.stringify(projectData))

      console.log('Project created:', projectData)

      setSubmitState('success')
      toast.success('Project posted successfully!')

      setTimeout(() => {
        router.push('/browse')
      }, 1500)

    } catch (error: any) {
      console.error('Error creating project:', error)
      setErrorMessage(error.message || 'Failed to create project')
      setSubmitState('error')
      toast.error('Failed to create project')
    }
  }

  const isSubmitting = submitState === 'submitting'

  return (
      <main className="min-h-screen bg-black relative overflow-hidden py-12">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-1/4 w-[500px] h-[500px] bg-[#4ade80]/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="container mx-auto px-4 max-w-3xl relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Post a Project</h1>
            <p className="text-gray-300 text-lg mb-8">
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
            <Card className="p-6 bg-white/5 backdrop-blur-sm border-white/10">
              <h2 className="text-2xl font-bold mb-6 text-white">Project Details</h2>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-white font-semibold">Project Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Build a Mobile App for E-commerce"
                    required
                    className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-[#4ade80]/50 focus:ring-[#4ade80]/20 focus:bg-white/15"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="category" className="text-white font-semibold">Category *</Label>
                  <Select 
                    required
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="mt-2 bg-white/10 border-white/20 text-white hover:border-white/30 focus:border-[#4ade80]/50 focus:ring-[#4ade80]/20">
                      <SelectValue placeholder="Select a category" className="text-gray-400" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/20">
                      <SelectItem value="development" className="text-white hover:bg-white/10 focus:bg-white/10">Development</SelectItem>
                      <SelectItem value="design" className="text-white hover:bg-white/10 focus:bg-white/10">Design</SelectItem>
                      <SelectItem value="ai-ml" className="text-white hover:bg-white/10 focus:bg-white/10">AI/ML</SelectItem>
                      <SelectItem value="marketing" className="text-white hover:bg-white/10 focus:bg-white/10">Marketing</SelectItem>
                      <SelectItem value="blockchain" className="text-white hover:bg-white/10 focus:bg-white/10">Blockchain</SelectItem>
                      <SelectItem value="writing" className="text-white hover:bg-white/10 focus:bg-white/10">Writing</SelectItem>
                      <SelectItem value="other" className="text-white hover:bg-white/10 focus:bg-white/10">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description" className="text-white font-semibold">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what you need built, key features, and your expectations..."
                    required
                    className="mt-2 min-h-32 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-[#4ade80]/50 focus:ring-[#4ade80]/20 focus:bg-white/15"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-300 mt-1">
                    {formData.description.length}/50 characters minimum
                  </p>
                </div>

                {/* XLM to USDC Conversion */}
                <Card className="border-[#4ade80]/20 bg-[#4ade80]/5">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">💱</span>
                        <h3 className="font-semibold text-white">Convert XLM to USDC</h3>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/10"
                        onClick={() => setShowSwapSection(!showSwapSection)}
                      >
                        {showSwapSection ? 'Hide' : 'Show'}
                      </Button>
                    </div>

                    {showSwapSection && (
                      <div className="space-y-3">
                        <div className="flex gap-3 text-sm">
                          <div className="flex-1 p-2 bg-background rounded">
                            <div className="text-muted-foreground">USDC Balance</div>
                            <div className="font-semibold">{usdcBalance} USDC</div>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="swapAmount" className="text-white font-semibold">XLM Amount to Convert</Label>
                          <Input
                            id="swapAmount"
                            type="number"
                            placeholder="100"
                            value={swapAmount}
                            onChange={(e) => setSwapAmount(e.target.value)}
                            disabled={swapping}
                            min="0.01"
                            step="0.01"
                            className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-[#4ade80]/50 focus:ring-[#4ade80]/20"
                          />
                        </div>

                        <Button
                          type="button"
                          onClick={handleSwap}
                          disabled={swapping || !swapAmount}
                          className="w-full"
                        >
                          {swapping ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Converting...
                            </>
                          ) : (
                            <>
                              <ArrowRightLeft className="mr-2 h-4 w-4" />
                              Convert XLM → USDC
                            </>
                          )}
                        </Button>

                        <p className="text-xs text-muted-foreground">
                          Converts XLM to USDC using Stellar DEX. You'll need USDC for project budget.
                        </p>
                      </div>
                    )}
                  </div>
                </Card>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="budget" className="text-white font-semibold">Budget (USDC) *</Label>
                    <div className="relative mt-2">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                      <Input 
                        id="budget" 
                        type="number" 
                        placeholder="5000" 
                        required 
                        className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-[#4ade80]/50 focus:ring-[#4ade80]/20 focus:bg-white/15"
                        value={formData.budget}
                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                        disabled={isSubmitting}
                        min="1"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="duration" className="text-white font-semibold">Duration (days) *</Label>
                    <div className="relative mt-2">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                      <Input 
                        id="duration" 
                        type="number" 
                        placeholder="30" 
                        required 
                        className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-[#4ade80]/50 focus:ring-[#4ade80]/20 focus:bg-white/15"
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
            <Card className="p-6 bg-white/5 backdrop-blur-sm border-white/10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Payment Milestones</h2>
                  <p className="text-sm text-gray-400 mt-1">Break your project into 2-5 payment phases</p>
                </div>
                <Button 
                  type="button" 
                  onClick={addMilestone} 
                  variant="outline" 
                  size="sm"
                  className="border-white/20 bg-white/5 hover:bg-white/10 text-white backdrop-blur-sm"
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
                    className="p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm text-white">Milestone {index + 1}</h3>
                      {milestones.length > 2 && (
                        <Button
                          type="button"
                          onClick={() => removeMilestone(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0"
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
                        className="text-white bg-white/10 border-white/20 placeholder:text-gray-400 focus:border-[#4ade80]/50 focus:ring-[#4ade80]/20 focus:bg-white/15"
                      />
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                        <Input
                          type="number"
                          placeholder="Amount"
                          value={milestone.budget}
                          onChange={(e) => updateMilestone(index, "budget", e.target.value)}
                          disabled={isSubmitting}
                          required
                          min="0"
                          step="0.01"
                          className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-[#4ade80]/50 focus:ring-[#4ade80]/20 focus:bg-white/15"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <Alert className="mt-4 border-[#4ade80]/50 bg-[#4ade80]/10">
                <Shield className="h-4 w-4 text-[#22c55e]" />
                <AlertDescription className="text-sm text-gray-200">
                  Payments are secured in escrow and released as you approve each milestone
                </AlertDescription>
              </Alert>
            </Card>

            {/* Wallet Connection Alert */}
            {!wallet.connected && (
              <Alert className="border-yellow-500/50 bg-yellow-500/10">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-gray-200">
                  Connect your wallet to post a project with secure escrow protection
                </AlertDescription>
              </Alert>
            )}

            {/* Success State */}
            {submitState === 'success' && (
              <Alert className="border-[#4ade80] bg-[#4ade80]/10">
                <CheckCircle2 className="h-4 w-4 text-[#4ade80]" />
                <AlertDescription className="text-gray-200">
                  <p className="font-semibold text-white">Project created successfully!</p>
                  <p className="text-sm mt-1">
                    Your project has been posted and is now visible to freelancers. Funds will be held in escrow when a bid is accepted.
                  </p>
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
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full bg-linear-to-r from-[#4ade80] to-[#22c55e] hover:from-[#22c55e] hover:to-[#4ade80] text-white shadow-lg shadow-[#4ade80]/50"
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
              </motion.div>
              <Button 
                type="button" 
                size="lg" 
                variant="outline" 
                className="border-white/20 bg-white/5 hover:bg-white/10 text-white backdrop-blur-sm"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </motion.form>
        </div>
      </main>
  )
}
