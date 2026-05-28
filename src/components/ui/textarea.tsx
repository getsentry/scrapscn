import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-input-bg px-2.5 py-2 text-base shadow-[inset_0_1px_0_var(--input-shadow)] transition-[border-color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:shadow-[inset_0_1px_0_var(--input-shadow),0_0_0_3px_var(--ring)/.25] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:shadow-[inset_0_1px_0_var(--input-shadow),0_0_0_3px_var(--destructive)/.2] md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
