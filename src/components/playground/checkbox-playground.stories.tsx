import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, userEvent, within } from "storybook/test"

import { CheckboxPlayground } from "./checkbox-playground"

const meta = {
  title: "Playground/Checkbox Workbench",
  component: CheckboxPlayground,
  args: {
    templates: [{
      slug: "checkbox-settings",
      title: "Checkbox settings",
      description: "Compose and review Checkbox controls.",
      tags: ["checkbox", "form", "settings"],
    }],
  },
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
      navigation: { pathname: "/" },
    },
  },
} satisfies Meta<typeof CheckboxPlayground>

export default meta
type Story = StoryObj<typeof meta>

/** Proves the local workbench, template state, and native form workflow. */
export const EndToEndWorkflow: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const templateLink = canvas.getByRole("link", { name: "Checkbox settings" })

    await expect(templateLink).toHaveAttribute("href", expect.stringContaining("/templates/checkbox-settings?"))
    await userEvent.selectOptions(canvas.getByRole("combobox", { name: "Preview width" }), "mobile")
    await userEvent.clear(canvas.getByRole("textbox", { name: "Label" }))
    await userEvent.type(canvas.getByRole("textbox", { name: "Label" }), "Notify the incident team")
    await expect(canvas.getByText("Notify the incident team", { selector: "form label" })).toBeVisible()

    await userEvent.click(canvas.getByRole("button", { name: "Move Alert me about new issues down" }))
    await userEvent.click(canvas.getByRole("button", { name: "Remove Weekly project report" }))
    await expect(canvas.queryByText("Weekly project report", { selector: "form label" })).not.toBeInTheDocument()

    await userEvent.click(canvas.getByRole("button", { name: "Save changes" }))
    await expect(canvas.getByText(/Saved:/)).toBeVisible()

    const updatedHref = templateLink.getAttribute("href")
    await expect(updatedHref).toContain("viewport=mobile")
    await expect(updatedHref).toContain("label=Notify+the+incident+team")
    await expect(updatedHref).not.toContain("weekly-reports")
  },
}

/** Proves that a hard-loaded template URL restores all documented review state. */
export const RestoredTemplateUrl: Story = {
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/templates/checkbox-settings",
        query: {
          checked: "true",
          disabled: "false",
          items: "issue-status,new-issues,constructor",
          label: "",
          selected: "issue-status",
          size: "md",
          theme: "light",
          viewport: "mobile",
        },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const form = canvasElement.querySelector("form")

    await expect(canvas.getByRole("textbox", { name: "Label" })).toHaveValue("")
    await expect(canvas.getByRole("combobox", { name: "Preview width" })).toHaveValue("mobile")
    await expect(canvas.getByRole("combobox", { name: "Size" })).toHaveValue("md")
    await expect(form).not.toBeNull()

    const formCanvas = within(form as HTMLFormElement)
    const formCheckboxes = formCanvas.getAllByRole("checkbox")
    await expect(formCheckboxes).toHaveLength(2)
    await expect(formCheckboxes[0]).toBeChecked()
    await expect(formCheckboxes[1]).toBeChecked()
    await expect(formCanvas.getByText("Untitled notification")).toBeVisible()
    await expect(formCanvas.queryByText("constructor")).not.toBeInTheDocument()
  },
}
