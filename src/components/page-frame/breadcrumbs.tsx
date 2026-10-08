import * as React from "react";

import { cn } from "../../lib/utils";

export interface Crumb {
  label: React.ReactNode;
  href?: string;
}

/**
 * Topbar breadcrumbs ("Breadcrumb List"). A horizontal trail of 14px crumbs
 * separated by a forward slash; the last crumb is the current page
 * (foreground, medium weight, not a link), earlier crumbs are regular-weight
 * muted links.
 *
 * @example
 * <Breadcrumbs
 *   items={[
 *     { label: "Issues", href: "/issues" },
 *     { label: "SEER-123" },
 *   ]}
 * />
 */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <ol className="flex items-center gap-1">
        {items.map((crumb, i) => {
          const last = i === items.length - 1;
          return (
            <li
              key={i}
              className={cn(
                "min-w-0 items-center gap-1",
                last ? "flex" : "hidden @min-[992px]/ivy-frame:flex",
              )}
            >
              {crumb.href && !last ? (
                <a
                  href={crumb.href}
                  className="truncate text-sm font-normal text-muted-foreground transition-colors hover:text-foreground"
                >
                  {crumb.label}
                </a>
              ) : (
                <span
                  aria-current={last ? "page" : undefined}
                  className={cn(
                    "truncate text-sm",
                    last ? "font-medium text-foreground" : "font-normal text-muted-foreground",
                  )}
                >
                  {crumb.label}
                </span>
              )}
              {!last && (
                <span
                  aria-hidden
                  className="shrink-0 px-0.5 text-sm font-normal text-muted-foreground/60"
                >
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
