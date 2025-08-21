import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

const CustomSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    rangeClassName?: string
  }
>(({ className, rangeClassName, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center", className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-4 w-full grow overflow-hidden rounded-full bg-secondary">
      <SliderPrimitive.Range className={cn("absolute h-full bg-[#007C92]", rangeClassName)} />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-8 w-8 border-grey-med-dark border drop-shadow-xl rounded-full bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible-ring-color-grey-med-dark disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))
CustomSlider.displayName = "CustomSlider"

export { CustomSlider }