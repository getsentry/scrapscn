import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import { Quote } from "./quote";

const meta = {
  title: "Scraps/Quote",
  component: Quote,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Quote>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: { children: "It is not a bug; it is an undocumented feature." },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("blockquote")).toBeInTheDocument();
  },
};

export const WithSource: Story = {
  args: {
    children: "It is not a bug; it is a feature.",
    source: { author: "Developer", href: "https://example.com/source", label: "in complete denial" },
  },
};

const semanticCases = [
  { caption: null, cite: null, id: "absent", label: null, source: undefined },
  { caption: "–", cite: null, id: "empty", label: null, source: {} },
  {
    caption: "–",
    cite: "https://example.com/href-only",
    id: "href-only",
    label: null,
    source: { href: "https://example.com/href-only" },
  },
  {
    caption: "– Ada",
    cite: null,
    id: "author-only",
    label: null,
    source: { author: "Ada" },
  },
  {
    caption: "– , Notes",
    cite: null,
    id: "label-only",
    label: "Notes",
    source: { label: "Notes" },
  },
  {
    caption: "– Ada, Notes",
    cite: "https://example.com/full",
    id: "full",
    label: "Notes",
    source: { author: "Ada", href: "https://example.com/full", label: "Notes" },
  },
] as const;

export const SemanticMatrix: Story = {
  render: () => (
    <div className="grid gap-6">
      {semanticCases.map((quoteCase) => (
        <div data-testid={`quote-case-${quoteCase.id}`} key={quoteCase.id}>
          {quoteCase.source === undefined ? (
            <Quote>A quote.</Quote>
          ) : (
            <Quote source={quoteCase.source}>A quote.</Quote>
          )}
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const quoteCase of semanticCases) {
      const fixture = canvas.getByTestId(`quote-case-${quoteCase.id}`);
      const blockquote = fixture.querySelector("blockquote");
      const caption = fixture.querySelector("figcaption");
      await expect(fixture.querySelector("figure")).not.toBeNull();
      await expect(fixture.querySelector('hr[aria-orientation="vertical"]')).not.toBeNull();
      await expect(blockquote?.textContent).toBe("A quote.");
      await expect(blockquote?.getAttribute("cite") ?? null).toBe(quoteCase.cite);
      await expect(caption?.textContent.trim() ?? null).toBe(quoteCase.caption);
      await expect(caption?.querySelector("cite")?.textContent ?? null).toBe(quoteCase.label);
    }
  },
};

export const LightAndDark: Story = {
  render: () => (
    <div className="grid gap-6 sm:grid-cols-2">
      <Quote source={{ author: "Light" }}>A regular Scraps quote.</Quote>
      <div className="dark bg-background p-4 text-foreground" data-testid="dark-quote">
        <Quote source={{ author: "Dark" }}>A regular Scraps quote.</Quote>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const darkFixture = within(canvasElement).getByTestId("dark-quote");
    const quote = darkFixture.querySelector("blockquote");
    const rail = darkFixture.querySelector("hr");
    if (!quote || !rail) throw new Error("Dark Quote fixture is incomplete");
    await expect(getComputedStyle(darkFixture).backgroundColor).toBe("oklch(0.292 0.024 302.5)");
    await expect(getComputedStyle(quote).color).toBe("oklch(0.925 0.007 304.2)");
    await expect(getComputedStyle(rail).borderLeftColor).toBe("rgb(20, 17, 25)");
  },
};
