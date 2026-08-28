import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import { configureScrapsLocale, t, tct, type ScrapsLocaleAdapter } from "./scraps-locale";

const restores: Array<() => void> = [];

describe("Scraps locale adapter", () => {
  afterEach(() => {
    for (const restore of restores.splice(0).reverse()) restore();
  });

  it("provides the standalone English formatting contract", () => {
    expect(t("Remove %s", "project")).toBe("Remove project");
    expect(t("%2$s then %1$s", "first", "second")).toBe("second then first");
    expect(t("%(name)s", { name: "Project" })).toBe("Project");
    expect(t("Progress: 100%%")).toBe("Progress: 100%");
    expect(t("%04d", 7)).toBe("0007");
    expect(
      renderToStaticMarkup(
        tct("[start]-[end] of [total]", {
          end: "20",
          start: createElement("strong", null, "1"),
          total: "42",
        }),
      ),
    ).toBe("<strong>1</strong>-20 of 42");
    expect(
      renderToStaticMarkup(
        tct("[bold:text with [link:another] group]", {
          bold: createElement("b"),
          link: createElement("a", { href: "/link" }),
        }),
      ),
    ).toBe('<b>text with <a href="/link">another</a> group</b>');
    expect(
      renderToStaticMarkup(
        tct("[render:one] [render:two] [render:three]", {
          render: createElement("strong"),
        }),
      ),
    ).toBe("<strong>one</strong> <strong>two</strong> <strong>three</strong>");

    let childrenAreAnArray = false;
    function InspectChildren({ children }: { children?: ReactNode }) {
      childrenAreAnArray = Array.isArray(children);
      return children;
    }
    renderToStaticMarkup(tct("[inspect:one]", { inspect: createElement(InspectChildren) }));
    expect(childrenAreAnArray).toBe(true);
  });

  it("delegates to a host adapter and restores the previous adapter", () => {
    const adapter: ScrapsLocaleAdapter = {
      t: (message) => (message === "Undo" ? "Deshacer" : message),
      tct: (message) => message,
    };
    const restore = configureScrapsLocale(adapter);
    restores.push(restore);

    expect(t("Undo")).toBe("Deshacer");
    restore();
    expect(t("Undo")).toBe("Undo");
  });

  it("enforces one application-wide bootstrap adapter", () => {
    const first: ScrapsLocaleAdapter = {
      t: () => "first",
      tct: () => "first",
    };
    const second: ScrapsLocaleAdapter = {
      t: () => "second",
      tct: () => "second",
    };
    const restoreFirst = configureScrapsLocale(first);
    restores.push(restoreFirst);

    expect(() => configureScrapsLocale(second)).toThrow("Scraps locale is already configured");
    expect(t("Undo")).toBe("first");

    restoreFirst();
    const restoreSecond = configureScrapsLocale(second);
    restores.push(restoreSecond);
    expect(t("Undo")).toBe("second");
  });
});
