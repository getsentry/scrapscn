"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  type Ref,
  type TextareaHTMLAttributes,
} from "react";
import TextareaAutosize, { type TextareaAutosizeProps } from "react-textarea-autosize";

import { cn } from "../../lib/utils";

type TextAreaSize = "xs" | "sm" | "md";

export interface TextAreaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "css" | "onResize" | "style"
> {
  autosize?: boolean;
  maxRows?: number;
  monospace?: boolean;
  nativeSize?: number;
  ref?: Ref<HTMLTextAreaElement>;
  rows?: number;
  size?: TextAreaSize;
  style?: TextareaAutosizeProps["style"];
  type?: React.HTMLInputTypeAttribute;
}

const baseClasses =
  "block h-auto w-full resize-y border border-[var(--scraps-theme-border-primary,var(--border))] bg-input-bg text-foreground inset-shadow-[0_1px_0_0_var(--input-shadow)] text-start leading-[1.4] transition-[border-color,box-shadow] duration-[120ms] ease-[var(--ease-smooth)] outline-none placeholder:text-muted-foreground placeholder:opacity-100 read-only:cursor-default focus:ring-2 focus:ring-ring focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:text-[#878490] disabled:opacity-60 disabled:placeholder:text-[#878490] aria-disabled:cursor-not-allowed aria-disabled:text-[#878490] aria-disabled:opacity-60 aria-disabled:placeholder:text-[#878490] dark:disabled:text-[#958e9f] dark:disabled:placeholder:text-[#958e9f] dark:aria-disabled:text-[#958e9f] dark:aria-disabled:placeholder:text-[#958e9f] data-[autosize=true]:[min-height:unset]";

const sizeClasses: Record<TextAreaSize, string> = {
  xs: "min-h-7 rounded-[5px] px-2 py-[calc((28px-(0.75rem*1.4))/2)] text-xs",
  sm: "min-h-8 rounded-[6px] px-3 py-[calc((32px-(0.875rem*1.4))/2)] text-sm",
  md: "min-h-9 rounded-[8px] px-4 py-[calc((36px-(0.875rem*1.4))/2)] text-sm",
};

export function TextArea({
  autosize = false,
  className,
  maxRows,
  monospace = false,
  nativeSize,
  ref,
  rows = 3,
  size = "md",
  type,
  ...props
}: TextAreaProps) {
  void nativeSize;
  void type;
  const classes = cn(
    baseClasses,
    sizeClasses[size],
    monospace ? "font-mono font-[425]" : "font-sans font-normal",
    className,
  );

  if (autosize) {
    return (
      <AutosizeTextArea
        {...props}
        className={classes}
        data-autosize="true"
        data-size={size}
        maxRows={maxRows}
        minRows={rows}
        ref={ref}
      />
    );
  }

  return (
    <textarea
      {...props}
      className={classes}
      data-autosize="false"
      data-slot="textarea"
      data-size={size}
      ref={ref}
      rows={rows}
    />
  );
}

function AutosizeTextArea({
  ref,
  ...props
}: TextareaAutosizeProps & { ref?: Ref<HTMLTextAreaElement> }) {
  const [element, setElement] = useState<HTMLTextAreaElement | null>(null);
  const [, setWidth] = useState<number>();
  const observerRef = useCallback((node: HTMLTextAreaElement | null) => {
    setElement(node);
  }, []);

  useLayoutEffect(() => {
    if (!element) return;
    const cleanup = setRef(ref, element);
    return () => {
      if (typeof cleanup === "function") cleanup();
      else setRef(ref, null);
    };
  }, [element, ref]);

  useEffect(() => {
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      setWidth(entry?.borderBoxSize?.[0]?.inlineSize ?? entry?.contentRect.width);
    });
    observer.observe(element, { box: "border-box" });
    return () => observer.disconnect();
  }, [element]);

  return <TextareaAutosize {...props} data-slot="textarea" ref={observerRef} />;
}

function setRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") return ref(value);
  if (ref) ref.current = value;
}

export { TextArea as Textarea };
