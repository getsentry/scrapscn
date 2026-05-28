import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const CHONK_VARIANTS = ["default", "secondary", "destructive", "warning"] as const
type ChonkVariant = (typeof CHONK_VARIANTS)[number]

function isChonky(variant: string | undefined | null): variant is ChonkVariant {
  return CHONK_VARIANTS.includes(variant as ChonkVariant)
}

const flatColors: Record<ChonkVariant, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  warning: "bg-warning text-warning-foreground hover:bg-warning/90",
}

const chonkStyles: Record<
  ChonkVariant,
  { surface: string; chonk: string; border: string }
> = {
  default: {
    surface: "bg-primary",
    chonk: "bg-chonk-accent",
    border: "border-chonk-accent",
  },
  secondary: {
    surface: "bg-background",
    chonk: "bg-chonk-neutral",
    border: "border-chonk-neutral",
  },
  destructive: {
    surface: "bg-destructive",
    chonk: "bg-chonk-danger",
    border: "border-chonk-danger",
  },
  warning: {
    surface: "bg-warning",
    chonk: "bg-chonk-warning",
    border: "border-chonk-warning",
  },
}

const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center text-sm font-medium whitespace-nowrap outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "text-primary-foreground",
        secondary: "text-foreground",
        destructive: "text-destructive-foreground",
        warning: "text-warning-foreground",
        outline:
          "border border-border bg-background hover:bg-muted dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        ghost:
          "hover:bg-muted dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 gap-1.5 rounded-lg px-4",
        xs: "h-6 gap-1 rounded-sm px-2 text-xs",
        sm: "h-8 gap-1 rounded-md px-3 text-xs",
        lg: "h-10 gap-1.5 rounded-lg px-5",
        icon: "size-9 rounded-lg",
        "icon-xs": "size-6 rounded-sm",
        "icon-sm": "size-7 rounded-md",
        "icon-lg": "size-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    chonk?: boolean
  }

function Button({
  className,
  variant = "default",
  size = "default",
  chonk,
  children,
  ...props
}: ButtonProps) {
  // xs is too short for the depth layer to read — the 1px chonk edge plus the
  // surface border looks like an asymmetric border, so xs always renders flat.
  const isXs = size === "xs" || size === "icon-xs"
  const shouldChonk = chonk !== false && isChonky(variant) && !isXs

  if (shouldChonk) {
    const s = chonkStyles[variant as ChonkVariant]

    return (
      <ButtonPrimitive
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        <span className={cn("absolute inset-0 rounded-[inherit]", s.chonk)} />
        <span
          className={cn(
            "absolute inset-0 rounded-[inherit] border",
            s.surface,
            s.border,
            "transition-transform [transition-duration:var(--duration-moderate)] [transition-timing-function:var(--ease-snap)]",
            isXs ? "-translate-y-px" : "-translate-y-0.5",
            isXs
              ? "group-hover/button:-translate-y-0.5"
              : "group-hover/button:-translate-y-[3px]",
            "group-active/button:translate-y-0",
            "group-aria-expanded/button:translate-y-0 group-aria-expanded/button:!transition-none",
            "group-aria-checked/button:translate-y-0 group-aria-checked/button:!transition-none",
            "group-disabled/button:translate-y-0 group-disabled/button:!transition-none"
          )}
        />
        <span
          className={cn(
            "relative z-10 flex items-center justify-center gap-[inherit]",
            "transition-transform [transition-duration:var(--duration-moderate)] [transition-timing-function:var(--ease-snap)]",
            isXs ? "-translate-y-px" : "-translate-y-0.5",
            isXs
              ? "group-hover/button:-translate-y-0.5"
              : "group-hover/button:-translate-y-[3px]",
            "group-active/button:translate-y-0",
            "group-aria-expanded/button:translate-y-0 group-aria-expanded/button:!transition-none",
            "group-aria-checked/button:translate-y-0 group-aria-checked/button:!transition-none",
            "group-disabled/button:translate-y-0 group-disabled/button:!transition-none"
          )}
        >
          {children}
        </span>
      </ButtonPrimitive>
    )
  }

  if (isChonky(variant)) {
    return (
      <ButtonPrimitive
        data-slot="button"
        className={cn(
          buttonVariants({ size, className }),
          flatColors[variant as ChonkVariant]
        )}
        {...props}
      >
        {children}
      </ButtonPrimitive>
    )
  }

  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {children}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
export type { ButtonProps }
