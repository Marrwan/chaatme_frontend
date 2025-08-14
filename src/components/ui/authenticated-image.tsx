'use client'

import { useState, useEffect } from 'react'

interface AuthenticatedImageProps {
  src: string
  alt: string
  className?: string
  onClick?: () => void
  fallback?: string
}

export const AuthenticatedImage: React.FC<AuthenticatedImageProps> = ({
  src,
  alt,
  className,
  onClick,
  fallback = '/default-image.png'
}) => {
  const [imageSrc, setImageSrc] = useState<string>(fallback)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const loadImage = async () => {
      try {
        setIsLoading(true)
        setError(false)

        // Check if it's a local file URL that needs authentication
        if (src.startsWith('/api/chat/')) {
          const token = localStorage.getItem('chaatme_token')
          if (!token) {
            setError(true)
            setImageSrc(fallback)
            return
          }

          // Get the API base URL and remove /api suffix if present
          const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
          const backendUrl = apiBaseUrl.replace('/api', '')
          
          const response = await fetch(`${backendUrl}${src}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          if (!response.ok) {
            throw new Error(`Failed to load image: ${response.status} ${response.statusText}`)
          }

          const blob = await response.blob()
          const blobUrl = URL.createObjectURL(blob)
          setImageSrc(blobUrl)
        } else {
          // For external URLs, use directly
          setImageSrc(src)
        }
      } catch (error) {
        console.error('Error loading image:', error)
        setError(true)
        setImageSrc(fallback)
      } finally {
        setIsLoading(false)
      }
    }

    if (src) {
      loadImage()
    }

    // Cleanup blob URL on unmount
    return () => {
      if (imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc)
      }
    }
  }, [src, fallback])

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      <img
        src={imageSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        onClick={onClick}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setError(true)
          setImageSrc(fallback)
          setIsLoading(false)
        }}
      />
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded text-gray-500 text-sm">
          Failed to load
        </div>
      )}
    </div>
  )
} 