'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validations'
import { authService } from '@/services/authService'
import { ApiRequestError } from '@/lib/api'
import { FormWrapper } from '@/components/ui/form-wrapper'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingButton } from '@/components/ui/spinner'
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema)
  })

  const password = watch('password', '')

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: '' }
    
    let strength = 0
    if (password.length >= 8) strength += 1
    if (/[A-Z]/.test(password)) strength += 1
    if (/[a-z]/.test(password)) strength += 1
    if (/[0-9]/.test(password)) strength += 1
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1

    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500']
    
    return {
      strength,
      label: labels[strength - 1] || '',
      color: colors[strength - 1] || 'bg-gray-300'
    }
  }

  const passwordStrength = getPasswordStrength(password)

  // Check if token is present
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <FormWrapper
          title="Invalid Reset Link"
          description="The password reset link is missing or invalid"
        >
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <AlertCircle className="h-16 w-16 text-red-500" />
            </div>
            
            <div className="space-y-3">
              <p className="text-gray-600">
                This password reset link is invalid or has expired.
              </p>
              <p className="text-sm text-gray-500">
                Please request a new password reset link.
              </p>
            </div>

            <div className="space-y-2">
              <Link href="/forgot-password">
                <LoadingButton className="w-full">
                  Request New Reset Link
                </LoadingButton>
              </Link>
                              <Link 
                  href="/login"
                  className="block text-center text-rose-500 hover:underline font-medium"
                >
                  Back to Sign In
                </Link>
            </div>
          </div>
        </FormWrapper>
      </div>
    )
  }

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await authService.resetPassword({
        token,
        newPassword: data.password
      })
      
      setSubmitSuccess(true)

      // Redirect to login after success
      setTimeout(() => {
        router.push('/login')
      }, 3000)

    } catch (error: unknown) {
      let errorMessage = 'Failed to reset password. Please try again.'
      
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

  if (submitSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <FormWrapper
          title="Password Reset Successful"
          description="Your password has been updated"
        >
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            
            <div className="space-y-3">
              <p className="text-gray-600">
                Your password has been successfully reset.
              </p>
              <p className="text-sm text-gray-500">
                You will be redirected to the sign in page shortly.
              </p>
            </div>

            <Link href="/login">
              <LoadingButton className="w-full">
                Continue to Sign In
              </LoadingButton>
            </Link>
          </div>
        </FormWrapper>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <FormWrapper
        title="Reset Your Password"
        description="Enter your new password below"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {/* New Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your new password"
                {...register('password')}
                className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {password && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">{passwordStrength.label}</span>
                </div>
              </div>
            )}

            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your new password"
                {...register('confirmPassword')}
                className={errors.confirmPassword ? 'border-red-500 pr-10' : 'pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <LoadingButton
            type="submit"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
          </LoadingButton>

                      <div className="text-center">
              <Link href="/login" className="text-rose-500 hover:underline font-medium">
                Back to Sign In
              </Link>
            </div>
        </form>
      </FormWrapper>
    </div>
  )
} 