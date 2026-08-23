import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { CodeBlock, InlineCode } from "./code";

const meta = {
  title: "Scraps/Code",
  component: CodeBlock,
  parameters: { layout: "centered" },
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

function readTooltipAnimation(
  tooltip: HTMLElement,
  state: "data-starting-style" | "data-ending-style"
) {
  const clone = tooltip.cloneNode(true) as HTMLElement;
  clone.setAttribute(state, "");
  tooltip.ownerDocument.body.append(clone);
  const computed = getComputedStyle(clone);
  const animation = {
    delay: computed.animationDelay,
    duration: computed.animationDuration,
    name: computed.animationName,
    timingFunction: computed.animationTimingFunction,
  };
  clone.remove();
  return animation;
}

export const Block: Story = {
  args: {
    children: "const sentry = { status: 'exact' };",
    filename: "example.ts",
    language: "typescript",
    linesToHighlight: [1],
  },
  render: (args) => (
    <div style={{ width: 560 }}>
      <CodeBlock {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvasElement.querySelector(".token.keyword")).not.toBeNull()
    );
    await waitFor(() =>
      expect(canvasElement.querySelector(".line-highlight")).not.toBeNull()
    );
    const pre = canvasElement.querySelector("pre");
    if (!pre) throw new Error("Code preview is missing");
    await expect(getComputedStyle(pre).backgroundColor).toBe("rgb(248, 248, 249)");
    await expect(getComputedStyle(pre).color).toBe("rgb(48, 46, 54)");
    await expect(getComputedStyle(pre).fontFamily).toContain("Roboto Mono");
    const copy = canvas.getByRole("button", { name: "Copy snippet" });
    await userEvent.tab();
    await expect(copy).toHaveFocus();
    await expect(getComputedStyle(copy).width).toBe("28px");
    await expect(getComputedStyle(copy).height).toBe("28px");
    await expect(getComputedStyle(copy).borderRadius).toBe("5px");
    await expect(getComputedStyle(copy).boxShadow).toBe(
      "rgb(255, 255, 255) 0px 0px 0px 0px, rgb(117, 83, 255) 0px 0px 0px 2px"
    );
    const copyIcon = copy.querySelector("svg");
    if (!copyIcon) throw new Error("Copy icon is missing");
    await expect(getComputedStyle(copyIcon).width).toBe("12px");
    await expect(getComputedStyle(copyIcon).height).toBe("12px");
    const tooltip = await waitFor(() => {
      const found = canvasElement.ownerDocument.querySelector<HTMLElement>(
        '[role="tooltip"]'
      );
      if (!found) throw new Error("Copy tooltip is missing");
      return found;
    });
    const enter = readTooltipAnimation(tooltip, "data-starting-style");
    const exit = readTooltipAnimation(tooltip, "data-ending-style");
    await expect(enter.name).toContain("copy-tooltip-spring-enter");
    await expect(enter.duration).toBe("0.2s");
    await expect(enter.delay).toBe("0s");
    await expect(enter.timingFunction).toContain("linear(");
    await expect(exit.name).toContain("copy-tooltip-spring-exit");
    await expect(exit.duration).toBe("0.2s");
    await expect(exit.delay).toBe("0.1s");
    await expect(exit.timingFunction).toContain("linear(");
  },
};

export const Dark: Story = {
  args: {
    children: "function capture(error) { return error; }",
    dark: true,
    language: "javascript",
  },
  render: (args) => (
    <div style={{ width: 560 }}>
      <CodeBlock {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const pre = canvasElement.querySelector("pre");
    const wrapper = pre?.parentElement?.parentElement;
    if (!pre || !wrapper) throw new Error("Dark code preview is missing");
    await expect(getComputedStyle(pre).backgroundColor).toBe("rgb(36, 32, 43)");
    await expect(getComputedStyle(pre).color).toBe("rgb(231, 229, 234)");
    await expect(
      getComputedStyle(wrapper).getPropertyValue("--scraps-theme-border-primary").trim()
    ).toBe("#141119");
    const copy = canvas.getByRole("button", { name: "Copy snippet" });
    copy.focus();
    await expect(getComputedStyle(copy).boxShadow).toBe(
      "rgb(46, 41, 54) 0px 0px 0px 0px, rgb(117, 83, 255) 0px 0px 0px 2px"
    );
    copy.blur();
    await userEvent.hover(copy);
    await waitFor(() => {
      const arrow = canvasElement.ownerDocument.querySelector<SVGSVGElement>(
        '[role="tooltip"] svg'
      );
      if (!arrow) throw new Error("Dark tooltip arrow is missing");
      const polygons = arrow.querySelectorAll("polygon");
      expect(polygons).toHaveLength(3);
      expect(getComputedStyle(polygons[0]!)).toHaveProperty("display", "block");
      const arrowFill = polygons[2];
      if (!arrowFill) throw new Error("Dark tooltip arrow fill is missing");
      expect(getComputedStyle(arrowFill).fill).toBe("rgb(46, 41, 54)");
    });
  },
};

export const Tabs: Story = {
  args: {
    children: "pnpm add @sentry/nextjs",
    language: "bash",
    onTabClick: fn(),
    selectedTab: "pnpm",
    tabs: [
      { label: "pnpm", value: "pnpm" },
      { label: "npm", value: "npm" },
    ],
  },
  render: (args) => (
    <div style={{ width: 560 }}>
      <CodeBlock {...args} />
    </div>
  ),
  play: async ({ args, canvasElement }) => {
    const npmTab = within(canvasElement).getByRole("button", { name: "npm" });
    await userEvent.click(npmTab);
    await expect(args.onTabClick).toHaveBeenCalledWith("npm");
  },
};

export const Square: Story = {
  args: {
    children: "const edge = true;",
    isRounded: false,
    language: "javascript",
  },
  render: (args) => (
    <div style={{ width: 560 }}>
      <CodeBlock {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const wrapper = canvasElement.querySelector<HTMLElement>(
      '[data-rounded="false"]'
    );
    if (!wrapper) throw new Error("Square code preview is missing");
    await expect(getComputedStyle(wrapper).borderRadius).toBe("0px");
  },
};

export const WithoutCopyButton: Story = {
  args: {
    children: "const privateValue = true;",
    hideCopyButton: true,
    language: "javascript",
  },
  render: (args) => (
    <div style={{ width: 560 }}>
      <CodeBlock {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).queryByRole("button", { name: "Copy snippet" })
    ).not.toBeInTheDocument();
  },
};

export const SelectionDisabled: Story = {
  args: {
    children: "const partialValue = true;",
    disableUserSelection: true,
    language: "javascript",
  },
  render: (args) => (
    <div style={{ width: 560 }}>
      <CodeBlock {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const code = canvasElement.querySelector("code");
    if (!code) throw new Error("Selection-disabled code is missing");
    await expect(getComputedStyle(code).userSelect).toBe("none");
  },
};

export const WithIcon: Story = {
  args: {
    children: "export const file = true;",
    icon: (
      <svg aria-label="TypeScript file" height="16" viewBox="0 0 16 16" width="16">
        <path d="M3 1h7l3 3v11H3z" fill="currentColor" />
      </svg>
    ),
    language: "typescript",
  },
  render: (args) => (
    <div style={{ width: 560 }}>
      <CodeBlock {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText("TypeScript file")).toBeVisible();
    await expect(
      getComputedStyle(canvas.getByRole("button", { name: "Copy snippet" })).opacity
    ).toBe("1");
  },
};

export const Copied: Story = {
  args: {
    children: "const copied = true;",
    language: "javascript",
    onCopy: fn(),
  },
  render: (args) => (
    <div style={{ width: 560 }}>
      <CodeBlock {...args} />
    </div>
  ),
  play: async ({ args, canvasElement }) => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.resolve() },
    });
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Copy snippet" })
    );
    await waitFor(() =>
      expect(
        canvasElement.ownerDocument.querySelector('[role="tooltip"]')
      ).toHaveTextContent("Copied")
    );
    await expect(args.onCopy).toHaveBeenCalledWith("const copied = true;");
  },
};

export const SelectionCopy: Story = {
  args: {
    children: "const selected = true;",
    language: "javascript",
    onSelectAndCopy: fn(),
  },
  render: (args) => (
    <div style={{ width: 560 }}>
      <CodeBlock {...args} />
    </div>
  ),
  play: async ({ args, canvasElement }) => {
    const code = canvasElement.querySelector("code");
    if (!code) throw new Error("Selectable code preview is missing");
    code.dispatchEvent(new Event("copy", { bubbles: true }));
    await expect(args.onSelectAndCopy).toHaveBeenCalledOnce();
  },
};

export const CopyError: Story = {
  args: {
    children: "const denied = true;",
    language: "javascript",
  },
  render: (args) => (
    <div style={{ width: 560 }}>
      <CodeBlock {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error("denied")) },
    });
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Copy snippet" })
    );
    await waitFor(() =>
      expect(
        canvasElement.ownerDocument.querySelector('[role="tooltip"]')
      ).toHaveTextContent("Unable to copy")
    );
  },
};

export const Inline: Story = {
  args: { children: "unused" },
  render: () => (
    <p>
      Run <InlineCode>pnpm dev</InlineCode> or inspect the{" "}
      <InlineCode variant="neutral">event_id</InlineCode> field.
    </p>
  ),
  play: async ({ canvasElement }) => {
    const [accent, neutral] = canvasElement.querySelectorAll("code");
    if (!accent || !neutral) throw new Error("Inline code previews are missing");
    await expect(getComputedStyle(accent).color).toBe("rgb(200, 0, 126)");
    await expect(getComputedStyle(neutral).color).toBe("rgb(48, 46, 54)");
  },
};

function TooltipGroupPreview() {
  const [ancestorClicks, setAncestorClicks] = useState(0);
  return (
    <div
      data-testid="tooltip-ancestor"
      style={{ display: "grid", gap: 24, width: 420 }}
      onClick={() => setAncestorClicks((count) => count + 1)}
    >
      <CodeBlock language="javascript">{"const first = true;"}</CodeBlock>
      <CodeBlock language="javascript">{"const second = true;"}</CodeBlock>
      <output data-testid="tooltip-ancestor-clicks">{ancestorClicks}</output>
    </div>
  );
}

export const TooltipGroup: Story = {
  args: { children: "unused" },
  render: () => <TooltipGroupPreview />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [first, second] = canvas.getAllByRole("button", {
      name: "Copy snippet",
    });
    if (!first || !second) throw new Error("Copy triggers are missing");
    await userEvent.hover(first);
    await waitFor(() => expect(first).toHaveAttribute("data-popup-open"));
    await userEvent.unhover(first);
    await userEvent.hover(second);
    await waitFor(() => expect(second).toHaveAttribute("data-popup-open"), {
      timeout: 350,
    });
    await expect(first).not.toHaveAttribute("data-popup-open");
    await expect(
      canvasElement.ownerDocument.querySelectorAll('[role="tooltip"]')
    ).toHaveLength(1);

    const tooltip = canvasElement.ownerDocument.querySelector<HTMLElement>(
      '[role="tooltip"][data-open]'
    );
    if (!tooltip) throw new Error("Open copy tooltip is missing");
    tooltip.click();
    await expect(canvas.getByTestId("tooltip-ancestor-clicks")).toHaveTextContent("0");
  },
};

export const TooltipCollision: Story = {
  args: { children: "unused" },
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
  render: () => (
    <div style={{ position: "fixed", top: 100, left: 0, width: 80 }}>
      <CodeBlock language="javascript">{"const edge = true;"}</CodeBlock>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Copy snippet" });
    await userEvent.hover(trigger);
    const document = canvasElement.ownerDocument;
    await waitFor(() => {
      const tooltip = document.querySelector<HTMLElement>('[role="tooltip"][data-open]');
      if (!tooltip) throw new Error("Collision tooltip is missing");
      expect(tooltip).toHaveAttribute("data-side", "right");
      expect(tooltip.querySelector("svg")).toHaveAttribute("data-side", "right");
      expect(tooltip.getBoundingClientRect().left).toBeGreaterThanOrEqual(12);
    });
  },
};
