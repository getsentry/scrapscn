"use client";

import * as React from "react";

import { IconChevron } from "./icons";

/**
 * A collapsible labelled section ("Tab Section Secondary Accordion"). The
 * header is a 36px row with a disclosure chevron in a 24px leading slot, a
 * medium-weight heading, and optional trailing `actions` (revealed on hover).
 * Toggling shows or hides the body rows. Use for groups a user can fold away;
 * use {@link SidebarSection} for a static, always-open group.
 *
 * Client component (owns open/closed state), so compose it with server-rendered
 * <SidebarItem> children passed in.
 */
export function SidebarAccordion({
  title,
  defaultOpen = true,
  actions,
  children,
}: {
  title: React.ReactNode;
  defaultOpen?: boolean;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="mt-1 flex flex-col gap-0.5">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="group flex h-9 items-center gap-1 rounded-lg pr-1.5 pl-2 text-nav-fg-selected transition-colors outline-none hover:bg-nav-hover focus-visible:ring-2 focus-visible:ring-nav-focus"
      >
        <span className="flex size-6 shrink-0 items-center justify-center">
          <IconChevron
            direction={open ? "down" : "right"}
            className="size-4 text-muted-foreground transition-transform"
          />
        </span>
        <span className="flex-1 truncate text-left text-sm font-medium">{title}</span>
        {actions && (
          <span className="flex items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
            {actions}
          </span>
        )}
      </button>
      {open && <div className="flex flex-col gap-0.5">{children}</div>}
    </div>
  );
}
