import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const CHONK_VARIANTS = ["default", "secondary", "destructive"] as const
type ChonkVariant = (typeof CHONK_VARIANTS)[number]

function isChonky(variant: string | undefined | null): variant is ChonkVariant {
  return CHONK_VARIANTS.includes(variant as ChonkVariant)
}

const chonkStyles: Record<
  ChonkVariant,
  { surface: string; chonk: string; border: string }
> = {
  default: {
    surface: "bg-primary",
    chonk: "bg-chonk-accent",
    border: "border-primary",
  },
  secondary: {
    surface: "bg-background",
    chonk: "bg-chonk-neutral",
    border: "border-chonk-neutral",
  },
  destructive: {
    surface: "bg-destructive",
    chonk: "bg-chonk-danger",
    border: "border-destructive",
  },
}

const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center rounded-lg text-sm font-medium whitespace-nowrap outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "text-primary-foreground",
        secondary: "text-foreground",
        destructive: "text-destructive-foreground",
        outline:
          "border border-border bg-background hover:bg-muted hover:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        ghost:
          "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 gap-1.5 px-4",
        xs: "h-6 gap-1 rounded-md px-2 text-xs",
        sm: "h-8 gap-1 rounded-md px-3 text-xs",
        lg: "h-10 gap-1.5 px-5",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md",
        "icon-sm": "size-7 rounded-md",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  children,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  if (isChonky(variant)) {
    const s = chonkStyles[variant]
    return (
      <ButtonPrimitive
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {/* Chonk shadow layer */}
        <span
          className={cn("absolute inset-0 rounded-[inherit]", s.chonk)}
        />
        {/* Surface layer — raised, presses on click */}
        <span
          className={cn(
            "absolute inset-0 rounded-[inherit] border -translate-y-0.5",
            "transition-transform duration-[160ms] [transition-timing-function:cubic-bezier(0.8,-0.4,0.5,1)]",
            "group-hover/button:-translate-y-1",
            "group-active/button:translate-y-0",
            s.surface,
            s.border
          )}
        />
        {/* Content */}
        <span
          className={cn(
            "relative z-10 flex items-center justify-center gap-1.5 -translate-y-0.5",
            "transition-transform duration-[160ms] [transition-timing-function:cubic-bezier(0.8,-0.4,0.5,1)]",
            "group-hover/button:-translate-y-1",
            "group-active/button:translate-y-0"
          )}
        >
          {children}
        </span>
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
