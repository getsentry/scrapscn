import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Playground } from "./playground";

const meta = {
  title: "Playground/Checkbox Workbench",
  component: Playground,
  args: {
    templates: [
      {
        slug: "checkbox-settings",
        title: "Checkbox settings",
        description: "Compose and review Checkbox controls.",
        tags: ["checkbox", "form", "settings"],
      },
    ],
  },
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
      navigation: { pathname: "/" },
    },
  },
} satisfies Meta<typeof Playground>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Proves the local workbench, template state, and native form workflow. */
export const EndToEndWorkflow: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const setupButton = canvas.getByRole("button", { name: "Open setup" });

    await expect(canvas.queryByRole("textbox", { name: "Label" })).not.toBeInTheDocument();
    await userEvent.click(setupButton);
    await expect(canvas.getByRole("combobox", { name: "Component or template" })).toHaveValue(
      "checkbox",
    );
    await expect(canvas.getByRole("button", { name: "Close setup" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await userEvent.selectOptions(
      canvas.getByRole("combobox", { name: "Preview width" }),
      "mobile",
    );
    await userEvent.clear(canvas.getByRole("textbox", { name: "Label" }));
    await userEvent.type(
      canvas.getByRole("textbox", { name: "Label" }),
      "Notify the incident team",
    );
    await expect(
      canvas.getByText("Notify the incident team", { selector: "form label" }),
    ).toBeVisible();

    await userEvent.click(
      canvas.getByRole("button", { name: "Move Notify the incident team down" }),
    );
    await userEvent.click(canvas.getByRole("button", { name: "Remove Weekly project report" }));
    await expect(
      canvas.queryByText("Weekly project report", { selector: "form label" }),
    ).not.toBeInTheDocument();

    await userEvent.click(canvas.getByRole("button", { name: "Collapse setup" }));
    await expect(canvas.queryByRole("textbox", { name: "Label" })).not.toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Open setup" })).toHaveFocus();
    await userEvent.click(canvas.getByRole("button", { name: "Save changes" }));
    await expect(canvas.getByText(/Saved:/)).toBeVisible();
  },
};

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
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Open setup" }));
    const form = canvasElement.querySelector("form");

    await expect(canvas.getByRole("textbox", { name: "Label" })).toHaveValue("");
    await expect(canvas.getByRole("combobox", { name: "Preview width" })).toHaveValue("mobile");
    await expect(canvas.getByRole("combobox", { name: "Size" })).toHaveValue("md");
    await expect(form).not.toBeNull();

    const formCanvas = within(form as HTMLFormElement);
    const formCheckboxes = formCanvas.getAllByRole("checkbox");
    await expect(formCheckboxes).toHaveLength(2);
    await expect(formCheckboxes[0]).toBeChecked();
    await expect(formCheckboxes[1]).toBeChecked();
    await expect(formCanvas.getByText("Untitled notification")).toBeVisible();
    await expect(formCanvas.queryByText("constructor")).not.toBeInTheDocument();
  },
};

/** Proves secondary navigation state restores from and writes to the shared URL. */
export const RestoredCollapsedSidebarUrl: Story = {
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/",
        query: {
          component: "checkbox",
          sidebar: "collapsed",
          theme: "light",
          viewport: "desktop",
        },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const initialExpand = canvas.getByRole("button", { name: "Expand" });
    await expect(initialExpand).toBeVisible();
    await userEvent.click(initialExpand);
    await expect(canvas.getByRole("button", { name: "Collapse" })).toBeVisible();
    await waitFor(() =>
      expect(new URL(window.location.href).searchParams.has("sidebar")).toBe(false),
    );

    await userEvent.click(canvas.getByRole("button", { name: "Collapse" }));
    await expect(canvas.getByRole("button", { name: "Expand" })).toBeVisible();
    await waitFor(() =>
      expect(new URL(window.location.href).searchParams.get("sidebar")).toBe("collapsed"),
    );

    await userEvent.click(canvas.getByRole("button", { name: "Open setup" }));
    await userEvent.click(canvas.getByRole("button", { name: "Reset" }));
    await expect(canvas.getByRole("button", { name: "Collapse" })).toBeVisible();
    await waitFor(() =>
      expect(new URL(window.location.href).searchParams.has("sidebar")).toBe(false),
    );

    const collapsedUrl = new URL(window.location.href);
    collapsedUrl.searchParams.set("sidebar", "collapsed");
    window.history.pushState(null, "", collapsedUrl);
    window.dispatchEvent(new PopStateEvent("popstate"));
    await waitFor(() => expect(canvas.getByRole("button", { name: "Expand" })).toBeVisible());

    const expandedUrl = new URL(window.location.href);
    expandedUrl.searchParams.delete("sidebar");
    window.history.pushState(null, "", expandedUrl);
    window.dispatchEvent(new PopStateEvent("popstate"));
    await waitFor(() => expect(canvas.getByRole("button", { name: "Collapse" })).toBeVisible());
  },
};
