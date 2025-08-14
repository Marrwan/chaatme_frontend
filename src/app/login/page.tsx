"use client"

import React, { useState } from 'react'
import Link from 'next/link'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, AlertCircle, Mail } from 'lucide-react'
import { authService } from '@/services/authService'
import { ApiRequestError, tokenManager } from '@/lib/api'
import { useAuth } from '@/lib/store'
import { loginSchema, type LoginFormData } from '@/lib/validations'

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, isInitialized } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [needsActivation, setNeedsActivation] = useState(false)
  const [userEmail, setUserEmail] = useState<string>('')
  const [checkingProfile, setCheckingProfile] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isInitialized && isAuthenticated) {
      console.log('[LoginPage] User is authenticated, redirecting to dashboard')
      router.replace('/dashboard')
    }
  }, [isAuthenticated, isInitialized, router])

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)
    setNeedsActivation(false)
    setUserEmail(data.email)

    try {
      const response = await authService.login(data)
      
      // Store token and update auth state
      tokenManager.set(response.token)
      login(response.user, response.token)
      
      // After login, redirect to main dashboard
      router.replace('/dashboard');
    } catch (error: unknown) {
      let errorMessage = 'Login failed. Please check your credentials and try again.'
      
      if (error instanceof ApiRequestError) {
        errorMessage = error.message
        
        // Check if it's an activation error
        if (errorMessage.toLowerCase().includes('activate') || 
            errorMessage.toLowerCase().includes('verification')) {
          setNeedsActivation(true)
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      
      setSubmitError(errorMessage)
    } finally {
      setIsSubmitting(false)
      setCheckingProfile(false)
    }
  }

  const handleResendActivation = async () => {
    try {
      const email = userEmail || getValues('email')
      if (!email) {
        setSubmitError('Please enter your email address first.')
        return
      }

      await authService.resendActivation(email)
      setSubmitError(null)
      setNeedsActivation(false)
      
      // Show success message
      alert('Activation email sent! Please check your inbox.')
      
    } catch (error: unknown) {
      let errorMessage = 'Failed to send activation email. Please try again.'
      
      if (error instanceof ApiRequestError) {
        errorMessage = error.message
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      
      setSubmitError(errorMessage)
    }
  }

  if (checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full flex items-center justify-center space-x-8">
        {/* Left Side - Image Collage */}
        <div className="hidden lg:block relative w-96 h-96">
          <div className="relative w-full h-full">
            {/* Main image: ChaatMe Image 2 */}
            <div className="absolute top-0 left-0 w-80 h-96 rounded-lg overflow-hidden transform rotate-3 shadow-lg">
              <img src="/ChaatMe Image 2.jpg" alt="ChaatMe visual" className="object-cover w-full h-full" />
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-sm">
          <div className="bg-white border border-gray-300 rounded-sm px-8 pt-6 pb-8">
            {/* ChaatMe Logo */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2">
                <img src="/ChaatMeLogo.jpg" alt="ChaatMe Logo" width={40} height={40} className="rounded" />
                <div className="text-2xl font-bold text-gray-900">Login to your account</div>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              {submitError && (
                <Alert variant="destructive" className="mb-4 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              {needsActivation && (
                <Alert className="mb-4 text-sm">
                  <Mail className="h-4 w-4" />
                  <AlertDescription className="space-y-2">
                    <p>Your account needs to be activated before you can login.</p>
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm"
                      onClick={handleResendActivation}
                      className="w-full text-xs"
                    >
                      Resend Activation Email
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Email Input */}
              <div>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email address"
                  autoComplete="email"
                  {...register('email')}
                  className={`h-10 text-sm border-gray-300 focus:border-gray-400 focus:ring-0 ${errors.email ? 'border-red-500' : ''}`}
                  style={{ backgroundColor: '#fafafa' }}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    autoComplete="current-password"
                    {...register('password')}
                    className={`h-10 text-sm border-gray-300 focus:border-gray-400 focus:ring-0 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                    style={{ backgroundColor: '#fafafa' }}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
                )}
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full h-10 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm rounded-sm transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Logging In...' : 'Log In'}
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-xs text-gray-500 font-semibold">OR</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Forgot Password */}
            <div className="text-center">
              <Link 
                href="/forgot-password" 
                className="text-xs text-rose-600 font-semibold hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {/* Sign Up Card */}
          <div className="bg-white border border-gray-300 rounded-sm px-8 py-4 text-center mt-3">
            <p className="text-sm text-gray-900">
              Don't have an account?{' '}
              <Link href="/register" className="text-rose-500 font-semibold hover:underline">
                Sign up
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
} 