"use client";

import { Check, Copy, Moon, RotateCcw, Settings2, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { SentryPageFrame } from "@/components/playground/sentry-page-frame";
import {
  parseWorkbenchTheme,
  parseWorkbenchViewport,
  type WorkbenchTheme,
  type WorkbenchViewport,
} from "@/components/playground/workbench";
import {
  getWorkbenchDefinition,
  getWorkbenchDefinitionForPath,
  parseWorkbenchId,
  workbenchOptions,
  WorkbenchHost,
  type WorkbenchId,
} from "@/components/playground/workbenches";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TemplateMetadata } from "@/templates/types";

const subscribeToHydration = () => () => {};

type SharedWorkbenchParams = {
  secondaryNavigationCollapsed?: boolean;
  theme?: WorkbenchTheme;
  viewport?: WorkbenchViewport;
};

function useHydrated() {
  return useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
}

function appendParams(target: URLSearchParams, source: URLSearchParams) {
  for (const [key, value] of source) target.append(key, value);
}

/** Renders the shared full-screen shell around one state-owning component workbench. */
export function Playground({ templates = [] }: { templates?: TemplateMetadata[] }) {
  const nextPathname = usePathname();
  const router = useRouter();
  const nextSearchParams = useSearchParams();
  const { resolvedTheme, setTheme: setAppTheme } = useTheme();
  const initialSearch = nextSearchParams.toString();
  const initialParams = new URLSearchParams(initialSearch);
  const visualCapture = initialParams.get("capture") === "visual";
  const [component, setComponent] = useState<WorkbenchId>(
    () => getWorkbenchDefinitionForPath(nextPathname, initialParams.get("component")).id,
  );
  const [pathname, setPathname] = useState(nextPathname);
  const [sourceSearch, setSourceSearch] = useState(initialSearch);
  const [theme, setTheme] = useState<WorkbenchTheme | null>(() =>
    parseWorkbenchTheme(initialParams.get("theme")),
  );
  const [viewport, setViewport] = useState<WorkbenchViewport>(() =>
    parseWorkbenchViewport(initialParams.get("viewport")),
  );
  const [secondaryNavigationCollapsed, setSecondaryNavigationCollapsed] = useState(
    () => initialParams.get("sidebar") === "collapsed",
  );
  const [setupOpen, setSetupOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const setupIslandRef = useRef<HTMLElement>(null);
  const setupTriggerRef = useRef<HTMLButtonElement>(null);
  const restoreSetupFocus = useRef(false);
  const hydrated = useHydrated();
  const currentTheme: WorkbenchTheme =
    theme ?? (hydrated && resolvedTheme === "dark" ? "dark" : "light");

  useEffect(() => {
    setAppTheme(theme ?? "system");
  }, [setAppTheme, theme]);

  useEffect(() => {
    function restoreFromHistory() {
      const nextPath = window.location.pathname;
      const nextSearch = window.location.search.slice(1);
      const params = new URLSearchParams(nextSearch);
      const nextTheme = parseWorkbenchTheme(params.get("theme"));
      setPathname(nextPath);
      setSourceSearch(nextSearch);
      setComponent(getWorkbenchDefinitionForPath(nextPath, params.get("component")).id);
      setTheme(nextTheme);
      setViewport(parseWorkbenchViewport(params.get("viewport")));
      setSecondaryNavigationCollapsed(params.get("sidebar") === "collapsed");
      setAppTheme(nextTheme ?? "system");
    }

    window.addEventListener("popstate", restoreFromHistory);
    return () => window.removeEventListener("popstate", restoreFromHistory);
  }, [setAppTheme]);

  useEffect(() => {
    if (setupOpen || !restoreSetupFocus.current) return;
    restoreSetupFocus.current = false;
    setupTriggerRef.current?.focus();
  }, [setupOpen]);

  useEffect(() => {
    if (!setupOpen) return;
    function closeOnOutsidePointer(event: PointerEvent) {
      if (event.target instanceof Node && setupIslandRef.current?.contains(event.target)) return;
      restoreSetupFocus.current = false;
      setSetupOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutsidePointer, true);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer, true);
  }, [setupOpen]);

  const composeParams = useCallback(
    (workbenchParams: URLSearchParams, shared?: SharedWorkbenchParams, id = component) => {
      const params = new URLSearchParams();
      params.set("component", id);
      appendParams(params, workbenchParams);
      params.set("theme", shared?.theme ?? currentTheme);
      params.set("viewport", shared?.viewport ?? viewport);
      params.delete("sidebar");
      if (shared?.secondaryNavigationCollapsed ?? secondaryNavigationCollapsed) {
        params.set("sidebar", "collapsed");
      }
      return params;
    },
    [component, currentTheme, secondaryNavigationCollapsed, viewport],
  );

  const replaceWorkbenchSearch = useCallback(
    (workbenchParams: URLSearchParams) => {
      const params = composeParams(workbenchParams);
      window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
    },
    [composeParams, pathname],
  );

  function closeSetup() {
    restoreSetupFocus.current = true;
    setSetupOpen(false);
  }

  return (
    <WorkbenchHost
      id={component}
      key={`${component}:${sourceSearch}`}
      sourceSearch={sourceSearch}
      onCollapseSetup={closeSetup}
      onSearchChange={replaceWorkbenchSearch}
    >
      {(session) => {
        const activeWorkbench = getWorkbenchDefinition(component);
        const visualCaptureReady = hydrated && resolvedTheme === currentTheme;
        function updateShared(next: SharedWorkbenchParams) {
          const params = composeParams(session.serialize(), next);
          window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
        }

        function navigate(value: string) {
          const templatePath = value.startsWith("/templates/") ? value : null;
          const nextComponent = templatePath
            ? getWorkbenchDefinitionForPath(templatePath, null).id
            : parseWorkbenchId(value);
          const nextPath = templatePath ?? "/";
          const workbenchParams =
            nextComponent === component ? session.serialize() : new URLSearchParams();
          const params = composeParams(workbenchParams, undefined, nextComponent);
          const search = params.toString();
          setComponent(nextComponent);
          setPathname(nextPath);
          setSourceSearch(search);
          router.push(`${nextPath}?${search}`, { scroll: false });
        }

        function resetPlayground() {
          const workbenchParams = session.reset();
          setTheme("light");
          setViewport("desktop");
          setSecondaryNavigationCollapsed(false);
          setAppTheme("light");
          const params = composeParams(workbenchParams, {
            secondaryNavigationCollapsed: false,
            theme: "light",
            viewport: "desktop",
          });
          window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
        }

        async function copyShareUrl() {
          const params = composeParams(session.serialize());
          window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
          const shareUrl = new URL(
            `${activeWorkbench.sharePath}?${params.toString()}`,
            window.location.origin,
          );
          await navigator.clipboard.writeText(shareUrl.href);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        }

        if (visualCapture) {
          return (
            <main
              className="min-h-dvh bg-background p-4 text-foreground sm:p-8"
              data-component={component}
              data-slot="visual-capture"
              data-visual-ready={visualCaptureReady ? "true" : undefined}
              data-viewport={viewport}
            >
              <div className="mx-auto grid w-full max-w-3xl min-w-0 grid-cols-[minmax(0,1fr)] [&_[data-testid=text-query-container]]:max-w-[calc(100%-1rem)]">
                {session.preview}
              </div>
            </main>
          );
        }

        return (
          <div
            className="isolate min-h-dvh bg-muted"
            data-component={component}
            data-slot="playground-canvas"
            data-viewport={viewport}
          >
            <aside
              aria-label="Playground controls"
              className={cn(
                "fixed [bottom:max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-[10000] flex -translate-x-1/2 flex-col-reverse overflow-hidden rounded-2xl border border-foreground/10 bg-popover/95 text-popover-foreground shadow-xl backdrop-blur-md",
                setupOpen ? "w-[calc(100%-1rem)] max-w-3xl" : "w-14",
              )}
              data-slot="playground-island"
              ref={setupIslandRef}
              onBlur={(event) => {
                const nextTarget = event.relatedTarget;
                if (!nextTarget || event.currentTarget.contains(nextTarget)) return;
                restoreSetupFocus.current = false;
                setSetupOpen(false);
              }}
              onKeyDown={(event) => {
                if (event.key !== "Escape" || !setupOpen) return;
                event.preventDefault();
                closeSetup();
              }}
            >
              <div
                className={cn(
                  "min-w-0 items-center gap-1 p-1.5",
                  setupOpen ? "grid grid-cols-[minmax(0,1fr)_repeat(4,2.75rem)] sm:flex" : "flex",
                )}
                data-slot="playground-toolbar"
              >
                {setupOpen ? (
                  <>
                    <label className="sr-only" htmlFor="playground-section">
                      Component or template
                    </label>
                    <select
                      aria-label="Component or template"
                      className="col-span-full h-11 min-w-0 touch-manipulation rounded-xl border border-input bg-background px-2 text-base font-medium focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-ring sm:col-auto sm:h-10 sm:flex-1 sm:text-sm"
                      id="playground-section"
                      value={pathname.startsWith("/templates/") ? pathname : component}
                      onChange={(event) => navigate(event.target.value)}
                    >
                      {workbenchOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                      {templates.map((template) => (
                        <option key={template.slug} value={`/templates/${template.slug}`}>
                          {template.title}
                        </option>
                      ))}
                    </select>
                    <label className="sr-only" htmlFor="preview-viewport">
                      Preview width
                    </label>
                    <select
                      className="h-11 w-full shrink-0 touch-manipulation rounded-xl border border-input bg-background px-2 text-base font-medium focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-ring sm:h-10 sm:w-24 sm:text-sm"
                      id="preview-viewport"
                      name="preview-viewport"
                      value={viewport}
                      onChange={(event) => {
                        const nextViewport = parseWorkbenchViewport(event.target.value);
                        setViewport(nextViewport);
                        updateShared({ viewport: nextViewport });
                      }}
                    >
                      <option value="desktop">Desktop</option>
                      <option value="mobile">Mobile</option>
                    </select>
                    <Button
                      aria-label={`Switch to ${currentTheme === "dark" ? "light" : "dark"} theme`}
                      className="size-11 sm:size-10"
                      icon={
                        currentTheme === "dark" ? (
                          <Sun aria-hidden="true" />
                        ) : (
                          <Moon aria-hidden="true" />
                        )
                      }
                      type="button"
                      variant="transparent"
                      onClick={() => {
                        const nextTheme = currentTheme === "dark" ? "light" : "dark";
                        setTheme(nextTheme);
                        setAppTheme(nextTheme);
                        updateShared({ theme: nextTheme });
                      }}
                    />
                    <Button
                      aria-label="Reset"
                      className="size-11 sm:size-10"
                      icon={<RotateCcw aria-hidden="true" />}
                      type="button"
                      variant="transparent"
                      onClick={resetPlayground}
                    />
                    <Button
                      aria-label={copied ? "Copied" : "Share"}
                      className="size-11 sm:size-10"
                      icon={copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                      type="button"
                      variant="transparent"
                      onClick={copyShareUrl}
                    />
                  </>
                ) : null}
                <Button
                  aria-controls="playground-setup"
                  aria-expanded={setupOpen}
                  aria-label={setupOpen ? "Close setup" : "Open setup"}
                  className="size-11 sm:size-10"
                  data-slot="playground-setup-trigger"
                  ref={setupTriggerRef}
                  icon={<Settings2 aria-hidden="true" />}
                  type="button"
                  variant={setupOpen ? "secondary" : "transparent"}
                  onClick={setupOpen ? closeSetup : () => setSetupOpen(true)}
                />
              </div>
              {setupOpen ? (
                <div
                  className="max-h-[calc(100dvh-8rem)] overflow-y-auto overscroll-contain border-b border-foreground/10 p-3 sm:max-h-[calc(100dvh-5rem)]"
                  id="playground-setup"
                >
                  {session.controls}
                </div>
              ) : null}
            </aside>
            <div
              className={
                viewport === "mobile" ? "flex min-h-dvh justify-center bg-muted" : "min-h-dvh"
              }
            >
              <div
                className={
                  viewport === "mobile"
                    ? "min-h-dvh w-full max-w-[390px] ring-1 ring-foreground/10"
                    : "min-h-dvh w-full"
                }
              >
                <SentryPageFrame
                  breadcrumbs={session.breadcrumbs}
                  secondaryNavigationCollapsed={secondaryNavigationCollapsed}
                  title={session.title}
                  onSecondaryNavigationCollapsedChange={(collapsed) => {
                    setSecondaryNavigationCollapsed(collapsed);
                    updateShared({ secondaryNavigationCollapsed: collapsed });
                  }}
                >
                  <div className="grid max-w-3xl gap-8">
                    <p className="max-w-[65ch] text-base text-pretty text-muted-foreground sm:text-sm">
                      {session.description}
                    </p>
                    {session.preview}
                  </div>
                </SentryPageFrame>
              </div>
            </div>
          </div>
        );
      }}
    </WorkbenchHost>
  );
}
