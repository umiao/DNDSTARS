import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`glass rounded-2xl p-5 transition-all hover:border-white/20 ${className}`}>
      {children}
    </div>
  )
}
