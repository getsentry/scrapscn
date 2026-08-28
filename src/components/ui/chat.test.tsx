import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("framer-motion", async (importOriginal) => ({
  ...(await importOriginal<typeof import("framer-motion")>()),
  useReducedMotion: () => false,
}));

import {
  AssistantActions,
  AssistantMessage,
  MessageRow,
  Spinner,
  ThinkingBlock,
  ToolCall,
  ToolCallIndicator,
  UserMessage,
} from "./chat";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const roots: Root[] = [];

async function render(element: ReactNode) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  roots.push(root);
  await act(async () => root.render(element));
  return { host, root };
}

async function click(element: Element) {
  await act(async () => element.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

describe("regular Scraps Chat", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  afterEach(async () => {
    vi.useRealTimers();
    for (const root of roots.splice(0)) await act(async () => root.unmount());
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it("forwards attributes and keeps canonical message geometry", async () => {
    const { host } = await render(
      <div>
        <MessageRow data-testid="user-row" from="user">
          <UserMessage data-testid="user-message" maxWidth="60%" style={{ width: "50%" }}>
            {"Long\nhttps://example.invalid/a-very-long-unbroken-token"}
          </UserMessage>
        </MessageRow>
        <MessageRow data-testid="assistant-row" density="compact" from="assistant">
          <AssistantMessage data-testid="assistant-message">Answer</AssistantMessage>
        </MessageRow>
      </div>,
    );
    const userRow = host.querySelector<HTMLElement>("[data-testid=user-row]")!;
    const assistantRow = host.querySelector<HTMLElement>("[data-testid=assistant-row]")!;
    const user = host.querySelector<HTMLElement>("[data-testid=user-message]")!;
    const assistant = host.querySelector<HTMLElement>("[data-testid=assistant-message]")!;

    expect(userRow.className).toContain("justify-end");
    expect(userRow.className).toContain("p-4");
    expect(assistantRow.className).toContain("justify-start");
    expect(assistantRow.className).toContain("px-4");
    expect(assistantRow.className).toContain("py-2");
    expect(user.style.maxWidth).toBe("60%");
    expect(user.style.width).toBe("50%");
    expect(user.className).toContain("whitespace-pre-wrap");
    expect(user.className).toContain("wrap-anywhere");
    expect(user.className).toContain("bg-[var(--scraps-theme-surface400)]");
    expect(assistant.className).toContain("min-w-0");
    expect(assistant.className).toContain("w-full");
  });

  it("keeps Spinner sizes and decorative or status semantics", async () => {
    const { host } = await render(
      <div>
        <Spinner data-testid="decorative" />
        <Spinner aria-label="Streaming" data-testid="labelled" role="status" size="lg" />
      </div>,
    );
    const decorative = host.querySelector<HTMLElement>("[data-testid=decorative]")!;
    const labelled = host.querySelector<HTMLElement>("[data-testid=labelled]")!;
    expect(decorative.getAttribute("aria-hidden")).toBe("true");
    expect(decorative.className).toContain("size-3");
    expect(labelled.getAttribute("aria-hidden")).toBeNull();
    expect(labelled.getAttribute("role")).toBe("status");
    expect(labelled.className).toContain("size-6");
    expect(labelled.className).toContain("scraps-chat-spin_0.6s");
    expect(labelled.className).toContain("scraps-chat-spin_2.4s");
  });

  it("renders every aggregate tool status with exact labels", async () => {
    const { host } = await render(
      <div>
        <ToolCallIndicator status="loading" />
        <ToolCallIndicator status="pending" />
        <ToolCallIndicator status="success" />
        <ToolCallIndicator status="failure" />
        <ToolCallIndicator status="mixed" />
        <ToolCallIndicator aria-label="Custom status" status="success" />
        <span data-testid="content">
          <ToolCallIndicator status="content" />
        </span>
      </div>,
    );
    for (const label of [
      "Running...",
      "Waiting for approval",
      "All tool calls succeeded",
      "All tool calls failed",
      "Some tool calls succeeded and some failed",
      "Custom status",
    ]) {
      expect(host.querySelector(`[aria-label="${label}"]`)).not.toBeNull();
    }
    expect(host.querySelector("[data-testid=content]")?.childElementCount).toBe(0);
    expect(
      host.querySelector('[aria-label="All tool calls succeeded"] path')?.getAttribute("d"),
    ).toContain("M13.72 3.22");
  });

  it("renders ToolCall slots inline with duration and failure metadata", async () => {
    const { host } = await render(
      <ToolCall
        durationMs={9_400}
        failureLabel="502"
        input={<span>GET /spans</span>}
        notifications={["Results truncated"]}
        output={<span>Gateway timeout</span>}
        reference={{ label: "Span", value: "f00" }}
        status="failure"
        title="Query spans"
      >
        Request details
      </ToolCall>,
    );

    expect(host.textContent).toContain("Query spans");
    expect(host.textContent).toContain("Input:");
    expect(host.textContent).toContain("GET /spans");
    expect(host.textContent).toContain("Output:");
    expect(host.textContent).toContain("Gateway timeout");
    expect(host.textContent).toContain("Results truncated");
    expect(host.textContent).toContain("Request details");
    expect(host.textContent).toContain("502");
    expect(host.textContent).toContain("9.4s");
    expect(host.querySelectorAll("button")).toHaveLength(1);
    expect(host.querySelector("button")?.hasAttribute("aria-expanded")).toBe(false);
  });

  it("uses the default failure label", async () => {
    const { host } = await render(<ToolCall status="failure" title="Read trace" />);
    expect(host.textContent).toContain("Failed");
  });

  it("reports feedback and copy without bubbling or holding submitted state", async () => {
    const onCopy = vi.fn();
    const onFeedback = vi.fn();
    const parentClick = vi.fn();
    const { host } = await render(
      <div onClick={parentClick}>
        <AssistantActions
          copyText="Assistant response"
          data-testid="actions"
          onCopy={onCopy}
          onFeedback={onFeedback}
        />
      </div>,
    );
    await click(host.querySelector('[aria-label="I like this response"]')!);
    await click(host.querySelector('[aria-label="I don\'t like this response"]')!);
    await click(host.querySelector('[aria-label="Copy to clipboard"]')!);
    await act(async () => Promise.resolve());

    expect(onFeedback.mock.calls).toEqual([["positive"], ["negative"]]);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("Assistant response");
    expect(onCopy).toHaveBeenCalledWith("Assistant response");
    expect(parentClick).not.toHaveBeenCalled();
    expect(host.querySelector("[data-testid=actions]")?.className).toContain("grid");
  });

  it("hides empty copy text and locks feedback with the submitted label", async () => {
    const { host } = await render(<AssistantActions copyText="" feedbackDisabled />);
    expect(host.querySelector('[aria-label="Copy to clipboard"]')).toBeNull();
    const submitted = host.querySelectorAll<HTMLButtonElement>('[aria-label="Feedback submitted"]');
    expect(submitted).toHaveLength(2);
    expect(Array.from(submitted).every((button) => button.disabled)).toBe(true);
  });

  it("counts, freezes, collapses, and manually reopens ThinkingBlock", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T00:00:05.300Z"));
    const start = new Date("2025-01-01T00:00:00.000Z");
    const { host, root } = await render(
      <ThinkingBlock startTime={start} title="Analyzing...">
        <div>inner content</div>
      </ThinkingBlock>,
    );
    expect(host.textContent).toContain("5.3s");
    expect(host.querySelector("button")?.getAttribute("aria-expanded")).toBe("true");
    expect(host.textContent).toContain("Analyzing.");

    await act(async () => {
      vi.advanceTimersByTime(2_000);
    });
    expect(host.textContent).toContain("7.3s");

    const end = new Date("2025-01-01T00:01:30.000Z");
    await act(async () =>
      root.render(
        <ThinkingBlock endTime={end} startTime={start} title="Done">
          <div>inner content</div>
        </ThinkingBlock>,
      ),
    );
    const iconPaths = Array.from(host.querySelectorAll("svg path"), (path) =>
      path.getAttribute("d"),
    );
    expect(iconPaths.some((path) => path?.startsWith("M8 0.25C8.21"))).toBe(true);
    expect(host.querySelector("svg circle")).toBeNull();
    expect(host.textContent).toContain("1.5min");
    expect(host.querySelector("button")?.getAttribute("aria-expanded")).toBe("false");
    await click(host.querySelector("button")!);
    expect(host.querySelector("button")?.getAttribute("aria-expanded")).toBe("true");
  });
});
