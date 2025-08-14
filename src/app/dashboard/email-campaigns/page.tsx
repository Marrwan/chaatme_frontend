'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/lib/useToast'
import { emailCampaignService, type EmailCampaign, type CreateCampaignRequest } from '@/services/emailCampaignService'
import { ApiRequestError } from '@/lib/api'
import { Plus, Play, Pause, RotateCcw, Eye, Users, Mail, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default function EmailCampaignsPage() {
  const router = useRouter()
  const toast = useToast()
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showStatsDialog, setShowStatsDialog] = useState(false)
  const [stats, setStats] = useState<{ totalEmails: number; estimatedDuration: number; targetAudience: string } | null>(null)
  const [selectedAudience] = useState('incomplete_profiles')
  const [customEmails, setCustomEmails] = useState('')

  // Form state
  const [formData, setFormData] = useState<CreateCampaignRequest>({
    name: '',
    subject: '',
    template: '',
    targetAudience: 'incomplete_profiles',
    emailsPerHour: 45
  })

  useEffect(() => {
    fetchCampaigns()
  }, [page])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const response = await emailCampaignService.getCampaigns(page, 10)
      if (response.success) {
        setCampaigns(response.data.campaigns)
        setTotalPages(response.data.totalPages)
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      toast.showError('Failed to fetch campaigns')
    } finally {
      setLoading(false)
    }
  }

  const createCampaign = async () => {
    try {
      const campaignData = { ...formData }
      
      if (formData.targetAudience === 'custom_list') {
        campaignData.customEmailList = customEmails.split('\n').filter(email => email.trim())
      }

      const response = await emailCampaignService.createCampaign(campaignData)
      if (response.success) {
        toast.showSuccess('Campaign created successfully')
        setShowCreateDialog(false)
        resetForm()
        fetchCampaigns()
      }
    } catch (error) {
      console.error('Error creating campaign:', error)
      
      // Handle validation errors (400 status)
      if (error instanceof ApiRequestError) {
        if (error.status === 400 && error.details && typeof error.details === 'object' && 'errors' in error.details) {
          const validationErrors = (error.details as { errors: Array<{ msg: string }> }).errors
          const errorMessages = validationErrors.map(err => err.msg).join(', ')
          toast.showError(`Validation errors: ${errorMessages}`)
        } else if (error.status === 400) {
          toast.showError(error.message || 'Invalid request data')
        } else if (error.status >= 500) {
          toast.showError('Server error. Please try again later.')
        } else {
          toast.showError(error.message || 'Failed to create campaign')
        }
      } else {
        toast.showError('Failed to create campaign')
      }
    }
  }



  const startCampaign = async (id: string) => {
    try {
      // Optimistic update - immediately update the campaign status
      setCampaigns(prevCampaigns => 
        prevCampaigns.map(campaign => 
          campaign.id === id 
            ? { ...campaign, status: 'active', startedAt: new Date().toISOString() }
            : campaign
        )
      )

      const response = await emailCampaignService.startCampaign(id)
      if (response.success) {
        toast.showSuccess('Campaign started successfully')
        // Refresh to get the latest data from server
        fetchCampaigns()
      } else {
        // Revert optimistic update if failed
        fetchCampaigns()
      }
    } catch (error) {
      console.error('Error starting campaign:', error)
      toast.showError('Failed to start campaign')
      // Revert optimistic update on error
      fetchCampaigns()
    }
  }

  const pauseCampaign = async (id: string) => {
    try {
      // Optimistic update - immediately update the campaign status
      setCampaigns(prevCampaigns => 
        prevCampaigns.map(campaign => 
          campaign.id === id 
            ? { ...campaign, status: 'paused' }
            : campaign
        )
      )

      const response = await emailCampaignService.pauseCampaign(id)
      if (response.success) {
        toast.showSuccess('Campaign paused successfully')
        // Refresh to get the latest data from server
        fetchCampaigns()
      } else {
        // Revert optimistic update if failed
        fetchCampaigns()
      }
    } catch (error) {
      console.error('Error pausing campaign:', error)
      toast.showError('Failed to pause campaign')
      // Revert optimistic update on error
      fetchCampaigns()
    }
  }

  const resumeCampaign = async (id: string) => {
    try {
      // Optimistic update - immediately update the campaign status
      setCampaigns(prevCampaigns => 
        prevCampaigns.map(campaign => 
          campaign.id === id 
            ? { ...campaign, status: 'active' }
            : campaign
        )
      )

      const response = await emailCampaignService.resumeCampaign(id)
      if (response.success) {
        toast.showSuccess('Campaign resumed successfully')
        // Refresh to get the latest data from server
        fetchCampaigns()
      } else {
        // Revert optimistic update if failed
        fetchCampaigns()
      }
    } catch (error) {
      console.error('Error resuming campaign:', error)
      toast.showError('Failed to resume campaign')
      // Revert optimistic update on error
      fetchCampaigns()
    }
  }

  const calculateStats = async () => {
    try {
      const customEmailList = selectedAudience === 'custom_list' 
        ? customEmails.split('\n').filter(email => email.trim())
        : undefined

      const response = await emailCampaignService.calculateStats(selectedAudience, customEmailList)
      if (response.success) {
        setStats(response.data)
        setShowStatsDialog(true)
      }
    } catch (error) {
      console.error('Error calculating stats:', error)
      toast.showError('Failed to calculate statistics')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      template: '',
      targetAudience: 'incomplete_profiles',
      emailsPerHour: 45
    })
    setCustomEmails('')
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: AlertCircle },
      active: { color: 'bg-green-100 text-green-800', icon: Play },
      paused: { color: 'bg-yellow-100 text-yellow-800', icon: Pause },
      completed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle }
    }

    const config = statusConfig[status as keyof typeof statusConfig]
    const Icon = config.icon

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getProgressPercentage = (campaign: EmailCampaign) => {
    if (campaign.totalEmails === 0) return 0
    return Math.round((campaign.sentEmails / campaign.totalEmails) * 100)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Email Campaigns</h1>
          <p className="text-gray-600">Manage bulk email campaigns for user engagement</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={calculateStats} variant="outline">
            <Users className="w-4 h-4 mr-2" />
            Calculate Stats
          </Button>

          <Button 
            onClick={() => setShowCreateDialog(true)} 
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign (Direct)
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Email Campaign</DialogTitle>
                <DialogDescription>
                  Create a new email campaign to engage users
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Campaign Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter campaign name"
                  />
                </div>
                <div>
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Enter email subject"
                  />
                </div>
                <div>
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <Select
                    value={formData.targetAudience}
                    onValueChange={(value) => setFormData({ ...formData, targetAudience: value as 'incomplete_profiles' | 'all_users' | 'custom_list' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="incomplete_profiles">Users with Incomplete Profiles</SelectItem>
                      <SelectItem value="all_users">All Users</SelectItem>
                      <SelectItem value="custom_list">Custom Email List</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.targetAudience === 'custom_list' && (
                  <div>
                    <Label htmlFor="customEmails">Custom Email List (one per line)</Label>
                    <Textarea
                      id="customEmails"
                      value={customEmails}
                      onChange={(e) => setCustomEmails(e.target.value)}
                      placeholder="Enter email addresses, one per line"
                      rows={5}
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="emailsPerHour">Emails Per Hour</Label>
                  <Input
                    id="emailsPerHour"
                    type="number"
                    value={formData.emailsPerHour}
                    onChange={(e) => setFormData({ ...formData, emailsPerHour: parseInt(e.target.value) })}
                    min="1"
                    max="100"
                  />
                </div>
                <div>
                  <Label htmlFor="template">Email Template (HTML)</Label>
                  <Textarea
                    id="template"
                    value={formData.template}
                    onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                    placeholder="Enter HTML email template"
                    rows={10}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Use {'{{email}}'} to insert recipient email address
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createCampaign}>
                    Create Campaign
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading campaigns...</p>
        </div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
            <p className="text-gray-600 mb-4">Create your first email campaign to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {campaign.name}
                      {getStatusBadge(campaign.status)}
                    </CardTitle>
                    <CardDescription>{campaign.subject}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {campaign.status === 'draft' && (
                      <Button size="sm" onClick={() => startCampaign(campaign.id)}>
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                    )}
                    {campaign.status === 'active' && (
                      <Button size="sm" variant="outline" onClick={() => pauseCampaign(campaign.id)}>
                        <Pause className="w-4 h-4 mr-1" />
                        Pause
                      </Button>
                    )}
                    {campaign.status === 'paused' && (
                      <Button size="sm" onClick={() => resumeCampaign(campaign.id)}>
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Resume
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/dashboard/email-campaigns/${campaign.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{campaign.totalEmails}</div>
                    <div className="text-sm text-gray-600">Total Recipients</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{campaign.sentEmails}</div>
                    <div className="text-sm text-gray-600">Sent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{campaign.failedEmails}</div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{campaign.emailsPerHour}</div>
                    <div className="text-sm text-gray-600">Per Hour</div>
                  </div>
                </div>
                
                {campaign.totalEmails > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{getProgressPercentage(campaign)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getProgressPercentage(campaign)}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between text-sm text-gray-500">
                  <span>Created: {new Date(campaign.createdAt).toLocaleDateString()}</span>
                  {campaign.startedAt && (
                    <span>Started: {new Date(campaign.startedAt).toLocaleDateString()}</span>
                  )}
                  {campaign.completedAt && (
                    <span>Completed: {new Date(campaign.completedAt).toLocaleDateString()}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Stats Dialog */}
      <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Campaign Statistics</DialogTitle>
            <DialogDescription>
              Estimated statistics for your campaign
            </DialogDescription>
          </DialogHeader>
          {stats && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalEmails}</div>
                  <div className="text-sm text-gray-600">Total Emails</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.estimatedDuration}</div>
                  <div className="text-sm text-gray-600">Hours to Complete</div>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p><strong>Target Audience:</strong> {stats.targetAudience.replace('_', ' ')}</p>
                <p><strong>Rate Limit:</strong> 45 emails per hour</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 