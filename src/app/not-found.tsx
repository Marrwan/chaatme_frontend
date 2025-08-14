'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, ArrowLeft, Search, AlertTriangle } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 mb-4">
              <AlertTriangle className="h-8 w-8 text-purple-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">404 - Page Not Found</CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Sorry, the page you're looking for doesn't exist.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-gray-500">
              The page you requested could not be found. It might have been moved, deleted, or you entered the wrong URL.
            </p>
            
            <div className="space-y-3">
              <Link href="/" className="block">
                <Button className="w-full">
                  <Home className="mr-2 h-4 w-4" />
                  Go to Home
                </Button>
              </Link>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500 mb-2">Looking for something specific?</p>
              <div className="space-y-2">
                <Link href="/dashboard" className="block">
                  <Button variant="ghost" size="sm" className="w-full">
                    <Search className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>

              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}