import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import { IndeterminateLoader } from "./loader";

const meta = { title: "Scraps/Loader", component: IndeterminateLoader, parameters: { layout: "padded" } } satisfies Meta<typeof IndeterminateLoader>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Vibrant: Story = { args: { "aria-label": "Loading issues" } };
export const Monochrome: Story = { args: { variant: "monochrome" }, decorators: [(Story) => <div style={{ color: "#7553ff", width: 240 }}><Story /></div>] };
export const Widths: Story = {
  render: () => (
    <div className="grid gap-6">
      <div style={{ width: 128 }}><IndeterminateLoader data-testid="small-loader" /></div>
      <div style={{ width: 240 }}><IndeterminateLoader /></div>
      <div style={{ width: 400 }}><IndeterminateLoader data-testid="large-loader" /></div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const smallBars = canvas.getByTestId("small-loader").querySelectorAll<HTMLElement>("span span");
    const largeBars = canvas.getByTestId("large-loader").querySelectorAll<HTMLElement>("span span");
    await waitFor(() => {
      expect(getComputedStyle(smallBars[0]!).animationDuration).toBe("2s");
      expect(getComputedStyle(smallBars[1]!).animationDelay).toBe("0.8s");
      expect(getComputedStyle(largeBars[0]!).animationDuration).toBe("2.8s");
      expect(getComputedStyle(largeBars[1]!).animationDelay).toBe("1.2s");
    });
  },
};
export const Messages: Story = { args: { messages: ["Loading issues", "Checking filters", "Preparing results"] }, render: (args) => <div className="dark" style={{ background: "#24202b", color: "#e7e5ea", padding: 24 }}><IndeterminateLoader {...args} /></div>, play: async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await expect(canvas.getByRole("progressbar", { name: "Loading" })).toBeInTheDocument();
  const message = canvas.getByText(/Loading issues/);
  const messageTransition = message.parentElement;
  if (!messageTransition) throw new Error("Loader message transition is missing");
  await waitFor(() => expect(getComputedStyle(messageTransition).opacity).toBe("1"));
} };
export const LightAndDark: Story = {
  render: () => (
    <div className="grid gap-6">
      <IndeterminateLoader data-testid="light-vibrant" />
      <div className="dark bg-background p-6 text-foreground">
        <IndeterminateLoader data-testid="dark-vibrant" />
      </div>
      <IndeterminateLoader color="#123456" data-testid="native-color-vibrant" />
      <IndeterminateLoader data-testid="style-color-monochrome" style={{ color: "#abcdef" }} variant="monochrome" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const light = canvas.getByTestId("light-vibrant");
    const dark = canvas.getByTestId("dark-vibrant");
    const nativeColor = canvas.getByTestId("native-color-vibrant");
    const monochrome = canvas.getByTestId("style-color-monochrome");
    const readVisuals = (track: HTMLElement) => {
      const before = getComputedStyle(track, "::before");
      const mask = track.querySelector<HTMLElement>(":scope > span");
      const bars = track.querySelectorAll<HTMLElement>("span span");
      if (!mask || bars.length !== 2) throw new Error("Loader visual layers are missing");
      return {
        accentBars: [...bars].map((bar) => getComputedStyle(bar).backgroundColor),
        maskImage: getComputedStyle(mask).maskImage,
        maskSize: getComputedStyle(mask).maskSize,
        trackColor: before.backgroundColor,
        trackOpacity: before.opacity,
      };
    };
    await expect(readVisuals(light)).toEqual({
      accentBars: ["rgb(117, 83, 255)", "rgb(117, 83, 255)"],
      maskImage: expect.stringContaining("data:image/svg+xml"),
      maskSize: "16px 8px",
      trackColor: "rgb(230, 230, 233)",
      trackOpacity: "1",
    });
    await expect(readVisuals(dark)).toEqual({
      accentBars: ["rgb(117, 83, 255)", "rgb(117, 83, 255)"],
      maskImage: expect.stringContaining("data:image/svg+xml"),
      maskSize: "16px 8px",
      trackColor: "rgb(27, 24, 33)",
      trackOpacity: "1",
    });
    await expect(readVisuals(nativeColor)).toMatchObject({
      accentBars: ["rgb(117, 83, 255)", "rgb(117, 83, 255)"],
      trackColor: "rgb(18, 52, 86)",
      trackOpacity: "1",
    });
    await expect(readVisuals(monochrome)).toMatchObject({
      accentBars: ["rgb(171, 205, 239)", "rgb(171, 205, 239)"],
      trackColor: "rgb(171, 205, 239)",
      trackOpacity: "0.2",
    });
  },
};
export const ReducedMotion: Story = { args: { messages: ["Loading"] }, parameters: { chromatic: { disableSnapshot: true } } };
