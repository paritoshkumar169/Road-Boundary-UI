"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Upload, ImageIcon, Video, Download, Zap, Settings2, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import Image from "next/image"
import { ModelInfo } from "@/app/model-Info"
import { ProcessingIndicator } from "@/components/processing-indicator"
import { AppHeader } from "@/components/app-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

export default function RoadBoundaryDetector() {
  const [selectedModel, setSelectedModel] = useState("daytime")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFileType, setSelectedFileType] = useState<"image" | "video" | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [confidenceThreshold, setConfidenceThreshold] = useState(50)
  const [displayMode, setDisplayMode] = useState("draw")
  const [isProcessing, setIsProcessing] = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("upload")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Sample images
  const sampleImages = [
    "/samples/sample1.jpg",
    "/samples/sample2.jpg",
    "/samples/sample3.jpg",
    "/samples/sample4.jpg",
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const fileType = file.type.startsWith("image/") ? "image" : "video"
    setSelectedFileType(fileType)
    setSelectedFile(file)

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setResultUrl(null)
    setError(null)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (!file) return

    const fileType = file.type.startsWith("image/") ? "image" : "video"
    setSelectedFileType(fileType)
    setSelectedFile(file)

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setResultUrl(null)
    setError(null)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleSampleImageClick = (imagePath: string) => {
    setSelectedFileType("image")
    setPreviewUrl(imagePath)
    setSelectedFile(null)
    setResultUrl(null)
    setError(null)
  }

  const processImage = async () => {
    if (!previewUrl) {
      setError("No image or video selected")
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const formData = new FormData()

      if (selectedFile) {
        //file size less than 10mb
        if (selectedFile.size > 10 * 1024 * 1024) {
          throw new Error("File size exceeds 10MB limit")
        }
        formData.append("file", selectedFile)
        console.log(`Using selected file: ${selectedFile.name}, type: ${selectedFile.type}, size: ${selectedFile.size}`)
      } else if (previewUrl) {
        try {
          console.log(`Fetching image from URL: ${previewUrl}`)
          const response = await fetch(previewUrl)
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`)
          }
          const blob = await response.blob()
          //filename extenstions
          let filename = "image.jpg"
          if (blob.type === "image/png") {
            filename = "image.png"
          } else if (blob.type === "image/gif") {
            filename = "image.gif"
          } else if (blob.type === "image/webp") {
            filename = "image.webp"
          } else if (blob.type.includes("video")) {
            filename = "video.mp4"
          }
          formData.append("file", blob, filename)
          console.log(`Fetched image as blob, type: ${blob.type}, size: ${blob.size}`)
        } catch (fetchError: unknown) {
          const errorMessage =
            fetchError instanceof Error ? fetchError.message : "Unknown error occurred while fetching the image"
          throw new Error(`Failed to fetch image: ${errorMessage}`)
        }
      }

      formData.append("model", selectedModel)
      formData.append("confidence", (confidenceThreshold / 100).toString())
      formData.append("displayMode", displayMode)

      console.log(
        `Processing with model: ${selectedModel}, confidence: ${
          confidenceThreshold / 100
        }, displayMode: ${displayMode}`,
      )

      //API request
      console.log("Sending request to /api")
      const response = await fetch("/api", {
        method: "POST",
        body: formData,
      })

      // Handle response
      let responseBody
      try {
        responseBody = await response.clone().json()
      } catch (jsonError) {
        responseBody = await response.text()
      }

      if (!response.ok) {
        const errorText = responseBody.error || `Server returned ${response.status} ${response.statusText}`
        throw new Error(`Failed to process image: ${errorText}`)
      }

      console.log("Received response:", responseBody)

      if (!responseBody.success || !responseBody.fileId) {
        throw new Error("Server response missing required data")
      }

      //timestamp avoid caching
      setResultUrl(`/results/${responseBody.fileId}_result.jpg?t=${Date.now()}`)

      console.log(`Result URL set to: /api/result/${responseBody.fileId}/result`)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      console.error("Error processing image:", errorMessage)
      setError(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadResult = () => {
    if (!resultUrl) return

    fetch(resultUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.style.display = "none"
        a.href = url
        // Create a filename with timestamp
        const filename = `road_boundary_result_${Date.now()}.jpg`
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      })
      .catch((error) => {
        console.error("Error downloading the file:", error)
        setError("Failed to download the result")
      })
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <main className="flex-1 container mx-auto py-8 px-4 md:px-6 lg:px-8">
        <div className="space-y-4 mb-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Road Boundary Detection and Object Detection
            </h1>
            <p className="text-muted-foreground max-w-3xl">
            Road Boundary and Object Detection models trained on self-annotated images, specifically for both daytime and nighttime conditions using the YOLO Segmentation Model. Test its accuracy with your own images or explore our sample images.            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
            <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  <span>Upload</span>
                </TabsTrigger>
                <TabsTrigger value="samples" className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  <span>Samples</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="mt-0">
                <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
                  <CardContent className="p-0">
                    <div
                      className={`flex flex-col items-center justify-center p-8 text-center transition-all rounded-md ${
                        isDragging ? "bg-purple-100 dark:bg-purple-900/20" : ""
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                    >
                      <div className="mb-4 rounded-full bg-purple-100 dark:bg-purple-900/20 p-4">
                        <Upload className="h-8 w-8 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">Drag & drop or click to upload</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Supports JPG, PNG, GIF and MP4 files up to 10MB
                      </p>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            fileInputRef.current?.click()
                            fileInputRef.current?.setAttribute("accept", "image/*")
                          }}
                          className="flex items-center gap-2"
                        >
                          <ImageIcon className="h-4 w-4" />
                          Image
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            fileInputRef.current?.click()
                            fileInputRef.current?.setAttribute("accept", "video/*")
                          }}
                          className="flex items-center gap-2"
                        >
                          <Video className="h-4 w-4" />
                          Video
                        </Button>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="samples" className="mt-0">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Sample Images</CardTitle>
                    <CardDescription>Try our pre-selected test images</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {sampleImages.map((image, index) => (
                        <div
                          key={index}
                          className="relative group cursor-pointer overflow-hidden rounded-lg border transition-all hover:shadow-md"
                          onClick={() => handleSampleImageClick(image)}
                        >
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
                          <div className="absolute bottom-2 left-2 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            Sample {index + 1}
                          </div>
                          <Image
                            src={image || "/placeholder.svg"}
                            alt={`Sample ${index + 1}`}
                            width={150}
                            height={150}
                            className="object-cover aspect-square transition-transform group-hover:scale-105"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-purple-600" />
                  <span>Detection Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Model Selection</h4>
                    <ModelInfo selectedModel={selectedModel} setSelectedModel={setSelectedModel} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium">Confidence Threshold</h4>
                      <Badge variant="outline" className="font-mono">
                        {confidenceThreshold}%
                      </Badge>
                    </div>
                    <Slider
                      value={[confidenceThreshold]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(value) => setConfidenceThreshold(value[0])}
                      className="py-1"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Low precision</span>
                      <span>High precision</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:pointer-events-none disabled:shadow-none"
                  disabled={!previewUrl || isProcessing}
                  onClick={processImage}
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Detect Boundaries
                    </span>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-6">
            <Card className="overflow-hidden border bg-card text-card-foreground shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">{resultUrl ? "Detection Result" : "Preview"}</CardTitle>
                {resultUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadResult}
                    className="flex items-center gap-2 text-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-0 aspect-video relative bg-black/5 dark:bg-white/5">
                {resultUrl ? (
                  selectedFileType === "video" ? (
                    <video src={resultUrl} controls className="w-full h-full object-contain" />
                  ) : (
                    <div className="relative w-full h-full">
                      <Image src={resultUrl || "/placeholder.svg"} alt="Result" fill className="object-contain" />
                      <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded-full text-xs font-medium">
                        Confidence: {confidenceThreshold}%
                      </div>
                    </div>
                  )
                ) : previewUrl ? (
                  selectedFileType === "video" ? (
                    <video src={previewUrl} controls className="w-full h-full object-contain" />
                  ) : (
                    <Image src={previewUrl || "/placeholder.svg"} alt="Preview" fill className="object-contain" />
                  )
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center p-8">
                      <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-muted-foreground">Upload an image or select a sample to begin</p>
                    </div>
                  </div>
                )}

                {isProcessing && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <ProcessingIndicator isProcessing={isProcessing} />
                  </div>
                )}
              </CardContent>
              {resultUrl && (
                <CardFooter className="pt-4 pb-2">
                  <Button
                    onClick={downloadResult}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Result
                  </Button>
                </CardFooter>
              )}
            </Card>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {resultUrl && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Analysis Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Model Used</p>
                      <p className="text-sm text-muted-foreground capitalize">{selectedModel}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Confidence Threshold</p>
                      <p className="text-sm text-muted-foreground">{confidenceThreshold}%</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">File Type</p>
                      <p className="text-sm text-muted-foreground capitalize">{selectedFileType || "Unknown"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Processing Time</p>
                      <p className="text-sm text-muted-foreground">~2.3 seconds</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

