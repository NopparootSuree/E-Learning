"use client"

import React, { useRef, useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, Volume2, VolumeX, AlertTriangle, Eye, EyeOff } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface VideoPlayerProps {
  src: string
  courseId: string
  onComplete?: () => void
  className?: string
}

export default function VideoPlayer({ src, courseId, onComplete, className = "" }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isRestoringPosition, setIsRestoringPosition] = useState(false)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  // Activity tracking
  const [lastActivityTime, setLastActivityTime] = useState(Date.now())
  const [isTabActive, setIsTabActive] = useState(true)
  const [isPausedBySystem, setIsPausedBySystem] = useState(false)
  const [warningMessage, setWarningMessage] = useState("")
  
  const inactivityTimeoutRef = useRef<NodeJS.Timeout>()
  const saveProgressIntervalRef = useRef<NodeJS.Timeout>()

  const loadProgress = useCallback(async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/progress`)
      if (response.ok) {
        const data = await response.json()
        
        console.log("🔄 Loading progress data:", data)
        
        // Set initial states
        setIsCompleted(data.hasCompletedContent)
        
        const savedTime = data.currentTime || 0
        const savedProgress = data.contentProgress || 0
        
        console.log("📍 Saved position - Time:", savedTime, "Progress:", savedProgress)
        
        // Always try to set saved position
        const trySetCurrentTime = () => {
          if (videoRef.current) {
            const readyState = videoRef.current.readyState
            const duration = videoRef.current.duration
            
            console.log("🎬 Video state - ReadyState:", readyState, "Duration:", duration)
            
            // Wait for at least metadata (readyState >= 1)
            if (readyState >= 1 && duration > 0) {
              // Set video position - allow seeking to any saved position
              if (savedTime > 0) {
                setIsRestoringPosition(true)
                
                const timeToSet = Math.min(savedTime, duration)
                
                console.log("⏯️ Setting video position to:", timeToSet)
                
                // Set position with retry mechanism
                let retryCount = 0
                const setPosition = () => {
                  if (videoRef.current && retryCount < 5) {
                    videoRef.current.currentTime = timeToSet
                    retryCount++
                    
                    // Verify position was set
                    setTimeout(() => {
                      if (videoRef.current && Math.abs(videoRef.current.currentTime - timeToSet) > 1) {
                        console.log("⚠️ Position not set correctly, retrying...", videoRef.current.currentTime, "vs", timeToSet)
                        setPosition()
                      } else {
                        console.log("✅ Video position set successfully:", videoRef.current?.currentTime)
                        setIsRestoringPosition(false)
                      }
                    }, 100)
                  }
                }
                
                // Try setting position
                setPosition()
                
                // Also set component state
                setCurrentTime(timeToSet)
              }
              
              // Set saved progress
              if (savedProgress > 0) {
                setProgress(savedProgress)
              } else if (savedTime > 0) {
                const calculatedProgress = (savedTime / duration) * 100
                setProgress(calculatedProgress)
              }
              
              setDuration(duration)
              
            } else {
              // Retry when video loads more data
              console.log("⏳ Video not ready, retrying in 200ms...")
              setTimeout(trySetCurrentTime, 200)
            }
          }
        }
        
        if (videoRef.current) {
          // Try immediately if video is ready
          if (videoRef.current.readyState >= 1) {
            trySetCurrentTime()
          } else {
            // Wait for video events
            console.log("⏳ Waiting for video to load...")
            const handleVideoReady = () => {
              console.log("🎬 Video ready event fired")
              trySetCurrentTime()
            }
            
            videoRef.current.addEventListener('loadedmetadata', handleVideoReady, { once: true })
            videoRef.current.addEventListener('loadeddata', handleVideoReady, { once: true })
            videoRef.current.addEventListener('canplay', handleVideoReady, { once: true })
          }
        }
      }
    } catch (error) {
      console.error("❌ Error loading progress:", error)
    }
  }, [courseId])

  const saveProgress = useCallback(async () => {
    if (!videoRef.current || duration === 0) return

    try {
      // Get real-time values from video element
      const realCurrentTime = videoRef.current.currentTime
      const realDuration = videoRef.current.duration || duration
      const calculatedProgress = realDuration > 0 ? (realCurrentTime / realDuration) * 100 : 0
      
      // Use the highest progress value (prevents going backwards)
      const realProgress = Math.max(calculatedProgress, progress)
      
      
      const response = await fetch(`/api/courses/${courseId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_progress",
          currentTime: realCurrentTime,
          progress: realProgress,
          duration: Math.floor(realDuration),
          isCompleted: realProgress >= 95
        })
      })
      
      if (!response.ok) {
        console.error("Failed to save progress:", response.statusText)
      }
    } catch (error) {
      console.error("Error saving progress:", error)
    }
  }, [courseId, duration, progress])

  // Load saved progress on mount
  useEffect(() => {
    loadProgress()
  }, [loadProgress])

  // Save progress before page unload (allow refresh but save position)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isCompleted && (isPlaying || progress > 0)) {
        // Force save current progress with sendBeacon for reliability
        if (videoRef.current && duration > 0) {
          const realCurrentTime = videoRef.current.currentTime
          const realDuration = videoRef.current.duration || duration
          const realProgress = realDuration > 0 ? (realCurrentTime / realDuration) * 100 : progress
          
          const progressData = {
            action: "update_progress",
            currentTime: realCurrentTime,
            progress: realProgress,
            duration: Math.floor(realDuration),
            isCompleted: realProgress >= 95
          }
          
          // Use sendBeacon - works during page unload
          const blob = new Blob([JSON.stringify(progressData)], { type: 'application/json' })
          navigator.sendBeacon(`/api/courses/${courseId}/progress`, blob)
          
        }
        
        // Show info message (optional - user can still leave)
        return "ความคืบหน้าจะถูกบันทึก เมื่อกลับมาจะเล่นต่อจากจุดที่หยุดไว้"
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isCompleted, isPlaying, progress, courseId, duration])

  // Optional: Show info when trying to refresh (but allow it)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isCompleted && (isPlaying || progress > 0)) {
        // F5
        if (e.key === 'F5') {
          // Force save progress before refresh with sync request
          if (videoRef.current && duration > 0) {
            const realCurrentTime = videoRef.current.currentTime
            const realDuration = videoRef.current.duration || duration
            const realProgress = realDuration > 0 ? (realCurrentTime / realDuration) * 100 : progress
            
            const progressData = {
              action: "update_progress",
              currentTime: realCurrentTime,
              progress: realProgress,
              duration: Math.floor(realDuration),
              isCompleted: realProgress >= 95
            }
            
            // Use sendBeacon for reliable saving during page unload
            const blob = new Blob([JSON.stringify(progressData)], { type: 'application/json' })
            navigator.sendBeacon(`/api/courses/${courseId}/progress`, blob)
            
          }
          return true // Allow refresh
        }
        
        // Ctrl+R, Ctrl+F5
        if (e.ctrlKey && (e.key === 'r' || e.key === 'R' || e.key === 'F5')) {
          // Force save progress before refresh with sync request
          if (videoRef.current && duration > 0) {
            const realCurrentTime = videoRef.current.currentTime
            const realDuration = videoRef.current.duration || duration
            const realProgress = realDuration > 0 ? (realCurrentTime / realDuration) * 100 : progress
            
            const progressData = {
              action: "update_progress",
              currentTime: realCurrentTime,
              progress: realProgress,
              duration: Math.floor(realDuration),
              isCompleted: realProgress >= 95
            }
            
            // Use sendBeacon for reliable saving during page unload
            const blob = new Blob([JSON.stringify(progressData)], { type: 'application/json' })
            navigator.sendBeacon(`/api/courses/${courseId}/progress`, blob)
            
          }
          return true // Allow refresh
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isCompleted, isPlaying, progress, courseId, duration])

  // Activity detection
  useEffect(() => {
    const handleActivity = () => {
      setLastActivityTime(Date.now())
      if (warningMessage && isTabActive) {
        setWarningMessage("")
        setIsPausedBySystem(false)
      }
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
    }
  }, [warningMessage, isTabActive])

  const pauseVideo = useCallback((reason?: string) => {
    if (videoRef.current && isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
      if (reason) {
        setWarningMessage(reason)
      }
      saveProgress()
    }
  }, [isPlaying, saveProgress])

  // Tab visibility detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isActive = !document.hidden
      setIsTabActive(isActive)
      
      if (!isActive && isPlaying) {
        pauseVideo("เนื่องจากคุณออกจากหน้าต่างเบราว์เซอร์")
        setIsPausedBySystem(true)
      }
    }

    const handleWindowBlur = () => {
      setIsTabActive(false)
      if (isPlaying) {
        pauseVideo("เนื่องจากคุณออกจากหน้าต่างเบราว์เซอร์")
        setIsPausedBySystem(true)
      }
    }

    const handleWindowFocus = () => {
      setIsTabActive(true)
      if (isPausedBySystem) {
        setWarningMessage("")
        setIsPausedBySystem(false)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleWindowBlur)
    window.addEventListener('focus', handleWindowFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleWindowBlur)
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [isPlaying, isPausedBySystem, pauseVideo])

  // Inactivity timer
  useEffect(() => {
    if (isPlaying && isTabActive) {
      inactivityTimeoutRef.current = setTimeout(() => {
        const timeSinceActivity = Date.now() - lastActivityTime
        if (timeSinceActivity >= 5 * 60 * 1000) { // 5 minutes
          pauseVideo("เนื่องจากไม่มีการโต้ตอบเป็นเวลา 5 นาที")
          setIsPausedBySystem(true)
        }
      }, 5 * 60 * 1000)
    }

    return () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current)
      }
    }
  }, [isPlaying, lastActivityTime, isTabActive, pauseVideo])

  // Auto-save progress every 3 seconds for better accuracy
  useEffect(() => {
    if (isPlaying && duration > 0) {
      saveProgressIntervalRef.current = setInterval(() => {
        saveProgress()
      }, 3000) // Save every 3 seconds for better resume accuracy
    } else {
      if (saveProgressIntervalRef.current) {
        clearInterval(saveProgressIntervalRef.current)
      }
    }

    return () => {
      if (saveProgressIntervalRef.current) {
        clearInterval(saveProgressIntervalRef.current)
      }
    }
  }, [isPlaying, duration, saveProgress])

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current && !isRestoringPosition) {
      const current = videoRef.current.currentTime
      const total = videoRef.current.duration || 0
      
      setCurrentTime(current)
      if (total > 0) setDuration(total)
      
      if (total > 0) {
        const progressPercent = (current / total) * 100
        
        // Only update progress if it's moving forward or is greater than current
        setProgress(prevProgress => {
          const newProgress = Math.max(progressPercent, prevProgress)
          return newProgress
        })
        
        
        // Save progress every 10% or every 30 seconds
        if (Math.floor(progressPercent) % 10 === 0 && Math.floor(progressPercent) !== Math.floor((current - 1) / total * 100)) {
          saveProgress()
        }
        
        // Check completion (95% watched)
        if (progressPercent >= 95 && !isCompleted) {
          setIsCompleted(true)
          onComplete?.()
          
          // Save completion
          fetch(`/api/courses/${courseId}/progress`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "complete_content",
              currentTime: current, // Keep decimal precision
              progress: 100,
              duration: Math.floor(total),
              isCompleted: true
            })
          }).catch(console.error)
        }
      }
    }
  }, [courseId, isCompleted, onComplete, isRestoringPosition, saveProgress])

  const handlePlay = () => {
    if (!isTabActive) {
      setWarningMessage("กรุณากลับมาที่หน้าต่างนี้เพื่อเล่นวิดีโอ")
      return
    }
    
    if (videoRef.current) {
      videoRef.current.play()
      setIsPlaying(true)
      setIsPausedBySystem(false)
      setWarningMessage("")
      setLastActivityTime(Date.now())
    }
  }

  const handlePause = () => {
    pauseVideo()
    // Save progress when paused
    saveProgress()
  }

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      setVolume(newVolume)
      setIsMuted(newVolume === 0)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted
      videoRef.current.muted = newMuted
      setIsMuted(newMuted)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Prevent seeking/skipping - must watch sequentially
  const handleSeeking = () => {
    if (videoRef.current && !isCompleted) {
      // Strict rule: can only seek backwards, never forward
      const seekTime = videoRef.current.currentTime
      const maxAllowedTime = currentTime + 0.5 // Very small tolerance
      
      if (seekTime > maxAllowedTime) {
        videoRef.current.currentTime = currentTime
        setWarningMessage("ห้ามข้ามไปข้างหน้า! คุณต้องดูวิดีโอตามลำดับจึงจะผ่านบทเรียน")
        
        // Auto pause when trying to skip
        if (isPlaying) {
          videoRef.current.pause()
          setIsPlaying(false)
        }
      }
    }
  }

  // Disable right-click context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-0">
        {/* Warning Alert */}
        {warningMessage && (
          <Alert className="m-4 border-yellow-500 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              {warningMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Video Container */}
        <div className="relative bg-black">
          <video
            ref={videoRef}
            src={src}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={() => {}}
            onLoadedData={() => {}}
            onSeeking={handleSeeking}
            onSeeked={() => {}}
            onContextMenu={handleContextMenu}
            className="w-full aspect-video"
            controlsList="nodownload nofullscreen noremoteplayback"
            disablePictureInPicture
            onCopy={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
            style={{ pointerEvents: isCompleted ? 'auto' : 'none' }}
            preload="metadata"
          />
          
          {/* Custom Controls Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            {/* Progress Bar */}
            <div className="mb-4">
              <Progress value={progress} className="h-2 bg-white/20" />
              <div className="flex justify-between text-white text-sm mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {/* Play/Pause Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={isPlaying ? handlePause : handlePlay}
                  className="text-white hover:bg-white/20"
                  disabled={!isTabActive && !isPlaying}
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>

                {/* Volume Control */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="text-white hover:bg-white/20"
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-20 accent-white"
                  />
                </div>
              </div>

              {/* Status Indicators */}
              <div className="flex items-center space-x-2">
                {!isTabActive && (
                  <Badge variant="destructive" className="text-xs">
                    <EyeOff className="h-3 w-3 mr-1" />
                    ออกจากหน้าต่าง
                  </Badge>
                )}
                
                {isCompleted && (
                  <Badge variant="default" className="bg-green-600 text-xs">
                    เสร็จสิ้น
                  </Badge>
                )}

                <Badge variant="outline" className="text-white border-white text-xs">
                  {progress.toFixed(2)}%
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Video Info and Warning */}
        <div className="p-4 bg-gray-50">
          {!isCompleted && progress > 0 && (
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center text-yellow-800 text-sm">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <span>
                  <strong>ข้อปฏิบัติ:</strong> คุณต้องดูวิดีโอให้จบ 95% จึงจะผ่านบทเรียน 
                  {progress > 0 && ` (ปัจจุบันดูแล้ว ${progress.toFixed(2)}%)`}
                </span>
              </div>
              <div className="mt-1 text-yellow-700 text-xs">
                • สามารถ refresh หน้าได้ ความคืบหน้าจะถูกบันทึกอัตโนมัติ<br/>
                • เมื่อกลับมาจะเล่นต่อจากจุดที่หยุดไว้ ไม่ต้องดูใหม่<br/>
                • ห้ามข้ามไปข้างหน้า ต้องดูตามลำดับจนครบ 95%
              </div>
            </div>
          )}
          
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>
              {isCompleted ? "✅ วิดีโอเสร็จสิ้นแล้ว" : "กรุณาดูวิดีโอให้ครบ 95% เพื่อผ่านบทเรียน"}
            </span>
            <span className="flex items-center">
              <Eye className="h-4 w-4 mr-1" />
              ต้องดูครบทั้งหมด
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}