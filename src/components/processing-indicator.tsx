"use client"

import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"

interface ProcessingIndicatorProps {
  isProcessing: boolean
}

export function ProcessingIndicator({ isProcessing }: ProcessingIndicatorProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!isProcessing) {
      setProgress(0)
      return
    }

    // Reset progress when processing starts
    setProgress(0)

    // Simulate progress over time
    // This is just an estimation since we don't have real-time progress data
    const interval = setInterval(() => {
      setProgress((prev) => {
        // Slow down progress as it gets higher to simulate longer processing time
        const increment = prev < 30 ? 5 : prev < 60 ? 3 : prev < 85 ? 1 : 0.5
        const newProgress = Math.min(prev + increment, 95) // Never reach 100% automatically
        return newProgress
      })
    }, 500)

    return () => clearInterval(interval)
  }, [isProcessing])

  // When processing completes, jump to 100%
  useEffect(() => {
    if (!isProcessing && progress > 0) {
      setProgress(100)

      // Reset after animation completes
      const timeout = setTimeout(() => {
        setProgress(0)
      }, 1000)

      return () => clearTimeout(timeout)
    }
  }, [isProcessing, progress])

  if (!isProcessing && progress === 0) return null

  return (
    <div className="w-full space-y-2">
      <Progress value={progress} className="h-2" />
      <p className="text-sm text-center text-muted-foreground">
        {progress < 100 ? `Processing... ${Math.round(progress)}%` : "Processing complete!"}
      </p>
    </div>
  )
}

