import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import { AvatarButton } from "./avatar-button";

const localSvg = (fill: string, inset = 0) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect x="${inset}" y="${inset}" width="${
      120 - inset * 2
    }" height="${120 - inset * 2}" fill="${fill}"/></svg>`,
  )}`;

const meta = {
  component: AvatarButton,
  title: "Scraps/AvatarButton",
} satisfies Meta<typeof AvatarButton>;

export default meta;
type Story = StoryObj<typeof meta>;

function Matrix({ dark = false }: { dark?: boolean }) {
  return (
    <div className={dark ? "dark" : ""}>
      <div className="flex flex-wrap items-center gap-4 bg-[var(--background)] p-6">
        <AvatarButton
          aria-label="Letter xs"
          avatar={{
            identifier: "jane",
            name: "Jane Doe",
            type: "letter_avatar",
          }}
          size="xs"
        />
        <AvatarButton
          aria-label="Letter sm"
          avatar={{
            identifier: "john",
            name: "John Doe",
            type: "letter_avatar",
          }}
          size="sm"
        />
        <AvatarButton
          aria-label="Letter md"
          avatar={{
            identifier: "sam",
            name: "Sam Doe",
            type: "letter_avatar",
          }}
        />
        <AvatarButton
          aria-label="Filled upload"
          avatar={{
            identifier: "filled",
            name: "Filled Upload",
            type: "upload",
            uploadUrl: localSvg("#7553ff"),
          }}
        />
        <AvatarButton
          aria-label="Padded upload"
          avatar={{
            identifier: "padded",
            name: "Padded Upload",
            type: "upload",
            uploadUrl: localSvg("#ff9838", 24),
          }}
        />
        <AvatarButton
          aria-label="Broken upload"
          avatar={{
            identifier: "broken",
            name: "Broken Upload",
            type: "upload",
            uploadUrl: "data:image/svg+xml,broken",
          }}
        />
      </div>
    </div>
  );
}

export const VisualAcceptanceMatrix: Story = {
  render: () => (
    <div className="grid gap-4">
      <Matrix />
      <Matrix dark />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("button", { name: "Letter xs" })[0]).toBeVisible();
    await expect(canvas.getAllByRole("button", { name: "Filled upload" })[0]).toBeVisible();
    await expect(canvas.getAllByRole("button", { name: "Padded upload" })[0]).toBeVisible();
  },
};
