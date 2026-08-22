import type { LucideIcon } from "lucide-react"
import {
  ChartNoAxesCombined,
  ChevronLeft,
  CircleHelp,
  Compass,
  Gauge,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Search,
  Settings,
  Siren,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

type PrimaryNavigationItem = {
  icon: LucideIcon
  key: string
  label: string
}

type SecondaryNavigationItem = {
  key: string
  label: string
}

type SentrySecondaryNavigationSection = {
  items: SecondaryNavigationItem[]
  key: string
  title: string
}

/** Inputs for the current Sentry organization shell and page layout. */
export interface SentryPageFrameProps {
  actions?: React.ReactNode
  breadcrumbs?: React.ReactNode[]
  children: React.ReactNode
  title: React.ReactNode
}

const primaryNavigationItems: PrimaryNavigationItem[] = [
  { icon: Gauge, key: "issues", label: "Issues" },
  { icon: Compass, key: "explore", label: "Explore" },
  { icon: LayoutDashboard, key: "dashboards", label: "Dashboards" },
  { icon: ChartNoAxesCombined, key: "insights", label: "Insights" },
  { icon: Siren, key: "monitors", label: "Monitors" },
  { icon: Settings, key: "settings", label: "Settings" },
]

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
]

function OrganizationAvatar({ organization }: { organization: string }) {
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
      {organization.slice(0, 1).toUpperCase()}
    </div>
  )
}

function PrimaryNavigation({
  activeItem,
  organization,
}: {
  activeItem: string
  organization: string
}) {
  return (
    <nav aria-label="Primary navigation" className="flex size-full flex-col items-center bg-background">
      <div className="flex h-[53px] w-full shrink-0 items-center justify-center border-b border-foreground/10">
        <button type="button" aria-label="Toggle organization menu" className="relative rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          <OrganizationAvatar organization={organization} />
        </button>
      </div>
      <ul role="list" className="grid w-full gap-1 p-1.5">
        {primaryNavigationItems.map((item) => {
          const Icon = item.icon
          const isActive = item.key === activeItem

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
                    isActive && "border-primary/20 bg-primary/10 text-foreground"
                  )}
                >
                  <Icon className="size-5 shrink-0 stroke-current" aria-hidden="true" />
                </span>
                <div className="text-[0.6875rem]/3 font-medium tracking-[-0.03em]">{item.label}</div>
              </a>
            </li>
          )
        })}
      </ul>
      <div className="mt-auto grid w-full gap-1 p-1.5 pt-0">
        <button type="button" aria-label="Help" className="flex h-10 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring">
          <CircleHelp className="size-5 shrink-0 stroke-current" aria-hidden="true" />
        </button>
        <button type="button" aria-label="User menu" className="flex h-10 items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring">
          <div className="flex size-7 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">SD</div>
        </button>
      </div>
    </nav>
  )
}

function SecondaryNavigation({
  activeItem,
  sections,
  title,
}: {
  activeItem: string
  sections: SentrySecondaryNavigationSection[]
  title: string
}) {
  return (
    <nav aria-label="Secondary navigation" className="grid size-full grid-rows-[53px_1fr] bg-muted">
      <div className="flex items-center justify-between border-b border-foreground/10 px-4">
        <p className="truncate text-sm font-semibold">{title}</p>
        <button type="button" aria-label="Collapse secondary navigation" className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring">
          <ChevronLeft className="size-4 shrink-0 stroke-current" aria-hidden="true" />
        </button>
      </div>
      <div className="overflow-y-auto overscroll-contain">
        {sections.map((section) => (
          <section key={section.key} aria-labelledby={`${section.key}-navigation-heading`} className="p-2">
            <h2 id={`${section.key}-navigation-heading`} className="px-2 py-2 text-sm font-semibold">
              {section.title}
            </h2>
            <ul role="list" className="grid gap-0.5">
              {section.items.map((item) => {
                const isActive = item.key === activeItem

                return (
                  <li key={item.key}>
                    <a
                      href={`#${item.key}`}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex h-8 items-center rounded-md border border-transparent px-3 text-sm text-muted-foreground hover:border-foreground/10 hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
                        isActive && "border-primary/20 bg-primary/10 text-foreground"
                      )}
                    >
                      {item.label}
                    </a>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </nav>
  )
}

function MobileNavigation() {
  return (
    <div className="@md:hidden">
      <Sheet>
      <SheetTrigger className="relative flex size-10 items-center justify-center rounded-md hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        <span className="absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2 pointer-fine:hidden" aria-hidden="true" />
        <Menu className="pointer-events-none size-5 shrink-0 stroke-current" aria-hidden="true" />
        <span className="sr-only">Open navigation</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-[min(22rem,calc(100vw-2rem))] gap-0 overflow-hidden p-0" showCloseButton>
        <SheetHeader className="border-b border-foreground/10 pr-12">
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription className="sr-only">Sentry primary and project settings navigation</SheetDescription>
        </SheetHeader>
        <nav aria-label="Mobile navigation" className="grid min-h-0 flex-1 grid-rows-[auto_1fr] overflow-hidden">
        <div className="grid grid-cols-6 gap-1 border-b border-foreground/10 p-2">
          {primaryNavigationItems.map((item) => {
            const Icon = item.icon
            const isActive = item.key === "settings"

            return (
              <a key={item.key} href={`#${item.key}`} aria-label={item.label} aria-current={isActive ? "page" : undefined} className={cn("flex h-11 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground", isActive && "bg-primary/10 text-foreground")}>
                <Icon className="size-5 shrink-0 stroke-current" aria-hidden="true" />
              </a>
            )
          })}
        </div>
        <div className="overflow-y-auto bg-muted">
          <div className="flex h-12 items-center gap-3 border-b border-foreground/10 px-4">
            <OrganizationAvatar organization="Acme" />
            <p className="min-w-0 flex-1 truncate text-base font-semibold @sm:text-sm">Settings</p>
          </div>
          <div className="p-2">
            {projectSettingsSections.map((section) => (
              <section key={section.key} aria-labelledby={`${section.key}-mobile-navigation-heading`} className="py-1">
                <h2 id={`${section.key}-mobile-navigation-heading`} className="px-3 py-2 text-base font-semibold @sm:text-sm">
                  {section.title}
                </h2>
                <ul role="list" className="grid gap-0.5">
                  {section.items.map((item) => (
                    <li key={item.key}>
                      <a href={`#${item.key}`} aria-current={item.key === "alert-settings" ? "page" : undefined} className={cn("flex min-h-10 items-center rounded-md px-3 text-base text-muted-foreground hover:bg-accent hover:text-foreground @sm:min-h-8 @sm:text-sm", item.key === "alert-settings" && "bg-primary/10 text-foreground")}>
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
  )
}

/** Renders a static-data Tailwind port of Sentry's current organization shell. */
export function SentryPageFrame({
  breadcrumbs = ["Settings", "Projects"],
  children,
  actions,
  title,
}: SentryPageFrameProps) {
  return (
    <div className="@container isolate min-h-dvh overflow-hidden bg-muted text-foreground" data-slot="sentry-page-frame">
      <div className="flex min-h-dvh">
        <aside aria-label="Primary navigation panel" className="hidden w-[74px] shrink-0 border-r border-foreground/10 @md:flex">
          <PrimaryNavigation activeItem="settings" organization="Acme" />
        </aside>
        <aside aria-label="Secondary navigation panel" className="hidden w-[190px] shrink-0 border-r border-foreground/10 @md:flex">
          <SecondaryNavigation activeItem="alert-settings" sections={projectSettingsSections} title="Settings" />
        </aside>

        <div className="min-w-0 flex-1 bg-muted">
          <div data-slot="sentry-top-bar" className="sticky top-0 z-20 flex min-h-12 flex-wrap items-center gap-2 border-b border-foreground/10 bg-muted px-3 py-1.5 @md:h-[53px] @md:min-h-[53px] @md:flex-nowrap @md:px-6 @md:py-0">
            <MobileNavigation />
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
              <button type="button" aria-label="Search" className="relative flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring">
                <Search className="size-4 shrink-0 stroke-current" aria-hidden="true" />
                <span className="absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2 pointer-fine:hidden" aria-hidden="true" />
              </button>
              <button type="button" aria-label="Give feedback" className="relative flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring">
                <MessageSquare className="size-4 shrink-0 stroke-current" aria-hidden="true" />
                <span className="absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2 pointer-fine:hidden" aria-hidden="true" />
              </button>
            </div>
          </div>

          <main className="min-h-[calc(100dvh-53px)] bg-background p-5 @sm:p-6 @md:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
