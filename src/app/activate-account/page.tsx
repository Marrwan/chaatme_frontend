'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { authService } from '@/services/authService'
import { ApiRequestError } from '@/lib/api'

function ActivateAccountContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isActivating, setIsActivating] = useState(true)
  const [activationError, setActivationError] = useState<string | null>(null)
  const [activationSuccess, setActivationSuccess] = useState<string | null>(null)

  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setActivationError('Invalid activation link. Missing token.')
      setIsActivating(false)
      return
    }

    activateAccount(token)
  }, [token])

  const activateAccount = async (activationToken: string) => {
    setIsActivating(true)
    setActivationError(null)
    setActivationSuccess(null)

    try {
      const response = await authService.activateAccount(activationToken)
      setActivationSuccess(response.message || 'Account activated successfully!')
    } catch (error: unknown) {
      let errorMessage = 'Account activation failed. Please try again or request a new activation link.'
      
      if (error instanceof ApiRequestError) {
        errorMessage = error.message
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      
      setActivationError(errorMessage)
    } finally {
      setIsActivating(false)
    }
  }

  const handleResendActivation = async () => {
    // This would require the user's email - for now, redirect to a resend page
    router.push('/resend-activation')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            {isActivating ? (
              <>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                  <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Activating Account
                </CardTitle>
                <CardDescription>
                  Please wait while we activate your account...
                </CardDescription>
              </>
            ) : activationSuccess ? (
              <>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Congratulations!!!
                </CardTitle>
                <CardDescription>
                  Your account is now active.
                </CardDescription>
              </>
            ) : (
              <>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Activation Failed
                </CardTitle>
                <CardDescription>
                  We couldn&apos;t activate your account
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {activationError && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{activationError}</AlertDescription>
              </Alert>
            )}

            {activationSuccess && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{activationSuccess}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              {activationSuccess ? (
                <Button asChild className="w-full">
                  <Link href="/login">
                    Continue to Login
                  </Link>
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={handleResendActivation}
                    variant="outline" 
                    className="w-full"
                  >
                    Resend Activation Email
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/login">
                      Back to Login
                    </Link>
                  </Button>
                </>
              )}
            </div>

            <div className="text-center text-sm text-gray-600">
              <p>
                Having trouble?{' '}
                <Link href="/contact" className="text-blue-600 hover:text-blue-500">
                  Contact Support
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ActivateAccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ActivateAccountContent />
    </Suspense>
  )
} 