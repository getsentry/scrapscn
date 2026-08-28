import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Badge } from "./badge";

const meta = {
  title: "Components/Badge",
  component: Badge,
  argTypes: {
    variant: {
      control: "select",
      options: [
        "muted",
        "info",
        "success",
        "warning",
        "danger",
        "promotion",
        "alpha",
        "beta",
        "new",
      ],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SemanticVariants: Story = {
  args: {
    variant: "new",
  },
  parameters: {
    a11y: { config: { rules: [{ enabled: false, id: "color-contrast" }] } },
  },

  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="muted">Ignored</Badge>
      <Badge variant="info">Unresolved</Badge>
      <Badge variant="success">Resolved</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="danger">Fatal</Badge>
      <Badge variant="promotion">Promoted</Badge>
    </div>
  ),
};

export const FeatureBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="alpha">Alpha</Badge>
      <Badge variant="beta">Beta</Badge>
      <Badge variant="new">New</Badge>
    </div>
  ),
};

// Args-driven story so the Controls panel manipulates a live instance.
export const Playground: Story = {
  args: { variant: "info", children: "Badge" },
  render: (args) => <Badge {...args} />,
};
