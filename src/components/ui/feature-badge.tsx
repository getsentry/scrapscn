import * as React from "react"
import { Bug, FlaskConical, Radio } from "lucide-react"

import { cn } from "@/lib/utils"
import { Tag, type tagVariants } from "@/components/ui/tag"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { VariantProps } from "class-variance-authority"

type FeatureType = "alpha" | "beta" | "new" | "experimental" | "debug"
type TagVariant = NonNullable<VariantProps<typeof tagVariants>["variant"]>

const variantMap: Record<FeatureType, TagVariant> = {
  alpha: "promotion",
  beta: "warning",
  new: "success",
  experimental: "muted",
  debug: "danger",
}

const iconMap: Record<FeatureType, React.ReactNode> = {
  alpha: <FlaskConical className="size-3" aria-hidden />,
  beta: <FlaskConical className="size-3" aria-hidden />,
  new: <Radio className="size-3" aria-hidden />,
  experimental: <FlaskConical className="size-3" aria-hidden />,
  debug: <Bug className="size-3" aria-hidden />,
}

const defaultTitles: Record<FeatureType, string> = {
  alpha: "This feature is internal and available for QA purposes",
  beta: "This feature is available for early adopters and may change",
  new: "This feature is new! Try it out and let us know what you think",
  experimental:
    "This feature is experimental! Try it out and let us know what you think. No promises!",
  debug: "This UI is for debugging purposes only",
}

function FeatureBadge({
  type,
  title,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Tag>, "variant" | "children"> & {
  type: FeatureType
  title?: React.ReactNode
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <Tag
              variant={variantMap[type]}
              role="img"
              aria-label={type}
              className={cn("w-5 justify-center px-0", className)}
              {...props}
            >
              {iconMap[type]}
            </Tag>
          }
        />
        <TooltipContent side="right">
          {title ?? defaultTitles[type]}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export { FeatureBadge }
