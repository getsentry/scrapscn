"use client"

import * as React from "react"
import { Radio as RadioPrimitive } from "@base-ui/react/radio"
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group"

import { cn } from "@/lib/utils"

function SegmentedControl({
  className,
  size = "md",
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive> & {
  size?: "md" | "sm" | "xs"
}) {
  return (
    <RadioGroupPrimitive
      data-slot="segmented-control"
      data-size={size}
      className={cn(
        "group/seg inline-flex w-fit items-center gap-1 rounded-lg bg-muted p-[3px] text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function SegmentedControlItem({
  className,
  children,
  ...props
}: RadioPrimitive.Root.Props) {
  return (
    <RadioPrimitive.Root
      data-slot="segmented-control-item"
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap outline-none transition-colors [transition-duration:var(--duration-fast)]",
        "group-data-[size=md]/seg:px-3 group-data-[size=md]/seg:py-1 group-data-[size=md]/seg:text-sm",
        "group-data-[size=sm]/seg:px-2.5 group-data-[size=sm]/seg:py-1 group-data-[size=sm]/seg:text-xs",
        "group-data-[size=xs]/seg:px-2 group-data-[size=xs]/seg:py-0.5 group-data-[size=xs]/seg:text-xs",
        "hover:text-foreground",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "data-checked:bg-background data-checked:text-foreground data-checked:shadow-sm",
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        className
      )}
      {...props}
    >
      {children}
    </RadioPrimitive.Root>
  )
}

export { SegmentedControl, SegmentedControlItem }
