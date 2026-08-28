import { cn } from "../../lib/utils";

import "./radio.css";

type RadioSize = "xs" | "sm" | "md";

interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  ref?: React.Ref<HTMLInputElement>;
  size?: RadioSize;
}

const radioSizes: Record<RadioSize, string> = {
  xs: "size-3 after:size-1.5",
  sm: "size-5 after:size-2.5",
  md: "size-6 after:size-3",
};

export function Radio({ className, ref, size = "md", ...props }: RadioProps) {
  return (
    <input
      {...props}
      ref={ref}
      type="radio"
      className={cn(
        "!m-0 inline-flex shrink-0 cursor-pointer appearance-none items-center justify-center rounded-full !border !border-solid !border-[var(--radio-border)] bg-transparent p-0 outline-none",
        "[transition:border_120ms_cubic-bezier(0.72,0,0.16,1),box-shadow_120ms_cubic-bezier(0.72,0,0.16,1)]",
        "after:block after:rounded-full after:bg-white after:opacity-0 after:content-[''] after:[transition:all_160ms_cubic-bezier(0.72,0,0.16,1)]",
        "focus-visible:![box-shadow:0_0_0_0_var(--scraps-radio-focus-mask),0_0_0_2px_var(--radio-focus)]",
        "checked:!border-[var(--radio-checked-chonk)] checked:bg-[var(--radio-checked)] checked:after:animate-[radioGrowIn_160ms_cubic-bezier(0.72,0,0.16,1)] checked:after:opacity-100",
        "disabled:cursor-not-allowed disabled:opacity-60",
        radioSizes[size],
        className,
      )}
    />
  );
}
