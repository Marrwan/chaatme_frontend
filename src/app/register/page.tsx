"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { authService } from '@/services/authService'
import { ApiRequestError } from '@/lib/api'
import { useAuth } from '@/lib/store'
import { registerSchema, type RegisterFormData } from '@/lib/validations'

export default function RegisterPage() {
  const router = useRouter()
  const { isAuthenticated, isInitialized } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [registrationSuccess, setRegistrationSuccess] = useState<string | null>(null)
  const [acceptTerms, setAcceptTerms] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      acceptTerms: false
    }
  })

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isInitialized && isAuthenticated) {
      console.log('[RegisterPage] User is authenticated, redirecting to dashboard')
      router.replace('/dashboard')
    }
  }, [isAuthenticated, isInitialized, router])

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)
    setRegistrationSuccess(null)

    try {
      const response = await authService.register({
        email: data.email,
        password: data.password,
        name: data.email.split('@')[0]
      })

      setRegistrationSuccess(response.message || 'Registration successful! Please check your email to activate your account.')

    } catch (error: unknown) {
      let errorMessage = 'Registration failed. Please try again.'
      
      if (error instanceof ApiRequestError) {
        errorMessage = error.message
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      
      setSubmitError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Check Your Email
              </CardTitle>
              <CardDescription>
                We have sent you an activation link
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription className="text-center">
                  {registrationSuccess}
                </AlertDescription>
              </Alert>
              
              <div className="text-center space-y-4">
                <p className="text-sm text-gray-600">
                  Kindly check your email and click on the link to activate your account.
                </p>
                
                <div className="space-y-2">
                  <Button asChild className="full">
                    <Link href="/login">
                      Go to Login
                    </Link>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setRegistrationSuccess(null)
                      setSubmitError(null)
                    }}
                  >
                    Register Another Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full flex items-center justify-center space-x-8">
        {/* Left Side - Image Collage */}
        <div className="hidden lg:block relative w-96 h-96">
          <div className="relative w-full h-full">
            {/* Main image: ChaatMe Image 2 */}
            <div className="absolute top-0 left-0 w-80 h-96 rounded-lg overflow-hidden transform rotate-3 shadow-lg">
              <Image src="/ChaatMe Image 2.jpg" alt="ChaatMe visual" fill className="object-cover" />
            </div>
          </div>
        </div>

        {/* Right Side - Register Form */}
        <div className="w-full max-w-sm">
          <div className="bg-white border border-gray-300 rounded-sm px-8 pt-6 pb-8">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2">
                <Image src="/ChaatMeLogo.jpg" alt="ChaatMe Logo" width={40} height={40} className="rounded" />
                <div className="text-2xl font-bold text-gray-900">Create Account</div>
              </div>
              <p className="text-sm text-gray-600 font-semibold mt-2">
                Sign up to see photos and videos from your friends.
              </p>
            </div>

            {/* Register Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              {submitError && (
                <Alert variant="destructive" className="mb-4 text-sm">
                  <AlertDescription>{submitError}</AlertDescription>
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
                    autoComplete="new-password"
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

              {/* Confirm Password Input */}
              <div>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm Password"
                    autoComplete="new-password"
                    {...register('confirmPassword')}
                    className={`h-10 text-sm border-gray-300 focus:border-gray-400 focus:ring-0 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                    style={{ backgroundColor: '#fafafa' }}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start space-x-2 pt-2">
                <Checkbox
                  id="acceptTerms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => {
                    const isChecked = !!checked;
                    setAcceptTerms(isChecked);
                    setValue('acceptTerms', isChecked);
                  }}
                  className={`mt-0.5 ${errors.acceptTerms ? 'border-red-500' : ''}`}
                />
                <label 
                  htmlFor="acceptTerms" 
                  className="text-xs text-gray-600 leading-tight cursor-pointer"
                  onClick={() => {
                    const newValue = !acceptTerms;
                    setAcceptTerms(newValue);
                    setValue('acceptTerms', newValue);
                  }}
                >
                  By signing up, you agree to our{' '}
                  <Link href="/terms" className="text-rose-600 font-semibold hover:underline">
                    Terms
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-rose-600 font-semibold hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              {errors.acceptTerms && (
                <p className="text-xs text-red-500">{errors.acceptTerms.message}</p>
              )}

              {/* Sign Up Button */}
              <Button
                type="submit"
                className="w-full h-10 bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm rounded-sm transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-xs text-gray-500 font-semibold">OR</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white border border-gray-300 rounded-sm px-8 py-4 text-center mt-3">
            <p className="text-sm text-gray-900">
              Have an account?{' '}
              <Link href="/login" className="text-rose-500 font-semibold hover:underline">
                Log in
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
} 