"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleSlash,
  Info,
  TriangleAlert,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button, type ButtonProps } from "@/components/ui/button"

type AlertVariant = "info" | "danger" | "warning" | "success" | "muted"

const alertVariants = cva(
  "group/alert relative flex min-h-11 w-full overflow-hidden text-left text-sm text-foreground [&_a:not([role=button])]:underline [&_a:not([role=button])]:underline-offset-3",
  {
    variants: {
      variant: {
        info: "border-primary/30 bg-primary/5 dark:bg-primary/10",
        warning: "border-warning/30 bg-warning/10 dark:border-warning/20",
        danger: "border-destructive/30 bg-destructive/5 dark:bg-destructive/10",
        success: "border-success/30 bg-success/5 dark:bg-success/10",
        muted: "border-border bg-card",
      },
      system: {
        true: "border-b",
        false: "rounded-lg border",
      },
    },
    defaultVariants: {
      variant: "info",
      system: false,
    },
  }
)

const alertIconMap: Record<AlertVariant, React.ComponentType<{ className?: string }>> = {
  info: Info,
  warning: TriangleAlert,
  danger: CircleSlash,
  success: CheckCircle2,
  muted: Info,
}

// The colored 44px "rail" on the left edge. Body uses a tint of the variant
// color; the rail uses the full-strength (vibrant) color with a contrasting icon.
const railBg: Record<AlertVariant, string> = {
  info: "bg-primary",
  warning: "bg-warning",
  danger: "bg-destructive",
  success: "bg-success",
  muted: "bg-card",
}

const railIconColor: Record<AlertVariant, string> = {
  info: "text-white",
  warning: "text-black",
  danger: "text-white",
  success: "text-black",
  muted: "text-foreground",
}

const railBorder: Record<AlertVariant, string> = {
  info: "border-primary/30",
  warning: "border-warning/30 dark:border-warning/20",
  danger: "border-destructive/30",
  success: "border-success/30",
  muted: "border-border",
}

interface AlertProps
  extends Omit<React.ComponentProps<"div">, "title">,
    VariantProps<typeof alertVariants> {
  icon?: React.ReactNode
  showIcon?: boolean
  expand?: React.ReactNode
  defaultExpanded?: boolean
  onExpandChange?: (expanded: boolean) => void
  trailingItems?: React.ReactNode
}

function Alert({
  className,
  variant = "info",
  system = false,
  showIcon = true,
  icon,
  expand,
  defaultExpanded = false,
  onExpandChange,
  trailingItems,
  children,
  ...props
}: AlertProps) {
  const resolvedVariant = (variant ?? "info") as AlertVariant
  const IconComponent = alertIconMap[resolvedVariant]
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded)

  function toggleExpanded() {
    const next = !isExpanded
    setIsExpanded(next)
    onExpandChange?.(next)
  }

  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant, system }), className)}
      {...props}
    >
      {showIcon && (
        <div
          className={cn(
            "flex w-11 shrink-0 items-center justify-center self-stretch border-r",
            railBg[resolvedVariant],
            railIconColor[resolvedVariant],
            railBorder[resolvedVariant]
          )}
        >
          {icon ?? <IconComponent className="size-5" />}
        </div>
      )}
      <div className="flex min-w-0 flex-1 items-start gap-3 px-3 py-2.5">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {children}
          {expand && isExpanded && (
            <div data-slot="alert-expand" className="mt-2 text-muted-foreground">
              {expand}
            </div>
          )}
        </div>
        {(trailingItems || expand) && (
          <div className="flex shrink-0 items-center gap-2">
            {trailingItems}
            {expand && (
              <button
                type="button"
                aria-label={isExpanded ? "Collapse" : "Expand"}
                aria-expanded={isExpanded}
                onClick={toggleExpanded}
                className="inline-flex size-5 items-center justify-center rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                {isExpanded ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("font-medium text-foreground", className)}
      {...props}
    />
  )
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-sm text-foreground [&_p:not(:last-child)]:mb-4",
        className
      )}
      {...props}
    />
  )
}

function AlertContainer({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("space-y-4", className)} {...props} />
}

function AlertButton(props: ButtonProps) {
  return <Button size="sm" variant="ghost" {...props} />
}

type AlertLinkProps = Pick<
  AlertProps,
  "variant" | "system" | "trailingItems" | "children"
> & {
  href?: string
  openInNewTab?: boolean
  onClick?: React.MouseEventHandler<HTMLAnchorElement>
}

function AlertLink({
  href,
  openInNewTab,
  onClick,
  variant = "info",
  system,
  trailingItems,
  children,
}: AlertLinkProps) {
  return (
    <a
      href={href ?? "#"}
      onClick={onClick}
      target={openInNewTab ? "_blank" : undefined}
      rel={openInNewTab ? "noreferrer" : undefined}
      className="block cursor-pointer no-underline"
    >
      <Alert
        variant={variant}
        system={system}
        trailingItems={trailingItems ?? <ChevronRight className="size-4" />}
      >
        {children}
      </Alert>
    </a>
  )
}

Alert.Container = AlertContainer
Alert.Button = AlertButton

export { Alert, AlertTitle, AlertDescription, AlertLink }
export type { AlertProps, AlertLinkProps }
