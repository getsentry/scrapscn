import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import { configureScrapsLocale } from "../../lib/scraps-locale";
import { BreadcrumbList } from "./breadcrumb-list";
import { LinkBehaviorContextProvider } from "./link";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

function renderBreadcrumbs(node: React.ReactNode) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const render = (nextNode: React.ReactNode) =>
    act(() =>
      root.render(
        <LinkBehaviorContextProvider
          value={{
            component: (props) => (
              <a {...props} href={typeof props.to === "string" ? props.to : props.to.pathname} />
            ),
            behavior: (props) => props,
          }}
        >
          {nextNode}
        </LinkBehaviorContextProvider>,
      ),
    );
  render(node);
  return {
    host,
    render,
    unmount: () =>
      act(() => {
        root.unmount();
        host.remove();
      }),
  };
}

function click(element: Element) {
  act(() => element.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

function changeInput(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  act(() => {
    setter?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function press(input: HTMLInputElement, key: string) {
  act(() => input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key })));
}

function clickEditableLabel(host: HTMLElement) {
  const label = host.querySelector('[data-slot="breadcrumb-editable-label"]');
  expect(label).not.toBeNull();
  click(label!);
}

describe("BreadcrumbList", () => {
  it("returns null when it has no parents", () => {
    const view = renderBreadcrumbs(<BreadcrumbList items={[]} />);
    expect(view.host.innerHTML).toBe("");
    view.unmount();
  });

  it("keeps one ordered list, exact metrics, and the 512px collapse", () => {
    const view = renderBreadcrumbs(
      <BreadcrumbList
        items={[
          {
            type: "link",
            label: "Settings",
            to: "/settings",
            leadingGraphic: <span>G</span>,
          },
        ]}
      />,
    );

    const list = view.host.querySelector("ol");
    const items = view.host.querySelectorAll("li");
    expect(view.host.querySelectorAll("ol")).toHaveLength(1);
    expect(list?.className).toContain("gap");
    expect(list?.className).toContain("[padding-top:0px]");
    expect(items).toHaveLength(2);
    expect(items[0]?.className).toContain("flex-shrink");
    expect(items[0]?.className).toContain("@[512px]");
    expect(items[1]?.className).toContain("@[512px]");
    expect(view.host.querySelector("a")?.textContent).toBe("Settings");
    expect(view.host.querySelector("a")?.getAttribute("data-test-id")).toBe("breadcrumb-link");
    expect(view.host.querySelector("a")?.parentElement?.classList.contains("min-w-8")).toBe(true);
    const graphic = [...view.host.querySelectorAll('span[aria-hidden="true"]')].find(
      (element) => element.textContent === "G",
    );
    expect(graphic).not.toBeUndefined();
    expect(view.host.querySelectorAll('svg:not([aria-hidden="true"])')).toHaveLength(0);
    view.unmount();
  });

  it("selects rich project options and preserves selected and disabled state", async () => {
    const changed = vi.fn();
    const view = renderBreadcrumbs(
      <BreadcrumbList
        items={[
          {
            type: "select-projects",
            value: "web",
            options: [
              {
                value: "web",
                label: "Web",
                details: "Selected project",
                leadingItems: "W",
                trailingItems: "Current",
              },
              { value: "api", label: "API", disabled: true },
              { value: "mobile", label: "Mobile" },
            ],
            onChange: changed,
          },
        ]}
      />,
    );

    const trigger = view.host.querySelector('[aria-label="Selected Project: Web"]');
    expect(trigger).not.toBeNull();
    await act(async () => {
      trigger?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
    const options = [...document.body.querySelectorAll('[data-slot="dropdown-menu-item"]')];
    const web = options.find((item) => item.textContent?.includes("Web"));
    const api = options.find((item) => item.textContent?.includes("API"));
    const mobile = options.find((item) => item.textContent?.includes("Mobile"));
    expect(web?.textContent).toContain("Selected project");
    expect(document.body.querySelector('[role="listbox"]')).not.toBeNull();
    expect(web?.getAttribute("role")).toBe("option");
    expect(web?.getAttribute("aria-selected")).toBe("true");
    expect(mobile?.getAttribute("aria-selected")).toBe("false");
    expect(web?.querySelector('path[d^="M13.72"]')).not.toBeNull();
    expect(api?.hasAttribute("data-disabled")).toBe(true);
    click(api!);
    expect(changed).not.toHaveBeenCalled();
    click(mobile!);
    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({ label: "Mobile", value: "mobile" }),
    );
    view.unmount();
  });

  it("renders title content without a heading and keeps pagination semantics", () => {
    const view = renderBreadcrumbs(
      <BreadcrumbList.Title
        item={{
          type: "page-title",
          label: "Issue",
          labelTooltip: "Issue short ID",
          pagination: {
            previous: { ariaLabel: "Previous issue", to: "/before" },
            next: { ariaLabel: "Next issue" },
          },
        }}
      />,
    );
    expect(view.host.querySelector("h1,h2,h3,h4,h5,h6")).toBeNull();
    expect(
      view.host.querySelector('[aria-label="Previous issue"]')?.getAttribute("aria-disabled"),
    ).not.toBe("true");
    expect(
      view.host.querySelector('[aria-label="Next issue"]')?.getAttribute("aria-disabled"),
    ).toBe("true");
    expect(view.host.textContent).toContain("Issue");
    view.unmount();
  });

  it("copies successfully without replacing the canonical icon", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const onCopy = vi.fn();
    const view = renderBreadcrumbs(
      <BreadcrumbList.Title
        item={{
          type: "page-title",
          label: "ISSUE-1",
          trailingActions: {
            type: "copy",
            label: "Copy ID",
            text: "ISSUE-1",
            onCopy,
          },
        }}
      />,
    );
    const copyButton = view.host.querySelector('[aria-label="Copy ID"]')!;
    const path = copyButton.querySelector("path")?.getAttribute("d");
    await act(async () => {
      copyButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
    expect(writeText).toHaveBeenCalledWith("ISSUE-1");
    expect(onCopy).toHaveBeenCalledWith("ISSUE-1");
    expect(copyButton.querySelector("path")?.getAttribute("d")).toBe(path);
    view.unmount();
  });

  it("commits, cancels, rejects empty Enter, and cancels an allowed empty blur", () => {
    const changed = vi.fn();
    const item = {
      type: "editable-title" as const,
      "aria-label": "Edit title",
      allowEmpty: true,
      autoSelect: true,
      errorMessage: "Name is required",
      onChange: changed,
      value: "Dashboard",
    };
    const view = renderBreadcrumbs(<BreadcrumbList.Title item={item} />);

    clickEditableLabel(view.host);
    let input = view.host.querySelector<HTMLInputElement>('input[aria-label="Edit title"]')!;
    changeInput(input, "New dashboard");
    press(input, "Enter");
    expect(changed).toHaveBeenLastCalledWith("New dashboard");
    expect(view.host.textContent).toContain("New dashboard");

    clickEditableLabel(view.host);
    input = view.host.querySelector<HTMLInputElement>('input[aria-label="Edit title"]')!;
    changeInput(input, "");
    press(input, "Enter");
    expect(view.host.querySelector('input[aria-label="Edit title"]')).not.toBeNull();
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(view.host.querySelector('[role="alert"]')?.textContent).toBe("Name is required");
    expect(changed).toHaveBeenCalledTimes(1);
    act(() => input.dispatchEvent(new FocusEvent("focusout", { bubbles: true })));
    expect(view.host.querySelector('input[aria-label="Edit title"]')).toBeNull();
    expect(view.host.textContent).toContain("New dashboard");

    clickEditableLabel(view.host);
    input = view.host.querySelector<HTMLInputElement>('input[aria-label="Edit title"]')!;
    changeInput(input, "Discard me");
    press(input, "Escape");
    expect(view.host.textContent).toContain("New dashboard");
    view.unmount();
  });

  it("cancels editing when the controlled value changes or the title becomes disabled", () => {
    const changed = vi.fn();
    const editable = (value: string, isDisabled = false) => (
      <BreadcrumbList.Title
        item={{
          type: "editable-title",
          "aria-label": "Edit title",
          isDisabled,
          onChange: changed,
          value,
        }}
      />
    );
    const view = renderBreadcrumbs(editable("Dashboard"));
    clickEditableLabel(view.host);
    expect(view.host.querySelector("input")).not.toBeNull();
    view.render(editable("Server value"));
    expect(view.host.querySelector("input")).toBeNull();
    expect(view.host.textContent).toContain("Server value");
    clickEditableLabel(view.host);
    view.render(editable("Server value", true));
    expect(view.host.querySelector("input")).toBeNull();
    expect(view.host.querySelector('svg path[d^="M11.26"]')).toBeNull();
    view.unmount();
  });

  it("renders rich menu actions and preserves requested submenu placement", async () => {
    const view = renderBreadcrumbs(
      <BreadcrumbList.Title
        item={{
          type: "page-title",
          label: "Issue",
          trailingActions: {
            type: "menu",
            triggerLabel: "Issue actions",
            items: [
              {
                key: "section",
                label: "Issue state",
                children: [
                  {
                    key: "delete",
                    label: "Delete",
                    details: "Permanent",
                    leadingItems: "D",
                    priority: "danger",
                    trailingItems: "⌘D",
                  },
                ],
              },
              {
                key: "more",
                label: "More",
                textValue: "More actions",
                submenu: { position: "auto-end", title: "Advanced" },
                children: [{ key: "merge", label: "Merge" }],
              },
            ],
          },
        }}
      />,
    );

    await act(async () => {
      click(view.host.querySelector('[aria-label="Issue actions"]')!);
      await Promise.resolve();
    });
    expect(document.body.textContent).toContain("Issue state");
    expect(document.body.textContent).toContain("Permanent");
    expect(document.body.textContent).toContain("⌘D");

    const submenuTrigger = document.body.querySelector('[data-slot="dropdown-menu-sub-trigger"]');
    expect(submenuTrigger?.getAttribute("aria-label")).toBe("More actions");
    Object.defineProperty(submenuTrigger, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        bottom: 240,
        height: 40,
        left: 900,
        right: 1000,
        top: 200,
        width: 100,
        x: 900,
        y: 200,
        toJSON: () => {},
      }),
    });
    act(() => submenuTrigger?.dispatchEvent(new FocusEvent("focusin", { bubbles: true })));
    await act(async () => {
      click(submenuTrigger!);
      await Promise.resolve();
    });
    const submenu = document.body.querySelector('[data-slot="dropdown-menu-sub-content"]');
    expect(submenu?.getAttribute("data-requested-side")).toBe("left");
    expect(submenu?.getAttribute("data-requested-align")).toBe("end");
    expect(document.body.textContent).toContain("Advanced");
    view.unmount();
  });

  it("uses the shared locale adapter for built-in accessible labels", () => {
    const resetLocale = configureScrapsLocale({
      t: (message, ...args) =>
        message === "Selected Project: %s"
          ? `Projet sélectionné : ${String(args[0])}`
          : `Traduit : ${message}`,
      tct: (message) => message,
    });
    const view = renderBreadcrumbs(
      <BreadcrumbList
        items={[
          { type: "link", label: "Settings", to: "/settings" },
          {
            type: "select-projects",
            value: "web",
            options: [{ value: "web", label: "Web" }],
            onChange: () => {},
          },
        ]}
      />,
    );

    expect(view.host.querySelector('[aria-label="Projet sélectionné : Web"]')).not.toBeNull();
    expect(view.host.querySelector('[aria-label="Traduit : More breadcrumbs"]')).not.toBeNull();
    view.unmount();
    resetLocale();
  });
});
