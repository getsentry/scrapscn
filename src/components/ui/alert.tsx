"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import {
  AlertCircle,
  CheckCircle2,
  Info,
  TriangleAlert,
  CircleSlash,
} from "lucide-react"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "group/alert relative grid w-full gap-x-3 gap-y-0 rounded-lg border px-3 py-2.5 text-left text-sm [&_a]:underline [&_a]:underline-offset-3",
  {
    variants: {
      variant: {
        info: "border-primary/30 bg-primary/5 dark:bg-primary/10",
        warning:
          "border-warning/30 bg-warning/10 dark:border-warning/20 dark:bg-warning/10",
        danger:
          "border-destructive/30 bg-destructive/5 dark:bg-destructive/10",
        success:
          "border-success/30 bg-success/5 dark:bg-success/10",
        muted: "border-border bg-card",
      },
      showIcon: {
        true: "grid-cols-[auto_1fr] [&>svg]:row-span-2 [&>svg]:mt-0.5 [&>svg]:size-4",
        false: "",
      },
    },
    defaultVariants: {
      variant: "info",
      showIcon: true,
    },
  }
)

const alertIconMap = {
  info: Info,
  warning: TriangleAlert,
  danger: CircleSlash,
  success: CheckCircle2,
  muted: Info,
} as const

const alertIconColors = {
  info: "text-primary",
  warning: "text-warning-foreground dark:text-warning",
  danger: "text-destructive",
  success: "text-success",
  muted: "text-muted-foreground",
} as const

function Alert({
  className,
  variant = "info",
  showIcon = true,
  icon,
  children,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof alertVariants> & {
    icon?: React.ReactNode
    showIcon?: boolean
  }) {
  const resolvedVariant = variant ?? "info"
  const IconComponent = alertIconMap[resolvedVariant]

  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant, showIcon }), className)}
      {...props}
    >
      {showIcon &&
        (icon ?? <IconComponent className={alertIconColors[resolvedVariant]} />)}
      {children}
    </div>
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "font-medium group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-sm text-balance text-muted-foreground md:text-pretty group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
        className
      )}
      {...props}
    />
  )
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("absolute top-2 right-2", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription, AlertAction }
