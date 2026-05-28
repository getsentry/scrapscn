"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { Check, X } from "lucide-react"

import { cn } from "@/lib/utils"

function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center outline-none",
        "after:absolute after:-inset-x-3 after:-inset-y-2",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        size === "sm" ? "h-5 w-9" : "h-6 w-10",
        className
      )}
      {...props}
    >
      {/* Debossed track */}
      <span
        className={cn(
          "absolute inset-0 rounded-sm",
          "bg-[color:oklch(0.07_0.01_280/.08)] border border-border border-t-2",
          "transition-colors [transition-duration:var(--duration-moderate)]",
          "group-data-checked/switch:bg-primary group-data-checked/switch:border-chonk-accent"
        )}
      />
      {/* Embossed thumb */}
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none relative z-10 flex items-center justify-center rounded-sm",
          "bg-background border border-border",
          "-translate-x-px -translate-y-px",
          "transition-transform [transition-duration:var(--duration-moderate)] [transition-timing-function:var(--ease-snap)]",
          "group-data-checked/switch:border-chonk-accent",
          "group-data-disabled/switch:translate-y-0",
          size === "sm" ? "size-5 data-checked:translate-x-[16px]" : "size-6 data-checked:translate-x-[16px]",
        )}
      >
        <X
          className={cn(
            "absolute text-muted-foreground transition-all [transition-duration:var(--duration-fast)]",
            "group-data-checked/switch:scale-90 group-data-checked/switch:opacity-0",
            "group-data-unchecked/switch:scale-100 group-data-unchecked/switch:opacity-100",
            size === "sm" ? "size-2.5" : "size-3"
          )}
        />
        <Check
          className={cn(
            "absolute text-primary transition-all [transition-duration:var(--duration-fast)]",
            "group-data-unchecked/switch:scale-90 group-data-unchecked/switch:opacity-0",
            "group-data-checked/switch:scale-100 group-data-checked/switch:opacity-100",
            size === "sm" ? "size-2.5" : "size-3"
          )}
        />
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  )
}

export { Switch }
