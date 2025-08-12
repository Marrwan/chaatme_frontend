import { apiClient } from '@/lib/api'

export interface EmailCampaign {
  id: string
  name: string
  subject: string
  template: string
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
  targetAudience: 'incomplete_profiles' | 'all_users' | 'custom_list'
  customEmailList: string[]
  emailsPerHour: number
  totalEmails: number
  sentEmails: number
  failedEmails: number
  scheduledAt?: string
  startedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
  creator?: {
    id: string
    name: string
    email: string
  }
}

export interface EmailLog {
  id: string
  campaignId: string
  recipientEmail: string
  recipientName: string
  status: 'pending' | 'sent' | 'failed' | 'bounced'
  sentAt?: string
  errorMessage?: string
  messageId?: string
  retryCount: number
  nextRetryAt?: string
  createdAt: string
  updatedAt: string
}

export interface CampaignStats {
  total: number
  sent: number
  failed: number
  pending: number
  bounced: number
}

export interface CampaignRecipient {
  email: string
  name: string
}

export interface CreateCampaignRequest {
  name: string
  subject: string
  template: string
  targetAudience?: 'incomplete_profiles' | 'all_users' | 'custom_list'
  customEmailList?: string[]
  emailsPerHour?: number
  scheduledAt?: string
}

export interface CampaignListResponse {
  campaigns: EmailCampaign[]
  total: number
  page: number
  totalPages: number
}

export interface RecipientsResponse {
  recipients: CampaignRecipient[]
  total: number
  page: number
  totalPages: number
}

export interface CampaignStatsResponse {
  targetAudience: string
  totalEmails: number
  estimatedDuration: number
}

export const emailCampaignService = {
  // Create a new campaign
  async createCampaign(data: CreateCampaignRequest): Promise<{ success: boolean; data: { campaign: EmailCampaign; totalEmails: number } }> {
    return apiClient.post('/email-campaigns', data, true)
  },

  // Get all campaigns
  async getCampaigns(page = 1, limit = 10): Promise<{ success: boolean; data: CampaignListResponse }> {
    return apiClient.get(`/email-campaigns?page=${page}&limit=${limit}`, true)
  },

  // Get campaign by ID
  async getCampaign(id: string): Promise<{ success: boolean; data: { campaign: EmailCampaign; stats: CampaignStats } }> {
    return apiClient.get(`/email-campaigns/${id}`, true)
  },

  // Get campaign recipients
  async getCampaignRecipients(id: string, page = 1, limit = 50): Promise<{ success: boolean; data: RecipientsResponse }> {
    return apiClient.get(`/email-campaigns/${id}/recipients?page=${page}&limit=${limit}`, true)
  },

  // Start campaign
  async startCampaign(id: string): Promise<{ success: boolean; data: { campaign: EmailCampaign; sentCount: number; failedCount: number; remainingEmails: number; isComplete: boolean } }> {
    return apiClient.post(`/email-campaigns/${id}/start`, {}, true)
  },

  // Pause campaign
  async pauseCampaign(id: string): Promise<{ success: boolean; data: { campaign: EmailCampaign } }> {
    return apiClient.post(`/email-campaigns/${id}/pause`, {}, true)
  },

  // Resume campaign
  async resumeCampaign(id: string): Promise<{ success: boolean; data: { campaign: EmailCampaign; sentCount: number; failedCount: number; remainingEmails: number; isComplete: boolean } }> {
    return apiClient.post(`/email-campaigns/${id}/resume`, {}, true)
  },

  // Send next batch
  async sendNextBatch(id: string): Promise<{ success: boolean; data: { sentCount: number; failedCount: number; remainingEmails: number; isComplete: boolean } }> {
    return apiClient.post(`/email-campaigns/${id}/send-batch`, {}, true)
  },

  // Calculate campaign statistics
  async calculateStats(targetAudience: string, customEmailList?: string[]): Promise<{ success: boolean; data: CampaignStatsResponse }> {
    return apiClient.post('/email-campaigns/calculate-stats', { targetAudience, customEmailList }, true)
  }
} 