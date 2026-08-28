import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import { Markdown } from "./markdown";

const meta = {
  component: Markdown,
  title: "Scraps/Markdown",
} satisfies Meta<typeof Markdown>;

export default meta;
type Story = StoryObj<typeof meta>;

const raw = `## Checkout regression

The **authentication** path now returns \`401 Unauthorized\`.

- [x] Find the first bad release
- [ ] Verify the fix

| Release | Failures |
| --- | ---: |
| 26.8.0 | 312 |

> All links and raw HTML pass through the canonical allowlist.`;

export const Static: Story = {
  args: { raw },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Checkout regression",
    );
    await expect(canvas.getByRole("table")).toBeVisible();
    await expect(canvas.getAllByRole("checkbox")).toHaveLength(2);
  },
};

export const Streaming: Story = {
  args: { raw, variant: "streaming" },
};

export const CustomTag: Story = {
  args: {
    raw: 'Investigating {% ref type="issue" id="SENTRY-123" /%}.',
    components: {
      Tag: ({ attrs }) => (
        <a href={`/issues/${attrs.id}/`} className="text-[var(--scraps-content-accent)] underline">
          {attrs.id}
        </a>
      ),
    },
  },
};
