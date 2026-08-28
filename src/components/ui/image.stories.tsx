import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import { Image } from "./image";

const imageSource =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='360' viewBox='0 0 640 360'%3E%3Crect width='640' height='360' fill='%237553ff'/%3E%3Ccircle cx='470' cy='120' r='100' fill='%23fc5cb4'/%3E%3Ctext x='48' y='210' fill='white' font-family='sans-serif' font-size='48'%3ESentry%3C/text%3E%3C/svg%3E";

const meta = {
  title: "Scraps/Image",
  component: Image,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Image>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: { alt: "Sentry color study", src: imageSource },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("img", { name: "Sentry color study" }),
    ).toHaveAttribute("loading", "lazy");
  },
};

export const AspectRatio: Story = {
  render: () => (
    <Image
      alt="Sixteen by nine image"
      aspectRatio="16 / 9"
      objectFit="cover"
      src={imageSource}
      width="320px"
    />
  ),
};

export const ObjectFit: Story = {
  render: () => (
    <div className="grid gap-4 sm:grid-cols-2">
      <Image
        alt="Contained image"
        height="180px"
        objectFit="contain"
        src={imageSource}
        width="100%"
      />
      <Image
        alt="Covered image"
        height="180px"
        objectFit="cover"
        objectPosition="top"
        src={imageSource}
        width="100%"
      />
    </div>
  ),
};

export const Responsive: Story = {
  render: () => (
    <Image
      alt="Responsive image"
      height={{ zero: "180px", md: "260px" }}
      src={imageSource}
      width={{ zero: "100%", md: "480px" }}
    />
  ),
};

export const Radius: Story = {
  render: () => (
    <Image alt="Rounded image" radius={{ zero: "sm", md: "2xl" }} src={imageSource} width="320px" />
  ),
};

export const Loading: Story = {
  render: () => <Image alt="Eager image" loading="eager" src={imageSource} width="320px" />,
};

export const ErrorFallback: Story = {
  render: () => (
    <Image
      alt="Fallback image"
      src="data:image/svg+xml,broken"
      width="320px"
      onError={(event) => {
        event.currentTarget.src = imageSource;
      }}
    />
  ),
};

export const LightAndDark: Story = {
  render: () => (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="bg-background p-4">
        <Image alt="Light image" radius="md" src={imageSource} />
      </div>
      <div className="dark bg-background p-4">
        <Image alt="Dark image" radius="md" src={imageSource} />
      </div>
    </div>
  ),
};

export const Narrow: Story = {
  render: () => (
    <div className="max-w-xs">
      <Image
        alt="Narrow image"
        aspectRatio="1 / 1"
        objectFit="cover"
        src={imageSource}
        width="100%"
      />
    </div>
  ),
};
