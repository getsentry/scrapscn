import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const tagVariants = cva(
  "inline-flex h-5 w-fit max-w-full shrink-0 items-center gap-1 rounded-sm px-2 text-xs font-medium whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        muted: "bg-secondary text-muted-foreground",
        info: "bg-primary/10 text-info dark:bg-primary/20",
        promotion: "bg-promotion/10 text-promotion-strong dark:bg-promotion/20",
        danger: "bg-destructive/10 text-destructive dark:bg-destructive/20",
        warning:
          "bg-warning/20 text-warning-foreground dark:bg-warning/15 dark:text-warning",
        success: "bg-success/10 text-success dark:bg-success/20",
      },
    },
    defaultVariants: {
      variant: "muted",
    },
  }
)

function Tag({
  className,
  variant = "muted",
  icon,
  onDismiss,
  children,
  ...props
}: Omit<React.ComponentProps<"span">, "onDismiss"> &
  VariantProps<typeof tagVariants> & {
    icon?: React.ReactNode
    onDismiss?: () => void
  }) {
  return (
    <span
      data-slot="tag"
      className={cn(tagVariants({ variant }), className)}
      {...props}
    >
      {icon}
      {children != null && (
        <span className="min-w-0 truncate">{children}</span>
      )}
      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={(event) => {
            event.preventDefault()
            onDismiss()
          }}
          className="-mr-1 inline-flex shrink-0 items-center justify-center rounded-sm text-current opacity-80 outline-none hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  )
}

export { Tag, tagVariants }
