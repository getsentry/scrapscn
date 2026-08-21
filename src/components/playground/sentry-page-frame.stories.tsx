import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"

import { SentryPageFrame } from "./sentry-page-frame"

const meta = {
  title: "Playground/Sentry Page Frame",
  component: SentryPageFrame,
  args: {
    breadcrumbs: ["Settings", "Projects", "Frontend"],
    children: <p>Page content</p>,
    title: "Notification Settings",
  },
} satisfies Meta<typeof SentryPageFrame>

export default meta
type Story = StoryObj<typeof meta>

/** Protects the source-grounded desktop shell geometry and navigation state. */
export const DesktopShellContract: Story = {
  args: {
    actions: <button type="button">Save changes</button>,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const primaryNavigation = canvas.getByRole("navigation", { name: "Primary navigation" })
    const secondaryNavigation = canvas.getByRole("navigation", { name: "Secondary navigation" })
    const activePrimaryLink = within(primaryNavigation).getByRole("link", { name: "Settings" })
    const activeSecondaryLink = within(secondaryNavigation).getByRole("link", { name: "Alert Settings" })
    const topBar = canvasElement.querySelector('[data-slot="sentry-top-bar"]')

    await expect(primaryNavigation.closest("aside")).toHaveStyle({ width: "74px" })
    await expect(secondaryNavigation.closest("aside")).toHaveStyle({ width: "190px" })
    await expect(topBar).toHaveStyle({ height: "53px" })
    await expect(activePrimaryLink).toHaveAttribute("aria-current", "page")
    await expect(activeSecondaryLink).toHaveAttribute("aria-current", "page")
    await expect(canvas.getByRole("heading", { level: 1, name: "Notification Settings" })).toBeVisible()
    await expect(canvas.getByRole("button", { name: "Save changes" })).toBeVisible()
  },
}

/** Protects mobile navigation, active state, dismissal, and focus return. */
export const MobileShellContract: Story = {
  render: (args) => (
    <div className="w-[390px]">
      <SentryPageFrame {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const documentCanvas = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole("button", { name: "Open navigation" })

    await userEvent.click(trigger)
    const mobileNavigation = documentCanvas.getByRole("navigation", { name: "Mobile navigation" })
    const primaryLinks = within(mobileNavigation).getAllByRole("link").slice(0, 6)

    await expect(primaryLinks).toHaveLength(6)
    await expect(within(mobileNavigation).getByRole("link", { name: "Settings" })).toHaveAttribute("aria-current", "page")
    await expect(within(mobileNavigation).getByRole("link", { name: "Alert Settings" })).toHaveAttribute("aria-current", "page")

    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(documentCanvas.queryByRole("navigation", { name: "Mobile navigation" })).not.toBeInTheDocument())
    await expect(trigger).toHaveFocus()
  },
}
