import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import { PictureInPictureProvider, usePictureInPicture } from "./picture-in-picture";

function SupportState() {
  const { isSupported, pipWindow } = usePictureInPicture();
  return (
    <output data-testid="picture-in-picture-support">
      {isSupported ? "Supported" : "Unavailable"} · {pipWindow ? "open" : "closed"}
    </output>
  );
}

const meta = {
  component: PictureInPictureProvider,
  title: "Scraps/PictureInPicture",
} satisfies Meta<typeof PictureInPictureProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UnsupportedBrowser: Story = {
  args: { children: <SupportState /> },
  beforeEach: () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, "documentPictureInPicture");
    Object.defineProperty(window, "documentPictureInPicture", {
      configurable: true,
      value: undefined,
    });
    return () => {
      if (descriptor) {
        Object.defineProperty(window, "documentPictureInPicture", descriptor);
      } else {
        Reflect.deleteProperty(window, "documentPictureInPicture");
      }
    };
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByTestId("picture-in-picture-support")).toHaveTextContent(
      "Unavailable · closed",
    );
  },
};
