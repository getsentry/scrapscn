"use client";

import { Check, Copy, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { PageFrame, Breadcrumbs, PRODUCT_NAV, type NavKey } from "@/components/page-frame";
import { Button, LinkButton } from "@/components/ui/button";

const pages: Record<string, { title: string; views: { key: string; label: string }[] }> = {
  issues: {
    title: "Issues",
    views: [
      { key: "feed", label: "Feed" },
      { key: "errors", label: "Errors & Outages" },
      { key: "feedback", label: "User Feedback" },
    ],
  },
  explore: {
    title: "Explore",
    views: [
      { key: "traces", label: "Traces" },
      { key: "logs", label: "Logs" },
      { key: "replays", label: "Replays" },
    ],
  },
  dashboards: {
    title: "Dashboards",
    views: [
      { key: "all", label: "All Dashboards" },
      { key: "frontend", label: "Frontend Overview" },
      { key: "web-vitals", label: "Web Vitals" },
    ],
  },
  insights: {
    title: "Insights",
    views: [
      { key: "frontend", label: "Frontend" },
      { key: "backend", label: "Backend" },
      { key: "mobile", label: "Mobile" },
    ],
  },
  monitors: {
    title: "Monitors",
    views: [
      { key: "uptime", label: "Uptime" },
      { key: "cron", label: "Cron Jobs" },
    ],
  },
  settings: {
    title: "Settings",
    views: [
      { key: "general", label: "General Settings" },
      { key: "teams", label: "Teams" },
      { key: "projects", label: "Projects" },
    ],
  },
};

export default function PageFrameTemplate() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { setTheme } = useTheme();
  const [shareState, setShareState] = useState<"idle" | "copied" | "error">("idle");
  const requestedArea = params.get("area") ?? "issues";
  const area = (Object.hasOwn(pages, requestedArea) ? requestedArea : "issues") as NavKey;
  const page = pages[area];
  const view = page.views.find((item) => item.key === params.get("view")) ?? page.views[0];
  const theme = params.get("theme") === "dark" ? "dark" : "light";
  const width = params.get("viewport") ?? "desktop";
  const collapsed = params.get("sidebar") === "collapsed";

  useEffect(() => {
    setTheme(theme);
  }, [theme, setTheme]);
  useEffect(() => {
    if (shareState !== "copied") return;
    const timeout = setTimeout(() => setShareState("idle"), 2000);
    return () => clearTimeout(timeout);
  }, [shareState]);

  function href(changes: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    Object.entries(changes).forEach(([key, value]) => next.set(key, value));
    return `${pathname}?${next}`;
  }
  function update(changes: Record<string, string>) {
    router.replace(href(changes), { scroll: false });
  }
  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareState("copied");
    } catch {
      setShareState("error");
    }
  }

  return (
    <div className="min-h-dvh bg-muted">
      <div
        className={
          width === "mobile"
            ? "mx-auto w-full max-w-[390px]"
            : width === "tablet"
              ? "mx-auto w-full max-w-[800px]"
              : "w-full"
        }
      >
        <PageFrame
          title={<Breadcrumbs items={[{ label: page.title }, { label: view.label }]} />}
          active={area}
          navItems={PRODUCT_NAV}
          collapsed={collapsed}
          onCollapsedChange={(value) => update({ sidebar: value ? "collapsed" : "expanded" })}
          onNavigate={(key) => update({ area: key, view: pages[key].views[0].key })}
        >
          <section className="m-6 flex min-h-[calc(100dvh-12rem)] flex-col items-center justify-center rounded-md border border-dashed px-6 py-16 text-center">
            <p className="text-xs font-medium text-muted-foreground">
              {page.title} / {view.label}
            </p>
            <h1 className="mt-3 text-xl font-medium">Your page starts here</h1>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Compose your {view.label.toLowerCase()} prototype inside the frame. Navigation and
              page actions stay outside this content area.
            </p>
          </section>
        </PageFrame>
      </div>
      <aside
        aria-label="Page frame preview controls"
        className="fixed inset-x-3 bottom-3 z-30 mx-auto flex w-fit max-w-[calc(100%-1.5rem)] flex-wrap items-center justify-center gap-2 rounded-lg border bg-background p-2 shadow-lg"
      >
        <LinkButton href="/" size="sm">
          Playground
        </LinkButton>
        <label className="sr-only" htmlFor="page-frame-width">
          Preview width
        </label>
        <select
          id="page-frame-width"
          value={width}
          onChange={(event) => update({ viewport: event.target.value })}
          className="h-8 rounded-md border bg-background px-2 text-sm"
        >
          <option value="desktop">Desktop</option>
          <option value="tablet">800px</option>
          <option value="mobile">390px</option>
        </select>
        <Button
          aria-label={theme === "dark" ? "Use light theme" : "Use dark theme"}
          icon={theme === "dark" ? <Sun /> : <Moon />}
          size="sm"
          onClick={() => update({ theme: theme === "dark" ? "light" : "dark" })}
        />
        <Button size="sm" icon={shareState === "copied" ? <Check /> : <Copy />} onClick={share}>
          {shareState === "copied" ? "Copied" : "Share"}
        </Button>
        <span
          role="status"
          className={shareState === "error" ? "text-xs text-danger-content" : "sr-only"}
        >
          {shareState === "copied"
            ? "Page frame link copied"
            : shareState === "error"
              ? "Copy the URL from your address bar to share."
              : ""}
        </span>
      </aside>
    </div>
  );
}
