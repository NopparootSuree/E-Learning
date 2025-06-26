"use client"

import { GraduationCap } from "lucide-react"

interface PageLoadingProps {
  message?: string
  size?: "sm" | "md" | "lg"
}

export function PageLoading({ 
  message = "กำลังโหลดข้อมูล...", 
  size = "md" 
}: PageLoadingProps) {
  const iconSize = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-8 w-8" : "h-6 w-6"
  const containerSize = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-16 w-16" : "h-12 w-12"
  const minHeight = size === "sm" ? "min-h-[20vh]" : size === "lg" ? "min-h-[80vh]" : "min-h-[40vh]"
  
  return (
    <div className={`flex flex-col items-center justify-center ${minHeight} space-y-4`}>
      {/* Spinning Logo */}
      <div className="relative">
        <div className={`flex ${containerSize} items-center justify-center rounded-full bg-primary/10 animate-pulse`}>
          <GraduationCap className={`${iconSize} text-primary animate-bounce`} />
        </div>
        <div className={`absolute inset-0 border-4 border-primary/20 border-t-primary rounded-full animate-spin`}></div>
      </div>
      
      {/* Loading Text */}
      <div className="text-center space-y-1">
        <p className={`${size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : "text-base"} text-gray-600 font-medium`}>
          {message}
        </p>
        {size !== "sm" && (
          <p className="text-xs text-gray-400">กรุณารอสักครู่</p>
        )}
      </div>
      
      {/* Progress Dots */}
      {size !== "sm" && (
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      )}
    </div>
  )
}