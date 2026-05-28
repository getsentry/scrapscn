"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center text-muted-foreground group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col",
  {
    variants: {
      variant: {
        flat: "gap-0",
        floating: "gap-1 rounded-lg bg-muted p-[3px]",
      },
      size: {
        md: "group-data-horizontal/tabs:h-9",
        sm: "group-data-horizontal/tabs:h-8",
        xs: "group-data-horizontal/tabs:h-7",
      },
    },
    defaultVariants: {
      variant: "flat",
      size: "md",
    },
  }
)

function TabsList({
  className,
  variant = "flat",
  size = "md",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      data-size={size}
      className={cn(tabsListVariants({ variant, size }), className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md py-1 font-medium whitespace-nowrap text-muted-foreground transition-colors",
        // Per-size padding + font (size is read from the parent TabsList)
        "group-data-[size=md]/tabs-list:px-3 group-data-[size=md]/tabs-list:text-sm",
        "group-data-[size=sm]/tabs-list:px-2.5 group-data-[size=sm]/tabs-list:text-sm",
        "group-data-[size=xs]/tabs-list:px-2 group-data-[size=xs]/tabs-list:text-xs",
        "group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start",
        // Inactive hover — subtle neutral tint (matches Sentry flat tabs)
        "not-data-active:hover:bg-accent not-data-active:hover:text-foreground",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
        "disabled:pointer-events-none disabled:opacity-50",
        // Selected state — accent text
        "data-active:text-primary",
        // Flat active hover — faint accent tint
        "group-not-data-[variant=floating]/tabs-list:data-active:hover:bg-primary/10",
        // Floating variant selected state — accent tint, no shadow
        "group-data-[variant=floating]/tabs-list:data-active:bg-primary/10 group-data-[variant=floating]/tabs-list:data-active:text-primary",
        // Selection indicator bar (flat variant only)
        "after:absolute after:bg-primary after:opacity-0 after:transition-opacity",
        "group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:-bottom-1 group-data-horizontal/tabs:after:h-0.5 group-data-horizontal/tabs:after:rounded-full",
        "group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-left-1 group-data-vertical/tabs:after:w-0.5 group-data-vertical/tabs:after:rounded-full",
        "group-not-data-[variant=floating]/tabs-list:data-active:after:opacity-100",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
