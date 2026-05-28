import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-input-bg px-2.5 py-1 text-base shadow-[inset_0_1px_0_var(--input-shadow)] transition-[border-color,box-shadow] outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:shadow-[inset_0_1px_0_var(--input-shadow),0_0_0_3px_var(--ring)/.25] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:shadow-[inset_0_1px_0_var(--input-shadow),0_0_0_3px_var(--destructive)/.2] md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
