"use client"

import { GraduationCap } from "lucide-react"

export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      {/* Spinning Logo */}
      <div className="relative">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 animate-pulse">
          <GraduationCap className="h-8 w-8 text-primary animate-bounce" />
        </div>
        <div className="absolute inset-0 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
      
      {/* Loading Text */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">กำลังโหลด...</h3>
        <p className="text-sm text-gray-500">กรุณารอสักครู่</p>
      </div>
      
      {/* Progress Dots */}
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  )
}