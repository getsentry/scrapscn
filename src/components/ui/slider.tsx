"use client"

import * as React from "react"
import { Slider as SliderPrimitive } from "@base-ui/react/slider"

import { cn } from "@/lib/utils"

type Ticks =
  | { count: number; labels?: boolean }
  | { interval: number; labels?: boolean }
  | { values: number[]; labels?: boolean }

type SliderProps = Omit<
  React.ComponentProps<typeof SliderPrimitive.Root>,
  "format"
> & {
  /** Visual tick marks (independent from `step`). */
  ticks?: Ticks
  /** Intl.NumberFormat options for the value/edge/tick labels. Pass "hidden" to hide all labels. */
  formatOptions?: Intl.NumberFormatOptions | "hidden"
}

function computeTickValues(
  ticks: Ticks | undefined,
  min: number,
  max: number
): number[] {
  if (!ticks) return []
  if ("values" in ticks) return ticks.values
  if ("interval" in ticks) {
    const count = Math.floor((max - min) / ticks.interval) + 1
    return Array.from({ length: count }, (_, i) => min + i * ticks.interval)
  }
  if (ticks.count >= 2) {
    const range = max - min
    return Array.from(
      { length: ticks.count },
      (_, i) => min + i * (range / (ticks.count - 1))
    )
  }
  return []
}

function Slider({
  className,
  min = 0,
  max = 100,
  step = 1,
  disabled,
  value,
  defaultValue,
  onValueChange,
  ticks,
  formatOptions,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  ...props
}: SliderProps) {
  const isHidden = formatOptions === "hidden"
  const formatter = React.useMemo(
    () => new Intl.NumberFormat(undefined, isHidden ? undefined : formatOptions),
    [formatOptions, isHidden]
  )
  const fmt = React.useCallback((n: number) => formatter.format(n), [formatter])

  const initial =
    (typeof value === "number" ? value : undefined) ??
    (typeof defaultValue === "number" ? defaultValue : undefined) ??
    min
  const [internal, setInternal] = React.useState(initial)
  const current = typeof value === "number" ? value : internal
  const pct = (n: number) => (max === min ? 0 : ((n - min) / (max - min)) * 100)

  const tickValues = React.useMemo(
    () => computeTickValues(ticks, min, max),
    [ticks, min, max]
  )
  const intermediateTicks = tickValues.filter((t) => t !== min && t !== max)
  const showLabels = !isHidden
  const showTickLabels = !!ticks?.labels

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(v, details) => {
        setInternal(Array.isArray(v) ? (v[0] ?? min) : v)
        onValueChange?.(v, details)
      }}
      className={cn(
        "group/slider relative w-full select-none data-disabled:opacity-60",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full touch-none items-center pt-8 pb-2">
        <SliderPrimitive.Track className="relative h-3 w-full rounded-md border border-border bg-muted shadow-(--shadow-debossed)">
          <SliderPrimitive.Indicator className="rounded-l-[5px] bg-primary" />

          {intermediateTicks.map((t) => (
            <span
              key={t}
              aria-hidden
              data-filled={t <= current || undefined}
              className="absolute top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-border data-[filled]:bg-primary/60"
              style={{ left: `${pct(t).toFixed(2)}%` }}
            />
          ))}

          <SliderPrimitive.Thumb
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledby}
            className="relative size-5 cursor-grab rounded-sm border border-border bg-background shadow-(--shadow-chonk) outline-none group-hover/slider:border-chonk-accent active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-disabled:cursor-not-allowed"
          >
            {showLabels && (
              <output
                aria-hidden
                className="pointer-events-none absolute bottom-full left-1/2 mb-2.5 -translate-x-1/2 rounded-xs px-1 text-xs font-medium text-muted-foreground tabular-nums group-focus-within/slider:bg-primary group-focus-within/slider:text-white"
              >
                {fmt(current)}
              </output>
            )}
          </SliderPrimitive.Thumb>
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>

      {showLabels && (
        <div
          aria-hidden
          className="pointer-events-none relative h-4 w-full text-xs text-muted-foreground tabular-nums"
        >
          <span className="absolute left-0">{fmt(min)}</span>
          {showTickLabels &&
            intermediateTicks.map((t) => (
              <span
                key={t}
                className="absolute -translate-x-1/2"
                style={{ left: `${pct(t).toFixed(2)}%` }}
              >
                {fmt(t)}
              </span>
            ))}
          <span className="absolute right-0">{fmt(max)}</span>
        </div>
      )}
    </SliderPrimitive.Root>
  )
}

export { Slider }
export type { SliderProps }
