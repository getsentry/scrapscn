import { cn } from "../../lib/utils";
import {
  IconIssues,
  IconCompass,
  IconDashboard,
  IconSiren,
  IconSettings,
  IconGraphLine,
  IconBroadcast,
  IconEllipsis,
} from "./icons";
import { SentryGlyph } from "./sentry-glyph";

type IconCmp = React.ComponentType<{ className?: string }>;

export type NavKey = "issues" | "explore" | "dashboards" | "monitors" | "insights" | "settings";

export type NavItem = { id: NavKey; label: string; icon: IconCmp };

/** The primary product nav shown in the left icon rail. */
export const PRODUCT_NAV: NavItem[] = [
  { id: "issues", label: "Issues", icon: IconIssues },
  { id: "explore", label: "Explore", icon: IconCompass },
  { id: "dashboards", label: "Dashboards", icon: IconDashboard },
  { id: "insights", label: "Insights", icon: IconGraphLine },
  { id: "monitors", label: "Monitors", icon: IconSiren },
  { id: "settings", label: "Settings", icon: IconSettings },
];

// "Tab Item Primary" — a 20px icon in a rounded box that carries the selection
// tint, with the label below. Rest / hover / active / focus × selected states
// all use the Sentry interactive/transparent nav tokens.
function RailButton({
  label,
  icon: Icon,
  active,
  onHover,
  onClick,
}: NavItem & { active?: boolean; onHover?: () => void; onClick?: () => void }) {
  return (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      onMouseEnter={onHover}
      onFocus={onHover}
      className={cn(
        "group flex w-[68px] flex-col items-center gap-1 rounded-md px-0.5 py-1 transition-colors outline-none",
        active ? "text-nav-fg-selected" : "text-nav-fg hover:text-nav-fg-hover",
      )}
    >
      <span
        className={cn(
          // 6px padding around the 20px icon → 32px square. A transparent
          // border on every state keeps sizing stable; only the selected box
          // shows an accent border (per the Tab Item Primary component).
          "flex items-center rounded-md border border-transparent p-1.5 transition-colors",
          "group-focus-visible:ring-2 group-focus-visible:ring-nav-focus",
          active
            ? "border-nav-selected-border bg-nav-selected group-hover:bg-nav-selected-hover group-active:bg-nav-selected-active"
            : "bg-transparent group-hover:bg-nav-hover group-active:bg-nav-active",
        )}
      >
        <Icon className="size-5" />
      </span>
      <span className="min-w-full text-center text-[11px] leading-none font-medium">{label}</span>
    </button>
  );
}

/**
 * The left icon rail — Sentry glyph, product nav, broadcast + overflow
 * utilities, and the user avatar. `active` highlights the current section.
 */
export function NavRail({
  active,
  items = PRODUCT_NAV,
  onItemHover,
  onRailHover,
  onItemClick,
  organization,
  footer,
}: {
  active?: NavKey;
  items?: NavItem[];
  organization?: React.ReactNode;
  footer?: React.ReactNode;
  /** Fired when a rail item is hovered/focused — drives the hover-peek panel. */
  onItemHover?: (key: NavKey) => void;
  /** Fired when the pointer enters any part of the rail, including the logo and padding. */
  onRailHover?: () => void;
  /** Fired when a rail item is clicked — use it to navigate to that section. */
  onItemClick?: (key: NavKey) => void;
}) {
  return (
    <aside
      aria-label="Product navigation rail"
      onMouseEnter={onRailHover}
      className="flex w-[76px] shrink-0 flex-col items-center border-r border-border bg-background"
    >
      {/* Org logo — shares the 53px top row with the sidebar + page headers. */}
      <div className="flex h-[53px] w-full shrink-0 items-center justify-center border-b border-border">
        {organization ?? (
          <div className="flex size-8 -translate-y-px items-center justify-center rounded-lg border border-[var(--scraps-button-primary-chonk)] bg-primary shadow-[0_2px_0_0_var(--scraps-button-primary-chonk)]">
            <SentryGlyph className="size-5 text-primary-foreground" />
          </div>
        )}
      </div>

      <nav
        aria-label="Products"
        className="flex min-h-0 flex-1 flex-col items-center gap-1 overflow-y-auto p-1 pt-2"
      >
        {items.map((it) => (
          <RailButton
            key={it.id}
            {...it}
            active={it.id === active}
            onHover={onItemHover ? () => onItemHover(it.id) : undefined}
            onClick={onItemClick ? () => onItemClick(it.id) : undefined}
          />
        ))}
      </nav>

      {/* Footer — embossed utility group (broadcasts + overflow) and avatar. */}
      {footer !== undefined ? (
        footer
      ) : (
        <div className="flex flex-col items-center gap-2 py-2">
          <div className="flex w-8 flex-col overflow-hidden rounded-md border border-chonk-neutral bg-background shadow-[0_1px_0_0_var(--color-chonk-neutral)]">
            <button
              disabled
              type="button"
              aria-label="Broadcasts"
              className="relative flex h-8 items-center justify-center text-nav-fg transition-colors hover:bg-nav-hover hover:text-nav-fg-hover"
            >
              <IconBroadcast className="size-4" />
              <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary" />
            </button>
            <div className="h-px w-full bg-chonk-neutral" />
            <button
              disabled
              type="button"
              aria-label="More"
              className="flex h-8 items-center justify-center text-nav-fg transition-colors hover:bg-nav-hover hover:text-nav-fg-hover"
            >
              <IconEllipsis className="size-4" />
            </button>
          </div>
          <button
            disabled
            type="button"
            aria-label="Your account"
            className="flex size-8 items-center justify-center rounded-md border border-chonk-neutral bg-background shadow-[0_1px_0_0_var(--color-chonk-neutral)] transition-colors hover:bg-nav-hover"
          >
            <span className="grid size-5 place-items-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              I
            </span>
          </button>
        </div>
      )}
    </aside>
  );
}
