"use client";

import type { LucideIcon } from "lucide-react";
import {
  ChartNoAxesCombined,
  ChevronsLeft,
  CircleHelp,
  Compass,
  Gauge,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Search,
  Settings,
  Siren,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
} from "react";

import { AvatarButton } from "@/components/ui/avatar-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type PrimaryNavigationItem = {
  icon: LucideIcon;
  key: string;
  label: string;
};

type SecondaryNavigationItem = {
  key: string;
  label: string;
};

type SentrySecondaryNavigationSection = {
  items: SecondaryNavigationItem[];
  key: string;
  title: string;
};

/** Inputs for the current Sentry organization shell and page layout. */
export interface SentryPageFrameProps {
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode[];
  children: React.ReactNode;
  onSecondaryNavigationCollapsedChange?: (collapsed: boolean) => void;
  secondaryNavigationCollapsed?: boolean;
  title: React.ReactNode;
}

const primaryNavigationItems: PrimaryNavigationItem[] = [
  { icon: Gauge, key: "issues", label: "Issues" },
  { icon: Compass, key: "explore", label: "Explore" },
  { icon: LayoutDashboard, key: "dashboards", label: "Dashboards" },
  { icon: ChartNoAxesCombined, key: "insights", label: "Insights" },
  { icon: Siren, key: "monitors", label: "Monitors" },
  { icon: Settings, key: "settings", label: "Settings" },
];

const projectSettingsSections: SentrySecondaryNavigationSection[] = [
  {
    key: "project",
    title: "Project",
    items: [
      { key: "general", label: "General Settings" },
      { key: "project-teams", label: "Project Teams" },
      { key: "alert-settings", label: "Alert Settings" },
      { key: "tags", label: "Tags & Context" },
      { key: "environments", label: "Environments" },
      { key: "ownership", label: "Ownership Rules" },
    ],
  },
  {
    key: "processing",
    title: "Processing",
    items: [
      { key: "inbound-filters", label: "Inbound Filters" },
      { key: "security-and-privacy", label: "Security & Privacy" },
      { key: "issue-grouping", label: "Issue Grouping" },
    ],
  },
];

const organizationAvatar = {
  identifier: "acme",
  name: "Acme",
  type: "letter_avatar",
} satisfies ComponentProps<typeof AvatarButton>["avatar"];

const userAvatar = {
  identifier: "sergiy@acme.example",
  name: "Sergiy Dybskiy",
  type: "letter_avatar",
} satisfies ComponentProps<typeof AvatarButton>["avatar"];

const menuAvatarClassName =
  "!size-11 !min-w-11 rounded-md [&_[data-slot=avatar-button-frame]]:!size-8";

function OrganizationMenu({ side = "right" }: { side?: "bottom" | "right" }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <AvatarButton
            aria-label="Toggle organization menu"
            avatar={organizationAvatar}
            className={menuAvatarClassName}
            size="sm"
          />
        }
      />
      <DropdownMenuContent className="w-64" side={side} align="start">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-3 px-2 py-2 normal-case">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
              A
            </span>
            <span className="grid min-w-0 gap-0.5">
              <span className="truncate text-sm font-semibold text-foreground">Acme</span>
              <span className="text-xs font-normal text-muted-foreground">3 Projects</span>
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="min-h-11">Organization Settings</DropdownMenuItem>
          <DropdownMenuItem className="min-h-11">Projects</DropdownMenuItem>
          <DropdownMenuItem className="min-h-11">Members</DropdownMenuItem>
          <DropdownMenuItem className="min-h-11">Teams</DropdownMenuItem>
          <DropdownMenuItem className="min-h-11">Usage &amp; Billing</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="min-h-11">Switch Organization</DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-52">
            <DropdownMenuItem className="min-h-11">Example Company</DropdownMenuItem>
            <DropdownMenuItem className="min-h-11">Sandbox</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenu({ side = "right" }: { side?: "bottom" | "right" }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <AvatarButton
            aria-label="User menu"
            avatar={userAvatar}
            className={menuAvatarClassName}
            size="xs"
          />
        }
      />
      <DropdownMenuContent className="w-64" side={side} align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="grid gap-0.5 px-2 py-2 normal-case">
            <span className="truncate text-sm font-semibold text-foreground">Sergiy Dybskiy</span>
            <span className="truncate text-xs font-normal text-muted-foreground">
              sergiy@acme.example
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="min-h-11">User Settings</DropdownMenuItem>
          <DropdownMenuItem className="min-h-11">Sign Out</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PrimaryNavigation({ activeItem }: { activeItem: string }) {
  return (
    <nav
      aria-label="Primary navigation"
      className="flex size-full flex-col items-center bg-background"
    >
      <div className="flex h-[53px] w-full shrink-0 items-center justify-center border-b border-foreground/10">
        <OrganizationMenu />
      </div>
      <ul role="list" className="grid w-full gap-1 p-1.5">
        {primaryNavigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.key === activeItem;

          return (
            <li key={item.key}>
              <a
                href={`#${item.key}`}
                aria-current={isActive ? "page" : undefined}
                className="group flex h-[52px] flex-col items-center justify-center gap-0.5 rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
              >
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-md border border-transparent group-hover:bg-accent",
                    isActive && "border-primary/20 bg-primary/10 text-foreground",
                  )}
                >
                  <Icon className="size-5 shrink-0 stroke-current" aria-hidden="true" />
                </span>
                <div className="text-[0.6875rem]/3 font-medium tracking-[-0.03em]">
                  {item.label}
                </div>
              </a>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto grid w-full gap-1 p-1.5 pt-0">
        <button
          type="button"
          aria-label="Help"
          className="flex h-11 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
        >
          <CircleHelp className="size-5 shrink-0 stroke-current" aria-hidden="true" />
        </button>
        <div className="flex items-center justify-center">
          <UserMenu />
        </div>
      </div>
    </nav>
  );
}

function SecondaryNavigation({
  activeItem,
  collapseButtonRef,
  onCollapse,
  sections,
  title,
}: {
  activeItem: string;
  collapseButtonRef: React.RefObject<HTMLButtonElement | null>;
  onCollapse: () => void;
  sections: SentrySecondaryNavigationSection[];
  title: string;
}) {
  return (
    <nav aria-label="Secondary navigation" className="grid size-full grid-rows-[53px_1fr] bg-muted">
      <div className="flex items-center justify-between border-b border-foreground/10 px-4">
        <p className="truncate text-sm font-semibold">{title}</p>
        <button
          type="button"
          aria-label="Collapse"
          className="relative flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
          ref={collapseButtonRef}
          onClick={onCollapse}
        >
          <span className="absolute size-11" aria-hidden="true" />
          <ChevronsLeft className="size-4 shrink-0 stroke-current" aria-hidden="true" />
        </button>
      </div>
      <div className="overflow-y-auto overscroll-contain">
        {sections.map((section) => (
          <section
            key={section.key}
            aria-labelledby={`${section.key}-navigation-heading`}
            className="p-2"
          >
            <h2
              id={`${section.key}-navigation-heading`}
              className="px-2 py-2 text-sm font-semibold"
            >
              {section.title}
            </h2>
            <ul role="list" className="grid gap-0.5">
              {section.items.map((item) => {
                const isActive = item.key === activeItem;

                return (
                  <li key={item.key}>
                    <a
                      href={`#${item.key}`}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex h-8 items-center rounded-md border border-transparent px-3 text-sm text-muted-foreground hover:border-foreground/10 hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
                        isActive && "border-primary/20 bg-primary/10 text-foreground",
                      )}
                    >
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </nav>
  );
}

function MobileNavigation() {
  return (
    <div className="@md:hidden">
      <Sheet>
        <SheetTrigger className="relative flex size-10 items-center justify-center rounded-md hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          <span
            className="absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2 pointer-fine:hidden"
            aria-hidden="true"
          />
          <Menu className="pointer-events-none size-5 shrink-0 stroke-current" aria-hidden="true" />
          <span className="sr-only">Open navigation</span>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-[min(22rem,calc(100vw-2rem))] gap-0 overflow-hidden p-0"
          showCloseButton
        >
          <SheetHeader className="border-b border-foreground/10 pr-12">
            <SheetTitle>Settings</SheetTitle>
            <SheetDescription className="sr-only">
              Sentry primary and project settings navigation
            </SheetDescription>
          </SheetHeader>
          <nav
            aria-label="Mobile navigation"
            className="grid min-h-0 flex-1 grid-rows-[auto_auto_1fr] overflow-hidden"
          >
            <div className="flex min-h-14 items-center gap-2 border-b border-foreground/10 px-2">
              <OrganizationMenu side="bottom" />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">Acme</span>
              <UserMenu side="bottom" />
            </div>
            <div className="grid grid-cols-6 gap-1 border-b border-foreground/10 p-2">
              {primaryNavigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.key === "settings";

                return (
                  <a
                    key={item.key}
                    href={`#${item.key}`}
                    aria-label={item.label}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex h-11 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground",
                      isActive && "bg-primary/10 text-foreground",
                    )}
                  >
                    <Icon className="size-5 shrink-0 stroke-current" aria-hidden="true" />
                  </a>
                );
              })}
            </div>
            <div className="overflow-y-auto bg-muted">
              <div className="flex h-12 items-center gap-3 border-b border-foreground/10 px-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
                  A
                </span>
                <p className="min-w-0 flex-1 truncate text-base font-semibold @sm:text-sm">
                  Settings
                </p>
              </div>
              <div className="p-2">
                {projectSettingsSections.map((section) => (
                  <section
                    key={section.key}
                    aria-labelledby={`${section.key}-mobile-navigation-heading`}
                    className="py-1"
                  >
                    <h2
                      id={`${section.key}-mobile-navigation-heading`}
                      className="px-3 py-2 text-base font-semibold @sm:text-sm"
                    >
                      {section.title}
                    </h2>
                    <ul role="list" className="grid gap-0.5">
                      {section.items.map((item) => (
                        <li key={item.key}>
                          <a
                            href={`#${item.key}`}
                            aria-current={item.key === "alert-settings" ? "page" : undefined}
                            className={cn(
                              "flex min-h-11 items-center rounded-md px-3 text-base text-muted-foreground hover:bg-accent hover:text-foreground @sm:text-sm",
                              item.key === "alert-settings" && "bg-primary/10 text-foreground",
                            )}
                          >
                            {item.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/** Renders a static-data Tailwind port of Sentry's current organization shell. */
export function SentryPageFrame({
  breadcrumbs = ["Settings", "Projects"],
  children,
  onSecondaryNavigationCollapsedChange,
  secondaryNavigationCollapsed,
  actions,
  title,
}: SentryPageFrameProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapseButtonRef = useRef<HTMLButtonElement>(null);
  const expandButtonRef = useRef<HTMLButtonElement>(null);
  const focusAfterToggleRef = useRef<"collapse" | "expand" | null>(null);
  const collapsed = secondaryNavigationCollapsed ?? internalCollapsed;
  const setCollapsed = useCallback(
    (nextCollapsed: boolean) => {
      if (secondaryNavigationCollapsed === undefined) setInternalCollapsed(nextCollapsed);
      onSecondaryNavigationCollapsedChange?.(nextCollapsed);
    },
    [onSecondaryNavigationCollapsedChange, secondaryNavigationCollapsed],
  );

  const toggleCollapsed = useCallback(
    (nextCollapsed: boolean) => {
      focusAfterToggleRef.current = nextCollapsed ? "expand" : "collapse";
      setCollapsed(nextCollapsed);
    },
    [setCollapsed],
  );

  useLayoutEffect(() => {
    const focusTarget = focusAfterToggleRef.current;
    if (!focusTarget) return;
    const button = focusTarget === "expand" ? expandButtonRef.current : collapseButtonRef.current;
    if (!button) return;
    focusAfterToggleRef.current = null;
    button.focus();
  }, [collapsed]);

  useEffect(() => {
    function toggleSecondaryNavigation(event: KeyboardEvent) {
      if (!event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || event.key !== "b") {
        return;
      }
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName))
      ) {
        return;
      }
      const visibleToggle = collapsed ? expandButtonRef.current : collapseButtonRef.current;
      if (!visibleToggle || visibleToggle.getClientRects().length === 0) return;
      event.preventDefault();
      toggleCollapsed(!collapsed);
    }

    document.addEventListener("keydown", toggleSecondaryNavigation);
    return () => document.removeEventListener("keydown", toggleSecondaryNavigation);
  }, [collapsed, toggleCollapsed]);

  return (
    <div
      className="@container isolate min-h-dvh overflow-hidden bg-muted text-foreground"
      data-slot="sentry-page-frame"
    >
      <div className="relative flex min-h-dvh">
        <aside
          aria-label="Primary navigation panel"
          className="hidden w-[74px] shrink-0 border-r border-foreground/10 @md:flex"
        >
          <PrimaryNavigation activeItem="settings" />
        </aside>
        {collapsed ? null : (
          <aside
            aria-label="Secondary navigation panel"
            className="hidden w-[190px] shrink-0 border-r border-foreground/10 @md:flex"
          >
            <SecondaryNavigation
              activeItem="alert-settings"
              collapseButtonRef={collapseButtonRef}
              onCollapse={() => toggleCollapsed(true)}
              sections={projectSettingsSections}
              title="Settings"
            />
          </aside>
        )}

        <div className="min-w-0 flex-1 bg-muted">
          <div
            data-slot="sentry-top-bar"
            className="sticky top-0 z-20 flex min-h-12 flex-wrap items-center gap-2 border-b border-foreground/10 bg-muted px-3 py-1.5 @md:h-[53px] @md:min-h-[53px] @md:flex-nowrap @md:px-6 @md:py-0"
          >
            <MobileNavigation />
            {collapsed ? (
              <button
                type="button"
                aria-label="Expand"
                className="relative hidden size-7 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring @md:flex"
                ref={expandButtonRef}
                onClick={() => toggleCollapsed(false)}
              >
                <span className="absolute size-11" aria-hidden="true" />
                <ChevronsLeft
                  className="size-4 shrink-0 rotate-180 stroke-current"
                  aria-hidden="true"
                />
              </button>
            ) : null}
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {breadcrumbs.length > 0 ? (
                <p className="hidden min-w-0 truncate text-sm text-muted-foreground @lg:block">
                  {breadcrumbs.map((breadcrumb, index) => (
                    <span key={index}>
                      {index > 0 ? " / " : null}
                      {breadcrumb}
                    </span>
                  ))}
                </p>
              ) : null}
              <h1 className="min-w-0 truncate text-base font-semibold @md:text-sm">{title}</h1>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {actions}
              <button
                type="button"
                aria-label="Search"
                className="relative flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
              >
                <Search className="size-4 shrink-0 stroke-current" aria-hidden="true" />
                <span
                  className="absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2 pointer-fine:hidden"
                  aria-hidden="true"
                />
              </button>
              <button
                type="button"
                aria-label="Give feedback"
                className="relative flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
              >
                <MessageSquare className="size-4 shrink-0 stroke-current" aria-hidden="true" />
                <span
                  className="absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2 pointer-fine:hidden"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          <main className="min-h-[calc(100dvh-53px)] bg-background p-5 @sm:p-6 @md:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
