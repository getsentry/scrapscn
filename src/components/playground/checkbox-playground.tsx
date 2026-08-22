"use client"

import { ArrowDown, ArrowUp, Check, ChevronDown, ChevronUp, Copy, Moon, Plus, RotateCcw, Settings2, Sun, Trash2 } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTheme } from "next-themes"
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"

import { SentryPageFrame } from "@/components/playground/sentry-page-frame"
import { Button } from "@/components/ui/button"
import { Checkbox, type CheckboxProps } from "@/components/ui/checkbox"
import { Container, Stack } from "@/components/ui/layout"
import { slot } from "@/components/ui/slot"
import { cn } from "@/lib/utils"
import type { TemplateMetadata } from "@/templates/types"

type CheckedState = "false" | "true" | "indeterminate"
type CheckboxSize = NonNullable<CheckboxProps["size"]>
type PlaygroundTheme = "dark" | "light"
type PlaygroundViewport = "desktop" | "mobile"
type NotificationId = "issue-status" | "new-issues" | "weekly-reports"
type PlaygroundState = {
  checked: CheckedState
  disabled: boolean
  items: NotificationId[]
  label: string
  selected: NotificationId[]
  size: CheckboxSize
  theme: PlaygroundTheme
  viewport: PlaygroundViewport
}

const defaultLabel = "Alert me about new issues"
const PlaygroundSlot = slot(["utility"] as const)
const defaultNotificationIds: NotificationId[] = ["new-issues", "issue-status", "weekly-reports"]
const notificationContent: Record<NotificationId, { description: string; label: string }> = {
  "new-issues": {
    label: defaultLabel,
    description: "Send an email when this project creates a new issue.",
  },
  "issue-status": {
    label: "Issue status changes",
    description: "Send an email when an issue is resolved or regressed.",
  },
  "weekly-reports": {
    label: "Weekly project report",
    description: "Send a summary of project activity every Monday.",
  },
}

function getCheckedState(value: string | null): CheckedState {
  return value === "true" || value === "indeterminate" ? value : "false"
}

function getCheckboxSize(value: string | null): CheckboxSize {
  return value === "xs" || value === "md" ? value : "sm"
}

function getTheme(value: string | null): PlaygroundTheme | null {
  return value === "dark" || value === "light" ? value : null
}

function getViewport(value: string | null): PlaygroundViewport {
  return value === "mobile" ? "mobile" : "desktop"
}

function isNotificationId(id: string): id is NotificationId {
  return Object.prototype.hasOwnProperty.call(notificationContent, id)
}

function getNotificationIds(value: string | null): NotificationId[] {
  const ids = value?.split(",").filter(isNotificationId)
  return ids?.length ? [...new Set(ids)] : defaultNotificationIds
}

function getSelectedNotificationIds(value: string | null): NotificationId[] {
  if (value === null) return ["issue-status"]
  return value.split(",").filter(isNotificationId)
}

function getNotificationLabel(item: NotificationId, label: string) {
  return item === "new-issues"
    ? label || "Untitled notification"
    : notificationContent[item].label
}

const subscribeToHydration = () => () => {}

function useHydrated() {
  return useSyncExternalStore(subscribeToHydration, () => true, () => false)
}

/** Renders the first end-to-end component workbench and shareable template. */
export function CheckboxPlayground({ templates = [] }: { templates?: TemplateMetadata[] }) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { resolvedTheme, setTheme: setAppTheme } = useTheme()
  const initialState = useMemo(
    () => ({
      checked: getCheckedState(searchParams.get("checked")),
      disabled: searchParams.get("disabled") === "true",
      items: getNotificationIds(searchParams.get("items")),
      label: searchParams.get("label") ?? defaultLabel,
      selected: getSelectedNotificationIds(searchParams.get("selected")),
      size: getCheckboxSize(searchParams.get("size")),
      theme: getTheme(searchParams.get("theme")),
      viewport: getViewport(searchParams.get("viewport")),
    }),
    [searchParams]
  )
  const [checked, setChecked] = useState<CheckedState>(initialState.checked)
  const [disabled, setDisabled] = useState(initialState.disabled)
  const [items, setItems] = useState(initialState.items)
  const [label, setLabel] = useState(initialState.label)
  const [selected, setSelected] = useState(initialState.selected)
  const [size, setSize] = useState<CheckboxSize>(initialState.size)
  const [theme, setTheme] = useState<PlaygroundTheme | null>(initialState.theme)
  const [viewport, setViewport] = useState<PlaygroundViewport>(initialState.viewport)
  const [setupOpen, setSetupOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [submittedState, setSubmittedState] = useState<string | null>(null)
  const setupIslandRef = useRef<HTMLElement>(null)
  const setupTriggerRef = useRef<HTMLButtonElement>(null)
  const restoreSetupFocus = useRef(false)
  const hydrated = useHydrated()
  const currentTheme = theme ?? (hydrated && resolvedTheme === "dark" ? "dark" : "light")

  useEffect(() => {
    if (initialState.theme) setAppTheme(initialState.theme)
  }, [initialState.theme, setAppTheme])

  useEffect(() => {
    if (setupOpen || !restoreSetupFocus.current) return
    restoreSetupFocus.current = false
    setupTriggerRef.current?.focus()
  }, [setupOpen])

  useEffect(() => {
    if (!setupOpen) return
    function closeSetupOnOutsidePointer(event: PointerEvent) {
      if (event.target instanceof Node && setupIslandRef.current?.contains(event.target)) return
      restoreSetupFocus.current = false
      setSetupOpen(false)
    }
    document.addEventListener("pointerdown", closeSetupOnOutsidePointer, true)
    return () => document.removeEventListener("pointerdown", closeSetupOnOutsidePointer, true)
  }, [setupOpen])

  function getUrlParams(next: Partial<PlaygroundState>) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("checked", next.checked ?? checked)
    params.set("disabled", String(next.disabled ?? disabled))
    params.set("items", (next.items ?? items).join(","))
    params.set("label", next.label ?? label)
    params.set("selected", (next.selected ?? selected).join(","))
    params.set("size", next.size ?? size)
    params.set("theme", next.theme ?? currentTheme)
    params.set("viewport", next.viewport ?? viewport)
    return params
  }

  function updateUrl(next: Partial<PlaygroundState>) {
    const params = getUrlParams(next)
    window.history.replaceState(null, "", `${pathname}?${params.toString()}`)
  }

  async function copyShareUrl() {
    updateUrl({})
    await navigator.clipboard.writeText(new URL(templateHref, window.location.origin).href)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  const checkboxValue = checked === "indeterminate" ? "indeterminate" : checked === "true"
  const templateHref = `/templates/checkbox-settings?${getUrlParams({}).toString()}`

  function resetPlayground() {
    const resetState: PlaygroundState = {
      checked: "false",
      disabled: false,
      items: defaultNotificationIds,
      label: defaultLabel,
      selected: ["issue-status"],
      size: "sm",
      theme: "light",
      viewport: "desktop",
    }
    setChecked(resetState.checked)
    setDisabled(resetState.disabled)
    setItems(resetState.items)
    setLabel(resetState.label)
    setSelected(resetState.selected)
    setSize(resetState.size)
    setTheme(resetState.theme)
    setViewport(resetState.viewport)
    setSubmittedState(null)
    setAppTheme(resetState.theme)
    updateUrl(resetState)
  }

  function moveItem(index: number, direction: -1 | 1) {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= items.length) return
    const nextItems = [...items]
    ;[nextItems[index], nextItems[targetIndex]] = [nextItems[targetIndex], nextItems[index]]
    updateItems(nextItems)
  }

  function updateItems(nextItems: NotificationId[]) {
    setItems(nextItems)
    updateUrl({ items: nextItems })
  }

  function closeSetup() {
    restoreSetupFocus.current = true
    setSetupOpen(false)
  }

  return (
    <div className="isolate min-h-dvh bg-muted" data-slot="playground-canvas" data-viewport={viewport}>
      <aside
        aria-label="Playground controls"
        className={cn(
          "fixed left-1/2 z-40 flex -translate-x-1/2 flex-col-reverse overflow-hidden rounded-2xl border border-foreground/10 bg-popover/95 text-popover-foreground shadow-xl backdrop-blur-md [bottom:max(0.75rem,env(safe-area-inset-bottom))]",
          setupOpen ? "w-[calc(100%-1rem)] max-w-3xl" : "w-14"
        )}
        data-slot="playground-island"
        ref={setupIslandRef}
        onBlur={(event) => {
          const nextTarget = event.relatedTarget
          if (!nextTarget) return
          if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return
          restoreSetupFocus.current = false
          setSetupOpen(false)
        }}
        onKeyDown={(event) => {
          if (event.key !== "Escape" || !setupOpen) return
          event.preventDefault()
          closeSetup()
        }}
      >
        <div
          className={cn(
            "min-w-0 items-center gap-1 p-1.5",
            setupOpen
              ? "grid grid-cols-[minmax(0,1fr)_repeat(4,2.75rem)] sm:flex"
              : "flex"
          )}
          data-slot="playground-toolbar"
        >
          {setupOpen && (
            <>
          <label className="sr-only" htmlFor="playground-section">Component or template</label>
          <select
            id="playground-section"
            aria-label="Component or template"
            value={pathname}
            onChange={(event) => {
              const destination = event.target.value === "/templates/checkbox-settings"
                ? templateHref
                : `${event.target.value}?${getUrlParams({}).toString()}`
              router.push(destination, { scroll: false })
            }}
            className="col-span-full h-11 min-w-0 touch-manipulation rounded-xl border border-input bg-background px-2 text-base font-medium focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-ring sm:col-auto sm:h-10 sm:flex-1 sm:text-sm"
          >
            <option value="/">Workbench</option>
            {templates.map((template) => (
              <option key={template.slug} value={`/templates/${template.slug}`}>{template.title}</option>
            ))}
          </select>
          <label className="sr-only" htmlFor="preview-viewport">Preview width</label>
          <select
            id="preview-viewport"
            name="preview-viewport"
            value={viewport}
            onChange={(event) => {
              const value = event.target.value as PlaygroundViewport
              setViewport(value)
              updateUrl({ viewport: value })
            }}
            className="h-11 w-full shrink-0 touch-manipulation rounded-xl border border-input bg-background px-2 text-base font-medium focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-ring sm:h-10 sm:w-24 sm:text-sm"
          >
            <option value="desktop">Desktop</option>
            <option value="mobile">Mobile</option>
          </select>
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            chonk={false}
            className="size-11 sm:size-10"
            aria-label={`Switch to ${currentTheme === "dark" ? "light" : "dark"} theme`}
            onClick={() => {
              const nextTheme = currentTheme === "dark" ? "light" : "dark"
              setTheme(nextTheme)
              setAppTheme(nextTheme)
              updateUrl({ theme: nextTheme })
            }}
          >
            {currentTheme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
          </Button>
          <Button type="button" variant="ghost" size="icon-lg" chonk={false} className="size-11 sm:size-10" aria-label="Reset" onClick={resetPlayground}>
            <RotateCcw aria-hidden="true" />
          </Button>
          <Button type="button" variant="ghost" size="icon-lg" chonk={false} className="size-11 sm:size-10" aria-label={copied ? "Copied" : "Share"} onClick={copyShareUrl}>
            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          </Button>
            </>
          )}
          <Button
            type="button"
            variant={setupOpen ? "secondary" : "ghost"}
            size="icon-lg"
            chonk={false}
            className="size-11 sm:size-10"
            aria-label={setupOpen ? "Close setup" : "Open setup"}
            aria-expanded={setupOpen}
            aria-controls="playground-setup"
            data-slot="playground-setup-trigger"
            ref={setupTriggerRef}
            onClick={setupOpen ? closeSetup : () => setSetupOpen(true)}
          >
            <Settings2 aria-hidden="true" />
          </Button>
        </div>

        {setupOpen && (
          <div id="playground-setup" className="max-h-[calc(100dvh-8rem)] overflow-y-auto overscroll-contain border-b border-foreground/10 p-3 sm:max-h-[calc(100dvh-5rem)]">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold">Checkbox setup</h2>
                    <p className="text-xs text-muted-foreground">Changes stay in the share URL.</p>
                  </div>
                  <ChevronUp className="size-4 text-muted-foreground" aria-hidden="true" />
                </div>

            <label className="grid gap-2 text-base font-medium sm:text-sm">
              Size
              <select
                name="checkbox-size"
                value={size}
                onChange={(event) => {
                  const value = event.target.value as CheckboxSize
                  setSize(value)
                  updateUrl({ size: value })
                }}
                className="h-11 touch-manipulation rounded-md border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-ring sm:h-10 sm:text-sm"
              >
                <option value="xs">Extra small</option>
                <option value="sm">Small</option>
                <option value="md">Medium</option>
              </select>
            </label>

            <label className="grid gap-2 text-base font-medium sm:text-sm">
              Label
              <input
                name="checkbox-label"
                value={label}
                onChange={(event) => {
                  setLabel(event.target.value)
                  updateUrl({ label: event.target.value })
                }}
                className="h-11 touch-manipulation rounded-md border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-ring sm:h-10 sm:text-sm"
              />
            </label>

            <label className="grid gap-2 text-base font-medium sm:text-sm">
              Checked state
              <select
                name="checkbox-state"
                value={checked}
                onChange={(event) => {
                  const value = event.target.value as CheckedState
                  setChecked(value)
                  updateUrl({ checked: value })
                }}
                className="h-11 touch-manipulation rounded-md border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-ring sm:h-10 sm:text-sm"
              >
                <option value="false">Unchecked</option>
                <option value="true">Checked</option>
                <option value="indeterminate">Indeterminate</option>
              </select>
            </label>

            <label className="flex min-h-11 cursor-pointer touch-manipulation items-center gap-3 text-base font-medium sm:min-h-10 sm:text-sm">
              <Checkbox
                name="disabled-control"
                checked={disabled}
                onChange={(event) => {
                  setDisabled(event.target.checked)
                  updateUrl({ disabled: event.target.checked })
                }}
              />
              Disabled
            </label>
              </div>

              <div className="grid content-start gap-2 sm:border-l sm:border-foreground/10 sm:pl-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">Template stack</h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-lg"
                  chonk={false}
                  className="size-11 sm:size-10"
                  aria-label="Add notification"
                  disabled={items.length === defaultNotificationIds.length}
                  onClick={() => {
                    const item = defaultNotificationIds.find((id) => !items.includes(id))
                    if (!item) return
                    updateItems([...items, item])
                  }}
                >
                  <Plus className="size-4 shrink-0" aria-hidden="true" />
                </Button>
              </div>
              <ol className="grid gap-1">
                {items.map((item, index) => (
                  <li key={item} className="flex min-w-0 items-center gap-1 rounded-md border border-foreground/10 px-2 py-1">
                    <div className="min-w-0 flex-1 truncate text-sm">{getNotificationLabel(item, label)}</div>
                    <Button type="button" variant="ghost" size="icon-lg" chonk={false} className="size-11 sm:size-10" aria-label={`Move ${getNotificationLabel(item, label)} up`} disabled={index === 0} onClick={() => moveItem(index, -1)}>
                      <ArrowUp className="size-3.5 shrink-0" aria-hidden="true" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-lg" chonk={false} className="size-11 sm:size-10" aria-label={`Move ${getNotificationLabel(item, label)} down`} disabled={index === items.length - 1} onClick={() => moveItem(index, 1)}>
                      <ArrowDown className="size-3.5 shrink-0" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-lg"
                      chonk={false}
                      className="size-11 sm:size-10"
                      aria-label={`Remove ${getNotificationLabel(item, label)}`}
                      disabled={items.length === 1}
                      onClick={() => {
                        updateItems(items.filter((id) => id !== item))
                      }}
                    >
                      <Trash2 className="size-3.5 shrink-0" aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ol>
              <button
                type="button"
                className="mt-1 flex min-h-11 touch-manipulation items-center justify-center gap-1.5 rounded-md text-base font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring sm:min-h-10 sm:text-sm"
                onClick={closeSetup}
              >
                <ChevronDown className="size-4" aria-hidden="true" />
                Collapse setup
              </button>
            </div>
            </div>
          </div>
        )}
      </aside>

      <div className={viewport === "mobile" ? "flex min-h-dvh justify-center bg-muted" : "min-h-dvh"}>
          <div className={viewport === "mobile" ? "min-h-dvh w-full max-w-[390px] ring-1 ring-foreground/10" : "min-h-dvh w-full"}>
          <SentryPageFrame title="Notification Settings" breadcrumbs={["Settings", "Projects", "Frontend"]}>
            <div className="grid max-w-3xl gap-8">
              <p className="max-w-[65ch] text-pretty text-base text-muted-foreground sm:text-sm">
                Choose how your team receives issue updates for this project.
              </p>
              <Container data-testid="layout-separator-proof" padding="md" border="primary" radius="md" background="primary">
                <Stack gap="sm" direction={{ zero: "column", "screen:lg": "row" }}>
                  <span className="text-sm font-medium">Layout and separator proof</span>
                  <Stack.Separator data-testid="layout-stack-separator-proof" />
                  <span className="text-sm text-muted-foreground">Responsive Scraps primitives</span>
                </Stack>
              </Container>
              <PlaygroundSlot.Provider>
                <Container containerType="inline-size" padding="md" border="primary" radius="md" background="primary">
                  <Stack gap="sm">
                    <span className="text-sm font-medium">Slot portal proof</span>
                    <PlaygroundSlot.Outlet name="utility">
                      {(props, hasConsumers) => (
                        <div {...props} data-testid="slot-playground-outlet" className="text-sm text-muted-foreground">
                          <PlaygroundSlot.Fallback>No utility content</PlaygroundSlot.Fallback>
                          {hasConsumers ? "Custom utility connected" : "Waiting for utility"}
                        </div>
                      )}
                    </PlaygroundSlot.Outlet>
                  </Stack>
                </Container>
                <PlaygroundSlot name="utility">
                  <span data-testid="slot-playground-content">Portaled Scraps content</span>
                </PlaygroundSlot>
              </PlaygroundSlot.Provider>
              <form
                aria-labelledby="email-heading"
                className="grid"
                onSubmit={(event) => {
                  event.preventDefault()
                  const formData = new FormData(event.currentTarget)
                  const selectedItems = items.filter((item) => formData.has(item))
                  setSubmittedState(selectedItems.length ? `Saved: ${selectedItems.map((item) => getNotificationLabel(item, label)).join(", ")}` : "Saved: no email notifications")
                }}
              >
                <div className="grid gap-1 border-b border-foreground/10 pb-4">
                  <h2 id="email-heading" className="text-lg font-semibold">Email notifications</h2>
                  <p className="text-pretty text-base text-muted-foreground sm:text-sm">Control the messages sent to project members.</p>
                </div>
                {items.map((item) => {
                  const content = notificationContent[item]
                  const itemLabel = getNotificationLabel(item, label)
                  const checkboxId = `${item}-checkbox`
                  const descriptionId = `${item}-description`
                  const labelId = `${item}-label`

                  return (
                    <div key={item} className="flex items-start gap-3 border-b border-foreground/10 py-4">
                      <span className="flex h-lh items-center text-lg sm:text-sm">
                        <Checkbox
                          id={checkboxId}
                          name={item}
                          value="enabled"
                          size={size}
                          checked={item === "new-issues" ? checkboxValue : selected.includes(item)}
                          disabled={disabled}
                          onChange={(event) => {
                            if (item === "new-issues") {
                              const value = event.target.checked ? "true" : "false"
                              setChecked(value)
                              updateUrl({ checked: value })
                              return
                            }
                            const nextSelected = event.target.checked
                              ? [...selected, item]
                              : selected.filter((selectedItem) => selectedItem !== item)
                            setSelected(nextSelected)
                            updateUrl({ selected: nextSelected })
                          }}
                          aria-describedby={descriptionId}
                          aria-labelledby={labelId}
                        />
                      </span>
                      <div className="min-w-0">
                        <label id={labelId} htmlFor={checkboxId} className="cursor-pointer font-medium">{itemLabel}</label>
                        <p id={descriptionId} className="mt-1 text-base text-muted-foreground sm:text-sm">{content.description}</p>
                      </div>
                    </div>
                  )
                })}
                <div className="flex flex-wrap items-center gap-3 pt-5">
                  <Button type="submit" chonk={false}>Save changes</Button>
                  {submittedState ? <output aria-live="polite" className="text-sm text-muted-foreground">{submittedState}</output> : null}
                </div>
              </form>
            </div>
          </SentryPageFrame>
          </div>
        </div>
    </div>
  )
}
