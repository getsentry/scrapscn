"use client";

import { useContext, type HTMLAttributes, type ReactNode, type Ref } from "react";
import type { DistributedOmit, SetRequired } from "type-fest";

import { Button, type ButtonProps } from "./button";
import { ControlContext } from "./compact-select-support";

type TriggerElement =
  | HTMLButtonElement
  | (Omit<HTMLButtonElement, "type"> & {
      type: "only use `Trigger.Button` or `Trigger.IconButton` for the trigger prop!";
    });

export type TriggerProps = Omit<HTMLAttributes<TriggerElement>, "children"> & {
  children: NonNullable<ReactNode>;
  ref?: Ref<TriggerElement>;
};

type DropdownButtonProps = DistributedOmit<ButtonProps, "onClick" | "type"> & {
  isOpen?: boolean;
  prefix?: ReactNode;
  showChevron?: boolean;
};

type ButtonTriggerProps = DistributedOmit<DropdownButtonProps, "children" | "ref"> & {
  children: NonNullable<ReactNode>;
  ref?: Ref<TriggerElement>;
};

type IconButtonTriggerProps = SetRequired<
  DistributedOmit<DropdownButtonProps, "ref" | "showChevron">,
  "aria-label" | "icon"
> & {
  children?: ReactNode;
  ref?: Ref<TriggerElement>;
};

function useContextProps() {
  const context = useContext(ControlContext);
  return {
    disabled: context.disabled,
    isOpen: context.overlayIsOpen,
    size: context.size,
  };
}

function ChevronIcon({ isOpen, size }: Pick<DropdownButtonProps, "isOpen" | "size">) {
  return (
    <svg
      aria-hidden="true"
      className={`${size === "zero" || size === "xs" ? "size-3" : "size-3.5"} shrink-0 ${isOpen ? "rotate-180" : ""}`}
      viewBox="0 0 16 16"
    >
      <path d="m3 6 5 5 5-5" fill="none" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

function DropdownButton({
  children,
  isOpen = false,
  prefix,
  ref,
  showChevron = true,
  size,
  className,
  ...props
}: DropdownButtonProps) {
  return (
    <Button
      aria-expanded={isOpen}
      aria-haspopup="true"
      className={`max-w-full ${className ?? ""}`}
      {...props}
      ref={ref}
      size={size}
    >
      <span className="flex min-w-0 items-center gap-1.5">
        {prefix ? <span className="font-medium after:content-[':']">{prefix}</span> : null}
        <span className="min-w-0 truncate">{children}</span>
        {showChevron ? <ChevronIcon isOpen={isOpen} size={size} /> : null}
      </span>
    </Button>
  );
}

export const OverlayTrigger = {
  Button({ ref, ...props }: ButtonTriggerProps) {
    return <DropdownButton {...useContextProps()} {...props} ref={ref as Ref<HTMLButtonElement>} />;
  },
  IconButton({ children, ref, ...props }: IconButtonTriggerProps) {
    void children;
    return (
      <DropdownButton
        {...useContextProps()}
        {...props}
        ref={ref as Ref<HTMLButtonElement>}
        showChevron={false}
      />
    );
  },
};
