'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/lib/store'
import { userService, type UpdateProfileRequest } from '@/services/userService'
import { ArrowLeft, Save, CheckCircle, AlertCircle, Upload, Eye, Edit, X } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, updateUser } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [formData, setFormData] = useState<UpdateProfileRequest>({
    name: '',
    realName: '',
    username: '',
    interests: '',
    hobbies: '',
    loveLanguage: '',
    dateOfBirth: '',
    gender: '',
    maritalStatus: '',
    height: '',
    complexion: '',
    bodySize: '',
    occupation: '',
    country: '',
    state: '',
    lga: '',
    contactNumber: '',
    email: ''
  })
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    
    if (user) {
      setFormData({
        name: user.name || '',
        realName: user.realName || '',
        username: user.username || '',
        interests: user.interests || '',
        hobbies: user.hobbies || '',
        loveLanguage: user.loveLanguage || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || '',
        maritalStatus: user.maritalStatus || '',
        height: user.height || '',
        complexion: user.complexion || '',
        bodySize: user.bodySize || '',
        occupation: user.occupation || '',
        country: user.country || '',
        state: user.state || '',
        lga: user.lga || '',
        contactNumber: user.contactNumber || '',
        email: user.email || ''
      })
      setProfilePicturePreview(user.profilePicture || '')
    }
  }, [isAuthenticated, user, router])

  const handleInputChange = (field: keyof UpdateProfileRequest, value: string) => {
    // Clear any existing error messages when user starts typing
    if (message && messageType === 'error') {
      setMessage('')
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Validate username format
  const isValidUsername = (username: string) => {
    return /^[a-zA-Z0-9]*$/.test(username)
  }

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage('Please select an image file')
        setMessageType('error')
        return
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setMessage('File size must be less than 5MB')
        setMessageType('error')
        return
      }
      
      setSelectedFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfilePicturePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      
      // Clear any existing error messages
      if (message && messageType === 'error') {
        setMessage('')
      }
    }
  }

  // Handle file upload
  const handleFileUpload = async () => {
    if (!selectedFile) {
      setMessage('Please select a file to upload')
      setMessageType('error')
      return
    }

    try {
      setIsUploading(true)
      setMessage('')
      
      const result = await userService.uploadProfilePicture(selectedFile)
      updateUser(result.user)
      
      // Update the profile picture preview with the server URL
      setProfilePicturePreview(result.user.profilePicture || '')
      
      setMessage('Profile picture uploaded successfully!')
      setMessageType('success')
      setSelectedFile(null)
      scrollToTop()
    } catch (error: any) {
      console.error('Error uploading profile picture:', error)
      setMessage(error.message || 'Failed to upload profile picture. Please try again.')
      setMessageType('error')
      scrollToTop()
    } finally {
      setIsUploading(false)
    }
  }

  // Remove selected file
  const removeSelectedFile = () => {
    setSelectedFile(null)
    setProfilePicturePreview(user?.profilePicture || '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate username
    if (formData.username && !isValidUsername(formData.username)) {
      setMessage('Username can only contain letters and numbers (no spaces or special characters)')
      setMessageType('error')
      scrollToTop()
      return
    }
    
    if (formData.username && formData.username.length < 3) {
      setMessage('Username must be at least 3 characters long')
      setMessageType('error')
      scrollToTop()
      return
    }

    try {
      setIsSaving(true)
      setMessage('')
      
             const result = await userService.updateProfile(formData)
       updateUser(result.user)
      
      setMessage('Profile updated successfully!')
      setMessageType('success')
      scrollToTop()
    } catch (error: any) {
      console.error('Error updating profile:', error)
      setMessage(error.message || 'Failed to update profile. Please try again.')
      setMessageType('error')
      scrollToTop()
    } finally {
      setIsSaving(false)
    }
  }

  const getDisplayValue = (value: string | undefined) => {
    if (!value || value === 'not-selected') return 'Not specified'
    return value.charAt(0).toUpperCase() + value.slice(1).replace('-', ' ')
  }

  const getLoveLanguageDisplay = (loveLanguage: string | undefined) => {
    if (!loveLanguage) return 'Not specified'
    return loveLanguage.split(',').map(lang => 
      lang.trim().split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    ).join(', ')
  }

  if (isPreviewMode) {
    return (
      <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Profile Preview</h1>
              </div>
              <Button onClick={() => setIsPreviewMode(false)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </div>

          {/* Profile Preview */}
          <div className="space-y-6 sm:space-y-8">
            {/* Profile Header */}
            <Card>
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                  <div className="relative">
                    {profilePicturePreview ? (
                      <img
                        src={profilePicturePreview}
                        alt="Profile"
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-purple-200"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-purple-100 flex items-center justify-center border-4 border-purple-200">
                        <span className="text-xl sm:text-2xl font-bold text-purple-600">
                          {formData.realName ? formData.realName.charAt(0).toUpperCase() : 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{formData.realName || 'Not specified'}</h2>
                    <p className="text-gray-600">@{formData.username || 'username'}</p>
                    <p className="text-sm text-gray-500">{formData.occupation || 'Not specified'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Real Name</Label>
                    <p className="text-gray-900">{formData.realName || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Username</Label>
                    <p className="text-gray-900">@{formData.username || 'Not specified'}</p>
                  </div>
                </div>
                
                {formData.interests && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Interests</Label>
                    <p className="text-gray-900">{formData.interests}</p>
                  </div>
                )}
                
                {formData.hobbies && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Hobbies</Label>
                    <p className="text-gray-900">{formData.hobbies}</p>
                  </div>
                )}
                
                {formData.loveLanguage && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Love Language</Label>
                    <p className="text-gray-900">{getLoveLanguageDisplay(formData.loveLanguage)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Personal Details */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Date of Birth</Label>
                    <p className="text-gray-900">{formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString() : 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Gender</Label>
                    <p className="text-gray-900">{getDisplayValue(formData.gender)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Marital Status</Label>
                    <p className="text-gray-900">{getDisplayValue(formData.maritalStatus)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Height</Label>
                    <p className="text-gray-900">{formData.height || 'Not specified'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Complexion</Label>
                    <p className="text-gray-900">{getDisplayValue(formData.complexion)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Body Size</Label>
                    <p className="text-gray-900">{getDisplayValue(formData.bodySize)}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-500">Occupation</Label>
                  <p className="text-gray-900">{formData.occupation || 'Not specified'}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Country</Label>
                    <p className="text-gray-900">{formData.country || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">State/Province</Label>
                    <p className="text-gray-900">{formData.state || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">LGA/Local Council</Label>
                    <p className="text-gray-900">{formData.lga || 'Not specified'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              
            </div>
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Edit Profile</h1>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-start ${
            messageType === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {messageType === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            )}
            <div className="whitespace-pre-line">{message}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">

          {/* Profile Picture */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>
                Upload a profile picture to make your profile more attractive
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Current Profile Picture */}
                {profilePicturePreview && (
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
                    <img
                      src={profilePicturePreview}
                      alt="Current Profile"
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-gray-200"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Current Profile Picture</p>
                      <p className="text-xs text-gray-500">Your profile picture will be displayed to other users</p>
                    </div>
                  </div>
                )}

                {/* File Upload Section */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="profilePictureFile">Upload New Profile Picture</Label>
                    <div className="mt-2">
                      <input
                        id="profilePictureFile"
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <label
                        htmlFor="profilePictureFile"
                        className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose Image
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Supported formats: JPG, PNG, GIF. Maximum size: 5MB
                    </p>
                  </div>

                  {/* Selected File Preview */}
                  {selectedFile && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg space-y-3 sm:space-y-0">
                      <div className="flex items-center space-x-3">
                        <img
                          src={profilePicturePreview}
                          alt="Selected File Preview"
                          className="w-12 h-12 rounded object-cover"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleFileUpload}
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                              Uploading...
                            </>
                          ) : (
                            'Upload'
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={removeSelectedFile}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Details</CardTitle>
              <CardDescription>
                Your basic profile information and interests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <Label htmlFor="realName">Real Name *</Label>
                  <Input
                    id="realName"
                    value={formData.realName}
                    onChange={(e) => handleInputChange('realName', e.target.value)}
                    placeholder="Enter your real name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="Choose a unique username"
                    required
                    className={formData.username && !isValidUsername(formData.username) ? 'border-red-500' : ''}
                  />
                  {formData.username && !isValidUsername(formData.username) && (
                    <p className="text-xs text-red-500 mt-1">
                      Username can only contain letters and numbers (no spaces or special characters)
                    </p>
                  )}
                  {formData.username && isValidUsername(formData.username) && formData.username.length < 3 && (
                    <p className="text-xs text-red-500 mt-1">
                      Username must be at least 3 characters long
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="interests">Your Interests</Label>
                <Textarea
                  id="interests"
                  value={formData.interests}
                  onChange={(e) => handleInputChange('interests', e.target.value)}
                  placeholder="Tell us about your interests (e.g., reading, traveling, cooking...)"
                  className="min-h-[80px]"
                />
              </div>
              
              <div>
                <Label htmlFor="hobbies">Your Hobbies</Label>
                <Textarea
                  id="hobbies"
                  value={formData.hobbies}
                  onChange={(e) => handleInputChange('hobbies', e.target.value)}
                  placeholder="What are your hobbies? (e.g., photography, sports, music...)"
                  className="min-h-[80px]"
                />
              </div>
              
              <div>
                <Label>Your Love Language</Label>
                <div className="space-y-3 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="words-of-affirmation" 
                      checked={formData.loveLanguage?.includes('words-of-affirmation') || false}
                      onCheckedChange={(checked) => {
                        const current = formData.loveLanguage ? formData.loveLanguage.split(',').filter(l => l.trim()) : []
                        if (checked) {
                          if (!current.includes('words-of-affirmation')) {
                            handleInputChange('loveLanguage', [...current, 'words-of-affirmation'].join(', '))
                          }
                        } else {
                          handleInputChange('loveLanguage', current.filter(l => l !== 'words-of-affirmation').join(', '))
                        }
                      }}
                    />
                    <Label htmlFor="words-of-affirmation" className="text-sm font-normal">
                      Words of Affirmation
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="quality-time" 
                      checked={formData.loveLanguage?.includes('quality-time') || false}
                      onCheckedChange={(checked) => {
                        const current = formData.loveLanguage ? formData.loveLanguage.split(',').filter(l => l.trim()) : []
                        if (checked) {
                          if (!current.includes('quality-time')) {
                            handleInputChange('loveLanguage', [...current, 'quality-time'].join(', '))
                          }
                        } else {
                          handleInputChange('loveLanguage', current.filter(l => l !== 'quality-time').join(', '))
                        }
                      }}
                    />
                    <Label htmlFor="quality-time" className="text-sm font-normal">
                      Quality Time
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="receiving-gifts" 
                      checked={formData.loveLanguage?.includes('receiving-gifts') || false}
                      onCheckedChange={(checked) => {
                        const current = formData.loveLanguage ? formData.loveLanguage.split(',').filter(l => l.trim()) : []
                        if (checked) {
                          if (!current.includes('receiving-gifts')) {
                            handleInputChange('loveLanguage', [...current, 'receiving-gifts'].join(', '))
                          }
                        } else {
                          handleInputChange('loveLanguage', current.filter(l => l !== 'receiving-gifts').join(', '))
                        }
                      }}
                    />
                    <Label htmlFor="receiving-gifts" className="text-sm font-normal">
                      Receiving Gifts
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="acts-of-service" 
                      checked={formData.loveLanguage?.includes('acts-of-service') || false}
                      onCheckedChange={(checked) => {
                        const current = formData.loveLanguage ? formData.loveLanguage.split(',').filter(l => l.trim()) : []
                        if (checked) {
                          if (!current.includes('acts-of-service')) {
                            handleInputChange('loveLanguage', [...current, 'acts-of-service'].join(', '))
                          }
                        } else {
                          handleInputChange('loveLanguage', current.filter(l => l !== 'acts-of-service').join(', '))
                        }
                      }}
                    />
                    <Label htmlFor="acts-of-service" className="text-sm font-normal">
                      Acts of Service
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="physical-touch" 
                      checked={formData.loveLanguage?.includes('physical-touch') || false}
                      onCheckedChange={(checked) => {
                        const current = formData.loveLanguage ? formData.loveLanguage.split(',').filter(l => l.trim()) : []
                        if (checked) {
                          if (!current.includes('physical-touch')) {
                            handleInputChange('loveLanguage', [...current, 'physical-touch'].join(', '))
                          }
                        } else {
                          handleInputChange('loveLanguage', current.filter(l => l !== 'physical-touch').join(', '))
                        }
                      }}
                    />
                    <Label htmlFor="physical-touch" className="text-sm font-normal">
                      Physical Touch
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

       

          {/* Personal Details */}
          <Card>
            <CardHeader>
              <CardTitle>Matching Details</CardTitle>
              <CardDescription>
                Your personal information and physical characteristics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender *</Label>
                  <Select value={formData.gender ? formData.gender : 'not-selected'} onValueChange={(value) => handleInputChange('gender', value === 'not-selected' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not-selected">Please select</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <Label htmlFor="maritalStatus">Marital Status *</Label>
                  <Select value={formData.maritalStatus ? formData.maritalStatus : 'not-selected'} onValueChange={(value) => handleInputChange('maritalStatus', value === 'not-selected' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select marital status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not-selected">Please select</SelectItem>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="divorced">Divorced</SelectItem>
                      <SelectItem value="widowed">Widowed</SelectItem>
                      <SelectItem value="separated">Separated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="height">Height *</Label>
                  <Input
                    id="height"
                    value={formData.height}
                    onChange={(e) => handleInputChange('height', e.target.value)}
                    placeholder="e.g., 5'8 or 173cm"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <Label htmlFor="complexion">Complexion *</Label>
                  <Select value={formData.complexion ? formData.complexion : 'not-selected'} onValueChange={(value) => handleInputChange('complexion', value === 'not-selected' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select complexion" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not-selected">Please select</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="olive">Olive</SelectItem>
                      <SelectItem value="brown">Brown</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="bodySize">Body Size *</Label>
                  <Select value={formData.bodySize ? formData.bodySize : 'not-selected'} onValueChange={(value) => handleInputChange('bodySize', value === 'not-selected' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select body size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not-selected">Please select</SelectItem>
                      <SelectItem value="slim">Slim</SelectItem>
                      <SelectItem value="average">Average</SelectItem>
                      <SelectItem value="athletic">Athletic</SelectItem>
                      <SelectItem value="curvy">Curvy</SelectItem>
                      <SelectItem value="plus-size">Plus Size</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="occupation">Occupation *</Label>
                <Input
                  id="occupation"
                  value={formData.occupation}
                  onChange={(e) => handleInputChange('occupation', e.target.value)}
                  placeholder="Enter your profession or occupation"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    placeholder="Enter country"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State/Province *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="Enter state or province"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lga">LGA/Local Council *</Label>
                  <Input
                    id="lga"
                    value={formData.lga}
                    onChange={(e) => handleInputChange('lga', e.target.value)}
                    placeholder="Enter LGA or local council"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="contactNumber">Contact Number</Label>
                <Input
                  id="contactNumber"
                  type="tel"
                  value={formData.contactNumber}
                  onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                  placeholder="Your phone number (will not be displayed to other users)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your phone number will not be displayed to other users
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <Card>
            <CardHeader>
              <CardDescription>
                Save your profile changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex items-center"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsPreviewMode(true)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
} 