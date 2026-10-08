"use client";

// Ported from Ivy Sanders Schneider’s shared PageFrame in seer-automation-vision.
import { Menu } from "lucide-react";
import * as React from "react";

import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { IconChevron, IconSeer, IconSearch, IconMegaphone } from "./icons";
import { NavRail, PRODUCT_NAV, type NavItem, type NavKey } from "./nav-rail";
import { NAV_SECTIONS } from "./nav-sections";
import { SecondarySidebar } from "./sidebar";

/** Connect each action to the host prototype; unavailable actions are disabled. */
export function AskSeerActions({
  onAskSeer,
  onSearch,
  onBroadcasts,
  children,
}: {
  onAskSeer?: () => void;
  onSearch?: () => void;
  onBroadcasts?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button size="sm" icon={<IconSeer />} disabled={!onAskSeer} onClick={onAskSeer}>
        Ask Seer
      </Button>
      <Button
        size="sm"
        variant="transparent"
        aria-label="Search"
        icon={<IconSearch className="text-muted-foreground" />}
        disabled={!onSearch}
        onClick={onSearch}
      />
      <Button
        size="sm"
        variant="transparent"
        aria-label="Broadcasts"
        icon={<IconMegaphone className="text-muted-foreground" />}
        disabled={!onBroadcasts}
        onClick={onBroadcasts}
      />
      {children}
    </div>
  );
}

export interface PageFrameProps {
  active?: NavKey;
  navItems?: NavItem[];
  /** Content used for both the docked sidebar and hover previews. */
  sectionSidebars?: Partial<Record<NavKey, React.ReactNode>>;
  /** Override the active sidebar. Pass null for a destination without a sidebar. */
  sidebar?: React.ReactNode;
  sidebarTitle?: React.ReactNode;
  title?: React.ReactNode;
  actions?: React.ReactNode;
  defaultCollapsed?: boolean;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** A docked panel to the right of both the page header and its content. */
  panel?: React.ReactNode;
  onNavigate?: (key: NavKey) => void;
  organization?: React.ReactNode;
  railFooter?: React.ReactNode;
  children: React.ReactNode;
  contentClassName?: string;
}

/**
 * Ivy’s 76px rail, 188px sidebar, 53px header and independently scrolling content.
 * Open: hovering another product peeks at its sidebar. Closed: a temporary
 * flyout can be pinned open. Navigation and main content remain consumer-owned.
 */
export function PageFrame({
  active,
  navItems = PRODUCT_NAV,
  sectionSidebars,
  sidebar,
  sidebarTitle,
  title,
  actions = <AskSeerActions />,
  defaultCollapsed = false,
  collapsed: controlledCollapsed,
  onCollapsedChange,
  panel,
  onNavigate,
  organization,
  railFooter,
  children,
  contentClassName,
}: PageFrameProps) {
  const [internalCollapsed, setInternalCollapsed] = React.useState(defaultCollapsed);
  const collapsed = controlledCollapsed ?? internalCollapsed;
  const [hoveredKey, setHoveredKey] = React.useState<NavKey | null>(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const zoneRef = React.useRef<HTMLDivElement>(null);
  const expandRef = React.useRef<HTMLButtonElement>(null);
  const toggleRef = React.useRef<HTMLButtonElement>(null);
  const pendingFocus = React.useRef<"expand" | "toggle" | null>(null);
  const sidebarId = React.useId();
  const contentId = React.useId();

  const cancelClose = React.useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);
  React.useEffect(() => cancelClose, [cancelClose]);
  const scheduleClose = React.useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => {
      if (!zoneRef.current?.contains(document.activeElement)) setHoveredKey(null);
    }, 150);
  }, [cancelClose]);
  const peek = React.useCallback(
    (key: NavKey) => {
      cancelClose();
      setHoveredKey(key);
    },
    [cancelClose],
  );
  const peekRail = React.useCallback(() => {
    cancelClose();
    setHoveredKey((key) => key ?? active ?? null);
  }, [active, cancelClose]);

  function setCollapsed(next: boolean) {
    cancelClose();
    setHoveredKey(null);
    pendingFocus.current = next ? "expand" : "toggle";
    if (controlledCollapsed === undefined) setInternalCollapsed(next);
    onCollapsedChange?.(next);
  }
  React.useLayoutEffect(() => {
    if (!pendingFocus.current) return;
    const button = pendingFocus.current === "expand" ? expandRef.current : toggleRef.current;
    pendingFocus.current = null;
    button?.focus();
  }, [collapsed]);

  function resolve(key?: NavKey) {
    const defaultSection = key ? NAV_SECTIONS[key] : undefined;
    const label = navItems.find((item) => item.id === key)?.label;
    const content =
      key === active && sidebar !== undefined
        ? sidebar
        : key && sectionSidebars && Object.hasOwn(sectionSidebars, key)
          ? sectionSidebars[key]
          : defaultSection?.content;
    return {
      title:
        key === active
          ? (sidebarTitle ?? label ?? defaultSection?.title)
          : (label ?? defaultSection?.title),
      content,
    };
  }
  const shown = resolve(hoveredKey ?? active);
  const current = resolve(active);
  const hasSidebar = current.content != null;
  const isFlyout = collapsed && hoveredKey != null && shown.content != null;
  const showDocked = !collapsed && shown.content != null;

  function navigate(key: NavKey) {
    cancelClose();
    setHoveredKey(null);
    setMobileOpen(false);
    onNavigate?.(key);
  }

  return (
    <div
      className="sentry-page-frame @container/ivy-frame h-dvh w-full overflow-hidden text-foreground"
      data-slot="page-frame"
    >
      <a
        href={`#${contentId}`}
        className="sr-only z-50 rounded-md bg-background p-3 focus:not-sr-only focus:absolute"
      >
        Skip to content
      </a>
      <div className="flex h-full w-full">
        <div
          ref={zoneRef}
          className="relative hidden shrink-0 @min-[992px]/ivy-frame:flex"
          data-slot="page-frame-navigation"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              cancelClose();
              setHoveredKey(null);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape" && hoveredKey) {
              event.stopPropagation();
              cancelClose();
              setHoveredKey(null);
              expandRef.current?.focus();
            }
          }}
        >
          <NavRail
            active={active}
            items={navItems}
            onItemHover={peek}
            onRailHover={peekRail}
            onItemClick={onNavigate ? navigate : undefined}
            organization={organization}
            footer={railFooter}
          />
          <div
            id={sidebarId}
            hidden={!showDocked && !isFlyout}
            className={isFlyout ? "absolute top-0 left-[76px] z-30 h-full" : "h-full"}
            data-slot="page-frame-sidebar"
            data-state={isFlyout ? "flyout" : showDocked ? "docked" : "closed"}
          >
            {showDocked || isFlyout ? (
              <SecondarySidebar
                title={shown.title}
                pinned={!isFlyout}
                onToggle={() => setCollapsed(!collapsed)}
                toggleRef={toggleRef}
                controls={sidebarId}
              >
                {shown.content}
              </SecondarySidebar>
            ) : null}
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col bg-background">
          <div
            className="flex h-12 shrink-0 items-center justify-between border-b bg-background px-2 @min-[992px]/ivy-frame:hidden"
            data-slot="page-frame-mobile-header"
          >
            <Sheet
              open={mobileOpen}
              onOpenChange={(open) => {
                setMobileOpen(open);
                if (open) setHoveredKey(null);
              }}
            >
              <SheetTrigger
                render={<Button aria-label="Open navigation" size="sm" icon={<Menu />} />}
              />
              <SheetContent
                side="left"
                className="sentry-page-frame w-[min(22rem,calc(100vw-2rem))] gap-0 p-0"
              >
                <SheetHeader className="border-b pr-12">
                  <SheetTitle>Navigation</SheetTitle>
                  <SheetDescription className="sr-only">Choose a product or page.</SheetDescription>
                </SheetHeader>
                <div className="flex min-h-0 flex-1" data-slot="page-frame-mobile-navigation">
                  <NavRail
                    active={active}
                    items={navItems}
                    onItemClick={onNavigate ? navigate : peek}
                    organization={organization}
                    footer={null}
                  />
                  {shown.content != null ? (
                    <div
                      className="flex min-w-0 flex-1 flex-col gap-0.5 overflow-y-auto bg-muted px-1 py-2"
                      onClick={(event) => {
                        if ((event.target as HTMLElement).closest("a[href]")) setMobileOpen(false);
                      }}
                    >
                      {shown.content}
                    </div>
                  ) : null}
                </div>
              </SheetContent>
            </Sheet>
            <span className="text-sm font-medium">
              {navItems.find((item) => item.id === active)?.label ?? "Sentry"}
            </span>
          </div>
          <header
            className="flex h-[53px] shrink-0 items-center gap-2 border-b border-border bg-muted px-4 @min-[992px]/ivy-frame:px-6"
            data-slot="page-frame-header"
          >
            {collapsed && hasSidebar ? (
              <Button
                aria-label="Expand sidebar"
                aria-expanded={false}
                aria-controls={sidebarId}
                size="sm"
                variant="transparent"
                className="hidden @min-[992px]/ivy-frame:inline-flex"
                icon={<IconChevron direction="right" isDouble />}
                ref={expandRef}
                onClick={() => setCollapsed(false)}
              />
            ) : null}
            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden text-sm font-medium">
              {title}
            </div>
            <div className="ml-auto shrink-0" data-slot="page-frame-actions">
              {actions}
            </div>
          </header>
          <main
            id={contentId}
            tabIndex={-1}
            className={cn("min-h-0 flex-1 overflow-auto outline-none", contentClassName)}
          >
            {children}
          </main>
        </div>
        {panel}
      </div>
    </div>
  );
}
