"use client";

import type { Query } from "history";
import { useCallback, type ReactNode } from "react";

import { tct } from "../../lib/scraps-locale";
import { cn } from "../../lib/utils";
import type { ButtonProps } from "./button";
import { Button, ButtonBar } from "./button";

/** Handles a cursor change with the target path, current query, and page direction. */
export type CursorHandler = (
  cursor: string | undefined,
  path: string,
  query: Query,
  delta: number,
) => void;

type PaginationProps = {
  caption?: ReactNode;
  className?: string;
  disabled?: boolean;
  onCursor?: CursorHandler;
  pageLinks?: string | null;
  paginationAnalyticsEvent?: (direction: string) => void;
  size?: ButtonProps["size"];
  to?: string;
};

type ParsedHeader = {
  cursor: string;
  href: string;
  results: boolean | null;
};

function parseLinkHeader(header: string | null): Record<string, ParsedHeader> {
  if (header === null || header === "") return {};

  const links: Record<string, ParsedHeader> = {};
  for (const value of header.split(",")) {
    const match = /<([^>]+)>; rel="([^"]+)"(?:; results="([^"]+)")?(?:; cursor="([^"]+)")?/.exec(
      value,
    );
    if (!match) continue;
    const [, href, rel, results, cursor] = match;
    links[rel!] = {
      cursor: cursor!,
      href: href!,
      results: results === "true" ? true : results === "false" ? false : null,
    };
  }
  return links;
}

function queryFromSearch(search: string): Query {
  const query: Query = {};
  for (const [key, value] of new URLSearchParams(search)) {
    const existing = query[key];
    query[key] =
      existing === undefined || existing === null
        ? value
        : Array.isArray(existing)
          ? [...existing, value]
          : [existing, value];
  }
  return query;
}

function searchFromQuery(query: Query): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) value.forEach((entry) => params.append(key, entry));
    else params.set(key, value);
  }
  const search = params.toString();
  return search ? `?${search}` : "";
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      aria-hidden="true"
      className={direction === "left" ? "rotate-[270deg]" : "rotate-90"}
      fill="currentColor"
      viewBox="0 0 16 16"
    >
      <path d="M8 5C8.21 5 8.4 5.09 8.54 5.24L12.79 9.74C13.08 10.04 13.07 10.51 12.76 10.79C12.46 11.08 11.99 11.07 11.7 10.76L8 6.84L4.29 10.76C4.01 11.07 3.54 11.08 3.24 10.79C2.93 10.51 2.92 10.04 3.2 9.74L7.45 5.24C7.6 5.09 7.79 5 8 5Z" />
    </svg>
  );
}

/** Renders the regular Scraps previous and next controls from an RFC 5988 Link header. */
export function Pagination({
  to,
  className,
  onCursor,
  paginationAnalyticsEvent,
  pageLinks,
  size = "sm",
  caption,
  disabled = false,
}: PaginationProps) {
  const defaultCursorHandler = useCallback<CursorHandler>((cursor, path, query) => {
    if (typeof window === "undefined") return;
    const nextQuery = { ...query, cursor };
    window.history.pushState(null, "", `${path}${searchFromQuery(nextQuery)}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);

  if (pageLinks === null || pageLinks === undefined) return null;

  const path = to ?? (typeof window === "undefined" ? "" : window.location.pathname);
  const query = typeof window === "undefined" ? {} : queryFromSearch(window.location.search);
  const links = parseLinkHeader(pageLinks);
  const previousDisabled = disabled || links.previous?.results === false;
  const nextDisabled = disabled || links.next?.results === false;
  const cursorHandler = onCursor ?? defaultCursorHandler;

  return (
    <div className={cn("mt-6 flex items-center justify-end", className)} data-test-id="pagination">
      {caption ? (
        <span className="mr-4 text-sm/5 text-[var(--scraps-content-secondary,#6a6772)]">
          {caption}
        </span>
      ) : null}
      <ButtonBar>
        <Button
          aria-label="Previous"
          disabled={previousDisabled}
          icon={<Chevron direction="left" />}
          size={size}
          onClick={() => {
            cursorHandler(links.previous?.cursor, path, query, -1);
            paginationAnalyticsEvent?.("Previous");
          }}
        />
        <Button
          aria-label="Next"
          disabled={nextDisabled}
          icon={<Chevron direction="right" />}
          size={size}
          onClick={() => {
            cursorHandler(links.next?.cursor, path, query, 1);
            paginationAnalyticsEvent?.("Next");
          }}
        />
      </ButtonBar>
    </div>
  );
}

type PaginationCaptionProps = {
  cursor: string | string[] | undefined | null;
  limit: number;
  pageLength: number;
  total: number;
};

function parseCursor(cursor: PaginationCaptionProps["cursor"]): { offset: number } | undefined {
  if (!cursor) return undefined;
  const value = Array.isArray(cursor) ? cursor[0] : cursor;
  if (!value) return undefined;
  const bits = value.split(":");
  if (bits.length !== 3) return undefined;
  return { offset: Number.parseInt(bits[1]!, 10) };
}

/** Returns a localized callback that formats pagination captions. */
export function useGetPaginationCaption() {
  return useCallback(({ cursor, limit, pageLength, total }: PaginationCaptionProps): ReactNode => {
    if (pageLength === 0) return "";

    const offset = parseCursor(cursor)?.offset ?? 0;
    const start = offset * limit + 1;
    const end = start + pageLength - 1;
    return tct("[start]-[end] of [total]", {
      end: end.toLocaleString(),
      start: start.toLocaleString(),
      total: total.toLocaleString(),
    });
  }, []);
}
