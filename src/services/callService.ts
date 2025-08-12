import { apiClient } from '@/lib/api'

export interface Call {
  id: string
  callerId: string
  receiverId: string
  type: 'audio' | 'video'
  status: 'pending' | 'accepted' | 'rejected' | 'ended' | 'missed'
  startTime?: string
  endTime?: string
  duration?: number
  createdAt: string
  updatedAt: string
  caller: {
    id: string
    name: string
    realName?: string
    profilePicture?: string
  }
  receiver: {
    id: string
    name: string
    realName?: string
    profilePicture?: string
  }
}

export interface GroupCall {
  id: string
  groupId: string
  hostId: string
  status: 'active' | 'ended'
  startTime: string
  endTime?: string
  maxParticipants: number
  currentParticipants: number
  createdAt: string
  updatedAt: string
  group: {
    id: string
    name: string
    description?: string
    avatarUrl?: string
  }
  host: {
    id: string
    name: string
    realName?: string
    profilePicture?: string
  }
  participants: GroupCallParticipant[]
}

export interface GroupCallParticipant {
  id: string
  userId: string
  callId: string
  role: 'host' | 'moderator' | 'participant'
  isMuted: boolean
  isVideoEnabled: boolean
  joinedAt: string
  leftAt?: string
  user: {
    id: string
    name: string
    realName?: string
    profilePicture?: string
  }
}

export interface InitiateCallRequest {
  receiverId: string
  type: 'audio' | 'video'
}

export interface CallResponse {
  success: boolean
  data: Call
  message: string
}

export interface GroupCallResponse {
  success: boolean
  data: GroupCall
  message: string
}

export interface CallHistoryResponse {
  success: boolean
  data: Call[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export const callService = {
  // Regular Calls
  
  // Initiate a call
  async initiateCall(data: InitiateCallRequest): Promise<CallResponse> {
    const response = await apiClient.request<CallResponse>({
      method: 'POST',
      endpoint: '/calls/initiate',
      data,
      requiresAuth: true
    })
    return response
  },

  // Accept a call
  async acceptCall(callId: string): Promise<CallResponse> {
    const response = await apiClient.request<CallResponse>({
      method: 'POST',
      endpoint: `/calls/${callId}/accept`,
      requiresAuth: true
    })
    return response
  },

  // Reject a call
  async rejectCall(callId: string): Promise<CallResponse> {
    const response = await apiClient.request<CallResponse>({
      method: 'POST',
      endpoint: `/calls/${callId}/reject`,
      requiresAuth: true
    })
    return response
  },

  // End a call
  async endCall(callId: string): Promise<CallResponse> {
    const response = await apiClient.request<CallResponse>({
      method: 'POST',
      endpoint: `/calls/${callId}/end`,
      requiresAuth: true
    })
    return response
  },

  // Get call details
  async getCall(callId: string): Promise<CallResponse> {
    const response = await apiClient.request<CallResponse>({
      method: 'GET',
      endpoint: `/calls/${callId}`,
      requiresAuth: true
    })
    return response
  },

  // Get call history
  async getCallHistory(page: number = 1, limit: number = 20): Promise<CallHistoryResponse> {
    const response = await apiClient.request<CallHistoryResponse>({
      method: 'GET',
      endpoint: '/calls/history',
      params: { page, limit },
      requiresAuth: true
    })
    return response
  },

  // Group Calls

  // Create a group call
  async createGroupCall(groupId: string): Promise<GroupCallResponse> {
    const response = await apiClient.request<GroupCallResponse>({
      method: 'POST',
      endpoint: '/calls/group/create',
      data: { groupId },
      requiresAuth: true
    })
    return response
  },

  // Join a group call
  async joinGroupCall(callId: string): Promise<GroupCallResponse> {
    const response = await apiClient.request<GroupCallResponse>({
      method: 'POST',
      endpoint: `/calls/group/${callId}/join`,
      requiresAuth: true
    })
    return response
  },

  // Leave a group call
  async leaveGroupCall(callId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.request<{ success: boolean; message: string }>({
      method: 'POST',
      endpoint: `/calls/group/${callId}/leave`,
      requiresAuth: true
    })
    return response
  },

  // End a group call
  async endGroupCall(callId: string): Promise<GroupCallResponse> {
    const response = await apiClient.request<GroupCallResponse>({
      method: 'POST',
      endpoint: `/calls/group/${callId}/end`,
      requiresAuth: true
    })
    return response
  },

  // Get group call details
  async getGroupCall(callId: string): Promise<GroupCallResponse> {
    const response = await apiClient.request<GroupCallResponse>({
      method: 'GET',
      endpoint: `/calls/group/${callId}`,
      requiresAuth: true
    })
    return response
  },

  // Get group call status
  async getGroupCallStatus(callId: string): Promise<GroupCallResponse> {
    const response = await apiClient.request<GroupCallResponse>({
      method: 'GET',
      endpoint: `/calls/group/${callId}/status`,
      requiresAuth: true
    })
    return response
  },

  // Update participant mute status
  async updateParticipantMute(callId: string, participantId: string, isMuted: boolean): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.request<{ success: boolean; message: string }>({
      method: 'POST',
      endpoint: `/calls/group/${callId}/participants/${participantId}/mute`,
      data: { isMuted },
      requiresAuth: true
    })
    return response
  },

  // Update participant role
  async updateParticipantRole(callId: string, participantId: string, role: 'host' | 'moderator' | 'participant'): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.request<{ success: boolean; message: string }>({
      method: 'POST',
      endpoint: `/calls/group/${callId}/participants/${participantId}/role`,
      data: { role },
      requiresAuth: true
    })
    return response
  }
}
