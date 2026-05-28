import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-sm border border-transparent px-1.5 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        muted: "bg-secondary text-muted-foreground",
        info: "bg-primary/10 text-primary dark:bg-primary/20",
        success:
          "bg-success/10 text-success dark:bg-success/20",
        warning:
          "bg-warning/20 text-warning-foreground dark:bg-warning/15 dark:text-warning",
        danger:
          "bg-destructive/10 text-destructive dark:bg-destructive/20",
        promotion:
          "bg-promotion/10 text-promotion dark:bg-promotion/20",
        alpha:
          "bg-promotion text-promotion-foreground",
        beta:
          "bg-warning text-warning-foreground",
        new:
          "bg-success text-success-foreground",
      },
    },
    defaultVariants: {
      variant: "muted",
    },
  }
)

function Badge({
  className,
  variant = "muted",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
