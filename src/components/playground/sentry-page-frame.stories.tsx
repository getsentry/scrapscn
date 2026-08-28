import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { SentryPageFrame } from "./sentry-page-frame";

const meta = {
  title: "Playground/Sentry Page Frame",
  component: SentryPageFrame,
  args: {
    breadcrumbs: ["Settings", "Projects", "Frontend"],
    children: <p>Page content</p>,
    title: "Notification Settings",
  },
} satisfies Meta<typeof SentryPageFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Protects the source-grounded desktop shell geometry and navigation state. */
export const DesktopShellContract: Story = {
  args: {
    actions: <button type="button">Save changes</button>,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const documentCanvas = within(canvasElement.ownerDocument.body);
    const primaryNavigation = canvas.getByRole("navigation", { name: "Primary navigation" });
    const secondaryNavigation = canvas.getByRole("navigation", { name: "Secondary navigation" });
    const activePrimaryLink = within(primaryNavigation).getByRole("link", { name: "Settings" });
    const activeSecondaryLink = within(secondaryNavigation).getByRole("link", {
      name: "Alert Settings",
    });
    const topBar = canvasElement.querySelector('[data-slot="sentry-top-bar"]');

    await expect(primaryNavigation.closest("aside")).toHaveStyle({ width: "74px" });
    await expect(secondaryNavigation.closest("aside")).toHaveStyle({ width: "190px" });
    await expect(topBar).toHaveStyle({ height: "53px" });
    await expect(activePrimaryLink).toHaveAttribute("aria-current", "page");
    await expect(activeSecondaryLink).toHaveAttribute("aria-current", "page");
    await expect(
      canvas.getByRole("heading", { level: 1, name: "Notification Settings" }),
    ).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Save changes" })).toBeVisible();

    await userEvent.click(canvas.getByRole("button", { name: "Toggle organization menu" }));
    const organizationMenu = await documentCanvas.findByRole("menu");
    await waitFor(() => expect(organizationMenu).toBeVisible());
    await expect(within(organizationMenu).getByText("Acme")).toBeVisible();
    await expect(
      within(organizationMenu).getByRole("menuitem", { name: "Organization Settings" }),
    ).toBeVisible();
    await expect(
      within(organizationMenu).getByRole("menuitem", { name: "Switch Organization" }),
    ).toBeVisible();
    await userEvent.keyboard("{Escape}");

    await userEvent.click(canvas.getByRole("button", { name: "User menu" }));
    const userMenu = await documentCanvas.findByRole("menu");
    await waitFor(() => expect(userMenu).toBeVisible());
    await expect(within(userMenu).getByText("sergiy@acme.example")).toBeVisible();
    await expect(within(userMenu).getByRole("menuitem", { name: "User Settings" })).toBeVisible();
    await expect(within(userMenu).getByRole("menuitem", { name: "Sign Out" })).toBeVisible();
    await userEvent.keyboard("{Escape}");

    await userEvent.click(canvas.getByRole("button", { name: "Collapse" }));
    await expect(
      canvas.queryByRole("navigation", { name: "Secondary navigation" }),
    ).not.toBeInTheDocument();
    const expand = canvas.getByRole("button", { name: "Expand" });
    await expect(expand).toBeVisible();
    await expect(expand).toHaveFocus();
    await userEvent.click(expand);
    const restoredSecondaryNavigation = canvas.getByRole("navigation", {
      name: "Secondary navigation",
    });
    await expect(restoredSecondaryNavigation).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Collapse" })).toHaveFocus();

    within(restoredSecondaryNavigation).getByRole("link", { name: "Alert Settings" }).focus();
    await userEvent.keyboard("{Control>}b{/Control}");
    const keyboardExpand = canvas.getByRole("button", { name: "Expand" });
    await expect(keyboardExpand).toBeVisible();
    await expect(keyboardExpand).toHaveFocus();
    await userEvent.keyboard("{Control>}b{/Control}");
    const keyboardCollapse = canvas.getByRole("button", { name: "Collapse" });
    await expect(keyboardCollapse).toBeVisible();
    await expect(keyboardCollapse).toHaveFocus();
  },
};

/** Protects mobile navigation, active state, dismissal, and focus return. */
export const MobileShellContract: Story = {
  render: (args) => (
    <div className="w-[390px]">
      <SentryPageFrame {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const documentCanvas = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole("button", { name: "Open navigation" });

    await userEvent.click(trigger);
    const mobileNavigation = documentCanvas.getByRole("navigation", { name: "Mobile navigation" });
    const primaryLinks = within(mobileNavigation).getAllByRole("link").slice(0, 6);

    await expect(primaryLinks).toHaveLength(6);
    await expect(within(mobileNavigation).getByRole("link", { name: "Settings" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(
      within(mobileNavigation).getByRole("link", { name: "Alert Settings" }),
    ).toHaveAttribute("aria-current", "page");
    const hiddenSecondaryNavigation = canvas.getByRole("navigation", {
      hidden: true,
      name: "Secondary navigation",
    });
    await userEvent.keyboard("{Control>}b{/Control}");
    await expect(hiddenSecondaryNavigation).toBeInTheDocument();

    const organizationTrigger = within(mobileNavigation).getByRole("button", {
      name: "Toggle organization menu",
    });
    await userEvent.click(organizationTrigger);
    const organizationMenu = await documentCanvas.findByRole("menu");
    await waitFor(() => expect(organizationMenu).toBeVisible());
    await expect(
      within(organizationMenu).getByRole("menuitem", { name: "Organization Settings" }),
    ).toBeVisible();
    await expect(
      within(organizationMenu).getByRole("menuitem", { name: "Switch Organization" }),
    ).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(documentCanvas.queryByRole("menu")).not.toBeInTheDocument());
    await expect(mobileNavigation).toBeVisible();
    await expect(organizationTrigger).toHaveFocus();

    const userTrigger = within(mobileNavigation).getByRole("button", { name: "User menu" });
    await userEvent.click(userTrigger);
    const userMenu = await documentCanvas.findByRole("menu");
    await waitFor(() => expect(userMenu).toBeVisible());
    await expect(within(userMenu).getByRole("menuitem", { name: "User Settings" })).toBeVisible();
    await expect(within(userMenu).getByRole("menuitem", { name: "Sign Out" })).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(documentCanvas.queryByRole("menu")).not.toBeInTheDocument());
    await expect(mobileNavigation).toBeVisible();
    await expect(userTrigger).toHaveFocus();

    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(
        documentCanvas.queryByRole("navigation", { name: "Mobile navigation" }),
      ).not.toBeInTheDocument(),
    );
    await expect(trigger).toHaveFocus();
  },
};
