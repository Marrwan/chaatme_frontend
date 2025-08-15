import { apiClient } from '@/lib/api'

// Extended user interface with new profile fields
export interface User {
  id: string
  email: string
  name: string
  realName?: string
  username?: string
  interests?: string
  hobbies?: string
  loveLanguage?: string
  profilePicture?: string
  dateOfBirth?: string
  gender?: string
  maritalStatus?: string
  height?: string
  complexion?: string
  bodySize?: string
  occupation?: string
  country?: string
  state?: string
  lga?: string
  contactNumber?: string
  isEmailVerified: boolean
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
  subscriptionStatus?: 'free' | 'premium'
  isPremium?: boolean
  canAccessMatchmaking?: boolean
}

export interface UpdateProfileRequest {
  name?: string
  realName?: string
  username?: string
  interests?: string
  hobbies?: string
  loveLanguage?: string
  dateOfBirth?: string
  gender?: string
  maritalStatus?: string
  height?: string
  complexion?: string
  bodySize?: string
  occupation?: string
  country?: string
  state?: string
  lga?: string
  contactNumber?: string
  email?: string
}

export interface DashboardStats {
  memberSince: string
  lastLogin?: string
  profileCompletion: number
  totalMatches?: number
  activeDatePlans?: number
}

// User Service
export const userService = {
  // Get user profile
  async getProfile(): Promise<User> {
    const response = await apiClient.request<{ success: boolean; data: { user: User } }>({
      method: 'GET',
      endpoint: '/user/profile',
      requiresAuth: true
    })
    return response.data.user
  },

  // Update user profile
  async updateProfile(data: UpdateProfileRequest): Promise<{ user: User; message: string }> {
    const response = await apiClient.request<{ success: boolean; message: string; data: { user: User } }>({
      method: 'PUT',
      endpoint: '/user/profile',
      data,
      requiresAuth: true
    })
    return {
      user: response.data.user,
      message: response.message
    }
  },

  // Upload profile picture
  async uploadProfilePicture(file: File): Promise<{ user: User; message: string }> {
    const formData = new FormData()
    formData.append('profilePicture', file)
    
    const response = await apiClient.request<{ success: boolean; message: string; data: { user: User } }>({
      method: 'POST',
      endpoint: '/user/dating-profile-picture',
      data: formData,
      requiresAuth: true,
      isFormData: true
    })
    return {
      user: response.data.user,
      message: response.message
    }
  },

  // Get dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiClient.request<{ success: boolean; data: DashboardStats }>({
      method: 'GET',
      endpoint: '/user/dashboard',
      requiresAuth: true
    })
    return response.data
  },

  // Change password

  // Get all users (for group creation)
  async getUsers(): Promise<{ success: boolean; data: User[] }> {
    const response = await apiClient.request<{ success: boolean; data: User[] }>({
      method: 'GET',
      endpoint: '/user/users',
      requiresAuth: true
    })
    return response
  },

  // Search users
  async searchUsers(query: string): Promise<{ success: boolean; data: User[] }> {
    const response = await apiClient.request<{ success: boolean; data: User[] }>({
      method: 'GET',
      endpoint: `/user/search?q=${encodeURIComponent(query)}`,
      requiresAuth: true
    })
    return response
  },
  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
    const response = await apiClient.request<{ success: boolean; message: string }>({
      method: 'POST',
      endpoint: '/user/change-password',
      data: { oldPassword: data.currentPassword, newPassword: data.newPassword },
      requiresAuth: true
    })
    return { message: response.message }
  },

  // Delete account
  async deleteAccount(): Promise<{ message: string }> {
    const response = await apiClient.request<{ success: boolean; message: string }>({
      method: 'DELETE',
      endpoint: '/user/account',
      requiresAuth: true
    })
    return { message: response.message }
  },



  // Check if profile is complete
  isProfileComplete(user: User): boolean {
    const requiredFields: (keyof User)[] = [
      'realName', 'username', 'dateOfBirth', 'gender', 
      'maritalStatus', 'height', 'complexion', 'bodySize', 
      'occupation', 'country', 'state', 'lga'
    ]
    
    return requiredFields.every(field => {
      const value = user[field]
      return value && value.toString().trim() !== ''
    })
  },

  // Calculate profile completion percentage
  getProfileCompletionPercentage(user: User): number {
    const allFields: (keyof User)[] = [
      'realName', 'username', 'interests', 'hobbies', 'loveLanguage',
      'profilePicture', 'dateOfBirth', 'gender', 'maritalStatus', 
      'height', 'complexion', 'bodySize', 'occupation', 
      'country', 'state', 'lga', 'contactNumber'
    ]
    
    const completedFields = allFields.filter(field => {
      const value = user[field]
      return value && value.toString().trim() !== ''
    })
    
    return Math.round((completedFields.length / allFields.length) * 100)
  }
} 