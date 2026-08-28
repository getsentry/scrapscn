"use client";

import type { LocationDescriptor } from "history";
import {
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";

import { cn } from "../../lib/utils";
import { Grid, type GridProps } from "./layout";
import { Link, type LinkProps } from "./link";
import { IndeterminateLoader } from "./loader";
import { SizeProvider, useSizeContext } from "./size-context";
import { Tooltip, type TooltipProps } from "./tooltip";
import { useClickTracking, type AnalyticsProps } from "./tracking-context";

type ButtonVariant = "secondary" | "primary" | "danger" | "warning" | "link" | "transparent";
type ButtonSize = "zero" | "xs" | "sm" | "md";

interface ButtonTooltipProps extends Omit<TooltipProps, "children" | "skipWrapper" | "title"> {
  title?: TooltipProps["title"];
}

interface CommonButtonProps extends AnalyticsProps {
  busy?: boolean;
  icon?: ReactNode;
  size?: ButtonSize;
  tooltipProps?: ButtonTooltipProps;
  variant?: ButtonVariant;
}

type ButtonElementProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "label" | "size" | "title">;

interface BaseButtonProps extends CommonButtonProps, ButtonElementProps {
  "data-size"?: string;
  ref?: Ref<HTMLButtonElement>;
}

interface ButtonPropsWithoutAriaLabel extends BaseButtonProps {
  children: ReactNode;
}

interface ButtonPropsWithAriaLabel extends BaseButtonProps {
  "aria-label": string;
  children?: never;
}

export type ButtonProps = ButtonPropsWithoutAriaLabel | ButtonPropsWithAriaLabel;

type LinkElementProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "label" | "size" | "title" | "href" | "target"
>;

interface BaseLinkButtonProps extends CommonButtonProps, LinkElementProps {
  disabled?: boolean;
}

interface LinkButtonPropsWithHref extends BaseLinkButtonProps {
  href: string;
  external?: boolean;
}

interface LinkButtonPropsWithTo extends BaseLinkButtonProps {
  to: string | LocationDescriptor;
  openInNewTab?: boolean;
  preventScrollReset?: boolean;
  replace?: boolean;
}

export type LinkButtonProps = LinkButtonPropsWithHref | LinkButtonPropsWithTo;

function hasRouterDestination(
  props: LinkButtonPropsWithHref | LinkButtonPropsWithTo,
): props is LinkButtonPropsWithTo {
  return "to" in props && props.to !== undefined;
}

function hasHrefDestination(
  props: LinkButtonPropsWithHref | LinkButtonPropsWithTo,
): props is LinkButtonPropsWithHref {
  return "href" in props && props.href !== undefined;
}

type RouterButtonLinkProps = LinkProps & {
  busy?: boolean;
  rel?: string;
  target?: string;
  variant?: ButtonVariant;
};

function RouterButtonLink(props: RouterButtonLinkProps) {
  return <Link {...props} />;
}

export interface ButtonBarProps extends Omit<GridProps, "gap"> {
  children: NonNullable<ReactNode>;
  orientation?: "horizontal" | "vertical";
  size?: Exclude<ButtonSize, "zero">;
}

const iconSizeClasses: Record<ButtonSize, string> = {
  zero: "[&>svg]:size-3",
  xs: "[&>svg]:size-3",
  sm: "[&>svg]:size-3.5",
  md: "[&>svg]:size-3.5",
};

const buttonBaseClasses = [
  "group/button relative inline-flex cursor-pointer items-center justify-center whitespace-nowrap border-0 bg-transparent font-medium opacity-100",
  "[--button-chonk:var(--scraps-button-secondary-chonk)] [--button-content:var(--scraps-button-secondary-content)] [--button-surface:var(--scraps-button-secondary-surface)]",
  "text-[var(--button-content)]",
  "before:pointer-events-none before:absolute before:inset-0 before:top-[var(--button-lift-base)] before:block before:h-[calc(100%-var(--button-lift-base))] before:translate-y-[calc(-1*var(--button-lift-base))] before:rounded-[inherit] before:bg-[var(--button-chonk)] before:shadow-[0_var(--button-lift-base)_0_0_var(--button-chonk)] before:content-['']",
  "after:pointer-events-none after:absolute after:inset-0 after:block after:translate-y-[calc(-1*var(--button-lift))] after:rounded-[inherit] after:border after:border-[var(--button-chonk)] after:bg-[var(--button-surface)] after:transition-transform after:duration-[120ms] after:ease-[cubic-bezier(.8,-.4,.5,1)] after:content-['']",
  "hover:[--button-lift:calc(var(--button-lift-base)+1px)] active:[--button-lift:0px] disabled:[--button-lift:0px] aria-[busy=true]:[--button-lift:0px] aria-[checked=true]:[--button-lift:0px] aria-[disabled=true]:[--button-lift:0px] aria-[expanded=true]:[--button-lift:0px]",
  "disabled:cursor-not-allowed disabled:opacity-60 aria-[busy=true]:cursor-progress aria-[disabled=true]:cursor-not-allowed aria-[disabled=true]:opacity-60",
  "focus-visible:outline-hidden focus-visible:after:shadow-[0_var(--button-lift)_0_0_var(--button-chonk),0_var(--button-lift)_0_2px_var(--ring),0_0_0_2px_var(--ring)]",
  "aria-[checked=true]:after:transition-none aria-[expanded=true]:after:transition-none motion-reduce:after:duration-0",
].join(" ");

const buttonVariantClasses: Record<ButtonVariant, string> = {
  secondary: "",
  primary:
    "[--button-chonk:var(--scraps-button-primary-chonk)] [--button-content:#fff] [--button-surface:#7553ff] focus-visible:after:border-2 focus-visible:after:border-dotted focus-visible:after:border-white focus-visible:after:shadow-none",
  danger:
    "[--button-chonk:var(--scraps-button-danger-chonk)] [--button-content:#fff] [--button-surface:#ff002b] focus-visible:after:border-2 focus-visible:after:border-dotted focus-visible:after:border-white focus-visible:after:shadow-none",
  warning:
    "[--button-chonk:var(--scraps-button-warning-chonk)] [--button-content:#000] [--button-surface:#ffce00] focus-visible:after:border-2 focus-visible:after:border-dotted focus-visible:after:border-black focus-visible:after:shadow-none",
  transparent:
    "[--button-lift-base:0px] [--button-lift:0px] text-[var(--scraps-button-transparent-content)] before:hidden after:hidden focus-visible:[box-shadow:0_0_0_0_var(--background),0_0_0_2px_var(--ring)] [&:not(:disabled):not([aria-disabled=true]):not([aria-busy=true]):hover]:bg-[var(--scraps-button-transparent-hover)] [&:not(:disabled):not([aria-disabled=true]):not([aria-busy=true]):active:active]:bg-[var(--scraps-button-transparent-active)]",
  link: "h-auto min-h-0 min-w-0 [--button-lift-base:0px] [--button-lift:0px] bg-transparent p-0 text-[var(--scraps-button-link-content)] before:hidden after:hidden focus-visible:[box-shadow:0_0_0_0_var(--background),0_0_0_2px_var(--ring)]",
};

const buttonSizeClasses: Record<ButtonSize, string> = {
  zero: "h-6 min-h-6 [--button-lift-base:0px] [--button-lift:0px] rounded-[4px] px-1.5 py-1 text-xs/4",
  xs: "h-7 min-h-7 [--button-lift-base:1px] [--button-lift:1px] rounded-[5px] px-2 py-1.5 text-xs/4",
  sm: "h-8 min-h-8 [--button-lift-base:2px] [--button-lift:2px] rounded-[6px] px-3 py-2 text-sm/4",
  md: "h-9 min-h-9 [--button-lift-base:2px] [--button-lift:2px] rounded-[8px] px-4 py-2 text-sm/4",
};

const linkButtonSizeClasses: Record<ButtonSize, string> = {
  zero: "text-xs/4",
  xs: "text-xs/4",
  sm: "text-sm/4",
  md: "text-sm/4",
};

const squareSizeClasses: Record<ButtonSize, string> = {
  zero: "min-w-6 p-0",
  xs: "min-w-7 p-0",
  sm: "min-w-8 p-0",
  md: "min-w-9 p-0",
};

function hasVisibleChildren(children: ReactNode) {
  return Array.isArray(children)
    ? children.some((child) => Boolean(child) || String(child) === "0")
    : Boolean(children) || String(children) === "0";
}

function accessibleLabel(props: { "aria-label"?: string; children?: ReactNode }) {
  return props["aria-label"] ?? (typeof props.children === "string" ? props.children : undefined);
}

function buttonClassName({
  className,
  shape,
  size,
  variant,
}: {
  className?: string;
  shape: "rectangular" | "square";
  size: ButtonSize;
  variant: ButtonVariant;
}) {
  return cn(
    buttonBaseClasses,
    buttonVariantClasses[variant],
    variant === "link" ? linkButtonSizeClasses[size] : buttonSizeClasses[size],
    variant !== "link" && shape === "square" && squareSizeClasses[size],
    className,
  );
}

function ButtonContents({
  busy,
  children,
  icon,
  size,
}: Pick<CommonButtonProps, "busy" | "icon"> & {
  children?: ReactNode;
  size: ButtonSize;
}) {
  return (
    <span
      className="relative z-[1] flex h-full min-w-0 flex-1 translate-y-[calc(-1*var(--button-lift))] items-center justify-center overflow-hidden whitespace-nowrap transition-transform duration-[120ms] ease-[cubic-bezier(.8,-.4,.5,1)] group-aria-[busy=true]/button:overflow-visible group-aria-[checked=true]/button:transition-none group-aria-[expanded=true]/button:transition-none group-data-[variant=link]/button:translate-y-0 group-data-[variant=transparent]/button:translate-y-0 motion-reduce:duration-0"
      data-slot="button-content"
    >
      <span className="flex min-w-0 items-center justify-center group-aria-[busy=true]/button:invisible">
        {icon ? (
          <span
            aria-hidden="true"
            className={cn(
              "inline-flex shrink-0 group-data-[shape=rectangular]/button:mr-2 group-data-[shape=rectangular]/button:group-data-[size=xs]/button:mr-1.5 group-data-[shape=rectangular]/button:group-data-[size=zero]/button:mr-1.5",
              iconSizeClasses[size],
            )}
            data-button-icon=""
          >
            {icon}
          </span>
        ) : null}
        {children}
      </span>
      {busy ? (
        <span className="visible absolute inset-0 flex items-center justify-center">
          <IndeterminateLoader aria-hidden variant="monochrome" />
        </span>
      ) : null}
    </span>
  );
}

function ButtonTooltip({
  children,
  tooltipProps,
}: {
  children: ReactNode;
  tooltipProps?: ButtonTooltipProps;
}) {
  return (
    <Tooltip
      skipWrapper
      {...tooltipProps}
      disabled={!tooltipProps?.title}
      title={tooltipProps?.title}
    >
      {children}
    </Tooltip>
  );
}

export function Button({
  disabled,
  type = "button",
  tooltipProps,
  busy,
  size: explicitSize,
  variant = "secondary",
  className,
  children,
  icon,
  analyticsEventKey,
  analyticsEventName,
  analyticsParams,
  ...props
}: ButtonProps) {
  const contextSize = useSizeContext();
  const size = explicitSize ?? contextSize ?? "md";
  const shape = hasVisibleChildren(children) ? "rectangular" : "square";
  const buttonProps = {
    ...props,
    analyticsEventKey,
    analyticsEventName,
    analyticsParams,
    busy,
    children,
    disabled,
    variant,
  };
  const { handleClick } = useClickTracking(buttonProps, "button");

  return (
    <ButtonTooltip tooltipProps={tooltipProps}>
      <button
        aria-busy={busy}
        aria-disabled={disabled}
        aria-label={accessibleLabel({ ...props, children })}
        {...props}
        className={buttonClassName({ className, shape, size, variant })}
        data-slot="button"
        data-shape={shape}
        data-size={props["data-size"] ?? size}
        data-variant={variant}
        disabled={disabled}
        onClick={handleClick}
        role="button"
        type={type}
      >
        <ButtonContents busy={busy} icon={icon} size={size}>
          {children}
        </ButtonContents>
      </button>
    </ButtonTooltip>
  );
}

export function LinkButton({
  disabled,
  tooltipProps,
  size: explicitSize,
  variant = "secondary",
  className,
  children,
  icon,
  analyticsEventKey,
  analyticsEventName,
  analyticsParams,
  busy,
  ...props
}: LinkButtonProps) {
  const contextSize = useSizeContext();
  const size = explicitSize ?? contextSize ?? "md";
  const shape = hasVisibleChildren(children) ? "rectangular" : "square";
  const { handleClick } = useClickTracking(
    {
      ...props,
      analyticsEventKey,
      analyticsEventName,
      analyticsParams,
      busy,
      children,
      disabled,
      variant,
    },
    "link",
  );
  const sharedProps = {
    "aria-disabled": disabled,
    "aria-label": accessibleLabel({ ...props, children }),
    className: buttonClassName({ className, shape, size, variant }),
    "data-slot": "button",
    "data-shape": shape,
    "data-size": size,
    "data-variant": variant,
    role: "button",
  } as const;
  const content = (
    <ButtonContents icon={icon} size={size}>
      {children}
    </ButtonContents>
  );
  let link: ReactNode;

  if (hasRouterDestination(props)) {
    const { openInNewTab, ...linkProps } = props;
    link = (
      <RouterButtonLink
        {...linkProps}
        {...sharedProps}
        analyticsEventKey={analyticsEventKey}
        analyticsEventName={analyticsEventName}
        analyticsParams={analyticsParams}
        busy={busy}
        disabled={disabled}
        rel={openInNewTab ? "noreferrer noopener" : undefined}
        target={openInNewTab ? "_blank" : undefined}
        to={props.to}
      >
        {content}
      </RouterButtonLink>
    );
  } else {
    if (!hasHrefDestination(props)) return null;
    const { external, href, ...anchorProps } = props;
    link = (
      <a
        {...anchorProps}
        {...sharedProps}
        href={disabled ? undefined : href}
        onClick={handleClick}
        rel={external ? "noreferrer noopener" : undefined}
        target={external ? "_blank" : undefined}
      >
        {content}
      </a>
    );
  }

  return <ButtonTooltip tooltipProps={tooltipProps}>{link}</ButtonTooltip>;
}

export function ButtonBar({
  children,
  orientation = "horizontal",
  size,
  className,
  ...props
}: ButtonBarProps) {
  const content = (
    <Grid
      align="center"
      className={cn(
        "[&>.active]:z-[2] [&>:is([role=presentation],.dropdown,button,input,a)]:relative",
        orientation === "horizontal"
          ? [
              "[&>:first-child:not(:last-child)]:rounded-r-none",
              "[&>:first-child:not(:last-child)>.dropdown-actor>:is(button,a)]:rounded-r-none",
              "[&>:not(:first-child):not(:last-child)]:rounded-none",
              "[&>:not(:first-child):not(:last-child)[role=presentation]>:is(button,a)]:rounded-none",
              "[&>:not(:first-child):not(:last-child)>.dropdown-actor>:is(button,a)]:rounded-none",
              "[&>:is([role=presentation],.dropdown,a,input,button)+[role=presentation]>:is(button,a)]:-ml-px",
              "[&>:is([role=presentation],.dropdown,a,input,button)+:is(.dropdown,a,input,button):not(:last-child)]:-ml-px",
              "[&>:last-child:not(:first-child)]:-ml-px",
              "[&>:last-child:not(:first-child)]:rounded-l-none",
              "[&>:last-child:not(:first-child)[role=presentation]>:is(button,a)]:-ml-px",
              "[&>:last-child:not(:first-child)[role=presentation]>:is(button,a)]:rounded-l-none",
              "[&>:last-child:not(:first-child)>.dropdown-actor>:is(button,a)]:-ml-px",
              "[&>:last-child:not(:first-child)>.dropdown-actor>:is(button,a)]:rounded-l-none",
            ]
          : [
              "[&>:first-child:not(:last-child)]:rounded-b-none",
              "[&>:first-child:not(:last-child)>.dropdown-actor>:is(button,a)]:rounded-b-none",
              "[&>:not(:first-child):not(:last-child)]:rounded-none",
              "[&>:not(:first-child):not(:last-child)[role=presentation]>:is(button,a)]:rounded-none",
              "[&>:not(:first-child):not(:last-child)>.dropdown-actor>:is(button,a)]:rounded-none",
              "[&>:is([role=presentation],.dropdown,a,input,button)+[role=presentation]>:is(button,a)]:-mt-px",
              "[&>:is([role=presentation],.dropdown,a,input,button)+:is(.dropdown,a,input,button):not(:last-child)]:-mt-px",
              "[&>:last-child:not(:first-child)]:-mt-px",
              "[&>:last-child:not(:first-child)]:rounded-t-none",
              "[&>:last-child:not(:first-child)[role=presentation]>:is(button,a)]:-mt-px",
              "[&>:last-child:not(:first-child)[role=presentation]>:is(button,a)]:rounded-t-none",
              "[&>:last-child:not(:first-child)>.dropdown-actor>:is(button,a)]:-mt-px",
              "[&>:last-child:not(:first-child)>.dropdown-actor>:is(button,a)]:rounded-t-none",
            ],
        className,
      )}
      flow={orientation === "horizontal" ? "column" : "row"}
      gap="0"
      {...props}
    >
      {children}
    </Grid>
  );
  return size ? <SizeProvider size={size}>{content}</SizeProvider> : content;
}
