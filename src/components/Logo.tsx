'use client'
// cspell:ignore unistay

import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils/index'

interface LogoProps {
  variant?: 'full' | 'icon' | 'text'
  size?: 'sm' | 'md' | 'lg'
  href?: string
  className?: string
  showAccent?: boolean
}

const sizeClasses = {
  sm: {
    icon: 'w-8 h-8',
    full: 'w-24 h-8',
    text: 'text-lg'
  },
  md: {
    icon: 'w-10 h-10',
    full: 'w-30 h-10',
    text: 'text-xl'
  },
  lg: {
    icon: 'w-12 h-12',
    full: 'w-36 h-12',
    text: 'text-2xl'
  }
}

export default function Logo({ 
  variant = 'full', 
  size = 'md', 
  href = '/', 
  className,
  showAccent = true 
}: LogoProps) {
  const LogoContent = () => {
    switch (variant) {
      case 'icon':
        return (
          <div className={cn('relative', sizeClasses[size].icon)}>
            <Image
              src="/unistay-icon.svg"
              alt="UniStay Logo"
              fill
              className="object-contain"
            />
          </div>
        )
      
      case 'text':
        return (
          <span className={cn(
            'font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent dark:from-blue-400 dark:to-blue-500',
            sizeClasses[size].text
          )}>
            UniStay
          </span>
        )
      
      case 'full':
      default:
        return (
          <div className="flex items-center space-x-3">
            <div className={cn('relative', sizeClasses[size].icon)}>
              <Image
                src="/unistay-icon.svg"
                alt="UniStay Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className={cn(
              'font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent dark:from-blue-400 dark:to-blue-500',
              sizeClasses[size].text
            )}>
              UniStay
            </span>
          </div>
        )
    }
  }

  if (href) {
    return (
      <Link href={href} className={cn('group inline-flex items-center', className)}>
        <LogoContent />
      </Link>
    )
  }

  return (
    <div className={cn('inline-flex items-center', className)}>
      <LogoContent />
    </div>
  )
}

// Export individual logo variants for convenience
export const LogoIcon = (props: Omit<LogoProps, 'variant'>) => (
  <Logo {...props} variant="icon" />
)

export const LogoText = (props: Omit<LogoProps, 'variant'>) => (
  <Logo {...props} variant="text" />
)

export const LogoFull = (props: Omit<LogoProps, 'variant'>) => (
  <Logo {...props} variant="full" />
)