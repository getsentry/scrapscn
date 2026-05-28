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
  const trackW = size === "sm" ? "w-9" : "w-10"
  const trackH = size === "sm" ? "h-5" : "h-6"
  const thumbSize = size === "sm" ? "size-5" : "size-6"
  const thumbTranslate =
    size === "sm"
      ? "data-checked:translate-x-[15px]"
      : "data-checked:translate-x-[15px]"
  const iconSize = size === "sm" ? "size-2.5" : "size-3"

  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-sm outline-none",
        "after:absolute after:-inset-x-3 after:-inset-y-2",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        trackW,
        trackH,
        className
      )}
      {...props}
    >
      {/* Debossed track */}
      <span
        className={cn(
          "absolute inset-0 rounded-[inherit]",
          "bg-input-bg border border-chonk-neutral",
          "border-t-2",
          "transition-colors [transition-duration:var(--duration-moderate)]",
          "group-data-checked/switch:bg-primary group-data-checked/switch:border-chonk-accent"
        )}
      />
      {/* Embossed thumb */}
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none relative z-10 flex items-center justify-center rounded-sm",
          "bg-background border border-chonk-neutral",
          "-translate-y-px translate-x-0",
          "transition-transform [transition-duration:var(--duration-moderate)] [transition-timing-function:var(--ease-snap)]",
          "group-data-checked/switch:border-chonk-accent",
          "group-data-disabled/switch:translate-y-0",
          thumbSize,
          thumbTranslate
        )}
      >
        {/* Close icon (unchecked) */}
        <X
          className={cn(
            "absolute text-muted-foreground transition-all [transition-duration:var(--duration-fast)]",
            "group-data-checked/switch:scale-90 group-data-checked/switch:opacity-0",
            "group-data-unchecked/switch:scale-100 group-data-unchecked/switch:opacity-100",
            iconSize
          )}
        />
        {/* Check icon (checked) */}
        <Check
          className={cn(
            "absolute text-primary transition-all [transition-duration:var(--duration-fast)]",
            "group-data-unchecked/switch:scale-90 group-data-unchecked/switch:opacity-0",
            "group-data-checked/switch:scale-100 group-data-checked/switch:opacity-100",
            iconSize
          )}
        />
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  )
}

export { Switch }
