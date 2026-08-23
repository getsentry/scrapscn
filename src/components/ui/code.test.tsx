import { act, createRef, Profiler, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CodeBlock, InlineCode, inlineCodeStyles } from "./code";
import { CodeMessagesProvider, type CodeMessages } from "./code-messages";
import { prismLanguageLoaders } from "./prism-language-loaders";
import { loadPrismLanguage, loadPrismLineHighlight, Prism } from "./prism";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const roots: Array<{ container: HTMLDivElement; root: Root }> = [];
const tooltipCloseAndCoolDown = 750;

async function render(ui: ReactNode) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push({ container, root });
  await act(async () => root.render(ui));
  return container;
}

async function rerender(container: HTMLDivElement, ui: ReactNode) {
  const mounted = roots.find((candidate) => candidate.container === container);
  if (!mounted) throw new Error("Rendered root is missing");
  await act(async () => mounted.root.render(ui));
}

async function advanceTimers(milliseconds: number) {
  await act(async () => {
    vi.advanceTimersByTime(milliseconds);
    await Promise.resolve();
  });
}

afterEach(async () => {
  vi.restoreAllMocks();
  for (const mounted of roots.splice(0)) {
    await act(async () => mounted.root.unmount());
    mounted.container.remove();
  }
});

describe("InlineCode", () => {
  it("forwards the native code contract and ref", async () => {
    const ref = createRef<HTMLElement>();
    const container = await render(
      <InlineCode ref={ref} aria-label="Inline example" variant="neutral">
        const value = 1
      </InlineCode>
    );

    expect(ref.current).toBe(container.querySelector("code"));
    expect(ref.current?.hasAttribute("data-variant")).toBe(false);
    expect(ref.current?.className).toContain("inlineCodeNeutral");
    expect(ref.current?.getAttribute("aria-label")).toBe("Inline example");
  });

  it("returns the canonical reusable inline style recipe", () => {
    const theme = {
      font: { family: { mono: "Mono" } },
      radius: { "2xs": "3px" },
      tokens: {
        background: {
          transparent: {
            neutral: { muted: "neutral-bg" },
            promotion: { muted: "promotion-bg" },
          },
        },
        content: { primary: "neutral-fg", promotion: "promotion-fg" },
      },
    };

    expect(inlineCodeStyles(theme).styles).toContain("color:promotion-fg");
    expect(inlineCodeStyles(theme).styles).toContain("background:promotion-bg");
    expect(
      inlineCodeStyles(theme, {
        "aria-label": "Neutral code",
        id: "neutral-code",
        variant: "neutral",
      }).styles
    ).toContain(
      "color:neutral-fg"
    );
    expect(inlineCodeStyles(theme, { variant: "neutral" }).styles).toContain(
      "background:neutral-bg"
    );
    expect(inlineCodeStyles(theme).styles).toContain(
      "border-radius:clamp(0.21em, 0.28em, 0.57em)"
    );
  });
});

describe("CodeBlock", () => {
  it("uses consumer copy messages for the tooltip and accessible name", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const messages: CodeMessages = {
      copiedTooltip: "Copiado",
      copyButtonLabel: "Copiar fragmento",
      copyErrorTooltip: "No se pudo copiar",
      copyTooltip: "Copiar",
    };

    try {
      const container = await render(
        <CodeMessagesProvider messages={messages}>
          <CodeBlock>{'const idioma = "es";'}</CodeBlock>
        </CodeMessagesProvider>
      );
      const button = container.querySelector<HTMLButtonElement>(
        '[aria-label="Copiar fragmento"]'
      );
      if (!button) throw new Error("Localized copy trigger is missing");

      await act(async () => button.focus());
      await advanceTimers(400);
      expect(document.querySelector('[role="tooltip"]')?.textContent).toBe(
        "Copiar"
      );

      await act(async () => {
        button.click();
        await Promise.resolve();
      });
      expect(writeText).toHaveBeenCalledWith('const idioma = "es";');
      expect(document.querySelector('[role="tooltip"]')?.textContent).toBe(
        "Copiado"
      );

      await act(async () => button.blur());
      await advanceTimers(tooltipCloseAndCoolDown);
    } finally {
      vi.useRealTimers();
    }
  });

  it("uses the consumer copy failure message", async () => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    const messages: CodeMessages = {
      copiedTooltip: "Copiado",
      copyButtonLabel: "Copiar fragmento",
      copyErrorTooltip: "No se pudo copiar",
      copyTooltip: "Copiar",
    };
    try {
      const container = await render(
        <CodeMessagesProvider messages={messages}>
          <CodeBlock>copia</CodeBlock>
        </CodeMessagesProvider>
      );
      const button = container.querySelector<HTMLButtonElement>(
        '[aria-label="Copiar fragmento"]'
      );

      await act(async () => {
        button?.focus();
        button?.click();
        await Promise.resolve();
      });
      await advanceTimers(400);
      expect(document.querySelector('[role="tooltip"]')?.textContent).toBe(
        "No se pudo copiar"
      );

      await act(async () => button?.blur());
      await advanceTimers(tooltipCloseAndCoolDown);
    } finally {
      vi.useRealTimers();
    }
  });

  it("uses canonical focus delays and keeps the tooltip group warm", async () => {
    vi.useFakeTimers();
    try {
      const container = await render(
        <>
          <CodeBlock>first</CodeBlock>
          <CodeBlock>second</CodeBlock>
        </>
      );
      const [first, second] = container.querySelectorAll<HTMLButtonElement>(
        '[aria-label="Copy snippet"]'
      );
      if (!first || !second) throw new Error("Copy triggers are missing");

      await act(async () => first.focus());
      expect(first.hasAttribute("data-popup-open")).toBe(false);
      await advanceTimers(399);
      expect(first.hasAttribute("data-popup-open")).toBe(false);
      await advanceTimers(1);
      expect(first.hasAttribute("data-popup-open")).toBe(true);

      await act(async () => first.blur());
      await advanceTimers(149);
      expect(first.hasAttribute("data-popup-open")).toBe(true);
      await advanceTimers(1);
      expect(first.hasAttribute("data-popup-open")).toBe(false);

      await act(async () => second.focus());
      expect(second.hasAttribute("data-popup-open")).toBe(true);
      await act(async () => second.blur());
      await advanceTimers(tooltipCloseAndCoolDown);
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not restart the group cooldown when an idle tooltip unmounts", async () => {
    vi.useFakeTimers();
    try {
      function TooltipSet({ showIdle }: { showIdle: boolean }) {
        return (
          <>
            <CodeBlock key="first">first</CodeBlock>
            {showIdle ? <CodeBlock key="idle">idle</CodeBlock> : null}
            <CodeBlock key="last">last</CodeBlock>
          </>
        );
      }

      const container = await render(<TooltipSet showIdle />);
      const first = container.querySelector<HTMLButtonElement>(
        '[aria-label="Copy snippet"]'
      );
      if (!first) throw new Error("First copy trigger is missing");
      await act(async () => first.focus());
      await advanceTimers(400);
      await act(async () => first.blur());
      await advanceTimers(150);
      await advanceTimers(500);

      await rerender(container, <TooltipSet showIdle={false} />);
      await advanceTimers(101);
      const buttons = container.querySelectorAll<HTMLButtonElement>(
        '[aria-label="Copy snippet"]'
      );
      const last = buttons[1];
      if (!last) throw new Error("Last copy trigger is missing");
      await act(async () => last.focus());
      expect(last.hasAttribute("data-popup-open")).toBe(false);
      await advanceTimers(399);
      expect(last.hasAttribute("data-popup-open")).toBe(false);
      await advanceTimers(1);
      expect(last.hasAttribute("data-popup-open")).toBe(true);
      await act(async () => last.blur());
      await advanceTimers(tooltipCloseAndCoolDown);
    } finally {
      vi.useRealTimers();
    }
  });

  it("resets tooltip state when the copy button is hidden and shown", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    try {
      const container = await render(<CodeBlock>copy me</CodeBlock>);
      const button = container.querySelector<HTMLButtonElement>(
        '[aria-label="Copy snippet"]'
      );
      if (!button) throw new Error("Copy trigger is missing");
      await act(async () => button.focus());
      await advanceTimers(400);
      await act(async () => {
        button.click();
        await Promise.resolve();
      });
      expect(document.querySelector('[role="tooltip"]')?.textContent).toBe(
        "Copied"
      );

      await rerender(container, <CodeBlock hideCopyButton>copy me</CodeBlock>);
      expect(container.querySelector('[aria-label="Copy snippet"]')).toBeNull();
      expect(document.querySelector('[role="tooltip"]')).toBeNull();
      await advanceTimers(600);

      await rerender(container, <CodeBlock>copy me</CodeBlock>);
      const restoredButton = container.querySelector<HTMLButtonElement>(
        '[aria-label="Copy snippet"]'
      );
      if (!restoredButton) throw new Error("Restored copy trigger is missing");
      await act(async () => restoredButton.focus());
      await advanceTimers(400);
      expect(document.querySelector('[role="tooltip"]')?.textContent).toBe(
        "Copy"
      );
      await act(async () => restoredButton.blur());
      await advanceTimers(tooltipCloseAndCoolDown);
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not rerender idle blocks when another tooltip opens", async () => {
    const commitCounts = Array.from({ length: 24 }, () => 0);
    const container = await render(
      <>
        {commitCounts.map((_, index) => (
          <Profiler
            id={`code-${index}`}
            key={index}
            onRender={() => {
              commitCounts[index] += 1;
            }}
          >
            <CodeBlock>{`snippet ${index}`}</CodeBlock>
          </Profiler>
        ))}
      </>
    );
    const idleCommitCounts = commitCounts.slice(1);
    const firstButton = container.querySelector<HTMLButtonElement>(
      '[aria-label="Copy snippet"]'
    );

    await act(async () => firstButton?.focus());
    await vi.waitFor(() =>
      expect(document.querySelector('[role="tooltip"]')).not.toBeNull()
    );

    expect(commitCounts.slice(1)).toEqual(idleCommitCounts);
  });

  it("retries a failed line-highlight chunk", async () => {
    const importer = vi
      .fn<() => Promise<unknown>>()
      .mockRejectedValueOnce(new Error("chunk failed"))
      .mockResolvedValueOnce(undefined);

    await expect(loadPrismLineHighlight(importer)).resolves.toBe(true);
    expect(importer).toHaveBeenCalledTimes(2);
  });

  it("reports a line-highlight chunk that fails twice", async () => {
    const importer = vi
      .fn<() => Promise<unknown>>()
      .mockRejectedValue(new Error("chunk failed"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await expect(loadPrismLineHighlight(importer)).resolves.toBe(false);
    expect(importer).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledWith(
      "Cannot load the Prism line-highlight plugin."
    );

    warn.mockRestore();
  });

  it("does not cache a failed language chunk and retries the next load", async () => {
    const originalLoader = prismLanguageLoaders.abap;
    const originalGrammar = Prism.languages.abap;
    const loader = vi
      .fn<() => Promise<unknown>>()
      .mockImplementationOnce(async () => {
        Prism.languages.abap = Prism.languages.javascript;
        throw new Error("chunk failed");
      })
      .mockImplementationOnce(async () => {
        Prism.languages.abap = Prism.languages.javascript;
      });
    prismLanguageLoaders.abap = loader;
    delete Prism.languages.abap;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    try {
      await expect(loadPrismLanguage("abap")).resolves.toBe(false);
      expect(warn).toHaveBeenCalledWith(
        "Cannot download Prism grammar file for `abap`. Check the internet connection, and the `lang` argument passed to `loadPrismLanguage()`."
      );
      expect(Prism.languages.abap).toBeUndefined();
      await expect(loadPrismLanguage("abap")).resolves.toBe(true);
      expect(loader).toHaveBeenCalledTimes(2);
    } finally {
      prismLanguageLoaders.abap = originalLoader;
      if (originalGrammar) Prism.languages.abap = originalGrammar;
      else delete Prism.languages.abap;
    }
  });

  it("starts sibling Prism dependencies concurrently", async () => {
    const originalMataLoader = prismLanguageLoaders.mata;
    const originalJavaLoader = prismLanguageLoaders.java;
    const originalPythonLoader = prismLanguageLoaders.python;
    const originalStataLoader = prismLanguageLoaders.stata;
    const originalMata = Prism.languages.mata;
    const originalJava = Prism.languages.java;
    const originalPython = Prism.languages.python;
    const originalStata = Prism.languages.stata;
    let resolveMata = () => {};
    let resolveJava = () => {};
    let resolvePython = () => {};
    const mataLoader = vi.fn(
      () =>
        new Promise<unknown>(resolve => {
          resolveMata = () => {
            Prism.languages.mata = Prism.languages.javascript;
            resolve(undefined);
          };
        })
    );
    const javaLoader = vi.fn(
      () =>
        new Promise<unknown>(resolve => {
          resolveJava = () => {
            Prism.languages.java = Prism.languages.javascript;
            resolve(undefined);
          };
        })
    );
    const pythonLoader = vi.fn(
      () =>
        new Promise<unknown>(resolve => {
          resolvePython = () => {
            Prism.languages.python = Prism.languages.javascript;
            resolve(undefined);
          };
        })
    );
    const stataLoader = vi.fn(async () => {
      Prism.languages.stata = Prism.languages.javascript;
    });
    prismLanguageLoaders.mata = mataLoader;
    prismLanguageLoaders.java = javaLoader;
    prismLanguageLoaders.python = pythonLoader;
    prismLanguageLoaders.stata = stataLoader;
    delete Prism.languages.mata;
    delete Prism.languages.java;
    delete Prism.languages.python;
    delete Prism.languages.stata;

    try {
      const loading = loadPrismLanguage("stata");
      await vi.waitFor(() => {
        expect(mataLoader).toHaveBeenCalledOnce();
        expect(javaLoader).toHaveBeenCalledOnce();
        expect(pythonLoader).toHaveBeenCalledOnce();
      });
      expect(stataLoader).not.toHaveBeenCalled();
      resolveMata();
      resolveJava();
      resolvePython();
      await expect(loading).resolves.toBe(true);
      expect(stataLoader).toHaveBeenCalledOnce();
    } finally {
      prismLanguageLoaders.mata = originalMataLoader;
      prismLanguageLoaders.java = originalJavaLoader;
      prismLanguageLoaders.python = originalPythonLoader;
      prismLanguageLoaders.stata = originalStataLoader;
      if (originalMata) Prism.languages.mata = originalMata;
      else delete Prism.languages.mata;
      if (originalJava) Prism.languages.java = originalJava;
      else delete Prism.languages.java;
      if (originalPython) Prism.languages.python = originalPython;
      else delete Prism.languages.python;
      if (originalStata) Prism.languages.stata = originalStata;
      else delete Prism.languages.stata;
    }
  });

  it("highlights a supported Prism language and calls onAfterHighlight", async () => {
    const onAfterHighlight = vi.fn();
    const container = await render(
      <CodeBlock language="javascript" onAfterHighlight={onAfterHighlight}>
        {"const answer = 42;"}
      </CodeBlock>
    );

    await vi.waitFor(() => {
      expect(container.querySelector(".token.keyword")?.textContent).toBe("const");
    });
    expect(onAfterHighlight).toHaveBeenCalledOnce();
    expect(onAfterHighlight.mock.calls[0]?.[0]).toBe(container.querySelector("code"));
  });

  it.each(["mjs", "cjs", "JavaScript"])(
    "normalizes %s before Prism highlights it",
    async (language) => {
      const container = await render(
        <CodeBlock language={language}>{"const answer = 42;"}</CodeBlock>
      );

      await vi.waitFor(() => {
        expect(container.querySelector(".token.keyword")?.textContent).toBe(
          "const"
        );
      });
      expect(container.querySelector("pre")?.className).toBe(
        "language-javascript"
      );
      expect(container.querySelector("code")?.className).toBe(
        "language-javascript"
      );
    }
  );

  it("uses the latest inline callback without restarting highlighting", async () => {
    const originalLoader = prismLanguageLoaders.abnf;
    const originalGrammar = Prism.languages.abnf;
    let resolveLanguage = () => {};
    prismLanguageLoaders.abnf = vi.fn(
      () =>
        new Promise<unknown>((resolve) => {
          resolveLanguage = () => {
            Prism.languages.abnf = Prism.languages.javascript;
            resolve(undefined);
          };
        })
    );
    delete Prism.languages.abnf;
    const callbackVersions: string[] = [];

    function CallbackHarness() {
      const [callbackVersion, setCallbackVersion] = useState("initial");
      const [highlightCount, setHighlightCount] = useState(0);

      return (
        <>
          <button type="button" onClick={() => setCallbackVersion("latest")}>
            Update callback
          </button>
          <CodeBlock
            language="abnf"
            onAfterHighlight={() => {
              callbackVersions.push(callbackVersion);
              setHighlightCount((count) => count + 1);
            }}
          >
            {"const answer = 42;"}
          </CodeBlock>
          <output>{highlightCount}</output>
        </>
      );
    }

    try {
      const container = await render(<CallbackHarness />);
      const updateButton = container.querySelector("button");
      if (!updateButton) throw new Error("Callback update button is missing");
      await vi.waitFor(() =>
        expect(prismLanguageLoaders.abnf).toHaveBeenCalledOnce()
      );
      await act(async () => updateButton.click());
      await act(async () => resolveLanguage());
      await vi.waitFor(() =>
        expect(container.querySelector("output")?.textContent).toBe("1")
      );
      await act(async () => Promise.resolve());

      expect(callbackVersions).toEqual(["latest"]);
      expect(prismLanguageLoaders.abnf).toHaveBeenCalledOnce();
    } finally {
      prismLanguageLoaders.abnf = originalLoader;
      if (originalGrammar) Prism.languages.abnf = originalGrammar;
      else delete Prism.languages.abnf;
    }
  });

  it("clears token markup when the language becomes unsupported", async () => {
    const source = "const answer = 42;";
    const container = await render(
      <CodeBlock language="javascript">{source}</CodeBlock>
    );
    await vi.waitFor(() =>
      expect(container.querySelector(".token.keyword")?.textContent).toBe("const")
    );

    await rerender(container, <CodeBlock language="not-a-language">{source}</CodeBlock>);

    expect(container.querySelector(".token")).toBeNull();
    expect(container.querySelector("code")?.textContent).toBe(source);
  });

  it("replaces and removes line highlights when the range changes", async () => {
    const source = "const first = 1;\nconst second = 2;";
    const container = await render(
      <CodeBlock language="javascript" linesToHighlight={[1]}>
        {source}
      </CodeBlock>
    );
    await vi.waitFor(() =>
      expect(container.querySelector('.line-highlight[data-range="1"]')).not.toBeNull()
    );

    await rerender(
      container,
      <CodeBlock language="javascript" linesToHighlight={[2]}>
        {source}
      </CodeBlock>
    );
    await vi.waitFor(() =>
      expect(container.querySelector('.line-highlight[data-range="2"]')).not.toBeNull()
    );
    expect(container.querySelectorAll(".line-highlight")).toHaveLength(1);

    await rerender(container, <CodeBlock language="javascript">{source}</CodeBlock>);
    await vi.waitFor(() =>
      expect(container.querySelectorAll(".line-highlight")).toHaveLength(0)
    );
  });

  it("does not re-highlight an equivalent line range after a parent rerender", async () => {
    const source = "const answer = 42;";
    const onAfterHighlight = vi.fn();
    const container = await render(
      <CodeBlock
        language="javascript"
        linesToHighlight={[1]}
        onAfterHighlight={onAfterHighlight}
      >
        {source}
      </CodeBlock>
    );
    await vi.waitFor(() => expect(onAfterHighlight).toHaveBeenCalledTimes(2));
    const highlightCount = onAfterHighlight.mock.calls.length;

    await rerender(
      container,
      <CodeBlock
        language="javascript"
        linesToHighlight={[1]}
        onAfterHighlight={onAfterHighlight}
      >
        {source}
      </CodeBlock>
    );

    expect(onAfterHighlight).toHaveBeenCalledTimes(highlightCount);
  });

  it("keeps unsupported languages as unformatted text", async () => {
    const onAfterHighlight = vi.fn();
    const container = await render(
      <CodeBlock language="not-a-language" onAfterHighlight={onAfterHighlight}>
        plain text
      </CodeBlock>
    );

    expect(container.querySelector("code")?.textContent).toBe("plain text");
    expect(container.querySelector(".token")).toBeNull();
    expect(onAfterHighlight).not.toHaveBeenCalled();
  });

  it("copies rendered text and reports the canonical child string", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const onCopy = vi.fn();
    const container = await render(
      <CodeBlock language="javascript" onCopy={onCopy}>
        {"const answer = 42;"}
      </CodeBlock>
    );
    const button = container.querySelector<HTMLButtonElement>(
      '[aria-label="Copy snippet"]'
    );

    await act(async () => {
      button?.focus();
      button?.click();
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledWith("const answer = 42;");
    expect(onCopy).toHaveBeenCalledWith("const answer = 42;");
    await vi.waitFor(() =>
      expect(document.querySelector('[role="tooltip"]')?.textContent).toBe("Copied")
    );
    await act(async () =>
      button?.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }))
    );
    await vi.waitFor(() =>
      expect(document.querySelector('[role="tooltip"]')?.textContent).toBe("Copy")
    );
  });

  it("reports clipboard failures without suppressing onCopy", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    const onCopy = vi.fn();
    const container = await render(<CodeBlock onCopy={onCopy}>copy me</CodeBlock>);
    const button = container.querySelector<HTMLButtonElement>(
      '[aria-label="Copy snippet"]'
    );

    await act(async () => {
      button?.focus();
      button?.click();
    });

    expect(onCopy).toHaveBeenCalledWith("copy me");
    await vi.waitFor(() =>
      expect(document.querySelector('[role="tooltip"]')?.textContent).toBe(
        "Unable to copy"
      )
    );
  });

  it("reports a missing clipboard without suppressing onCopy", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
    const onCopy = vi.fn();
    const container = await render(<CodeBlock onCopy={onCopy}>copy me</CodeBlock>);
    const button = container.querySelector<HTMLButtonElement>(
      '[aria-label="Copy snippet"]'
    );

    await act(async () => {
      button?.focus();
      button?.click();
    });

    expect(onCopy).toHaveBeenCalledWith("copy me");
    await vi.waitFor(() =>
      expect(document.querySelector('[role="tooltip"]')?.textContent).toBe(
        "Unable to copy"
      )
    );
  });

  it("renders filename, icon, tabs, selection, and tab callbacks", async () => {
    const onTabClick = vi.fn();
    const container = await render(
      <CodeBlock
        filename="example.ts"
        icon={<span data-testid="header-icon">TS</span>}
        selectedTab="react"
        tabs={[
          { label: "React", value: "react" },
          { label: "Vue", value: "vue" },
        ]}
        onTabClick={onTabClick}
      >
        code
      </CodeBlock>
    );

    expect(container.textContent).toContain("example.ts");
    expect(container.querySelector('[data-testid="header-icon"]')).not.toBeNull();
    const react = [...container.querySelectorAll("button")].find(
      (button) => button.textContent === "React"
    );
    const vue = [...container.querySelectorAll("button")].find(
      (button) => button.textContent === "Vue"
    );
    expect(react?.className).toContain("selectedTab");
    expect(react?.getAttribute("aria-pressed")).toBe("true");
    expect(vue?.getAttribute("aria-pressed")).toBe("false");
    await act(async () => vue?.click());
    expect(onTabClick).toHaveBeenCalledWith("vue");
  });

  it("supports hidden copy, square corners, inline rendering, and selection control", async () => {
    const container = await render(
      <CodeBlock
        data-render-inline
        disableUserSelection
        hideCopyButton
        isRounded={false}
        linesToHighlight={[1, 3]}
      >
        {"one\ntwo\nthree"}
      </CodeBlock>
    );
    const wrapper = container.firstElementChild;
    const code = container.querySelector("code");

    expect(wrapper?.getAttribute("data-render-inline")).toBe("true");
    expect(wrapper?.getAttribute("data-rounded")).toBe("false");
    expect(container.querySelector('[aria-label="Copy snippet"]')).toBeNull();
    expect(container.querySelector("pre")?.dataset.line).toBe("1,3");
    expect(code?.dataset.disableUserSelection).toBe("true");
  });

  it("forwards manual copy events from the code element", async () => {
    const onSelectAndCopy = vi.fn();
    const container = await render(
      <CodeBlock onSelectAndCopy={onSelectAndCopy}>copy event</CodeBlock>
    );

    container
      .querySelector("code")
      ?.dispatchEvent(new Event("copy", { bubbles: true }));

    expect(onSelectAndCopy).toHaveBeenCalledOnce();
  });
});
