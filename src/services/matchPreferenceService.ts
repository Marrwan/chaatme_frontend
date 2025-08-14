import { apiClient } from '@/lib/api'
import type { User } from './userService'

// Match preference interface
export interface MatchPreference {
  id: string
  userId: string
  ageMin?: number
  ageMax?: number
  gender?: string
  maritalStatus?: string
  complexion?: string
  bodySize?: string
  sameInterests?: boolean
  sameHobbies?: boolean
  createdAt: string
  updatedAt: string
}

export interface SetMatchPreferenceRequest {
  ageMin?: number
  ageMax?: number
  gender?: string
  maritalStatus?: string
  complexion?: string
  bodySize?: string
  sameInterests?: boolean
  sameHobbies?: boolean
}

export interface MatchResult {
  matches: User[]
  total: number
}

// Match Preference Service
export const matchPreferenceService = {
  // Get user's match preference
  async getMatchPreference(): Promise<MatchPreference | null> {
    const response = await apiClient.request<{ success: boolean; data: { preference: MatchPreference | null } }>({
      method: 'GET',
      endpoint: '/match-preference',
      requiresAuth: true
    })
    return response.data.preference
  },

  // Set or update match preference
  async setMatchPreference(data: SetMatchPreferenceRequest): Promise<{ preference: MatchPreference; message: string }> {
    const response = await apiClient.request<{ success: boolean; message: string; data: { preference: MatchPreference } }>({
      method: 'POST',
      endpoint: '/match-preference',
      data,
      requiresAuth: true
    })
    return {
      preference: response.data.preference,
      message: response.message
    }
  },

  // Update existing match preference
  async updateMatchPreference(data: SetMatchPreferenceRequest): Promise<{ preference: MatchPreference; message: string }> {
    const response = await apiClient.request<{ success: boolean; message: string; data: { preference: MatchPreference } }>({
      method: 'PUT',
      endpoint: '/match-preference',
      data,
      requiresAuth: true
    })
    return {
      preference: response.data.preference,
      message: response.message
    }
  },

  // Delete match preference
  async deleteMatchPreference(): Promise<{ message: string }> {
    const response = await apiClient.request<{ success: boolean; message: string }>({
      method: 'DELETE',
      endpoint: '/match-preference',
      requiresAuth: true
    })
    return { message: response.message }
  },

  // Find potential matches
  async findMatches(): Promise<MatchResult> {
    const response = await apiClient.request<{ success: boolean; data: MatchResult }>({
      method: 'GET',
      endpoint: '/match-preference/matches',
      requiresAuth: true
    })
    return response.data
  }
} 