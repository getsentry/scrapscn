"use client";

import PlatformIcon from "platformicons/build/platformIcon";
import { type HTMLAttributes, type ReactNode, type Ref } from "react";

import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Link } from "./link";
import { Tooltip, type TooltipProps } from "./tooltip";
import { useTranslation } from "./translation-context";
import { useIsInsideInteractiveElement } from "./use-is-inside-interactive-element";

type FeatureBadgeType = "alpha" | "beta" | "new" | "experimental" | "internal";
type BadgeVariant =
  | "muted"
  | "internal"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "highlight"
  | "promotion"
  | FeatureBadgeType;
type TagVariant = "muted" | "info" | "promotion" | "danger" | "warning" | "success";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant: BadgeVariant;
}

const badgeClasses: Record<BadgeVariant, string> = {
  alpha: "bg-[var(--scraps-badge-promotion-vibrant)] text-[var(--scraps-badge-on-vibrant-dark)]",
  beta: "bg-[var(--scraps-badge-warning-vibrant)] text-[var(--scraps-badge-on-vibrant-dark)]",
  danger: "bg-[var(--scraps-badge-danger-muted)] text-[var(--scraps-content-danger)]",
  experimental: "bg-[var(--scraps-badge-neutral-muted)] text-[var(--scraps-content-secondary)]",
  highlight: "bg-[var(--scraps-badge-accent-muted)] text-[var(--scraps-content-accent)]",
  info: "bg-[var(--scraps-badge-accent-muted)] text-[var(--scraps-content-accent)]",
  internal: "bg-[var(--scraps-badge-neutral-muted)] text-[var(--scraps-content-secondary)]",
  muted: "bg-[var(--scraps-badge-neutral-muted)] text-[var(--scraps-content-secondary)]",
  new: "bg-[var(--scraps-badge-success-vibrant)] text-[var(--scraps-badge-on-vibrant-dark)]",
  promotion: "bg-[var(--scraps-badge-promotion-muted)] text-[var(--scraps-content-promotion)]",
  success: "bg-[var(--scraps-badge-success-muted)] text-[var(--scraps-content-success)]",
  warning: "bg-[var(--scraps-badge-warning-muted)] text-[var(--scraps-content-warning)]",
};

function getBadgeClasses(variant: BadgeVariant) {
  const className = badgeClasses[variant];
  if (className === undefined) {
    throw new TypeError(`Unsupported badge variant: ${variant}`);
  }
  return className;
}

function Badge({ children, className, variant, ...props }: BadgeProps) {
  return (
    <span
      {...props}
      className={cn(
        "inline-flex h-5 items-center rounded-[5px] px-1 py-1 text-xs [line-height:initial] font-medium",
        getBadgeClasses(variant),
        className,
      )}
    >
      {children}
    </span>
  );
}

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  "data-test-id"?: string;
  variant: TagVariant;
  /** Icon on the left side. */
  icon?: ReactNode;
  /** Shows a clickable close icon on the right side. */
  onDismiss?: () => void;
  ref?: Ref<HTMLDivElement>;
}

const tagClasses: Record<TagVariant, string> = {
  danger: "bg-[var(--scraps-badge-danger-muted)] text-[var(--scraps-content-danger)]",
  info: "bg-[var(--scraps-badge-accent-muted)] text-[var(--scraps-content-accent)]",
  muted: "bg-[var(--scraps-theme-gray100)] text-[var(--scraps-content-secondary)]",
  promotion: "bg-[var(--scraps-badge-promotion-muted)] text-[var(--scraps-content-promotion)]",
  success: "bg-[var(--scraps-badge-success-muted)] text-[var(--scraps-content-success)]",
  warning: "bg-[var(--scraps-theme-yellow100)] text-[var(--scraps-content-warning)]",
};

function getTagClasses(variant: TagVariant) {
  const className = tagClasses[variant];
  if (className === undefined) {
    throw new TypeError(`Unsupported badge type: ${variant}`);
  }
  return className;
}

function BadgeIcon({
  children,
  className,
  height = 12,
  width = 12,
}: {
  children: ReactNode;
  className?: string;
  height?: number;
  width?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      className={cn("fill-current", className)}
      height={height}
      viewBox="0 0 16 16"
      width={width}
    >
      {children}
    </svg>
  );
}

function CloseIcon() {
  return (
    <BadgeIcon>
      <path d="M12.72 2.22C13.01 1.93 13.49 1.93 13.78 2.22C14.07 2.51 14.07 2.99 13.78 3.28L9.06 8L13.78 12.72C14.07 13.01 14.07 13.49 13.78 13.78C13.49 14.07 13.01 14.07 12.72 13.78L8 9.06L3.28 13.78C2.99 14.07 2.51 14.07 2.22 13.78C1.93 13.49 1.93 13.01 2.22 12.72L6.94 8L2.22 3.28C1.93 2.99 1.93 2.51 2.22 2.22C2.51 1.93 2.99 1.93 3.28 2.22L8 6.94L12.72 2.22Z" />
    </BadgeIcon>
  );
}

function Tag({
  ref,
  variant,
  icon,
  onDismiss,
  children,
  className,
  "data-test-id": testId,
  ...props
}: TagProps) {
  const variantClasses = getTagClasses(variant);
  const { t } = useTranslation();
  return (
    <div
      {...props}
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-[4px] px-2 text-xs",
        variantClasses,
        className,
      )}
      data-test-id={testId ?? "tag-background"}
      ref={ref}
    >
      {icon ? (
        <span className="inline-flex items-center gap-[inherit] [&_svg:not([width]):not([height])]:size-3">
          {icon}
        </span>
      ) : null}
      {children ? (
        <div className="flex min-w-0 items-center gap-1 overflow-hidden text-ellipsis whitespace-nowrap">
          {children}
        </div>
      ) : null}
      {onDismiss ? (
        <Button
          aria-label={t("Dismiss")}
          className="-mr-1 border-0 text-current hover:text-current"
          icon={<CloseIcon />}
          onClick={(event) => {
            event.preventDefault();
            onDismiss();
          }}
          size="zero"
          variant="link"
        />
      ) : null}
    </div>
  );
}

const defaultTitles = {
  alpha: "This feature is internal and available for QA purposes",
  beta: "This feature is in beta and may change",
  new: "This feature is new! Try it out and let us know what you think",
  experimental:
    "This feature is experimental! Try it out and let us know what you think. No promises!",
  debug: "This UI is for debugging purposes only",
} as const;

type FeatureType = keyof typeof defaultTitles;

const featureVariants = {
  alpha: "promotion",
  beta: "warning",
  new: "success",
  experimental: "muted",
  debug: "danger",
} as const satisfies Record<FeatureType, TagVariant>;

function FeatureIcon({ type }: { type: FeatureType }) {
  if (type === "new") {
    return (
      <BadgeIcon>
        <path d="M2.9 1.84C3.22 1.57 3.69 1.62 3.95 1.94C4.22 2.25 4.17 2.73 3.86 2.99C2.42 4.18 1.5 5.99 1.5 8C1.5 10.01 2.42 11.81 3.86 13.01C4.17 13.27 4.22 13.74 3.95 14.06C3.69 14.38 3.22 14.43 2.9 14.16C1.13 12.7 0 10.48 0 8C0 5.52 1.13 3.3 2.9 1.84ZM12.04 1.94C12.31 1.62 12.78 1.57 13.1 1.84C14.87 3.3 16 5.52 16 8C16 10.48 14.87 12.7 13.1 14.16C12.78 14.43 12.31 14.38 12.04 14.06C11.78 13.74 11.82 13.27 12.14 13.01C13.58 11.81 14.5 10.01 14.5 8C14.5 5.99 13.58 4.18 12.14 2.99C11.82 2.73 11.78 2.25 12.04 1.94ZM4.81 4.15C5.13 3.88 5.6 3.93 5.87 4.25C6.13 4.57 6.09 5.04 5.77 5.3C4.99 5.95 4.5 6.92 4.5 8C4.5 9.08 4.99 10.05 5.77 10.7C6.09 10.96 6.13 11.43 5.87 11.75C5.6 12.07 5.13 12.12 4.81 11.85C3.71 10.94 3 9.55 3 8C3 6.45 3.71 5.06 4.81 4.15ZM10.13 4.25C10.4 3.93 10.87 3.88 11.19 4.15C12.29 5.06 13 6.45 13 8C13 9.55 12.29 10.94 11.19 11.85C10.87 12.11 10.4 12.07 10.13 11.75C9.87 11.43 9.91 10.96 10.23 10.7C11.01 10.05 11.5 9.08 11.5 8C11.5 6.92 11.01 5.95 10.23 5.3C9.91 5.04 9.87 4.57 10.13 4.25ZM8 6C9.1 6 10 6.9 10 8C10 9.1 9.1 10 8 10C6.9 10 6 9.1 6 8C6 6.9 6.9 6 8 6Z" />
      </BadgeIcon>
    );
  }

  if (type === "debug") {
    return (
      <BadgeIcon>
        <path d="M9.25 9a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1 0-1.5zM9.25 6a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 1 1 0-1.5z" />
        <path d="M8 0a3 3 0 0 1 3 3h.019l2.81-1.874a.75.75 0 0 1 .832 1.248l-2.348 1.565.36 2.561h2.576a.75.75 0 0 1 0 1.5h-2.367l.167 1.194a5.1 5.1 0 0 1-.23 2.371l1.981 2.18a.75.75 0 0 1-1.11 1.01L12.07 12.97A5.08 5.08 0 0 1 8 15a5.08 5.08 0 0 1-4.07-2.032l-1.625 1.787a.75.75 0 0 1-1.11-1.01l1.984-2.182a5.1 5.1 0 0 1-.227-2.369L3.119 8H.75a.75.75 0 0 1 0-1.5h2.578l.359-2.558-2.353-1.568a.75.75 0 1 1 .832-1.248L4.976 3H5a3 3 0 0 1 3-3M4.437 9.402a3.599 3.599 0 1 0 7.127 0L10.877 4.5H5.123zM8 1.5A1.5 1.5 0 0 0 6.5 3h3A1.5 1.5 0 0 0 8 1.5" />
      </BadgeIcon>
    );
  }

  return (
    <BadgeIcon>
      <path d="M12.25 0.5C12.66 0.5 13 0.84 13 1.25C13 1.66 12.66 2 12.25 2H11.5V6.53L14.67 11.55C15.56 12.95 14.67 14.76 13.1 14.98C12.99 14.99 12.89 15 12.77 15H3.23L3.06 14.99C3.01 14.99 2.95 14.98 2.9 14.98C2.74 14.96 2.59 14.92 2.45 14.87C2.26 14.8 2.08 14.7 1.92 14.59C1.45 14.25 1.12 13.73 1.01 13.16C0.99 13.06 0.98 12.96 0.97 12.87C0.97 12.82 0.97 12.77 0.97 12.72C0.97 12.57 0.99 12.42 1.02 12.27C1.05 12.12 1.1 11.98 1.17 11.83C1.21 11.74 1.26 11.64 1.32 11.55L2.94 9L4.5 6.53V2H3.75C3.34 2 3 1.66 3 1.25C3 0.84 3.34 0.5 3.75 0.5H12.25ZM6 6.75C6 6.89 5.96 7.03 5.88 7.15L4.71 9H11.29L10.12 7.15C10.04 7.03 10 6.89 10 6.75V2H6V6.75Z" />
    </BadgeIcon>
  );
}

export interface FeatureBadgeProps {
  type: FeatureType;
  tooltipProps?: Omit<Partial<TooltipProps>, "isHoverable" | "skipWrapper">;
}

function FeatureBadge({ type, tooltipProps }: FeatureBadgeProps) {
  const { t } = useTranslation();
  const title = tooltipProps?.title ?? t(defaultTitles[type]);
  const { ref, isInsideInteractiveElement, isInteractiveElementFocusVisible } =
    useIsInsideInteractiveElement<HTMLDivElement>(undefined);

  return (
    <Tooltip
      title={title}
      position="right"
      {...tooltipProps}
      forceVisible={isInteractiveElementFocusVisible ? "delayed" : tooltipProps?.forceVisible}
      isHoverable
      skipWrapper
    >
      <Tag
        aria-label={type}
        className="w-5 shrink-0 justify-center p-0 focus-visible:shadow-[0_0_0_0_var(--background),0_0_0_2px_var(--ring)] focus-visible:outline-none"
        ref={ref}
        role="img"
        tabIndex={isInsideInteractiveElement ? undefined : 0}
        variant={featureVariants[type]}
      >
        <FeatureIcon type={type} />
      </Tag>
    </Tooltip>
  );
}

type AlertBadgeProps = {
  /** Displays the custom issue badge, which has no incident status. */
  isIssue?: boolean;
  /** IncidentStatus.OPENED, CLOSED, WARNING, or CRITICAL. */
  status?: 1 | 2 | 10 | 20;
  /** Includes the status label. */
  withText?: boolean;
};

type AlertBadgeStatus = NonNullable<AlertBadgeProps["status"]> | "issue";

const alertConfig: Record<AlertBadgeStatus, { className: string; icon: ReactNode; text: string }> =
  {
    issue: {
      className:
        "border border-[var(--scraps-theme-border-primary)] bg-[var(--background)] text-[var(--scraps-content-primary)]",
      icon: (
        <path d="M13.25 1C14.22 1 15 1.78 15 2.75V13.25C15 14.22 14.22 15 13.25 15H2.75C1.84 15 1.1 14.31 1.01 13.43L1 13.25V2.75C1 1.78 1.78 1 2.75 1H13.25ZM2.5 13.25L2.5 13.3C2.53 13.41 2.63 13.5 2.75 13.5H13.25C13.39 13.5 13.5 13.39 13.5 13.25V8.5H11.75C11.61 8.5 11.5 8.61 11.5 8.75V9.75C11.5 10.72 10.72 11.5 9.75 11.5H6.25C5.28 11.5 4.5 10.72 4.5 9.75V8.75C4.5 8.61 4.39 8.5 4.25 8.5H2.5V13.25ZM2.5 7H4.25C5.22 7 6 7.78 6 8.75V9.75C6 9.89 6.11 10 6.25 10H9.75C9.89 10 10 9.89 10 9.75V8.75C10 7.78 10.78 7 11.75 7H13.5V5.5H2.5V7ZM2.75 2.5C2.61 2.5 2.5 2.61 2.5 2.75V4H13.5V2.75C13.5 2.61 13.39 2.5 13.25 2.5H2.75Z" />
      ),
      text: "Issue",
    },
    20: {
      className:
        "bg-[var(--scraps-badge-danger-vibrant)] text-[var(--scraps-badge-on-vibrant-light)]",
      icon: (
        <path d="M9.18 0C9.43 0 9.66 0.12 9.8 0.32C9.94 0.52 9.97 0.78 9.89 1.01C9.23 2.81 9.5 4.55 9.96 5.89C10.1 5.55 10.25 5.22 10.43 4.91C11.01 3.93 11.96 3 13.25 3C13.47 3 13.68 3.1 13.82 3.27C13.97 3.44 14.03 3.66 13.99 3.88C13.64 5.88 13.88 6.8 14.17 7.55C14.48 8.36 15 9.24 15 10.84C15 12.89 13.91 14.22 12.58 14.99C11.27 15.75 9.72 16 8.59 16C4.83 16 2.43 14.6 1.47 12.25C0.56 9.98 1.12 7.11 2.59 4.39L2.66 4.29C2.83 4.07 3.11 3.96 3.39 4.01C3.72 4.08 3.96 4.34 4 4.67C4.1 5.59 4.46 6.53 4.92 7.26C4.65 5.5 4.98 3.97 5.6 2.77C6.03 1.93 6.61 1.25 7.22 0.78C7.82 0.32 8.51 0 9.18 0ZM8.09 2C7.68 2.33 7.26 2.82 6.93 3.45C6.26 4.75 5.98 6.64 6.94 8.96C7.04 9.2 7.01 9.46 6.87 9.67C6.73 9.88 6.5 10 6.25 10C5.72 10 5.24 9.76 4.85 9.46C4.46 9.15 4.09 8.73 3.78 8.26C3.51 7.87 3.28 7.43 3.07 6.96C2.43 8.78 2.36 10.43 2.86 11.69C3.51 13.28 5.2 14.5 8.59 14.5C9.54 14.5 10.81 14.28 11.82 13.7C12.79 13.13 13.5 12.25 13.5 10.84C13.5 9.6 13.14 9.06 12.77 8.09C12.46 7.29 12.23 6.36 12.35 4.9C12.13 5.08 11.92 5.34 11.72 5.67C11.27 6.45 11 7.44 11 8.25C11 8.59 10.77 8.88 10.45 8.97C10.12 9.06 9.78 8.92 9.61 8.64C8.94 7.53 7.63 4.97 8.09 2Z" />
      ),
      text: "Critical",
    },
    10: {
      className:
        "bg-[var(--scraps-badge-warning-vibrant)] text-[var(--scraps-badge-on-vibrant-dark)]",
      icon: (
        <path d="M6.81 0.65C7.26 -0.16 8.38 -0.21 8.91 0.5L9.01 0.65L15.66 12.86C16.12 13.69 15.52 14.71 14.57 14.71H1.25C0.3 14.71 -0.3 13.69 0.15 12.86L6.81 0.65ZM1.67 13.21H14.15L7.91 1.77L1.67 13.21ZM7.91 9.71C8.46 9.71 8.91 10.15 8.91 10.71C8.91 11.26 8.46 11.71 7.91 11.71C7.36 11.71 6.91 11.26 6.91 10.71C6.91 10.15 7.36 9.71 7.91 9.71ZM7.91 4.71C8.32 4.71 8.66 5.04 8.66 5.46V7.96C8.66 8.37 8.32 8.71 7.91 8.71C7.5 8.71 7.16 8.37 7.16 7.96V5.46C7.16 5.04 7.5 4.71 7.91 4.71Z" />
      ),
      text: "Warning",
    },
    1: {
      className:
        "bg-[var(--scraps-badge-success-vibrant)] text-[var(--scraps-badge-on-vibrant-dark)]",
      icon: (
        <path d="M13.72 3.22C14.01 2.93 14.49 2.93 14.78 3.22C15.07 3.51 15.07 3.99 14.78 4.28L6.53 12.53C6.24 12.82 5.76 12.82 5.47 12.53L1.22 8.28C0.93 7.99 0.93 7.51 1.22 7.22C1.51 6.93 1.99 6.93 2.28 7.22L6 10.94L13.72 3.22Z" />
      ),
      text: "Resolved",
    },
    2: {
      className:
        "bg-[var(--scraps-badge-success-vibrant)] text-[var(--scraps-badge-on-vibrant-dark)]",
      icon: (
        <path d="M13.72 3.22C14.01 2.93 14.49 2.93 14.78 3.22C15.07 3.51 15.07 3.99 14.78 4.28L6.53 12.53C6.24 12.82 5.76 12.82 5.47 12.53L1.22 8.28C0.93 7.99 0.93 7.51 1.22 7.22C1.51 6.93 1.99 6.93 2.28 7.22L6 10.94L13.72 3.22Z" />
      ),
      text: "Resolved",
    },
  };

function AlertBadge({ isIssue, status = 2, withText }: AlertBadgeProps) {
  const { t } = useTranslation();
  const effectiveStatus: AlertBadgeStatus = isIssue ? "issue" : status;
  const config = alertConfig[effectiveStatus];
  const text = t(config.text);

  return (
    <div className="flex items-center gap-3 px-1 py-[5px]" data-test-id="alert-badge">
      <div
        aria-label={withText ? undefined : text}
        className={cn(
          "flex size-[26px] items-center justify-center rounded-[4px]",
          config.className,
        )}
        role="presentation"
      >
        <BadgeIcon height={13} width={13}>
          {config.icon}
        </BadgeIcon>
      </div>
      {withText ? <div>{text}</div> : null}
    </div>
  );
}

type Deploy = {
  dateFinished: string;
  dateStarted: string;
  environment: string;
  id: string;
  name: string;
  url: string;
  version: string;
};

type DeployBadgeProps = {
  deploy: Deploy;
  orgSlug: string;
  projectId: number;
  version: string;
};

const compactTerminalReleaseGroup = /\([^()\s]+\)$/;

function formatReleaseSearch(version: string) {
  const releaseFilter = `release:${version}`;
  return compactTerminalReleaseGroup.test(version) ? releaseFilter.slice(0, -1) : releaseFilter;
}

function DeployBadge({ deploy, orgSlug, projectId, version }: DeployBadgeProps) {
  const { t } = useTranslation();
  const search = new URLSearchParams([
    ["environment", deploy.environment],
    ["project", String(projectId)],
    ["query", formatReleaseSearch(version)],
  ]);

  return (
    <Link to={`/organizations/${orgSlug}/issues/?${search.toString()}`}>
      <Tooltip skipWrapper title={t("Open In Issues")}>
        <Tag className="max-w-24" variant="info">
          {deploy.environment}
        </Tag>
      </Tooltip>
    </Link>
  );
}

type ProjectsBadgeProps = {
  /** When no platform is supplied, shows all projects instead of my projects. */
  allProjects?: boolean;
  /** Platform slugs; only the first two are shown. */
  projectPlatforms: string[];
};

function ProjectsBadge({ allProjects, projectPlatforms }: ProjectsBadgeProps) {
  let icons: ReactNode;

  switch (projectPlatforms.length) {
    case 0:
      icons = (
        <BadgeIcon className="size-4" height={16} width={16}>
          <path
            d={
              allProjects
                ? "M11.25 0C12.216 0 13 .784 13 1.75V3h1.25c.966 0 1.75.784 1.75 1.75v9.5A1.75 1.75 0 0 1 14.25 16h-9.5A1.75 1.75 0 0 1 3 14.25V13H1.75A1.75 1.75 0 0 1 0 11.25v-9.5C0 .784.784 0 1.75 0zm-6.5 4.5a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25zm7.5 6a.75.75 0 0 1 0 1.5h-5.5a.75.75 0 0 1 0-1.5zm-10.5-9a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25H3V4.75C3 3.784 3.784 3 4.75 3h6.75V1.75a.25.25 0 0 0-.25-.25zM12.25 7a.75.75 0 0 1 0 1.5H6.75a.75.75 0 0 1 0-1.5z"
                : "M11.25 0C12.22 0 13 0.78 13 1.75V3H14.25C15.22 3 16 3.78 16 4.75V14.25C16 15.22 15.22 16 14.25 16H4.75C3.78 16 3 15.22 3 14.25V13H1.75C0.78 13 0 12.22 0 11.25V1.75C0 0.78 0.78 0 1.75 0H11.25ZM4.75 4.5C4.61 4.5 4.5 4.61 4.5 4.75V14.25C4.5 14.39 4.61 14.5 4.75 14.5H14.25C14.39 14.5 14.5 14.39 14.5 14.25V4.75C14.5 4.61 14.39 4.5 14.25 4.5H4.75ZM12 10.5C12 11.88 10.88 13 9.5 13C8.12 13 7 11.88 7 10.5V10H12V10.5ZM1.75 1.5C1.61 1.5 1.5 1.61 1.5 1.75V11.25C1.5 11.39 1.61 11.5 1.75 11.5H3V4.75C3 3.78 3.78 3 4.75 3H11.5V1.75C11.5 1.61 11.39 1.5 11.25 1.5H1.75ZM7 7C7.55 7 8 7.45 8 8C8 8.55 7.55 9 7 9C6.45 9 6 8.55 6 8C6 7.45 6.45 7 7 7ZM12 7C12.55 7 13 7.45 13 8C13 8.55 12.55 9 12 9C11.45 9 11 8.55 11 8C11 7.45 11.45 7 12 7Z"
            }
          />
        </BadgeIcon>
      );
      break;
    case 1:
      icons = (
        <div className="absolute top-0 left-0 size-4 overflow-hidden rounded-[3px] border border-[var(--scraps-theme-border-muted)]">
          <PlatformIcon alt="" platform={projectPlatforms[0] ?? ""} size={14} />
        </div>
      );
      break;
    default:
      icons = (
        <>
          <div className="absolute top-0 right-1 size-3">
            <PlatformIcon alt="" platform={projectPlatforms[0] ?? ""} size={12} />
          </div>
          <div className="absolute right-0 bottom-0 size-3">
            <PlatformIcon alt="" platform={projectPlatforms[1] ?? ""} size={12} />
          </div>
        </>
      );
  }

  return (
    <div aria-hidden="true" className="relative flex size-4 shrink-0 items-center justify-center">
      {icons}
    </div>
  );
}

export { AlertBadge, Badge, DeployBadge, FeatureBadge, ProjectsBadge, Tag };
