"use client";

import { useCallback } from "react";

import { cn } from "../../lib/utils";
import InteractionStateLayer from "./interaction-state-layer";

type CheckboxSize = "xs" | "sm" | "md";

/** Props that match the public API of Sentry's regular Scraps Checkbox. */
export interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "checked" | "size"
> {
  checked?: React.InputHTMLAttributes<HTMLInputElement>["checked"] | "indeterminate";
  ref?: React.Ref<HTMLInputElement>;
  size?: CheckboxSize;
}

const checkboxSizes: Record<
  CheckboxSize,
  { box: string; icon: string; radius: string; strokeWidth: number }
> = {
  xs: {
    box: "size-3",
    icon: "size-2.5",
    radius: "rounded-[2px]",
    strokeWidth: 1.8,
  },
  sm: {
    box: "size-4",
    icon: "size-3",
    radius: "rounded-[4px]",
    strokeWidth: 1.88,
  },
  md: {
    box: "size-[22px]",
    icon: "size-[18px]",
    radius: "rounded-[6px]",
    strokeWidth: 2.12,
  },
};

function assignRef<T>(ref: React.Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") {
    return ref(value);
  } else if (ref) {
    ref.current = value;
    return () => {
      ref.current = null;
    };
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
  const isIndeterminate = checked === "indeterminate";
  const setInputRef = useCallback(
    (node: HTMLInputElement | null) => {
      if (node) node.indeterminate = isIndeterminate;
      return assignRef(ref, node);
    },
    [isIndeterminate, ref],
  );
  const dimensions = checkboxSizes[size];
  const isInteractive = !props.disabled && !props.readOnly;

  return (
    <div
      className={cn(
        "relative inline-flex justify-start",
        dimensions.radius,
        isInteractive ? "cursor-pointer" : "cursor-auto",
        className,
      )}
      style={style}
    >
      <input
        ref={setInputRef}
        checked={!isIndeterminate && checked}
        type="checkbox"
        className="peer absolute top-0 left-0 m-0 size-full cursor-[inherit] p-0 opacity-0"
        style={style}
        {...props}
      />
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none relative flex items-center justify-center border border-[var(--checkbox-border)] bg-transparent text-inherit",
          "peer-checked:bg-[var(--checkbox-checked)] peer-checked:text-white peer-indeterminate:bg-[var(--checkbox-checked)] peer-indeterminate:text-white",
          "peer-focus-visible:[box-shadow:0_0_0_0_var(--scraps-checkbox-focus-mask),0_0_0_2px_var(--checkbox-focus)]",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-60 peer-disabled:peer-checked:border-[var(--checkbox-checked-chonk)] peer-disabled:peer-indeterminate:border-[var(--checkbox-checked-chonk)] peer-aria-disabled:opacity-60",
          dimensions.box,
          dimensions.radius,
        )}
      >
        {(checked === true || isIndeterminate) && (
          <svg
            viewBox="0 0 16 16"
            className={cn(
              "shrink-0 fill-none stroke-white [stroke-linecap:round] [stroke-linejoin:round]",
              dimensions.icon,
            )}
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
      {isInteractive && (
        <InteractionStateLayer higherOpacity={checked === true || isIndeterminate} />
      )}
    </div>
  );
}
