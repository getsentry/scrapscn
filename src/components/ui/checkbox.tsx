"use client"

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { Check, Minus } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  size = "default",
  ...props
}: CheckboxPrimitive.Root.Props & {
  size?: "sm" | "default"
}) {
  const boxSize = size === "sm" ? "size-4" : "size-[22px]"
  const iconSize = size === "sm" ? "size-3" : "size-[18px]"
  const radius = size === "sm" ? "rounded-xs" : "rounded-sm"

  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer group/checkbox relative inline-flex shrink-0 cursor-pointer items-center justify-center outline-none",
        "border border-border bg-transparent",
        "transition-colors [transition-duration:var(--duration-fast)]",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "data-checked:border-primary data-checked:bg-primary",
        "data-indeterminate:border-primary data-indeterminate:bg-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        boxSize,
        radius,
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn(
          "flex items-center justify-center text-primary-foreground",
          iconSize
        )}
      >
        <Check className={iconSize} strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
