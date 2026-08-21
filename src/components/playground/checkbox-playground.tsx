"use client"

import Link from "next/link"
import { ArrowDown, ArrowUp, Check, Copy, Moon, Plus, RotateCcw, Sun, Trash2 } from "lucide-react"
import { usePathname, useSearchParams } from "next/navigation"
import { useTheme } from "next-themes"
import { useEffect, useMemo, useState, useSyncExternalStore } from "react"

import { SentryPageFrame } from "@/components/playground/sentry-page-frame"
import { Button } from "@/components/ui/button"
import { Checkbox, type CheckboxProps } from "@/components/ui/checkbox"
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

const subscribeToHydration = () => () => {}

function useHydrated() {
  return useSyncExternalStore(subscribeToHydration, () => true, () => false)
}

/** Renders the first end-to-end component workbench and shareable template. */
export function CheckboxPlayground({ templates = [] }: { templates?: TemplateMetadata[] }) {
  const pathname = usePathname()
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
  const [copied, setCopied] = useState(false)
  const [submittedState, setSubmittedState] = useState<string | null>(null)
  const hydrated = useHydrated()
  const currentTheme = theme ?? (hydrated && resolvedTheme === "dark" ? "dark" : "light")

  useEffect(() => {
    if (initialState.theme) setAppTheme(initialState.theme)
  }, [initialState.theme, setAppTheme])

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
    setItems(nextItems)
    updateUrl({ items: nextItems })
  }

  return (
    <div className="isolate min-h-dvh bg-muted">
      <header className="border-b border-foreground/10 bg-background">
        <div className="mx-auto flex max-w-[100rem] items-center gap-3 p-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <h1 className="text-balance text-lg font-semibold">Scrapscn playground</h1>
            <p className="text-pretty text-base text-muted-foreground sm:text-sm">Build regular Scraps screens without the monolith.</p>
          </div>
          <nav aria-label="Playground sections" className="flex items-center gap-3 text-sm font-medium">
            <Link href={`/?${getUrlParams({}).toString()}`} aria-current={pathname === "/" ? "page" : undefined} className="text-muted-foreground hover:text-foreground aria-[current=page]:text-primary">
              Workbench
            </Link>
            {templates.map((template) => (
              <Link key={template.slug} href={template.slug === "checkbox-settings" ? templateHref : `/templates/${template.slug}`} aria-current={pathname === `/templates/${template.slug}` ? "page" : undefined} className="text-muted-foreground hover:text-foreground aria-[current=page]:text-primary">
                {template.title}
              </Link>
            ))}
          </nav>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Switch to ${currentTheme === "dark" ? "light" : "dark"} theme`}
            onClick={() => {
              const nextTheme = currentTheme === "dark" ? "light" : "dark"
              setTheme(nextTheme)
              setAppTheme(nextTheme)
              updateUrl({ theme: nextTheme })
            }}
          >
            {currentTheme === "dark" ? (
              <Sun className="size-4 shrink-0" aria-hidden="true" />
            ) : (
              <Moon className="size-4 shrink-0" aria-hidden="true" />
            )}
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[100rem] gap-4 p-4 sm:p-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="rounded-lg border border-foreground/10 bg-background p-4">
          <div className="grid gap-5">
            <div className="grid gap-1">
              <h2 className="text-base font-semibold">Checkbox controls</h2>
              <p className="text-pretty text-base text-muted-foreground sm:text-sm">Change the public props, then share this exact state.</p>
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
                className="h-10 rounded-md border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-ring sm:h-8 sm:text-sm"
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
                className="h-10 rounded-md border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-ring sm:h-8 sm:text-sm"
              />
            </label>

            <label className="grid gap-2 text-base font-medium sm:text-sm">
              Preview width
              <select
                name="preview-viewport"
                value={viewport}
                onChange={(event) => {
                  const value = event.target.value as PlaygroundViewport
                  setViewport(value)
                  updateUrl({ viewport: value })
                }}
                className="h-10 rounded-md border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-ring sm:h-8 sm:text-sm"
              >
                <option value="desktop">Desktop</option>
                <option value="mobile">Mobile · 390 px</option>
              </select>
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
                className="h-10 rounded-md border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-ring sm:h-8 sm:text-sm"
              >
                <option value="false">Unchecked</option>
                <option value="true">Checked</option>
                <option value="indeterminate">Indeterminate</option>
              </select>
            </label>

            <label className="flex min-h-10 cursor-pointer items-center gap-3 text-base font-medium sm:min-h-8 sm:text-sm">
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

            <div className="grid gap-2 border-t border-foreground/10 pt-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">Template stack</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Add notification"
                  disabled={items.length === defaultNotificationIds.length}
                  onClick={() => {
                    const item = defaultNotificationIds.find((id) => !items.includes(id))
                    if (!item) return
                    const nextItems = [...items, item]
                    setItems(nextItems)
                    updateUrl({ items: nextItems })
                  }}
                >
                  <Plus className="size-4 shrink-0" aria-hidden="true" />
                </Button>
              </div>
              <ol className="grid gap-1">
                {items.map((item, index) => (
                  <li key={item} className="flex min-w-0 items-center gap-1 rounded-md border border-foreground/10 px-2 py-1">
                    <div className="min-w-0 flex-1 truncate text-sm">{item === "new-issues" ? label : notificationContent[item].label}</div>
                    <Button type="button" variant="ghost" size="icon-xs" aria-label={`Move ${notificationContent[item].label} up`} disabled={index === 0} onClick={() => moveItem(index, -1)}>
                      <ArrowUp className="size-3.5 shrink-0" aria-hidden="true" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-xs" aria-label={`Move ${notificationContent[item].label} down`} disabled={index === items.length - 1} onClick={() => moveItem(index, 1)}>
                      <ArrowDown className="size-3.5 shrink-0" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Remove ${notificationContent[item].label}`}
                      disabled={items.length === 1}
                      onClick={() => {
                        const nextItems = items.filter((id) => id !== item)
                        setItems(nextItems)
                        updateUrl({ items: nextItems })
                      }}
                    >
                      <Trash2 className="size-3.5 shrink-0" aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ol>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" chonk={false} onClick={resetPlayground}>
                <RotateCcw className="size-4 shrink-0" aria-hidden="true" />
                Reset
              </Button>
              <Button type="button" variant="outline" chonk={false} onClick={copyShareUrl}>
                {copied ? <Check className="size-4 shrink-0" aria-hidden="true" /> : <Copy className="size-4 shrink-0" aria-hidden="true" />}
                {copied ? "Copied" : "Share"}
              </Button>
            </div>
          </div>
        </aside>

        <div aria-labelledby="preview-heading" className="min-w-0">
          <h2 id="preview-heading" className="sr-only">Template preview</h2>
          <div className={viewport === "mobile" ? "mx-auto max-w-[390px]" : undefined}>
          <SentryPageFrame title="Notification Settings" breadcrumbs={["Settings", "Projects", "Frontend"]}>
            <div className="grid max-w-3xl gap-8">
              <p className="max-w-[65ch] text-pretty text-base text-muted-foreground sm:text-sm">
                Choose how your team receives issue updates for this project.
              </p>
              <form
                aria-labelledby="email-heading"
                className="grid"
                onSubmit={(event) => {
                  event.preventDefault()
                  const formData = new FormData(event.currentTarget)
                  const selectedItems = items.filter((item) => formData.has(item))
                  setSubmittedState(selectedItems.length ? `Saved: ${selectedItems.map((item) => item === "new-issues" ? label : notificationContent[item].label).join(", ")}` : "Saved: no email notifications")
                }}
              >
                <div className="grid gap-1 border-b border-foreground/10 pb-4">
                  <h2 id="email-heading" className="text-lg font-semibold">Email notifications</h2>
                  <p className="text-pretty text-base text-muted-foreground sm:text-sm">Control the messages sent to project members.</p>
                </div>
                {items.map((item) => {
                  const content = notificationContent[item]
                  const itemLabel = item === "new-issues" ? label : content.label
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
                        <label id={labelId} htmlFor={checkboxId} className="cursor-pointer font-medium">{itemLabel || "Untitled notification"}</label>
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
    </div>
  )
}
