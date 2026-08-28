"use client";

import {
  useDisclosure,
  type AriaDisclosureProps,
  type DisclosureAria,
} from "@react-aria/disclosure";
import { usePress } from "@react-aria/interactions";
import { useDisclosureState, type DisclosureState } from "@react-stately/disclosure";
import {
  createContext,
  useContext,
  useRef,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";

import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Container, Stack, type StackProps } from "./layout";
import { Text } from "./text";

type DisclosureSize = "xs" | "sm" | "md";
type DisclosureVariant = "default" | "outline";

interface DisclosureProps
  extends Omit<AriaDisclosureProps, "isDisabled" | "isExpanded">, Omit<StackProps, "as"> {
  as?: "section" | "div";
  children: NonNullable<ReactNode>;
  expanded?: boolean;
  ref?: Ref<HTMLDivElement | null>;
  size?: DisclosureSize;
  variant?: DisclosureVariant;
}

type DisclosureContextValue = DisclosureAria & {
  context: { size: DisclosureSize; variant: DisclosureVariant };
  panelRef: RefObject<HTMLDivElement | null>;
  state: DisclosureState;
};

const DisclosureContext = createContext<DisclosureContextValue | null>(null);

function useDisclosureContext() {
  const context = useContext(DisclosureContext);
  if (!context) throw new Error("useDisclosureContext must be used within a Disclosure component");
  return context;
}

function DisclosureComponent({
  children,
  size = "md",
  variant = "default",
  ref,
  onExpandedChange,
  ...props
}: DisclosureProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const state = useDisclosureState({
    ...props,
    isExpanded: props.expanded,
    onExpandedChange,
  });
  const { buttonProps, panelProps } = useDisclosure(
    {
      ...props,
      isExpanded: props.expanded,
      onExpandedChange,
    },
    state,
    panelRef,
  );

  return (
    <DisclosureContext.Provider
      value={{
        buttonProps,
        context: { size, variant },
        panelProps,
        panelRef,
        state,
      }}
    >
      <Stack align="start" data-disclosure="" ref={ref} {...props}>
        {children}
      </Stack>
    </DisclosureContext.Provider>
  );
}

interface DisclosureTitleProps extends HTMLAttributes<HTMLButtonElement> {
  children?: NonNullable<ReactNode>;
  leadingItems?: ReactNode;
  trailingItems?: ReactNode;
}

const rowGapClasses: Record<DisclosureSize, string> = {
  xs: "gap-1",
  sm: "gap-1.5",
  md: "gap-2",
};

function Chevron({ direction }: { direction: "right" | "down" }) {
  return (
    <svg
      aria-hidden="true"
      className={cn("size-4 shrink-0", direction === "right" ? "rotate-90" : "rotate-180")}
      fill="currentColor"
      role="img"
      viewBox="0 0 16 16"
    >
      <path d="M8 5C8.21 5 8.4 5.09 8.54 5.24L12.79 9.74C13.08 10.04 13.07 10.51 12.76 10.79C12.46 11.08 11.99 11.07 11.7 10.76L8 6.84L4.29 10.76C4.01 11.07 3.54 11.08 3.24 10.79C2.93 10.51 2.92 10.04 3.2 9.74L7.45 5.24C7.6 5.09 7.79 5 8 5Z" />
    </svg>
  );
}

function Title({
  children,
  className,
  leadingItems,
  trailingItems,
  ...rest
}: DisclosureTitleProps) {
  const { buttonProps, context, state } = useDisclosureContext();
  const { isDisabled, ...restButtonProps } = buttonProps;
  const { pressProps } = usePress(restButtonProps);
  const chevron = <Chevron direction={state.isExpanded ? "down" : "right"} />;

  return (
    <div
      className={cn(
        "flex w-full items-center justify-start rounded-[6px] pr-1 hover:bg-[var(--scraps-button-transparent-hover)] active:bg-[var(--scraps-button-transparent-active)]",
        leadingItems && "pl-1",
        rowGapClasses[context.size],
      )}
    >
      {leadingItems}
      <Button
        {...pressProps}
        {...rest}
        className={cn(
          "grow justify-start pl-1 hover:!bg-transparent active:!bg-transparent",
          className,
        )}
        disabled={isDisabled}
        icon={leadingItems ? undefined : chevron}
        size={context.size}
        variant="transparent"
      >
        {leadingItems ? (
          <span className="flex items-center gap-1">
            {children}
            {chevron}
          </span>
        ) : (
          children
        )}
      </Button>
      {trailingItems}
    </div>
  );
}

interface DisclosureContentProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

const outlinePadding: Record<DisclosureSize, "sm" | "md" | "lg"> = {
  xs: "sm",
  sm: "md",
  md: "lg",
};
const outlineRadius: Record<DisclosureSize, "md" | "lg" | "xl"> = {
  xs: "md",
  sm: "lg",
  md: "xl",
};
const alignedPaddingClasses: Record<DisclosureSize, string> = {
  xs: "p-1 pl-[22px]",
  sm: "p-1.5 pl-[26px]",
  md: "p-2 pl-[26px]",
};

function Content({ children, className, ...props }: DisclosureContentProps) {
  const { context, panelProps, panelRef } = useDisclosureContext();

  if (context.variant === "outline") {
    return (
      <Container
        {...panelProps}
        {...props}
        ref={panelRef}
        border="primary"
        className={className}
        padding={outlinePadding[context.size]}
        radius={outlineRadius[context.size]}
        width="100%"
      >
        {children}
      </Container>
    );
  }

  return (
    <Container
      {...panelProps}
      {...props}
      ref={panelRef}
      className={cn(alignedPaddingClasses[context.size], className)}
      width="100%"
    >
      <Text as="div" size={context.size}>
        {children}
      </Text>
    </Container>
  );
}

export const Disclosure = Object.assign(DisclosureComponent, {
  Content,
  Title,
});
