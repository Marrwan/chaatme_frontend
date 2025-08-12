'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/store'
import { 
  ArrowLeft, 
  MessageCircle, 
  Star, 
  Users, 
  Heart, 
  TrendingUp, 
  Shield, 
  Clock,
  CheckCircle,
  Phone,
  Video,
  Calendar
} from 'lucide-react'

export default function CounsellingPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated || !user) {
    return null
  }

  const counsellingServices = [
    {
      id: '1',
      title: 'Personal Transformation Sessions',
      description: 'Unlock your potential and become the best version of yourself through guided personal development.',
      duration: '60 minutes',
      type: 'Individual',
      price: '$99/session',
      features: [
        'Self-awareness development',
        'Goal setting and achievement',
        'Confidence building',
        'Personal growth planning',
        'Mindset transformation'
      ],
      rating: 4.9,
      reviews: 156,
      icon: <TrendingUp className="h-6 w-6" />
    },
    {
      id: '2',
      title: 'Love & Relationship Coaching',
      description: 'Learn love afresh and master the art of building meaningful, lasting relationships.',
      duration: '75 minutes',
      type: 'Individual/Couple',
      price: '$129/session',
      features: [
        'Communication skills',
        'Emotional intelligence',
        'Conflict resolution',
        'Intimacy building',
        'Relationship dynamics'
      ],
      rating: 4.8,
      reviews: 203,
      icon: <Heart className="h-6 w-6" />
    },
    {
      id: '3',
      title: 'Dating Confidence Workshop',
      description: 'Build confidence in dating scenarios and improve your social interaction skills.',
      duration: '90 minutes',
      type: 'Group Session',
      price: '$79/session',
      features: [
        'Social confidence building',
        'Conversation starters',
        'Body language mastery',
        'Online dating optimization',
        'First date success tips'
      ],
      rating: 4.7,
      reviews: 89,
      icon: <Users className="h-6 w-6" />
    },
    {
      id: '4',
      title: 'Relationship Management Mastery',
      description: 'Advanced strategies for maintaining healthy, thriving long-term relationships.',
      duration: '120 minutes',
      type: 'Intensive Session',
      price: '$199/session',
      features: [
        'Advanced communication',
        'Trust building techniques',
        'Long-term planning',
        'Crisis management',
        'Relationship maintenance'
      ],
      rating: 4.9,
      reviews: 67,
      icon: <Shield className="h-6 w-6" />
    }
  ]

  const sessionFormats = [
    {
      type: 'Video Call',
      icon: <Video className="h-5 w-5" />,
      description: 'Face-to-face online sessions with certified counselors'
    },
    {
      type: 'Phone Call',
      icon: <Phone className="h-5 w-5" />,
      description: 'Voice-only sessions for convenience and privacy'
    },
    {
      type: 'Chat Session',
      icon: <MessageCircle className="h-5 w-5" />,
      description: 'Text-based counseling for thoughtful communication'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <MessageCircle className="h-8 w-8 text-purple-600" />
                Counselling Services
              </h1>
              <p className="text-gray-600 mt-2">
                Personal transformation and relationship coaching to help you become your best self
              </p>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <Card className="mb-8 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-purple-900 mb-4">
                Transform Your Life & Relationships
              </h2>
              <p className="text-purple-700 mb-6 max-w-2xl mx-auto">
                Work with certified relationship and personal development coaches to unlock your 
                potential, improve your relationships, and create lasting positive change in your life.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                {sessionFormats.map((format, index) => (
                  <div key={index} className="flex items-center justify-center gap-2 text-purple-800">
                    {format.icon}
                    <span className="font-medium">{format.type}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Counselling Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {counsellingServices.map((service) => (
            <Card key={service.id} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                      {service.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{service.title}</CardTitle>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium">{service.rating}</span>
                          <span className="text-sm text-gray-500">({service.reviews})</span>
                        </div>
                        <span className="text-sm font-medium text-purple-600">{service.price}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <CardDescription className="mt-3">
                  {service.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{service.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{service.type}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 mb-2">What&apos;s included:</h4>
                  <ul className="space-y-1">
                    {service.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="pt-4 space-y-2">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Session
                  </Button>
                  <Button variant="outline" className="w-full">
                    Learn More
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Session Formats */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Choose Your Preferred Session Format</CardTitle>
            <CardDescription>
              We offer flexible session formats to suit your comfort and convenience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {sessionFormats.map((format, index) => (
                <div key={index} className="text-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 bg-purple-100 rounded-full text-purple-600">
                      {format.icon}
                    </div>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">{format.type}</h3>
                  <p className="text-sm text-gray-600">{format.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">How do I book a counselling session?</h4>
                <p className="text-sm text-gray-600">
                  Simply click &quot;Book Session&quot; on any service card above. You&apos;ll be guided through 
                  selecting your preferred date, time, and session format.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Are the counselors certified?</h4>
                <p className="text-sm text-gray-600">
                  Yes, all our counselors are certified relationship and personal development coaches 
                  with extensive experience in their respective fields.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Can I reschedule my session?</h4>
                <p className="text-sm text-gray-600">
                  Yes, you can reschedule your session up to 24 hours before the scheduled time 
                  without any additional charges.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Is my information kept confidential?</h4>
                <p className="text-sm text-gray-600">
                  Absolutely. We maintain strict confidentiality standards and your personal 
                  information and session details are never shared with third parties.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 