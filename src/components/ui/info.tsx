"use client";

import { useState, type ComponentType, type ReactNode, type Ref, type SVGAttributes } from "react";

import { cn } from "../../lib/utils";
import { Text, type TextProps, type TextPrimitive } from "./text";
import { Tooltip, type TooltipProps } from "./tooltip";

type InfoTextPrimitive = Exclude<TextPrimitive, "legend">;
type DistributedOmit<Value, Keys extends PropertyKey> = Value extends unknown
  ? Omit<Value, Keys>
  : never;

type InfoTextBaseProps<T extends InfoTextPrimitive> = DistributedOmit<
  TextProps<T>,
  "title" | "underline" | "variant"
> & {
  title: ReactNode;
  variant?: TooltipProps["underlineColor"] | "inherit";
} & Pick<TooltipProps, "delay" | "maxWidth" | "position">;

export type InfoTextProps<T extends InfoTextPrimitive> =
  | (InfoTextBaseProps<T> & { mode?: undefined })
  | (DistributedOmit<InfoTextBaseProps<T>, "display" | "wrap"> & {
      mode: "overflowOnly";
    });

export function InfoText<T extends InfoTextPrimitive = "span">({
  children,
  delay,
  maxWidth,
  mode,
  position,
  title,
  ...textProps
}: InfoTextProps<T>) {
  const isOverflowOnly = mode === "overflowOnly";
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textPropsWithMode = {
    ...textProps,
    ...(isOverflowOnly ? { ellipsis: true as const } : {}),
  } as TextProps<T>;

  if (!title) return <Text {...textPropsWithMode}>{children}</Text>;

  return (
    <Tooltip
      delay={delay}
      isHoverable
      maxWidth={maxWidth}
      onOverflowChange={isOverflowOnly ? setIsOverflowing : undefined}
      position={position}
      showOnlyOnOverflow={isOverflowOnly}
      showUnderline={!isOverflowOnly}
      skipWrapper
      title={title}
      underlineColor={textProps.variant === "inherit" ? undefined : textProps.variant}
    >
      <Text
        {...textPropsWithMode}
        className={cn(
          "outline-hidden focus-visible:shadow-[0_0_0_0_var(--background),0_0_0_2px_var(--ring)]",
          textProps.className,
        )}
        tabIndex={isOverflowOnly && !isOverflowing ? undefined : 0}
      >
        {children}
      </Text>
    </Tooltip>
  );
}

type IconSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
type IconVariant =
  | "accent"
  | "danger"
  | "primary"
  | "promotion"
  | "secondary"
  | "success"
  | "warning"
  | "muted";

type SVGIconProps = Omit<SVGAttributes<SVGSVGElement>, "color" | "type"> & {
  legacySize?: string;
  ref?: Ref<SVGSVGElement>;
  size?: IconSize;
  variant?: IconVariant;
};

interface InfoTooltipProps extends SVGIconProps {
  title: ReactNode;
  position?: TooltipProps["position"];
}

const iconSizes: Record<IconSize, string> = {
  xs: "12px",
  sm: "14px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  "2xl": "72px",
};

const iconVariantColors: Record<IconVariant, string> = {
  accent: "var(--scraps-content-accent,#653de9)",
  danger: "var(--scraps-content-danger,#d50000)",
  muted: "var(--scraps-content-secondary,#6a6772)",
  primary: "var(--scraps-content-primary,#302e36)",
  promotion: "var(--scraps-content-promotion,#c8007e)",
  secondary: "var(--scraps-content-secondary,#6a6772)",
  success: "var(--scraps-content-success,#008900)",
  warning: "var(--scraps-info-graphics-warning-vibrant,#d59600)",
};

function SvgIcon({
  legacySize,
  size = "md",
  variant,
  ...props
}: SVGIconProps & { children: ReactNode }) {
  return (
    <svg
      role="img"
      viewBox="0 0 16 16"
      {...props}
      fill={variant ? iconVariantColors[variant] : "currentColor"}
      height={legacySize ?? iconSizes[size]}
      width={legacySize ?? iconSizes[size]}
    />
  );
}

function IconQuestion(props: SVGIconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M8 0C12.42 0 16 3.58 16 8C16 12.42 12.42 16 8 16C3.58 16 0 12.42 0 8C0 3.58 3.58 0 8 0ZM8 1.5C4.41 1.5 1.5 4.41 1.5 8C1.5 11.59 4.41 14.5 8 14.5C11.59 14.5 14.5 11.59 14.5 8C14.5 4.41 11.59 1.5 8 1.5ZM8 11C8.55 11 9 11.45 9 12C9 12.55 8.55 13 8 13C7.45 13 7 12.55 7 12C7 11.45 7.45 11 8 11ZM9.1 3C9.97 3 11 3.6 11 4.75V6.27C11 7.45 9.94 8 9.1 8H8.75V9.25C8.75 9.66 8.41 10 8 10C7.59 10 7.25 9.66 7.25 9.25V7.75C7.25 7.06 7.81 6.5 8.5 6.5H9.1C9.25 6.5 9.37 6.45 9.43 6.4C9.46 6.38 9.48 6.36 9.49 6.34C9.49 6.33 9.5 6.31 9.5 6.27V4.75C9.5 4.69 9.48 4.65 9.42 4.6C9.36 4.55 9.24 4.5 9.1 4.5H6.75C6.61 4.5 6.58 4.53 6.59 4.52C6.58 4.53 6.58 4.54 6.57 4.56C6.55 4.61 6.52 4.7 6.51 4.83C6.5 4.96 6.5 5.09 6.5 5.25C6.5 5.66 6.16 6 5.75 6C5.34 6 5 5.66 5 5.25C5 4.98 4.99 4.45 5.18 3.98C5.29 3.73 5.47 3.47 5.76 3.27C6.05 3.08 6.39 3 6.75 3H9.1Z" />
    </SvgIcon>
  );
}

function IconLock({ locked = false, ...props }: SVGIconProps & { locked?: boolean }) {
  return (
    <SvgIcon {...props}>
      {locked ? (
        <path d="M8 0C10.49 0 12.5 2.01 12.5 4.5V6.52C13.35 6.64 14 7.37 14 8.25V12.75C14 13.72 13.22 14.5 12.25 14.5H3.75C2.78 14.5 2 13.72 2 12.75V8.25C2 7.37 2.65 6.64 3.5 6.52V4.5C3.5 2.01 5.51 0 8 0ZM3.75 8C3.61 8 3.5 8.11 3.5 8.25V12.75C3.5 12.89 3.61 13 3.75 13H12.25C12.39 13 12.5 12.89 12.5 12.75V8.25C12.5 8.11 12.39 8 12.25 8H3.75ZM8 1.5C6.34 1.5 5 2.84 5 4.5V6.5H11V4.5C11 2.84 9.66 1.5 8 1.5Z" />
      ) : (
        <path d="M11 0C13.49 0 15.5 2.01 15.5 4.5V7.25C15.5 7.66 15.16 8 14.75 8C14.34 8 14 7.66 14 7.25V4.5C14 2.84 12.66 1.5 11 1.5C9.34 1.5 8 2.84 8 4.5V6.5H10.25C11.22 6.5 12 7.28 12 8.25V12.75C12 13.72 11.22 14.5 10.25 14.5H1.75C0.78 14.5 0 13.72 0 12.75V8.25C0 7.28 0.78 6.5 1.75 6.5H6.5V4.5C6.5 2.01 8.51 0 11 0ZM1.75 8C1.61 8 1.5 8.11 1.5 8.25V12.75C1.5 12.89 1.61 13 1.75 13H10.25C10.39 13 10.5 12.89 10.5 12.75V8.25C10.5 8.11 10.39 8 10.25 8H1.75Z" />
      )}
    </SvgIcon>
  );
}

function IconWithTooltip({
  "aria-label": ariaLabel,
  icon: Icon,
  position,
  title,
  ...props
}: InfoTooltipProps & { icon: ComponentType<SVGIconProps> }) {
  return (
    <Tooltip isHoverable position={position} skipWrapper title={title}>
      <span
        aria-label={ariaLabel}
        className="inline-flex rounded-full outline-hidden focus-visible:shadow-[0_0_0_0_var(--background),0_0_0_2px_var(--ring)]"
        role="img"
        tabIndex={0}
      >
        <Icon {...props} aria-hidden />
      </span>
    </Tooltip>
  );
}

export function InfoTip(props: InfoTooltipProps) {
  return <IconWithTooltip {...props} aria-label="More information" icon={IconQuestion} />;
}

function LockIcon(props: SVGIconProps) {
  return <IconLock {...props} locked />;
}

export function DisabledTip(props: InfoTooltipProps) {
  return <IconWithTooltip {...props} aria-label="Disabled" icon={LockIcon} />;
}
