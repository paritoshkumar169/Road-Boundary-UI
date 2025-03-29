"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, RefreshCw } from "lucide-react"
import Image from "next/image"

interface ResultViewerProps {
  resultUrl: string | null
  onReset: () => void
}

export function ResultViewer({ resultUrl, onReset }: ResultViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (resultUrl) {
      setIsLoading(true)
      setError(null)
    }
  }, [resultUrl])

  const handleImageLoad = () => {
    setIsLoading(false)
  }

  const handleImageError = () => {
    setIsLoading(false)
    setError("Failed to load the processed image")
  }

  const handleDownload = () => {
    if (resultUrl) {
      const link = document.createElement("a")
      link.href = resultUrl
      link.download = "processed-image.jpg"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  if (!resultUrl) return null

  return (
    <Card className="w-full mt-6">
      <CardContent className="p-4">
        <div className="flex flex-col items-center">
          <h3 className="text-lg font-semibold mb-4">Processing Result</h3>

          {isLoading && (
            <div className="flex items-center justify-center h-64 w-full">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {error ? (
            <div className="text-red-500 p-4 text-center">{error}</div>
          ) : (
            <div className="relative w-full aspect-video bg-muted rounded-md overflow-hidden">
              <Image
                src={resultUrl || "/placeholder.svg"}
                alt="Processed image"
                fill
                className="object-contain"
                onLoad={handleImageLoad}
                onError={handleImageError}
                style={{ display: isLoading ? "none" : "block" }}
              />
            </div>
          )}

          <div className="flex gap-4 mt-4">
            <Button onClick={handleDownload} disabled={isLoading || !!error}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" onClick={onReset}>
              Process Another Image
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

