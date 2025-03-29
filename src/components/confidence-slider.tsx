"use client"

import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

interface ConfidenceSliderProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

export function ConfidenceSlider({ value, onChange, disabled = false }: ConfidenceSliderProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label htmlFor="confidence" className="text-base font-medium">
              Confidence Threshold
            </Label>
            <span className="text-sm font-medium">{value}%</span>
          </div>
          <Slider
            id="confidence"
            min={10}
            max={90}
            step={5}
            value={[value]}
            onValueChange={(values) => onChange(values[0])}
            disabled={disabled}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>More detections</span>
            <span>Higher precision</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

