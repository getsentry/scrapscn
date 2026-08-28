import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Ellipsis, Folder } from "lucide-react";
import { useState } from "react";

import { BreadcrumbList } from "./breadcrumb-list";
import { LinkBehaviorContextProvider, type LinkProps } from "./link";

const meta = {
  title: "Scraps/BreadcrumbList",
  component: BreadcrumbList,
  decorators: [
    (Story) => (
      <LinkBehaviorContextProvider
        value={{
          behavior: (props: LinkProps) => props,
          component: ({ to, ...props }: LinkProps) => (
            <a {...props} href={typeof to === "string" ? to : to.pathname} />
          ),
        }}
      >
        <Story />
      </LinkBehaviorContextProvider>
    ),
  ],
  parameters: { layout: "padded" },
} satisfies Meta<typeof BreadcrumbList>;
export default meta;
type Story = StoryObj<typeof meta>;

function Frame({ children, narrow = false }: { children: React.ReactNode; narrow?: boolean }) {
  return <div className={narrow ? "w-[480px]" : "w-[720px]"}>{children}</div>;
}
const links = [
  {
    type: "link" as const,
    label: "Settings",
    to: "/settings",
    leadingGraphic: <Folder className="size-4" />,
  },
  { type: "link" as const, label: "Projects", to: "/projects" },
];
export const Links: Story = {
  render: () => (
    <Frame>
      <BreadcrumbList items={links} />
    </Frame>
  ),
};
export const SelectProjects: Story = {
  render: () => {
    const [value, setValue] = useState("web");
    return (
      <Frame>
        <BreadcrumbList
          items={[
            {
              type: "select-projects",
              value,
              options: [
                { value: "web", label: "Web" },
                { value: "api", label: "API" },
              ],
              onChange: (option) => setValue(option.value),
            },
          ]}
        />
      </Frame>
    );
  },
};
export const TitlePaginationAndActions: Story = {
  render: () => (
    <Frame>
      <BreadcrumbList.Title
        item={{
          type: "page-title",
          label: "ISSUE-42",
          labelTooltip: "Issue short ID",
          pagination: {
            previous: { ariaLabel: "Previous issue", to: "/issues/41" },
            next: { ariaLabel: "Next issue" },
          },
          trailingActions: [
            { type: "copy", label: "Copy short ID", text: "ISSUE-42" },
            {
              type: "menu",
              triggerLabel: "More actions",
              triggerIcon: <Ellipsis />,
              items: [
                { key: "archive", label: "Archive" },
                { key: "delete", label: "Delete", priority: "danger" },
              ],
            },
          ],
        }}
      />
    </Frame>
  ),
};
export const EditableTitle: Story = {
  render: () => {
    const [value, setValue] = useState("Frontend dashboard");
    return (
      <Frame>
        <BreadcrumbList.Title
          item={{
            type: "editable-title",
            "aria-label": "Edit dashboard name",
            autoSelect: true,
            onChange: setValue,
            value,
          }}
        />
      </Frame>
    );
  },
};
export const Narrow: Story = {
  render: () => (
    <Frame narrow>
      <BreadcrumbList items={links} />
    </Frame>
  ),
};
