import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "../../lib/utils"

const Slider = React.forwardRef(({ 
  className,
  label,
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  ...props 
}, ref) => {
  return (
    <div className="space-y-2 w-full">
      {label && (
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
          <span className="text-sm text-neutral-500">{value}</span>
        </div>
      )}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-neutral-500 min-w-8">{min}</span>
        <SliderPrimitive.Root
          ref={ref}
          className={cn(
            "relative flex w-full touch-none select-none items-center",
            className
          )}
          value={[value]}
          onValueChange={([newValue]) => onValueChange(newValue)}
          min={min}
          max={max}
          step={step}
          {...props}
        >
          <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
            <SliderPrimitive.Range className="absolute h-full bg-primary dark:bg-neutral-100" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-white shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-100/50 dark:bg-neutral-950" />
        </SliderPrimitive.Root>
        <span className="text-sm text-neutral-500 min-w-8">{max}</span>
      </div>
    </div>
  );
});

Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
