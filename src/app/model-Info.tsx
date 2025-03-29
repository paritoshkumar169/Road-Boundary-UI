"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ModelInfoProps {
  selectedModel: string
  setSelectedModel: (model: string) => void
}

export function ModelInfo({ selectedModel, setSelectedModel }: ModelInfoProps) {
  const modelDetails = {
    daytime: {
      name: "Daytime Model",
      description: "Optimized for daylight conditions with high visibility",
      accuracy: "95.2%",
      trainedOn: "1500 daytime road images",
      lastUpdated: "March 8, 2025",
    },
    nighttime: {
      name: "Nighttime Model",
      description: "Specialized for low-light and nighttime conditions",
      accuracy: "90.8%",
      trainedOn: "500 nighttime road images",
      lastUpdated: "March 27, 2025",
    },
  }

  const currentModel = modelDetails[selectedModel as keyof typeof modelDetails]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Model Selection</CardTitle>
        <CardDescription>Choose which model to use for detection</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue={selectedModel} onValueChange={setSelectedModel}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="daytime">Daytime</TabsTrigger>
            <TabsTrigger value="nighttime">Nighttime</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="text-sm space-y-2">
          <p className="font-medium">{currentModel.name}</p>
          <p className="text-muted-foreground">{currentModel.description}</p>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div>
              <p className="text-xs text-muted-foreground">Accuracy</p>
              <p className="font-medium">{currentModel.accuracy}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last Updated</p>
              <p className="font-medium">{currentModel.lastUpdated}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

