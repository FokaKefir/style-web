import * as React from "react"
import { useState } from "react"
import { Button } from "./ui/button"
import { Slider } from "./ui/slider"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer"
import {
  Card,
  CardContent,
} from "./ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@components/ui/carousel"
import { Upload } from "lucide-react"

export function GenerateDrawer() {
  const [styleWeight, setStyleWeight] = useState(1)
  const [tvWeight, setTvWeight] = useState(1)
  const [iterations, setIterations] = useState(500)
  const [selectedImage, setSelectedImage] = useState(null)

  const styleWeightToSliderValue = (weight) => {
    const weights = [1, 3, 10, 30, 100, 300, 1000, 3000, 10000, 30000, 100000]
    return weights[weight * 2]
  }

  const tvWeightToSliderValue = (weight) => {
    const weights = [1, 10, 100, 1000, 10000, 100000]
    return weights[weight];
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedImage(URL.createObjectURL(file))
    }
  }

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700">Generate</Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-4xl px-6">
          <DrawerHeader>
            <DrawerTitle>Generate Image</DrawerTitle>
            <DrawerDescription>Transform your images with AI-powered style transfer.</DrawerDescription>
          </DrawerHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
            <div className="space-y-4">
              <div className="h-48 border-2 border-dashed rounded-lg flex items-center justify-center relative overflow-hidden">
                {selectedImage ? (
                  <img src={selectedImage} alt="Content" className="h-full w-auto object-contain" />
                ) : (
                  <div className="text-center">
                    <Upload className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">Click to upload content image</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <Slider
                    label="Stylishness"
                    value={styleWeight}
                    onValueChange={setStyleWeight}
                    min={0}
                    max={5}
                    step={0.5}
                    className="w-full"
                  />

                  <Slider
                    label="Smoothness"
                    value={tvWeight}
                    onValueChange={setTvWeight}
                    min={0}
                    max={5}
                    step={1}
                    className="w-full"
                  />

                  <Slider
                    label="Duration"
                    value={iterations}
                    onValueChange={setIterations}
                    min={500}
                    max={3000}
                    step={500}
                    className="w-full"
                  />
                </div>

                <select className="w-full rounded-md border border-input px-3 py-2">
                  <option value="">Select initialization method</option>
                  <option value="random">Random</option>
                  <option value="content">Content</option>
                  <option value="style">Style</option>
                </select>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-4">Select Style</h3>
              <Carousel 
                className="w-full max-w-4xl mx-auto px-4"
                opts={{
                  align: "center",
                  containScroll: "trimSnaps",
                  dragFree: true,
                  startIndex: 1
                }}
              >
                <CarouselContent className="-ml-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <CarouselItem key={index} className="pl-2 basis-4/5 md:basis-2/3 lg:basis-1/2 transition-all duration-300">
                      <div className="px-1 group">
                        <Card className="border shadow-md hover:shadow-lg transition-all duration-300">
                          <CardContent className="flex aspect-square items-center justify-center p-6 relative">
                            <div className="transform transition-all duration-300 group-hover:scale-105">
                              <span className="text-xl md:text-2xl font-semibold">Style {index + 1}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex opacity-50 hover:opacity-100 transition-opacity" />
                <CarouselNext className="hidden md:flex opacity-50 hover:opacity-100 transition-opacity" />
              </Carousel>
            </div>
          </div>

          <DrawerFooter>
            <Button 
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => {
                const mappedStyleWeight = styleWeightToSliderValue(styleWeight);
                const mappedTvWeight = tvWeightToSliderValue(tvWeight);
                console.log('Generation parameters:', {
                  styleWeight,
                  mappedStyleWeight,
                  tvWeight,
                  mappedTvWeight,
                  iterations,
                  selectedImage,
                });
                console.log('bazdmeg:', {
                  styleWeight: styleWeightToSliderValue(styleWeight),
                  tvWeight: tvWeightToSliderValue(tvWeight),
                  iterations,
                });
              }}
            >
              Generate
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
