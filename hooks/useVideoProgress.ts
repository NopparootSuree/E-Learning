import { useState, useEffect, useCallback } from "react"

interface VideoProgressHook {
  progress: number
  currentTime: number
  isCompleted: boolean
  updateProgress: (currentTime: number, duration: number) => void
  markCompleted: () => void
}

export function useVideoProgress(courseId: string): VideoProgressHook {
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)

  // Load initial progress
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const response = await fetch(`/api/courses/${courseId}/progress`)
        if (response.ok) {
          const data = await response.json()
          setProgress(data.contentProgress || 0)
          setCurrentTime(data.currentTime || 0)
          setIsCompleted(data.hasCompletedContent || false)
        }
      } catch (error) {
        console.error("Error loading progress:", error)
      }
    }

    if (courseId) {
      loadProgress()
    }
  }, [courseId])

  const updateProgress = useCallback(async (currentTime: number, duration: number) => {
    if (duration > 0) {
      const progressPercent = Math.min((currentTime / duration) * 100, 100)
      setProgress(progressPercent)
      setCurrentTime(currentTime)

      // Save progress to server
      try {
        await fetch(`/api/courses/${courseId}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update_progress",
            currentTime: currentTime,
            progress: progressPercent,
            duration: duration,
            isCompleted: progressPercent >= 95
          })
        })
      } catch (error) {
        console.error("Error saving progress:", error)
      }
    }
  }, [courseId])

  const markCompleted = useCallback(async () => {
    setIsCompleted(true)
    setProgress(100)

    try {
      await fetch(`/api/courses/${courseId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete_content",
          currentTime: currentTime,
          progress: 100,
          isCompleted: true
        })
      })
    } catch (error) {
      console.error("Error marking completion:", error)
    }
  }, [courseId, currentTime])

  return {
    progress,
    currentTime,
    isCompleted,
    updateProgress,
    markCompleted
  }
}