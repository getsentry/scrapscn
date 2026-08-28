"use client";

import { useRef, useState, type ReactNode } from "react";

import { t } from "../../lib/scraps-locale";
import { cn } from "../../lib/utils";
import { Button, type ButtonProps } from "./button";
import { ExternalLink, Link } from "./link";

type AlertVariant = "danger" | "info" | "muted" | "success" | "warning";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant: AlertVariant;
  defaultExpanded?: boolean;
  expand?: ReactNode;
  handleExpandChange?: (isExpanded: boolean) => void;
  icon?: ReactNode;
  showIcon?: boolean;
  system?: boolean;
  trailingItems?: ReactNode;
}

const variantClasses: Record<AlertVariant, string> = {
  info: "[--alert-background:var(--scraps-alert-info-background)] [--alert-border:var(--scraps-alert-info-border)] [--alert-icon-background:#7553ff] [--alert-icon-color:#fff]",
  danger:
    "[--alert-background:var(--scraps-alert-danger-background)] [--alert-border:var(--scraps-alert-danger-border)] [--alert-icon-background:#ff002b] [--alert-icon-color:#fff]",
  warning:
    "[--alert-background:var(--scraps-alert-warning-background)] [--alert-border:var(--scraps-alert-warning-border)] [--alert-icon-background:#ffce00] [--alert-icon-color:#000]",
  success:
    "[--alert-background:var(--scraps-alert-success-background)] [--alert-border:var(--scraps-alert-success-border)] [--alert-icon-background:#00f261] [--alert-icon-color:#000]",
  muted:
    "[--alert-background:transparent] [--alert-border:var(--scraps-theme-border-primary)] [--alert-icon-background:var(--scraps-theme-surface500)] [--alert-icon-color:var(--scraps-content-primary)]",
};

const glyphPaths: Record<AlertVariant, string> = {
  warning:
    "M6.81 0.65C7.26 -0.16 8.38 -0.21 8.91 0.5L9.01 0.65L15.66 12.86C16.12 13.69 15.52 14.71 14.57 14.71H1.25C0.3 14.71 -0.3 13.69 0.15 12.86L6.81 0.65ZM1.67 13.21H14.15L7.91 1.77L1.67 13.21ZM7.91 9.71C8.46 9.71 8.91 10.15 8.91 10.71C8.91 11.26 8.46 11.71 7.91 11.71C7.36 11.71 6.91 11.26 6.91 10.71C6.91 10.15 7.36 9.71 7.91 9.71ZM7.91 4.71C8.32 4.71 8.66 5.04 8.66 5.46V7.96C8.66 8.37 8.32 8.71 7.91 8.71C7.5 8.71 7.16 8.37 7.16 7.96V5.46C7.16 5.04 7.5 4.71 7.91 4.71Z",
  success:
    "M13.72 3.22C14.01 2.93 14.49 2.93 14.78 3.22C15.07 3.51 15.07 3.99 14.78 4.28L6.53 12.53C6.24 12.82 5.76 12.82 5.47 12.53L1.22 8.28C0.93 7.99 0.93 7.51 1.22 7.22C1.51 6.93 1.99 6.93 2.28 7.22L6 10.94L13.72 3.22Z",
  danger:
    "M8 0C12.42 0 16 3.58 16 8C16 12.42 12.42 16 8 16C3.58 16 0 12.42 0 8C0 3.58 3.58 0 8 0ZM3.97 13.09C5.07 13.97 6.48 14.5 8 14.5C11.59 14.5 14.5 11.59 14.5 8C14.5 6.48 13.97 5.07 13.09 3.97L3.97 13.09ZM8 1.5C4.41 1.5 1.5 4.41 1.5 8C1.5 9.52 2.03 10.92 2.91 12.03L12.03 2.91C10.92 2.03 9.52 1.5 8 1.5Z",
  info: "M8 0C12.42 0 16 3.58 16 8C16 12.42 12.42 16 8 16C3.58 16 0 12.42 0 8C0 3.58 3.58 0 8 0ZM8 1.5C4.41 1.5 1.5 4.41 1.5 8C1.5 11.59 4.41 14.5 8 14.5C11.59 14.5 14.5 11.59 14.5 8C14.5 4.41 11.59 1.5 8 1.5ZM8 7C8.41 7 8.75 7.34 8.75 7.75V11.25C8.75 11.66 8.41 12 8 12C7.59 12 7.25 11.66 7.25 11.25V7.75C7.25 7.34 7.59 7 8 7ZM8 4C8.55 4 9 4.45 9 5C9 5.55 8.55 6 8 6C7.45 6 7 5.55 7 5C7 4.45 7.45 4 8 4Z",
  muted:
    "M8 0C12.42 0 16 3.58 16 8C16 12.42 12.42 16 8 16C3.58 16 0 12.42 0 8C0 3.58 3.58 0 8 0ZM8 1.5C4.41 1.5 1.5 4.41 1.5 8C1.5 11.59 4.41 14.5 8 14.5C11.59 14.5 14.5 11.59 14.5 8C14.5 4.41 11.59 1.5 8 1.5ZM8 7C8.41 7 8.75 7.34 8.75 7.75V11.25C8.75 11.66 8.41 12 8 12C7.59 12 7.25 11.66 7.25 11.25V7.75C7.25 7.34 7.59 7 8 7ZM8 4C8.55 4 9 4.45 9 5C9 5.55 8.55 6 8 6C7.45 6 7 5.55 7 5C7 4.45 7.45 4 8 4Z",
};

function AlertGlyph({ variant }: { variant: AlertVariant }) {
  return (
    <svg role="img" viewBox="0 0 16 16" className="size-4 fill-current">
      <path d={glyphPaths[variant]} />
    </svg>
  );
}

function Chevron({ direction }: { direction: "down" | "right" | "up" }) {
  const rotation = direction === "right" ? 90 : direction === "down" ? 180 : 0;
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="size-4 fill-current"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <path d="M8 5C8.21 5 8.4 5.09 8.54 5.24L12.79 9.74C13.08 10.04 13.07 10.51 12.76 10.79C12.46 11.08 11.99 11.07 11.7 10.76L8 6.84L4.29 10.76C4.01 11.07 3.54 11.08 3.24 10.79C2.93 10.51 2.92 10.04 3.2 9.74L7.45 5.24C7.6 5.09 7.79 5 8 5Z" />
    </svg>
  );
}

export function Alert({
  icon,
  system,
  expand,
  trailingItems,
  className,
  children,
  variant,
  defaultExpanded = false,
  handleExpandChange,
  showIcon = true,
  onClick,
  ...props
}: AlertProps) {
  const showExpand = expand !== undefined && expand !== null;
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const expandRef = useRef<HTMLDivElement>(null);

  function setExpanded(next: boolean) {
    setIsExpanded(next);
    handleExpandChange?.(next);
  }

  function handleClick(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === expandRef.current || expandRef.current?.contains(event.target as Node)) {
      return;
    }
    if (showExpand) setExpanded(!isExpanded);
  }

  return (
    <div
      {...props}
      className={cn(
        `ref-${variant}`,
        "[container-type:inline-size] relative grid min-h-11 w-full gap-x-3 gap-y-0 overflow-hidden border-solid border-[var(--alert-border)] [background-image:linear-gradient(var(--alert-background)),linear-gradient(var(--scraps-theme-surface500))] py-2 text-[var(--scraps-content-primary)] [&_a:not([role=button])]:underline",
        trailingItems && showExpand
          ? "grid-cols-[1fr_auto_min-content]"
          : trailingItems
            ? "grid-cols-[1fr_auto]"
            : showExpand
              ? "grid-cols-[1fr_min-content]"
              : "grid-cols-[1fr]",
        system ? "rounded-none border-x-0 border-t-0 border-b" : "rounded-md border",
        showExpand && "cursor-pointer",
        showIcon ? "pr-3 pl-14" : "px-3",
        variantClasses[variant],
        className,
      )}
      onClick={onClick ?? handleClick}
    >
      {showIcon ? (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-11 border-r border-[var(--alert-border)] bg-[var(--alert-icon-background)]" />
          <div
            className="absolute top-3 left-3 flex size-5 items-center justify-center text-[var(--alert-icon-color)]"
            onClick={handleClick}
          >
            {icon ?? <AlertGlyph variant={variant} />}
          </div>
        </>
      ) : null}
      <div className="place-content-center py-1 leading-[1.4]">{children}</div>
      {trailingItems ? (
        <div
          className="col-[1/-1] row-start-2 grid min-h-7 auto-cols-max grid-flow-col grid-rows-[100%] justify-items-start gap-2 py-0.5 text-sm @[512px]:items-start @[512px]:[grid-area:auto] [&>svg]:flex [&>svg]:size-4 [&>svg]:self-center"
          onClick={(event) => event.stopPropagation()}
        >
          {trailingItems}
        </div>
      ) : null}
      {showExpand ? (
        <div className="flex items-center self-start">
          <Button
            size="zero"
            variant="transparent"
            icon={<Chevron direction={isExpanded ? "up" : "down"} />}
            aria-label={isExpanded ? t("Collapse") : t("Expand")}
            onClick={() => setExpanded(!isExpanded)}
          />
        </div>
      ) : null}
      {isExpanded ? (
        <div
          ref={expandRef}
          className={cn(
            "col-[1/-1] cursor-auto self-start text-[var(--scraps-content-secondary)] @[768px]:row-start-2",
            trailingItems ? "row-start-3" : "row-start-2",
          )}
        >
          {expand}
        </div>
      ) : null}
    </div>
  );
}

function AlertContainer(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("w-full [&>div]:mb-4", props.className)} />;
}

type DistributedOmit<T, Key extends PropertyKey> = T extends unknown ? Omit<T, Key> : never;

function AlertButton(props: DistributedOmit<ButtonProps, "size">) {
  return <Button {...props} size="zero" />;
}

Alert.Container = AlertContainer;
Alert.Button = AlertButton;

type BaseAlertLinkProps = Pick<AlertProps, "children" | "system" | "trailingItems" | "variant">;

interface ExternalAlertLinkProps extends BaseAlertLinkProps {
  href: string;
  openInNewTab: boolean;
  onClick?: never;
  to?: never;
}

interface InternalAlertLinkProps extends BaseAlertLinkProps {
  to: string;
  href?: never;
  onClick?: never;
  openInNewTab?: never;
}

interface ManualAlertLinkProps extends BaseAlertLinkProps {
  onClick: React.MouseEventHandler<HTMLAnchorElement>;
  href?: never;
  openInNewTab?: never;
  to?: never;
}

type AlertLinkProps = ExternalAlertLinkProps | InternalAlertLinkProps | ManualAlertLinkProps;

const alertLinkClasses: Record<AlertVariant, string> = {
  info: "decoration-[var(--scraps-theme-blue200)] hover:decoration-[var(--scraps-theme-blue500)]",
  success:
    "decoration-[var(--scraps-theme-green200)] hover:decoration-[var(--scraps-theme-green500)]",
  muted: "decoration-[var(--scraps-theme-border-primary)] hover:decoration-current",
  warning:
    "decoration-[var(--scraps-theme-yellow200)] hover:decoration-[var(--scraps-theme-yellow500)]",
  danger: "decoration-[var(--scraps-theme-red200)] hover:decoration-[var(--scraps-theme-red500)]",
};

export function AlertLink(props: AlertLinkProps): ReactNode {
  const className = cn(
    "block w-full cursor-pointer underline transition-[border-color] duration-200",
    alertLinkClasses[props.variant],
  );
  const alertProps: AlertProps = {
    variant: props.variant,
    system: props.system,
    trailingItems: props.trailingItems ?? <Chevron direction="right" />,
  };

  if ("href" in props) {
    return (
      <ExternalLink className={className} href={props.href} openInNewTab={props.openInNewTab}>
        <Alert {...alertProps}>{props.children}</Alert>
      </ExternalLink>
    );
  }

  if ("onClick" in props) {
    return (
      <Link className={className} to="" onClick={props.onClick}>
        <Alert {...alertProps}>{props.children}</Alert>
      </Link>
    );
  }

  return (
    <Link className={className} to={props.to}>
      <Alert {...alertProps}>{props.children}</Alert>
    </Link>
  );
}

function AlertLinkContainer(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("[&>a]:mb-4", props.className)} />;
}

AlertLink.Container = AlertLinkContainer;
