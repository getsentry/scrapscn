import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const linkVariants = cva(
  "inline-flex items-center gap-1 rounded-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        accent: "text-info underline underline-offset-3 hover:text-primary",
        muted: "text-muted-foreground hover:text-foreground",
      },
    },
    defaultVariants: {
      variant: "accent",
    },
  }
)

function Link({
  className,
  variant,
  external,
  ...props
}: React.ComponentProps<"a"> &
  VariantProps<typeof linkVariants> & {
    /** Open in a new tab with safe rel attributes. */
    external?: boolean
  }) {
  const externalProps = external
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {}

  return (
    <a
      data-slot="link"
      className={cn(linkVariants({ variant }), className)}
      {...externalProps}
      {...props}
    />
  )
}

export { Link, linkVariants }
