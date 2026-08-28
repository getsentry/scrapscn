import { act, type ReactNode } from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const { isMacMock, loggerWarnMock } = vi.hoisted(() => ({
  isMacMock: vi.fn(() => false),
  loggerWarnMock: vi.fn(),
}));

vi.mock("@react-aria/utils", async (importActual) => ({
  ...(await importActual<typeof import("@react-aria/utils")>()),
  isMac: isMacMock,
}));

vi.mock("@sentry/react", () => ({
  logger: { warn: loggerWarnMock },
}));

import { Hotkey, Kbd, matchesHotkey, useHotkeys } from "./hotkey";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const roots: Array<{ container: HTMLDivElement; root: Root }> = [];

async function render(ui: ReactNode) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push({ container, root });
  await act(async () => root.render(ui));
  return container;
}

type TestRegistration = {
  callback: (event: KeyboardEvent) => void;
  match: string | string[];
  enabled?: boolean;
  includeInputs?: boolean;
  skipPreventDefault?: boolean;
};

function HotkeyListener({ hotkeys }: { hotkeys: TestRegistration[] }) {
  useHotkeys(hotkeys);
  return null;
}

async function mountHotkeys(hotkeys: TestRegistration[]) {
  await render(<HotkeyListener hotkeys={hotkeys} />);
  const mounted = roots[roots.length - 1];
  return {
    rerender: async (next: TestRegistration[]) => {
      await act(async () => mounted?.root.render(<HotkeyListener hotkeys={next} />));
    },
  };
}

function dispatchKey(
  key: string,
  options: KeyboardEventInit = {},
  target: Document | HTMLElement = document,
) {
  const event = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    code:
      key === "/"
        ? "Slash"
        : /^[a-z]$/.test(key)
          ? `Key${key.toUpperCase()}`
          : /^[0-9]$/.test(key)
            ? `Digit${key}`
            : key,
    key,
    ...options,
  });
  target.dispatchEvent(event);
  return event;
}

afterEach(async () => {
  for (const mounted of roots.splice(0)) {
    await act(async () => mounted.root.unmount());
    mounted.container.remove();
  }
  isMacMock.mockReset();
  isMacMock.mockReturnValue(false);
  loggerWarnMock.mockReset();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe("Hotkey regression evidence", () => {
  it("hydrates the server platform snapshot before updating to macOS", async () => {
    isMacMock.mockReturnValue(true);
    const serverMarkup = renderToString(<Hotkey value="mod+k" />);
    const container = document.createElement("div");
    container.innerHTML = serverMarkup;
    document.body.append(container);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(container.textContent).toBe("CtrlK");
    expect(container.querySelector("svg")).toBeNull();

    let root: Root | undefined;
    await act(async () => {
      root = hydrateRoot(container, <Hotkey value="mod+k" />);
    });
    if (!root) throw new Error("Hotkey hydration did not create a React root");
    roots.push({ container, root });

    expect(consoleError).not.toHaveBeenCalled();
    expect(container.querySelector('[aria-label="⌘"] svg')).not.toBeNull();
    expect(container.textContent).toBe("K");
  });

  it("renders the exact accessible Sentry modifier SVG", async () => {
    isMacMock.mockReturnValue(true);
    const container = await render(<Hotkey value="command+k" />);
    const icon = container.querySelector('[aria-label="⌘"] svg');

    expect(icon).not.toBeNull();
    expect(icon?.getAttribute("viewBox")).toBe("0 0 16 16");
    expect(icon?.querySelector("path")?.getAttribute("d")).toBe(
      "M12 1.25a2.75 2.75 0 1 1 0 5.5h-1.25v2.5H12A2.75 2.75 0 1 1 9.25 12v-1.25h-2.5V12A2.75 2.75 0 1 1 4 9.25h1.25v-2.5H4A2.75 2.75 0 1 1 6.75 4v1.25h2.5V4A2.75 2.75 0 0 1 12 1.25m-8 9.5A1.25 1.25 0 1 0 5.25 12v-1.25zM10.75 12A1.25 1.25 0 1 0 12 10.75h-1.25zm-4-2.75h2.5v-2.5h-2.5zM4 2.75a1.25 1.25 0 1 0 0 2.5h1.25V4c0-.69-.56-1.25-1.25-1.25m8 0c-.69 0-1.25.56-1.25 1.25v1.25H12a1.25 1.25 0 1 0 0-2.5",
    );
  });

  it("renders the canonical empty nested key for an empty first combination", async () => {
    const container = await render(<Hotkey value="" />);

    expect(container.querySelectorAll("kbd")).toHaveLength(2);
    expect(container.querySelector("kbd > kbd")?.textContent).toBe("");
  });

  it("uses the complete named-key aliases", async () => {
    const container = await render(<Hotkey value="ins+del+⇪" />);

    expect(container.textContent).toBe("InsertDelCapsLock");
  });

  it("does not use a physical ASCII fallback on an AZERTY mismatch", async () => {
    isMacMock.mockReturnValue(true);
    const callback = vi.fn();
    await mountHotkeys([{ callback, match: "mod+/" }]);
    const event = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      code: "Slash",
      key: "+",
      metaKey: true,
    });

    document.dispatchEvent(event);

    expect(callback).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it("uses a physical fallback for shifted punctuation", async () => {
    const callback = vi.fn();
    await mountHotkeys([{ callback, match: "control+shift+1" }]);
    const event = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      code: "Digit1",
      ctrlKey: true,
      key: "!",
      shiftKey: true,
    });

    document.dispatchEvent(event);

    expect(callback).toHaveBeenCalledOnce();
    expect(event.defaultPrevented).toBe(true);
  });

  it("logs the exact production warning for an unknown named glyph", async () => {
    vi.stubEnv("NODE_ENV", "production");

    await render(<Hotkey value="mysterykey" />);

    expect(loggerWarnMock).toHaveBeenCalledWith("Missing key glyph mapping", {
      keyName: "mysterykey",
    });
  });

  it("throws for an unknown named glyph in development", async () => {
    vi.stubEnv("NODE_ENV", "development");

    await expect(render(<Hotkey value="mysterykey" />)).rejects.toThrow(
      'Missing key glyph mapping for "mysterykey"',
    );
  });

  it("resolves later array combinations before displaying the first", async () => {
    vi.stubEnv("NODE_ENV", "development");

    await expect(render(<Hotkey value={["mod+k", "mysterykey"]} />)).rejects.toThrow(
      'Missing key glyph mapping for "mysterykey"',
    );
  });
});

describe("Kbd", () => {
  it("renders a kbd element", async () => {
    const container = await render(<Kbd>K</Kbd>);
    expect(container.textContent).toBe("K");
    expect(container.firstElementChild?.tagName).toBe("KBD");
  });

  it("forwards className", async () => {
    const container = await render(<Kbd className="custom">X</Kbd>);
    expect(container.firstElementChild?.classList.contains("custom")).toBe(true);
  });

  it("renders glyph characters", async () => {
    const container = await render(<Kbd>{"⌘"}</Kbd>);
    expect(container.textContent).toBe("⌘");
  });
});

describe("Hotkey canonical display", () => {
  it("renders command as ⌘ icon", async () => {
    isMacMock.mockReturnValue(true);
    const container = await render(<Hotkey value="command+k" />);
    expect(container.querySelector('[aria-label="⌘"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="⌘"]')?.getAttribute("role")).toBeNull();
    expect(container.querySelector('[aria-label="⌘"] svg')?.getAttribute("role")).toBe("img");
    expect(container.querySelector('[aria-label="⌘"] svg')?.hasAttribute("aria-hidden")).toBe(
      false,
    );
    expect(container.textContent).toContain("K");
  });

  it("renders ctrl as ⌃ icon", async () => {
    isMacMock.mockReturnValue(true);
    const container = await render(<Hotkey value="ctrl+alt+delete" />);
    expect(container.querySelector('[aria-label="⌃"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="⌥"]')).not.toBeNull();
    expect(container.textContent).toContain("Del");
  });

  it("renders option as ⌥ icon", async () => {
    isMacMock.mockReturnValue(true);
    const container = await render(<Hotkey value="option+x" />);
    expect(container.querySelector('[aria-label="⌥"]')).not.toBeNull();
    expect(container.textContent).toContain("X");
  });

  it("renders command as Ctrl text", async () => {
    const container = await render(<Hotkey value="command+k" />);
    expect(container.textContent).toBe("CtrlK");
  });

  it("renders ctrl as Ctrl text", async () => {
    const container = await render(<Hotkey value="ctrl+alt+delete" />);
    expect(container.textContent).toBe("CtrlAltDel");
  });

  it("renders option as Alt text", async () => {
    const container = await render(<Hotkey value="option+x" />);
    expect(container.textContent).toBe("AltX");
  });

  it("renders shift as ⇧ icon", async () => {
    const container = await render(<Hotkey value="shift+up" />);
    expect(container.querySelector('[aria-label="⇧"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="↑"]')).not.toBeNull();
  });

  it("accepts a single string", async () => {
    isMacMock.mockReturnValue(true);
    const container = await render(<Hotkey value="command+/" />);
    expect(container.querySelector('[aria-label="⌘"]')).not.toBeNull();
    expect(container.textContent).toContain("/");
  });

  it("uses first combo from array", async () => {
    isMacMock.mockReturnValue(true);
    const container = await render(<Hotkey value={["command+backspace", "delete"]} />);
    expect(container.querySelector('[aria-label="⌘"]')).not.toBeNull();
    expect(container.textContent).toContain("⌫");
    expect(container.textContent).not.toContain("Del");
  });

  it("renders nested kbd elements", async () => {
    const container = await render(<Hotkey value="command+k" />);
    expect(container.querySelectorAll("kbd")).toHaveLength(3);
  });
});

describe("useHotkeys", () => {
  it("handles a simple match", async () => {
    const callback = vi.fn();
    await mountHotkeys([{ callback, match: "ctrl+s" }]);
    const event = dispatchKey("s", { ctrlKey: true });
    expect(event.defaultPrevented).toBe(true);
    expect(callback).toHaveBeenCalledOnce();
  });

  it("handles multiple matches", async () => {
    const callback = vi.fn();
    await mountHotkeys([{ callback, match: ["ctrl+s", "command+m"] }]);
    dispatchKey("s", { ctrlKey: true });
    dispatchKey("m", { metaKey: true });
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("handles a complex match", async () => {
    const callback = vi.fn();
    await mountHotkeys([{ callback, match: ["command+ctrl+alt+shift+x"] }]);
    dispatchKey("x", { altKey: true, ctrlKey: true, metaKey: true, shiftKey: true });
    expect(callback).toHaveBeenCalledOnce();
  });

  it("does not match when extra modifiers are pressed", async () => {
    const callback = vi.fn();
    await mountHotkeys([{ callback, match: ["command+shift+x"] }]);
    dispatchKey("x", { altKey: true, ctrlKey: true, metaKey: true, shiftKey: true });
    expect(callback).not.toHaveBeenCalled();
  });

  it("updates with rerender", async () => {
    const callback = vi.fn();
    const mounted = await mountHotkeys([{ callback, match: "ctrl+s" }]);
    dispatchKey("s", { ctrlKey: true });
    expect(callback).toHaveBeenCalledOnce();
    callback.mockClear();
    await mounted.rerender([{ callback, match: "command+m" }]);
    dispatchKey("s", { ctrlKey: true });
    dispatchKey("m", { metaKey: true });
    expect(callback).toHaveBeenCalledOnce();
  });

  it("skips input and textarea", async () => {
    const callback = vi.fn();
    await mountHotkeys([{ callback, match: "/" }]);
    for (const tag of ["input", "textarea"] as const) {
      const input = document.createElement(tag);
      document.body.append(input);
      dispatchKey("/", {}, input);
    }
    expect(callback).not.toHaveBeenCalled();
  });

  it("does not skips input and textarea with includesInputs", async () => {
    const callback = vi.fn();
    await mountHotkeys([{ callback, includeInputs: true, match: "/" }]);
    const input = document.createElement("input");
    document.body.append(input);
    dispatchKey("/", {}, input);
    expect(callback).toHaveBeenCalledOnce();
  });

  it("skips preventDefault", async () => {
    const callback = vi.fn();
    await mountHotkeys([{ callback, match: "ctrl+s", skipPreventDefault: true }]);
    const event = dispatchKey("s", { ctrlKey: true });
    expect(event.defaultPrevented).toBe(false);
    expect(callback).toHaveBeenCalledOnce();
  });

  it("matches shift+digit when event.key is the shifted symbol", async () => {
    const callback = vi.fn();
    await mountHotkeys([{ callback, match: "command+shift+1" }]);
    dispatchKey("!", { code: "Digit1", metaKey: true, shiftKey: true });
    expect(callback).toHaveBeenCalledOnce();
  });

  it("matches a letter via event.key regardless of physical position", async () => {
    const callback = vi.fn();
    await mountHotkeys([{ callback, match: "command+k" }]);
    dispatchKey("k", { code: "KeyQ", metaKey: true });
    expect(callback).toHaveBeenCalledOnce();
  });

  it("matches a letter via event.code on non-Latin layouts", async () => {
    const callback = vi.fn();
    await mountHotkeys([{ callback, match: "command+k" }]);
    dispatchKey("к", { code: "KeyK", metaKey: true });
    expect(callback).toHaveBeenCalledOnce();
  });

  it("matches Escape via event.key", async () => {
    const callback = vi.fn();
    await mountHotkeys([{ callback, match: "Escape" }]);
    dispatchKey("Escape", { code: "Escape" });
    expect(callback).toHaveBeenCalledOnce();
  });

  it("matches arrow keys via event.key", async () => {
    const callback = vi.fn();
    await mountHotkeys([{ callback, match: "left" }]);
    dispatchKey("ArrowLeft", { code: "ArrowLeft" });
    expect(callback).toHaveBeenCalledOnce();
  });

  it("matches vim-style alternatives alongside arrow keys", async () => {
    const callback = vi.fn();
    await mountHotkeys([{ callback, match: ["left", "h"] }]);
    dispatchKey("ArrowLeft", { code: "ArrowLeft" });
    dispatchKey("h", { code: "KeyH" });
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("skips a disabled hotkey without preventing default", async () => {
    const callback = vi.fn();
    await mountHotkeys([{ callback, enabled: false, match: "Escape" }]);
    const event = dispatchKey("Escape");
    expect(callback).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it("respects toggling enabled between renders", async () => {
    const callback = vi.fn();
    const mounted = await mountHotkeys([{ callback, enabled: false, match: "Escape" }]);
    dispatchKey("Escape");
    await mounted.rerender([{ callback, enabled: true, match: "Escape" }]);
    dispatchKey("Escape");
    expect(callback).toHaveBeenCalledOnce();
  });

  it("matches a letter shortcut even when shift is held (case-insensitive)", async () => {
    const callback = vi.fn();
    await mountHotkeys([{ callback, match: "command+shift+k" }]);
    dispatchKey("K", { code: "KeyK", metaKey: true, shiftKey: true });
    expect(callback).toHaveBeenCalledOnce();
  });

  it("does not match mod+/ on AZERTY when user presses Cmd++ (physical Slash key)", async () => {
    isMacMock.mockReturnValue(true);
    const callback = vi.fn();
    await mountHotkeys([{ callback, includeInputs: true, match: "mod+/" }]);
    const event = dispatchKey("+", { code: "Slash", metaKey: true });
    expect(callback).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it("matches command on macOS", async () => {
    isMacMock.mockReturnValue(true);
    const callback = vi.fn();
    await mountHotkeys([{ callback, match: "mod+k" }]);
    dispatchKey("k", { metaKey: true });
    dispatchKey("k", { ctrlKey: true });
    expect(callback).toHaveBeenCalledOnce();
  });

  it("matches control on non-mac platforms", async () => {
    const callback = vi.fn();
    await mountHotkeys([{ callback, match: "mod+k" }]);
    dispatchKey("k", { ctrlKey: true });
    dispatchKey("k", { metaKey: true });
    expect(callback).toHaveBeenCalledOnce();
  });

  it("rejects extra non-mod modifiers", async () => {
    isMacMock.mockReturnValue(true);
    const callback = vi.fn();
    await mountHotkeys([{ callback, match: "mod+k" }]);
    dispatchKey("k", { ctrlKey: true, metaKey: true });
    expect(callback).not.toHaveBeenCalled();
  });

  it("removes its document listener on unmount", async () => {
    const add = vi.spyOn(document, "addEventListener");
    const remove = vi.spyOn(document, "removeEventListener");
    const callback = vi.fn();
    await mountHotkeys([{ callback, match: "k" }]);
    const listener = add.mock.calls.find(([name]) => name === "keydown")?.[1];
    const mounted = roots.pop();
    await act(async () => mounted?.root.unmount());
    expect(remove).toHaveBeenCalledWith("keydown", listener);
    mounted?.container.remove();
  });

  it("does not duplicate its document listener after rerender", async () => {
    const add = vi.spyOn(document, "addEventListener");
    const callback = vi.fn();
    const mounted = await mountHotkeys([{ callback, match: "k" }]);
    await mounted.rerender([{ callback, match: "m" }]);
    expect(add.mock.calls.filter(([name]) => name === "keydown")).toHaveLength(1);
  });

  it("ignores IME composition events", async () => {
    const callback = vi.fn();
    await mountHotkeys([{ callback, match: "k" }]);
    dispatchKey("k", { isComposing: true });
    expect(callback).not.toHaveBeenCalled();
  });
});

describe("matchesHotkey", () => {
  it("rejects composition, accepts alternatives and normalizes tokens", () => {
    const event = new KeyboardEvent("keydown", {
      code: "KeyK",
      ctrlKey: true,
      key: "k",
    });
    const composing = new KeyboardEvent("keydown", {
      code: "KeyK",
      ctrlKey: true,
      isComposing: true,
      key: "k",
    });

    expect(matchesHotkey(["meta+j", "CTRL+K"], event)).toBe(true);
    expect(matchesHotkey("control+k", composing)).toBe(false);
  });

  it("requires the exact modifier set", () => {
    const event = new KeyboardEvent("keydown", {
      altKey: true,
      code: "KeyK",
      ctrlKey: true,
      key: "k",
    });

    expect(matchesHotkey("ctrl+k", event)).toBe(false);
    expect(matchesHotkey("ctrl+alt+k", event)).toBe(true);
  });
});
