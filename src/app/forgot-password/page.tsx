'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validations'
import { authService } from '@/services/authService'
import { ApiRequestError } from '@/lib/api'
import { FormWrapper } from '@/components/ui/form-wrapper'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingButton } from '@/components/ui/spinner'
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema)
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await authService.forgotPassword({ email: data.email })
      setSubmitSuccess(true)
    } catch (error: unknown) {
      let errorMessage = 'Failed to send reset email. Please try again.'
      
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
          title="Check Your Email"
          description="We've sent you a password reset link"
        >
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            
            <div className="space-y-3">
              <p className="text-gray-600">
                If an account with that email exists, we&apos;ve sent you a password reset link.
              </p>
              <p className="text-sm text-gray-500">
                Please check your email and follow the instructions to reset your password.
              </p>
            </div>

            <div className="pt-4">
              <Link 
                href="/login"
                className="inline-flex items-center text-rose-500 hover:underline font-medium"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Link>
            </div>
          </div>
        </FormWrapper>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <FormWrapper
        title="Forgot Password?"
        description="Enter your email address and we&apos;ll send you a link to reset your password"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address"
              {...register('email')}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <LoadingButton
            type="submit"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Sending Reset Link...' : 'Send Reset Link'}
          </LoadingButton>

          <div className="text-center space-y-2">
                          <Link 
                href="/login"
                className="inline-flex items-center text-rose-500 hover:underline font-medium"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Link>
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-rose-500 hover:underline font-medium">
                  Create one
                </Link>
              </p>
          </div>
        </form>
      </FormWrapper>
    </div>
  )
} 