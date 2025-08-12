'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/lib/store'
import { paymentService, type Plan } from '@/services/paymentService'
import { 
  ArrowLeft, 
  CheckCircle, 
  Crown, 
  Star, 
  MessageCircle, 
  Video, 
  Heart, 
  Users,
  AlertCircle,
  Loader2
} from 'lucide-react'

function SubscriptionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated } = useAuth()
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [currentSubscription, setCurrentSubscription] = useState<any>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    
    loadSubscriptionData()
  }, [isAuthenticated, router])

  useEffect(() => {
    // Check for payment verification
    const reference = searchParams.get('reference')
    if (reference) {
      verifyPayment(reference)
    }
  }, [searchParams])

  const loadSubscriptionData = async () => {
    try {
      setIsLoading(true)
      
      // Load plans
      const plansData = await paymentService.getPlans()
      setPlans(plansData)
      
      // Load current subscription
      try {
        const subscription = await paymentService.getCurrentSubscription()
        setCurrentSubscription(subscription.data)
      } catch (error) {
        // User might not have a subscription
        console.log('No active subscription found')
      }
    } catch (error) {
      console.error('Error loading subscription data:', error)
      setMessage('Failed to load subscription data')
      setMessageType('error')
    } finally {
      setIsLoading(false)
    }
  }

  const verifyPayment = async (reference: string) => {
    try {
      setIsProcessing(true)
      setMessage('')
      
      const result = await paymentService.verifyPayment(reference)
      
      if (result.success) {
        setMessage('Payment verified successfully! Your premium subscription is now active.')
        setMessageType('success')
        // Reload subscription data
        await loadSubscriptionData()
        // Update auth context
        if (typeof window !== 'undefined') {
          window.location.reload()
        }
      } else {
        setMessage('Payment verification failed. Please try again.')
        setMessageType('error')
      }
    } catch (error) {
      console.error('Payment verification error:', error)
      setMessage('Payment verification failed. Please contact support.')
      setMessageType('error')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUpgrade = async (planId: string) => {
    try {
      setIsProcessing(true)
      setMessage('')
      
      const result = await paymentService.initializePayment(planId)
      
      if (result.status && result.data?.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = result.data.authorization_url
      } else {
        setMessage('Failed to initialize payment. Please try again.')
        setMessageType('error')
      }
    } catch (error) {
      console.error('Payment initialization error:', error)
      setMessage('Failed to initialize payment. Please try again.')
      setMessageType('error')
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isAuthenticated || !user) {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading subscription plans...</p>
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
                <Crown className="h-8 w-8 text-yellow-600" />
                Subscription Plans
              </h1>
              <p className="text-gray-600 mt-2">
                Choose the perfect plan for your dating journey
              </p>
            </div>
            {currentSubscription?.isActive && (
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                <CheckCircle className="h-4 w-4 inline mr-2" />
                Premium Active
              </div>
            )}
          </div>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-md flex items-center max-w-4xl mx-auto ${
            messageType === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {messageType === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            {message}
          </div>
        )}

        {/* Current Subscription Status */}
        {currentSubscription?.subscription && (
          <Card className="mb-8 max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Current Subscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Plan</p>
                  <p className="font-semibold">{currentSubscription.subscription.plan?.name || 'Premium'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-semibold text-green-600">Active</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Expires</p>
                  <p className="font-semibold">
                    {new Date(currentSubscription.subscription.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plans */}
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Choose Your Plan</h2>
            <p className="text-gray-600">Select a plan that best fits your needs</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* FREE BASIC */}
            <Card className={`relative ${user.subscriptionStatus === 'free' ? 'ring-2 ring-blue-500' : ''}`}>
              <CardHeader>
                <CardTitle className="text-center">FREE BASIC</CardTitle>
                <CardDescription className="text-center">Get started for free</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <span className="text-3xl font-bold">₦0</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <ul className="space-y-3">
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
                <Button 
                  variant="outline" 
                  className="w-full" 
                  disabled={user.subscriptionStatus === 'free'}
                >
                  {user.subscriptionStatus === 'free' ? 'Current Plan' : 'Free Plan'}
                </Button>
              </CardContent>
            </Card>

            {/* PREMIUM */}
            <Card className={`relative border-blue-200 ${user.subscriptionStatus === 'premium' ? 'ring-2 ring-blue-500' : ''}`}>
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
                <ul className="space-y-3">
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
                <Button 
                  className="w-full" 
                  disabled={user.subscriptionStatus === 'premium' || isProcessing}
                  onClick={() => handleUpgrade(plans.find(p => p.name === 'Premium')?.id || '')}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : user.subscriptionStatus === 'premium' ? (
                    'Current Plan'
                  ) : (
                    'Upgrade to Premium'
                  )}
              </Button>
              </CardContent>
            </Card>
          </div>

          {/* Features Comparison */}
          <Card className="mt-12">
            <CardHeader>
              <CardTitle className="text-center">Feature Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Feature</th>
                      <th className="text-center py-3 px-4">Free Basic</th>
                      <th className="text-center py-3 px-4">Premium</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 px-4">Chat Access</td>
                      <td className="text-center py-3 px-4">Receive Only</td>
                      <td className="text-center py-3 px-4">Full Access</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Audio/Video Calls</td>
                      <td className="text-center py-3 px-4">Receive Only</td>
                      <td className="text-center py-3 px-4">Full Access</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Matchmaking System</td>
                      <td className="text-center py-3 px-4">❌</td>
                      <td className="text-center py-3 px-4">✅</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Set Preferences</td>
                      <td className="text-center py-3 px-4">❌</td>
                      <td className="text-center py-3 px-4">✅</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Send Interest Messages</td>
                      <td className="text-center py-3 px-4">❌</td>
                      <td className="text-center py-3 px-4">✅</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Monthly Price</td>
                      <td className="text-center py-3 px-4 font-bold">₦0</td>
                      <td className="text-center py-3 px-4 font-bold">₦10,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">How does the subscription work?</h4>
                <p className="text-gray-600 text-sm">
                  Premium subscriptions are billed monthly at ₦10,000. You can cancel anytime and continue using the service until the end of your billing period.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Can I cancel my subscription?</h4>
                <p className="text-gray-600 text-sm">
                  Yes, you can cancel your subscription at any time. You'll continue to have access to premium features until the end of your current billing period.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">What payment methods are accepted?</h4>
                <p className="text-gray-600 text-sm">
                  We accept all major Nigerian payment methods including debit cards, credit cards, and bank transfers through our secure payment partner Paystack.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SubscriptionContent />
    </Suspense>
  )
} 