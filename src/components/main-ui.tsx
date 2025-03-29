"use client"

import { useState } from "react"
import { ImageUploader } from "./image-uploader"
import { ModelSelector } from "./model-selector"
import { ConfidenceSlider } from "./confidence-slider"
import { ProcessingIndicator } from "./processing-indicator"
import { ResultViewer } from "./result-viewer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export function MainUI() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState("yolov8n")
  const [confidenceThreshold, setConfidenceThreshold] = useState(50)
  const [isProcessing, setIsProcessing] = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file)
    setPreviewUrl(file ? URL.createObjectURL(file) : null)
    setResultUrl(null)
    setError(null)
  }

  const handleModelChange = (model: string) => {
    setSelectedModel(model)
  }

  const handleConfidenceChange = (value: number) => {
    setConfidenceThreshold(value)
  }

  const resetForm = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setResultUrl(null)
    setError(null)
  }

  const processImage = async () => {
    if (!previewUrl) {
      setError("No image selected")
      return
    }
  
    setIsProcessing(true)
    setError(null)
  
    try {
      const formData = new FormData()
  
      // Add image to FormData
      if (selectedFile) {
        if (selectedFile.size > 10 * 1024 * 1024) {
          throw new Error("File size exceeds 10MB limit")
        }
        formData.append("file", selectedFile)
      } else if (previewUrl) {
        try {
          const response = await fetch(previewUrl)
          if (!response.ok) {
            throw new Error(`Failed to fetch preview image: ${response.status}`)
          }
          const blob = await response.blob()
          formData.append("file", blob, "image.jpg")
        } catch (fetchError: unknown) {
          const errorMessage =
            fetchError instanceof Error ? fetchError.message : "Unknown error occurred while fetching the image"
          throw new Error(`Failed to fetch preview image: ${errorMessage}`)
        }
      }
  
      // Add other parameters
      formData.append("model", selectedModel)
      formData.append("confidence", (confidenceThreshold / 100).toString())
  
      // Make the API request
      const response = await fetch("/api/process", {
        method: "POST",
        body: formData,
      })
  
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(
          `Failed to process image: Server returned ${response.status} ${response.statusText}. Details: ${errorText}`,
        )
      }
  
      const data = await response.json()
  
      if (!data.fileId) {
        throw new Error("Server response missing required fileId")
      }
  
      // ✅ Corrected result URL path
      setResultUrl(`/results/${data.fileId}_result.jpg`)
  
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      console.error("Error processing image:", errorMessage)
      setError(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }
  

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Road Boundary Detection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <ImageUploader previewUrl={previewUrl} onFileChange={handleFileChange} disabled={isProcessing} />

            {previewUrl && !resultUrl && (
              <>
                <ModelSelector
                  selectedModel={selectedModel}
                  onModelChange={handleModelChange}
                  disabled={isProcessing}
                />

                <ConfidenceSlider
                  value={confidenceThreshold}
                  onChange={handleConfidenceChange}
                  disabled={isProcessing}
                />

                <Button onClick={processImage} disabled={isProcessing || !previewUrl} className="w-full">
                  Process Image
                </Button>
              </>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <ProcessingIndicator isProcessing={isProcessing} />

            <ResultViewer resultUrl={resultUrl} onReset={resetForm} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

