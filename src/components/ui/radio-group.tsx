"use client"

import * as React from "react"
import { Radio as RadioPrimitive } from "@base-ui/react/radio"
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group"

import { cn } from "@/lib/utils"

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive>) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn("grid gap-2", className)}
      {...props}
    />
  )
}

function RadioGroupItem({
  className,
  size = "md",
  ...props
}: RadioPrimitive.Root.Props & { size?: "sm" | "md" }) {
  return (
    <RadioPrimitive.Root
      data-slot="radio-group-item"
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-background outline-none",
        "transition-[border-color,background-color] [transition-duration:var(--duration-fast)]",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "data-checked:border-chonk-accent data-checked:bg-primary",
        "data-disabled:cursor-not-allowed data-disabled:opacity-60",
        size === "sm" ? "size-5" : "size-6",
        className
      )}
      {...props}
    >
      <RadioPrimitive.Indicator
        className={cn(
          "rounded-full bg-white",
          size === "sm" ? "size-2.5" : "size-3"
        )}
      />
    </RadioPrimitive.Root>
  )
}

export { RadioGroup, RadioGroupItem }
