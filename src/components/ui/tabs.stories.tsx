import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { TabList, TabPanels, Tabs } from "./tabs";

const meta = {
  title: "Components/Tabs",
  component: Tabs,
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

const items = ["overview", "activity", "feedback", "attachments"] as const;

function Example({
  orientation = "horizontal",
  size = "md",
  variant = "flat",
}: {
  orientation?: "horizontal" | "vertical";
  size?: "md" | "sm" | "xs";
  variant?: "flat" | "floating";
}) {
  return (
    <Tabs className="w-96" defaultValue="overview" orientation={orientation} size={size}>
      <TabList variant={variant}>
        {items.map((item) => (
          <TabList.Item key={item}>{item}</TabList.Item>
        ))}
      </TabList>
      <TabPanels>
        {items.map((item) => (
          <TabPanels.Item key={item}>{item} panel</TabPanels.Item>
        ))}
      </TabPanels>
    </Tabs>
  );
}

export const Flat: Story = { render: () => <Example /> };
export const Floating: Story = {
  render: () => <Example variant="floating" />,
};
export const Vertical: Story = {
  render: () => <Example orientation="vertical" />,
};
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      {(["md", "sm", "xs"] as const).map((size) => (
        <Example key={size} size={size} />
      ))}
    </div>
  ),
};
