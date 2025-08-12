'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
  Crown
} from 'lucide-react'

export default function MatchMakingPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [currentStep, setCurrentStep] = useState<'check' | 'preferences' | 'plans' | 'matches'>('check')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
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
    height: '',
    complexion: '',
    bodySize: '',
    occupation: '',
    country: '',
    state: '',
    lga: ''
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
              height: preference.height || '',
              complexion: preference.complexion || '',
              bodySize: preference.bodySize || '',
              occupation: preference.occupation || '',
              country: preference.country || '',
              state: preference.state || '',
              lga: preference.lga || ''
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

  const handlePreferenceChange = (field: keyof SetMatchPreferenceRequest, value: string | number) => {
    setPreferenceForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSavePreferences = async () => {
    setIsSaving(true)
    setMessage('')

    try {
      const result = await matchPreferenceService.setMatchPreference(preferenceForm)
      setMatchPreference(result.preference)
      setMessage(result.message)
      setMessageType('success')
      setCurrentStep('plans')
    } catch (error) {
      console.error('Error saving preferences:', error)
      setMessage(error instanceof Error ? error.message : 'Failed to save preferences')
      setMessageType('error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleFindMatches = async () => {
    setIsLoading(true)
    try {
      const result = await matchPreferenceService.findMatches()
      setMatches(result.matches)
      setCurrentStep('matches')
    } catch (error) {
      console.error('Error finding matches:', error)
      setMessage(error instanceof Error ? error.message : 'Failed to find matches')
      setMessageType('error')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated || !user) {
    return null
  }

  const renderProfileCheck = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <AlertCircle className="h-6 w-6 text-yellow-600" />
          Complete Your Profile First
        </CardTitle>
        <CardDescription>
          You need to complete your profile before you can set match preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-gray-600">
          To provide you with the best matches, we need your complete profile information. 
          Please fill out all required fields in your profile.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/dashboard/profile">
            <Button>Complete Profile</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )

  const renderPreferencesForm = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Set Your Match Preferences</CardTitle>
          <CardDescription>
            Tell us what you&apos;re looking for in a potential match
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
              <Label htmlFor="maritalStatus">Marital Status</Label>
              <Select value={preferenceForm.maritalStatus} onValueChange={(value) => handlePreferenceChange('maritalStatus', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select preferred marital status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="divorced">Divorced</SelectItem>
                  <SelectItem value="widowed">Widowed</SelectItem>
                  <SelectItem value="separated">Separated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                value={preferenceForm.height}
                onChange={(e) => handlePreferenceChange('height', e.target.value)}
                placeholder="e.g., 5ft 8in or 173cm"
              />
            </div>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <div>
              <Label htmlFor="occupation">Occupation</Label>
              <Input
                id="occupation"
                value={preferenceForm.occupation}
                onChange={(e) => handlePreferenceChange('occupation', e.target.value)}
                placeholder="Enter preferred occupation"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={preferenceForm.country}
                onChange={(e) => handlePreferenceChange('country', e.target.value)}
                placeholder="Enter country"
              />
            </div>
            <div>
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                value={preferenceForm.state}
                onChange={(e) => handlePreferenceChange('state', e.target.value)}
                placeholder="Enter state"
              />
            </div>
            <div>
              <Label htmlFor="lga">LGA/Local Council</Label>
              <Input
                id="lga"
                value={preferenceForm.lga}
                onChange={(e) => handlePreferenceChange('lga', e.target.value)}
                placeholder="Enter LGA"
              />
            </div>
          </div>

          <div className="flex gap-4">
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
            <Link href="/dashboard">
              <Button variant="outline">Cancel</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderServicePlans = () => (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Choose Your Service Plan</h2>
        <p className="text-gray-600">Select a plan that best fits your needs</p>
      </div>

      {/* Upgrade Prompt for Non-Premium Users */}
      {!user.canAccessMatchmaking && (
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
                <Button className="bg-yellow-600 hover:bg-yellow-700">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* FREE BASIC */}
        <Card className="relative">
          <CardHeader>
            <CardTitle className="text-center">FREE BASIC</CardTitle>
            <CardDescription className="text-center">Get started for free</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm">Response-Only Account</span>
              </li>
              <li className="flex items-center">
                <MessageCircle className="h-4 w-4 text-yellow-500 mr-2" />
                <span className="text-sm">Can receive: Chat, Audio Call, Video Call</span>
              </li>
              <li className="flex items-center">
                <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                <span className="text-sm">Cannot initiate matchmaking</span>
              </li>
            </ul>
            <Button variant="outline" className="w-full" disabled>
              {user.subscriptionStatus === 'free' ? 'Current Plan' : 'Free Plan'}
            </Button>
          </CardContent>
        </Card>

        {/* PREMIUM */}
        <Card className="relative border-blue-200">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <div className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
              RECOMMENDED
            </div>
          </div>
          <CardHeader>
            <CardTitle className="text-center text-blue-600">PREMIUM</CardTitle>
            <CardDescription className="text-center">Full access to all features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <span className="text-3xl font-bold">₦10,000</span>
              <span className="text-gray-600">/month</span>
            </div>
            <ul className="space-y-2">
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm">Initiate & receive Chat, Audio Calls, Video Calls</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm">Access to Matchmaking System</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm">Set matchmaking preferences</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm">Submit matchmaking form</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm">Discover and connect with compatible matches</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm">Send interest messages</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm">Build serious relationships</span>
              </li>
            </ul>
            {user.subscriptionStatus === 'premium' ? (
              <Button className="w-full" disabled>
                Current Plan
              </Button>
            ) : (
              <Link href="/dashboard/subscription">
                <Button className="w-full">
                  Upgrade to Premium
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Coaching Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Become a better version of yourself with personal transformation sessions, 
              learn love afresh, and improve your relationship management skills.
            </p>
            <Link href="/dashboard/counselling">
              <Button variant="outline" className="w-full">
                Take Coaching Sessions
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-500" />
              Date Planning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Get support with planning a flawless date with expert guidance 
              and personalized recommendations.
            </p>
            <Link href="/dashboard/plan-date">
              <Button variant="outline" className="w-full">
                Plan a Date
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {user.canAccessMatchmaking && (
      <div className="text-center">
        <Button onClick={handleFindMatches} size="lg">
          <Search className="h-5 w-5 mr-2" />
          Find My Matches
        </Button>
      </div>
      )}
    </div>
  )

  const renderMatches = () => (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Matches</h2>
          <p className="text-gray-600">Found {matches.length} potential matches based on your preferences</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCurrentStep('plans')}>
            <SettingsIcon className="h-4 w-4 mr-2" />
            View Plans
          </Button>
          <Button onClick={handleFindMatches}>
            <Search className="h-4 w-4 mr-2" />
            Refresh Matches
          </Button>
        </div>
      </div>

      {matches.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No matches found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your preferences to find more potential matches.
            </p>
            <Button onClick={() => setCurrentStep('preferences')} variant="outline">
              Adjust Preferences
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((match) => (
            <Card key={match.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  {match.profilePicture && (
                    <img 
                      src={match.profilePicture} 
                      alt={match.realName || match.username} 
                      className="w-20 h-20 rounded-full mx-auto object-cover"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">
                      {match.realName || match.username || 'Anonymous'}
                    </h3>
                    <p className="text-gray-600 text-sm">{match.occupation}</p>
                    <p className="text-gray-500 text-sm">
                      {match.country && match.state && `${match.state}, ${match.country}`}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Gender:</span>
                      <span className="capitalize">{match.gender}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Height:</span>
                      <span>{match.height}</span>
                    </div>
                    {match.interests && (
                      <div className="text-sm">
                        <span className="text-gray-600">Interests:</span>
                        <p className="text-gray-800 truncate">{match.interests}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1">
                      <Heart className="h-4 w-4 mr-1" />
                      Like
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Chat
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading match making...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Heart className="h-8 w-8 text-[#8B0000]" />
                Match Making
              </h1>
              <p className="text-gray-600 mt-2">
                Find your perfect match based on your preferences
              </p>
            </div>
          </div>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-md max-w-4xl mx-auto ${
            messageType === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <div className="flex items-center mb-3">
              {messageType === 'success' ? (
                <CheckCircle className="h-5 w-5 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 mr-2" />
              )}
              {message}
            </div>
            
            {/* Show upgrade button for premium errors */}
            {messageType === 'error' && message.includes('Upgrade to Premium') && (
              <div className="mt-3 pt-3 border-t border-red-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-red-700">
                    Upgrade to Premium to unlock matchmaking features and find your perfect match!
                  </p>
                  <Link href="/dashboard/subscription">
                    <Button size="sm" className="bg-[#8B0000] hover:bg-[#660000] text-white">
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade Now
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step Content */}
        {currentStep === 'check' && renderProfileCheck()}
        {currentStep === 'preferences' && renderPreferencesForm()}
        {currentStep === 'plans' && renderServicePlans()}
        {currentStep === 'matches' && renderMatches()}
      </div>
    </div>
  )
} 