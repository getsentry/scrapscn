import { cn } from "../../lib/utils";
import { IconChevron } from "./icons";

type IconCmp = React.ComponentType<{ className?: string }>;

/**
 * The secondary (contextual) sidebar that sits between the rail and the main
 * content. `title` renders the header row with a collapse/pin affordance.
 * Compose the body from <SidebarNav>, <SidebarItem>, <SidebarSection>, etc.
 *
 * The header chevron has two looks driven by `pinned`:
 * - `pinned` (docked): a neutral `«` collapse button.
 * - not pinned (hover flyout): a filled blurple `»` **pin-open** button.
 */
export function SecondarySidebar({
  title,
  children,
  className,
  pinned = true,
  onToggle,
  toggleRef,
  controls,
}: {
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** True when docked; false when shown as a temporary hover flyout. */
  pinned?: boolean;
  /** Toggle the panel: collapse when pinned, pin-open when a flyout. */
  onToggle?: () => void;
  toggleRef?: React.Ref<HTMLButtonElement>;
  controls?: string;
}) {
  return (
    <aside
      aria-label="Secondary navigation"
      className={cn(
        "flex h-full w-[188px] shrink-0 flex-col border-r border-border bg-muted",
        className,
      )}
    >
      {title && (
        // Section name — shares the 53px top row with the logo + page headers.
        <div className="flex h-[53px] shrink-0 items-center justify-between border-b border-border pr-2 pl-4">
          <span className="truncate text-sm font-medium">{title}</span>
          {pinned ? (
            <button
              ref={toggleRef}
              aria-controls={controls}
              aria-expanded={pinned}
              type="button"
              aria-label="Collapse sidebar"
              onClick={onToggle}
              className="flex size-8 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-nav-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              <IconChevron direction="left" isDouble className="size-4" />
            </button>
          ) : (
            <button
              ref={toggleRef}
              aria-controls={controls}
              aria-expanded={pinned}
              type="button"
              aria-label="Keep sidebar open"
              onClick={onToggle}
              className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-chonk transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-ring"
            >
              <IconChevron direction="right" isDouble className="size-4" />
            </button>
          )}
        </div>
      )}
      <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-1 py-2">
        {children}
      </div>
    </aside>
  );
}

/** A group of sidebar rows. */
export function SidebarNav({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("flex flex-col gap-0.5", className)}>{children}</div>;
}

/**
 * A labelled section header. Optional leading `icon` (e.g. a gold star) and an
 * optional trailing `action` node (e.g. a collapse chevron).
 */
export function SidebarSection({
  title,
  icon: Icon,
  iconClassName,
  action,
  children,
}: {
  title: React.ReactNode;
  icon?: IconCmp;
  iconClassName?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="mt-3 flex flex-col gap-0.5">
      <div className="flex items-center gap-2 px-2 py-1.5">
        {Icon && <Icon className={cn("size-4 shrink-0", iconClassName)} />}
        <span className="text-sm font-semibold">{title}</span>
        {action && <span className="ml-auto flex items-center">{action}</span>}
      </div>
      {children}
    </div>
  );
}

/** A count / status pill shown at the trailing edge of a row (e.g. "99+"). */
export function SidebarCount({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-auto shrink-0 rounded-full bg-muted px-1.5 text-sm font-medium text-muted-foreground">
      {children}
    </span>
  );
}

/**
 * A single sidebar row. Supports a leading icon (or any leading node via
 * `leading`), an active state, a trailing count/badge, and indentation for
 * nested rows.
 */
export function SidebarItem({
  children,
  icon: Icon,
  iconClassName,
  leading,
  active,
  indent,
  badge,
  className,
  ...props
}: {
  children: React.ReactNode;
  icon?: IconCmp;
  iconClassName?: string;
  leading?: React.ReactNode;
  active?: boolean;
  indent?: boolean;
  badge?: React.ReactNode;
} & React.ComponentProps<"a">) {
  const hasLeading = Icon || leading;
  const Component = props.href ? "a" : "span";
  return (
    <Component
      aria-current={active ? "page" : undefined}
      className={cn(
        // 36px (MD) rows, regular-weight 14px label. A transparent border keeps
        // sizing stable; only the selected row shows the accent border.
        "flex h-9 items-center gap-1 rounded-lg border border-transparent pr-1.5 pl-2 text-sm leading-none text-nav-fg transition-colors",
        props.href &&
          "hover:bg-nav-hover hover:text-nav-fg-hover focus-visible:outline-2 focus-visible:outline-ring active:bg-nav-active",
        indent && !hasLeading && "pl-3",
        active &&
          "border-nav-selected-border bg-nav-selected text-nav-fg-selected hover:bg-nav-selected-hover hover:text-nav-fg-selected",
        className,
      )}
      {...props}
    >
      {hasLeading && (
        <span className="flex size-8 shrink-0 items-center justify-center">
          {Icon ? <Icon className={cn("size-4", iconClassName)} /> : leading}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {badge}
    </Component>
  );
}

/** A thin divider between sidebar groups. */
export function SidebarSeparator({ className }: { className?: string }) {
  return <div className={cn("my-2 h-px bg-border", className)} />;
}
