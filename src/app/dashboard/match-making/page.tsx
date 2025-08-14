'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

import { useAuth } from '@/lib/store'
import { userService } from '@/services/userService'
import { matchPreferenceService, type SetMatchPreferenceRequest, type MatchPreference } from '@/services/matchPreferenceService'
import type { User } from '@/services/userService'
import { 
  ArrowLeft, 
  Heart, 
  Settings as SettingsIcon, 
  Users, 
  AlertCircle, 
  CheckCircle, 
  Star, 
  MessageCircle, 
  Video, 
  Calendar,
  Save,
  Search,
  Crown,
  Eye,
  Edit
} from 'lucide-react'

export default function MatchMakingPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [currentStep, setCurrentStep] = useState<'check' | 'preferences' | 'plans' | 'matches'>('check')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [isProfileComplete, setIsProfileComplete] = useState(false)
  const [matchPreference, setMatchPreference] = useState<MatchPreference | null>(null)
  const [matches, setMatches] = useState<User[]>([])
  const [preferenceForm, setPreferenceForm] = useState<SetMatchPreferenceRequest>({
    ageMin: 18,
    ageMax: 65,
    gender: '',
    maritalStatus: '',
    complexion: '',
    bodySize: '',
    sameInterests: false,
    sameHobbies: false
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    
    initializeMatchMaking()
  }, [isAuthenticated, router])

  const initializeMatchMaking = async () => {
    try {
      setIsLoading(true)
      
      if (user) {
        // Check profile completion
        const profileComplete = userService.isProfileComplete(user)
        setIsProfileComplete(profileComplete)
        
        if (!profileComplete) {
          setCurrentStep('check')
          return
        }

        // Load existing preference
        try {
          const preference = await matchPreferenceService.getMatchPreference()
          if (preference) {
            setMatchPreference(preference)
            setPreferenceForm({
              ageMin: preference.ageMin || 18,
              ageMax: preference.ageMax || 65,
              gender: preference.gender || '',
              maritalStatus: preference.maritalStatus || '',
              complexion: preference.complexion || '',
              bodySize: preference.bodySize || '',
              sameInterests: preference.sameInterests || false,
              sameHobbies: preference.sameHobbies || false
            })
            setCurrentStep('plans')
          } else {
            setCurrentStep('preferences')
          }
        } catch (error) {
          setCurrentStep('preferences')
        }
      }
    } catch (error) {
      console.error('Error initializing match making:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreferenceChange = (field: keyof SetMatchPreferenceRequest, value: any) => {
    setPreferenceForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleMaritalStatusChange = (status: string, checked: boolean) => {
    const currentStatuses = preferenceForm.maritalStatus ? preferenceForm.maritalStatus.split(',').filter(s => s.trim()) : []
    
    if (checked) {
      if (!currentStatuses.includes(status)) {
        handlePreferenceChange('maritalStatus', [...currentStatuses, status].join(', '))
      }
    } else {
      handlePreferenceChange('maritalStatus', currentStatuses.filter(s => s !== status).join(', '))
    }
  }

  const handleSavePreferences = async () => {
    try {
      setIsSaving(true)
      setMessage('')
      
      await matchPreferenceService.setMatchPreference(preferenceForm)
      
      setMessage('Match preferences saved successfully!')
      setMessageType('success')
      setCurrentStep('plans')
    } catch (error: any) {
      console.error('Error saving preferences:', error)
      setMessage(error.message || 'Failed to save preferences. Please try again.')
      setMessageType('error')
    } finally {
      setIsSaving(false)
    }
  }

  const getDisplayValue = (value: string | undefined) => {
    if (!value || value === 'not-selected') return 'Not specified'
    return value.charAt(0).toUpperCase() + value.slice(1).replace('-', ' ')
  }

  const getMaritalStatusDisplay = (maritalStatus: string | undefined) => {
    if (!maritalStatus) return 'Not specified'
    return maritalStatus.split(',').map(status => 
      status.trim().charAt(0).toUpperCase() + status.trim().slice(1)
    ).join(', ')
  }

  if (isPreviewMode) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Match Preferences Preview</h1>
              </div>
              <Button onClick={() => setIsPreviewMode(false)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Preferences
              </Button>
            </div>
          </div>

          {/* Preferences Preview */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Your Match Preferences</CardTitle>
                <CardDescription>
                  These are the criteria you've set for finding your perfect match
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Age Range</Label>
                    <p className="text-gray-900">{preferenceForm.ageMin} - {preferenceForm.ageMax} years</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Preferred Gender</Label>
                    <p className="text-gray-900">{getDisplayValue(preferenceForm.gender)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Marital Status</Label>
                    <p className="text-gray-900">{getMaritalStatusDisplay(preferenceForm.maritalStatus)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Complexion</Label>
                    <p className="text-gray-900">{getDisplayValue(preferenceForm.complexion)}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-500">Body Size</Label>
                  <p className="text-gray-900">{getDisplayValue(preferenceForm.bodySize)}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-500">Additional Preferences</Label>
                  <div className="space-y-2 mt-2">
                    {preferenceForm.sameInterests && (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-gray-900">People with same/similar interests like me</span>
                      </div>
                    )}
                    {preferenceForm.sameHobbies && (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-gray-900">People with same/similar hobbies like me</span>
                      </div>
                    )}
                    {!preferenceForm.sameInterests && !preferenceForm.sameHobbies && (
                      <p className="text-gray-500">No additional preferences set</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading match making...</p>
        </div>
      </div>
    )
  }

  if (currentStep === 'check') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Complete Your Profile First</h2>
            <p className="text-gray-600 mb-8">
              You need to complete your profile before you can set match preferences and find matches.
            </p>
            <Link href="/dashboard/profile">
              <Button className="bg-purple-600 hover:bg-purple-700">
                Complete Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (currentStep === 'preferences') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Set Match Preferences</h1>
              </div>
            </div>
          </div>

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

          <Card>
            <CardHeader>
              <CardTitle>Match Preferences</CardTitle>
              <CardDescription>
                Set your preferences to find the perfect match
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="ageMin">Minimum Age</Label>
                  <Input
                    id="ageMin"
                    type="number"
                    min="18"
                    max="100"
                    value={preferenceForm.ageMin || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? '' : parseInt(e.target.value) || 0;
                      handlePreferenceChange('ageMin', value);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="ageMax">Maximum Age</Label>
                  <Input
                    id="ageMax"
                    type="number"
                    min="18"
                    max="100"
                    value={preferenceForm.ageMax || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? '' : parseInt(e.target.value) || 0;
                      handlePreferenceChange('ageMax', value);
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={preferenceForm.gender} onValueChange={(value) => handlePreferenceChange('gender', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select preferred gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Marital Status</Label>
                  <div className="space-y-3 mt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="single" 
                        checked={preferenceForm.maritalStatus?.includes('single') || false}
                        onCheckedChange={(checked) => handleMaritalStatusChange('single', checked as boolean)}
                      />
                      <Label htmlFor="single" className="text-sm font-normal">Single</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="divorced" 
                        checked={preferenceForm.maritalStatus?.includes('divorced') || false}
                        onCheckedChange={(checked) => handleMaritalStatusChange('divorced', checked as boolean)}
                      />
                      <Label htmlFor="divorced" className="text-sm font-normal">Divorced</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="widowed" 
                        checked={preferenceForm.maritalStatus?.includes('widowed') || false}
                        onCheckedChange={(checked) => handleMaritalStatusChange('widowed', checked as boolean)}
                      />
                      <Label htmlFor="widowed" className="text-sm font-normal">Widowed</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="separated" 
                        checked={preferenceForm.maritalStatus?.includes('separated') || false}
                        onCheckedChange={(checked) => handleMaritalStatusChange('separated', checked as boolean)}
                      />
                      <Label htmlFor="separated" className="text-sm font-normal">Separated</Label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="complexion">Complexion</Label>
                  <Select value={preferenceForm.complexion} onValueChange={(value) => handlePreferenceChange('complexion', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select preferred complexion" />
                    </SelectTrigger>
                    <SelectContent>
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
                  <Label htmlFor="bodySize">Body Size</Label>
                  <Select value={preferenceForm.bodySize} onValueChange={(value) => handlePreferenceChange('bodySize', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select preferred body size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slim">Slim</SelectItem>
                      <SelectItem value="average">Average</SelectItem>
                      <SelectItem value="athletic">Athletic</SelectItem>
                      <SelectItem value="curvy">Curvy</SelectItem>
                      <SelectItem value="plus-size">Plus Size</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Additional Preferences</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="sameInterests" 
                      checked={preferenceForm.sameInterests}
                      onCheckedChange={(checked) => handlePreferenceChange('sameInterests', checked as boolean)}
                    />
                    <Label htmlFor="sameInterests" className="text-sm font-normal">
                      People with same/similar interests like me
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="sameHobbies" 
                      checked={preferenceForm.sameHobbies}
                      onCheckedChange={(checked) => handlePreferenceChange('sameHobbies', checked as boolean)}
                    />
                    <Label htmlFor="sameHobbies" className="text-sm font-normal">
                      People with same/similar hobbies like me
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 mt-6">
            <Button onClick={handleSavePreferences} disabled={isSaving}>
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
            <Button 
              variant="outline"
              onClick={() => setIsPreviewMode(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview Preferences
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const renderServicePlans = () => (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Choose Your Service Plan</h2>
        <p className="text-gray-600">Select a plan that best fits your needs</p>
      </div>

      {/* Upgrade Prompt for Non-Premium Users */}
      {user && !user.canAccessMatchmaking && (
        <Card className="max-w-4xl mx-auto border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-yellow-800">
              <AlertCircle className="h-6 w-6" />
              Upgrade Required
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-yellow-700">
              To access the matchmaking system and find your perfect match, you need to upgrade to Premium.
            </p>
            <div className="bg-white p-4 rounded-lg border border-yellow-200">
              <h3 className="font-semibold text-lg mb-2">Premium Features Include:</h3>
              <ul className="text-sm space-y-1 text-left max-w-md mx-auto">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Full access to matchmaking system
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Set detailed match preferences
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Discover and connect with compatible matches
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Send interest messages
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Initiate chats and calls
                </li>
              </ul>
            </div>
            <div className="flex gap-4 justify-center">
              <Link href="/dashboard/subscription">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to Premium
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Premium User Content */}
      {user && user.canAccessMatchmaking && (
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Your Match Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Age Range</Label>
                  <p className="text-gray-900">{preferenceForm.ageMin} - {preferenceForm.ageMax} years</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Preferred Gender</Label>
                  <p className="text-gray-900">{getDisplayValue(preferenceForm.gender)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Marital Status</Label>
                  <p className="text-gray-900">{getMaritalStatusDisplay(preferenceForm.maritalStatus)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Complexion</Label>
                  <p className="text-gray-900">{getDisplayValue(preferenceForm.complexion)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Body Size</Label>
                  <p className="text-gray-900">{getDisplayValue(preferenceForm.bodySize)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Additional Preferences</Label>
                  <div className="space-y-1">
                    {preferenceForm.sameInterests && (
                      <p className="text-sm text-gray-900">• Same interests</p>
                    )}
                    {preferenceForm.sameHobbies && (
                      <p className="text-sm text-gray-900">• Same hobbies</p>
                    )}
                    {!preferenceForm.sameInterests && !preferenceForm.sameHobbies && (
                      <p className="text-sm text-gray-500">None specified</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <Button onClick={() => setCurrentStep('preferences')} variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Preferences
                </Button>
                <Button onClick={() => setIsPreviewMode(true)} variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Find Matches
              </CardTitle>
              <CardDescription>
                Discover people who match your preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Search className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">Ready to Find Your Match?</h3>
                <p className="text-gray-600 mb-6">
                  Click the button below to start discovering people who match your preferences.
                </p>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Search className="h-4 w-4 mr-2" />
                  Find Matches
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Match Making</h1>
            </div>
          </div>
        </div>

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

        {renderServicePlans()}
      </div>
    </div>
  )
} 