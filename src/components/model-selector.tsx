"use client"

import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent } from "@/components/ui/card"

interface ModelSelectorProps {
  selectedModel: string
  onModelChange: (model: string) => void
  disabled?: boolean
}

export function ModelSelector({ selectedModel, onModelChange, disabled = false }: ModelSelectorProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-2">
          <Label htmlFor="model-selection" className="text-base font-medium">
            Detection Model
          </Label>
          <RadioGroup
            value={selectedModel}
            onValueChange={onModelChange}
            className="grid grid-cols-1 sm:grid-cols-3 gap-2"
            disabled={disabled}
          >
            <Label
              htmlFor="model-yolov8n"
              className={`flex items-center justify-between border rounded-md p-3 cursor-pointer ${
                selectedModel === "yolov8n" ? "border-primary bg-primary/5" : "border-muted"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="space-y-1">
                <div className="font-medium">YOLOv8n</div>
                <div className="text-xs text-muted-foreground">Fastest</div>
              </div>
              <RadioGroupItem value="yolov8n" id="model-yolov8n" className="sr-only" />
            </Label>

            <Label
              htmlFor="model-yolov8m"
              className={`flex items-center justify-between border rounded-md p-3 cursor-pointer ${
                selectedModel === "yolov8m" ? "border-primary bg-primary/5" : "border-muted"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="space-y-1">
                <div className="font-medium">YOLOv8m</div>
                <div className="text-xs text-muted-foreground">Balanced</div>
              </div>
              <RadioGroupItem value="yolov8m" id="model-yolov8m" className="sr-only" />
            </Label>

            <Label
              htmlFor="model-yolov8l"
              className={`flex items-center justify-between border rounded-md p-3 cursor-pointer ${
                selectedModel === "yolov8l" ? "border-primary bg-primary/5" : "border-muted"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="space-y-1">
                <div className="font-medium">YOLOv8l</div>
                <div className="text-xs text-muted-foreground">Most accurate</div>
              </div>
              <RadioGroupItem value="yolov8l" id="model-yolov8l" className="sr-only" />
            </Label>
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  )
}

