"use client"

import { useCallback } from "react"

import { cn } from "@/lib/utils"

type CheckboxSize = "xs" | "sm" | "md"

/** Props that match the public API of Sentry's regular Scraps Checkbox. */
export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "checked" | "size"> {
  checked?: React.InputHTMLAttributes<HTMLInputElement>["checked"] | "indeterminate"
  ref?: React.Ref<HTMLInputElement>
  size?: CheckboxSize
}

const checkboxSizes: Record<CheckboxSize, { box: string; icon: string; radius: string; strokeWidth: number }> = {
  xs: { box: "size-3", icon: "size-2.5", radius: "rounded-[2px]", strokeWidth: 1.8 },
  sm: { box: "size-4", icon: "size-3", radius: "rounded-[4px]", strokeWidth: 1.88 },
  md: { box: "size-[22px]", icon: "size-[18px]", radius: "rounded-[6px]", strokeWidth: 2.12 },
}

function assignRef<T>(ref: React.Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") {
    return ref(value)
  } else if (ref) {
    ref.current = value
    return () => {
      ref.current = null
    }
  }
}

/** Renders the native, form-compatible Checkbox used by regular Scraps. */
export function Checkbox({
  checked = false,
  size = "sm",
  className,
  ref,
  style,
  ...props
}: CheckboxProps) {
  const isIndeterminate = checked === "indeterminate"
  const setInputRef = useCallback(
    (node: HTMLInputElement | null) => {
      if (node) node.indeterminate = isIndeterminate
      return assignRef(ref, node)
    },
    [isIndeterminate, ref]
  )
  const dimensions = checkboxSizes[size]

  return (
    <div
      data-slot="checkbox"
      data-size={size}
      className={cn(
        "group/checkbox relative inline-flex justify-start",
        dimensions.radius,
        props.disabled || props.readOnly ? "cursor-auto" : "cursor-pointer",
        className
      )}
      style={style}
    >
      <input
        ref={setInputRef}
        checked={!isIndeterminate && checked}
        type="checkbox"
        className="peer absolute inset-0 z-10 m-0 size-full cursor-[inherit] appearance-none rounded-[inherit] opacity-0 focus-visible:outline-none"
        style={style}
        {...props}
      />
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none relative flex items-center justify-center border border-checkbox-border bg-transparent text-inherit",
          "peer-checked:bg-checkbox-checked peer-checked:text-white peer-indeterminate:bg-checkbox-checked peer-indeterminate:text-white",
          "peer-focus-visible:shadow-[0_0_0_2px_var(--checkbox-focus)]",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-60 peer-aria-disabled:opacity-60 peer-disabled:peer-checked:border-checkbox-checked-chonk peer-disabled:peer-indeterminate:border-checkbox-checked-chonk",
          dimensions.box,
          dimensions.radius
        )}
      >
        {(checked === true || isIndeterminate) && (
          <svg
            viewBox="0 0 16 16"
            className={cn("shrink-0 fill-none stroke-white [stroke-linecap:round] [stroke-linejoin:round]", dimensions.icon)}
            strokeWidth={dimensions.strokeWidth}
          >
            {isIndeterminate ? (
              <path d="M3 8H13" />
            ) : (
              <path d="M2.86 9.14C4.42 10.7 6.9 13.14 6.86 13.14L12.57 3.43" />
            )}
          </svg>
        )}
      </div>
      {!(props.disabled || props.readOnly) && (
        <span
          role="presentation"
          className={cn(
            "pointer-events-none absolute inset-0 box-content rounded-[inherit] border-inherit bg-current opacity-0 group-hover/checkbox:opacity-6 group-active/checkbox:opacity-9",
            (checked === true || isIndeterminate) && "group-hover/checkbox:opacity-[0.085] group-active/checkbox:opacity-12"
          )}
        />
      )}
    </div>
  )
}
