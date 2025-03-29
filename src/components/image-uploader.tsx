"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, X } from "lucide-react"
import Image from "next/image"

interface ImageUploaderProps {
  previewUrl: string | null
  onFileChange: (file: File | null) => void
  disabled?: boolean
}

export function ImageUploader({ previewUrl, onFileChange, disabled = false }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith("image/")) {
        onFileChange(file)
      }
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileChange(e.target.files[0])
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveImage = () => {
    onFileChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/*"
        className="hidden"
        disabled={disabled}
      />

      {previewUrl ? (
        <Card className="overflow-hidden">
          <CardContent className="p-0 relative">
            <div className="relative aspect-video w-full">
              <Image src={previewUrl || "/placeholder.svg"} alt="Preview" fill className="object-cover" />
            </div>
            {!disabled && (
              <Button variant="destructive" size="icon" className="absolute top-2 right-2" onClick={handleRemoveImage}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/20"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center gap-4">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Drag and drop an image here</p>
              <p className="text-xs text-muted-foreground mt-1">or click to browse (JPG, PNG, up to 10MB)</p>
            </div>
            <Button variant="secondary" onClick={handleButtonClick} disabled={disabled}>
              Select Image
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

