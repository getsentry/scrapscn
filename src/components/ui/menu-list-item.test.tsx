import { act, createRef, type ComponentPropsWithRef } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { InnerWrap, LeadingItems, MenuListItem } from "./menu-list-item";

vi.mock("@floating-ui/dom", async (importActual) => ({
  ...(await importActual<typeof import("@floating-ui/dom")>()),
  computePosition: vi.fn(async () => ({
    middlewareData: {
      escaped: { escaped: false },
      referenceHidden: { referenceHidden: false },
    },
    placement: "right-start" as const,
    strategy: "fixed" as const,
    x: 0,
    y: 0,
  })),
}));

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const roots: Array<{
  element: HTMLDivElement;
  root: ReturnType<typeof createRoot>;
}> = [];

async function render(element: React.ReactNode) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  roots.push({ element: host, root });
  await act(async () => root.render(element));
  return host;
}

describe("MenuListItem", () => {
  afterEach(async () => {
    for (const { element, root } of roots.splice(0)) {
      await act(async () => root.unmount());
      element.remove();
    }
  });

  it("keeps IDs, aria state, slots, and render-function vocabulary", async () => {
    const host = await render(
      <MenuListItem
        details={({ isFocused, isSelected }) => `${isFocused}:${isSelected}`}
        isFocused
        isSelected
        label="Item"
        leadingItems={({ disabled }) => <span>{String(disabled)}</span>}
        trailingItems={({ isSelected }) => <span>{String(isSelected)}</span>}
      />,
    );
    const item = host.querySelector("li")!;
    expect(item.getAttribute("aria-labelledby")).toBeTruthy();
    expect(item.getAttribute("aria-describedby")).toBeTruthy();
    expect(host.textContent).toContain("true:true");
    expect(host.textContent).toContain("false");
    expect(host.textContent).toContain("true");
  });

  it("uses the regular sizes, priorities, disabled state, and ellipsis label", async () => {
    const host = await render(
      <MenuListItem disabled label="Long label" priority="danger" size="xs" />,
    );
    const inner = host.querySelector("li > div")!;
    expect(inner.className.split(" ")).toEqual(
      expect.arrayContaining([
        "cursor-default",
        "pl-3",
        "pr-2",
        "py-1",
        "rounded-[6px]",
        "text-[12px]",
        "[line-height:1.4]",
        "text-[var(--scraps-content-secondary,#6a6772)]",
      ]),
    );
    expect(inner.className).not.toMatch(/\b(?:pl-4|pr-3|py-2|py-3)\b/);
    expect(host.querySelector("li")?.className).toContain("cursor-pointer");
    expect(host.querySelector("[data-test-id=menu-list-item-label]")?.className).toContain(
      "text-ellipsis",
    );
  });

  it("uses canonical padding and font size for every form size", async () => {
    const host = await render(
      <>
        {(
          [
            ["xs", "py-1", "text-[12px]"],
            ["sm", "py-1.5", "text-[14px]"],
            ["md", "py-2", "text-[14px]"],
          ] as const
        ).map(([size, paddingClass]) => (
          <InnerWrap
            data-size={size}
            disabled={false}
            isFocused={false}
            key={size}
            priority="default"
            size={size}
          >
            {paddingClass}
          </InnerWrap>
        ))}
      </>,
    );

    for (const [size, paddingClass, fontClass] of [
      ["xs", "py-1", "text-[12px]"],
      ["sm", "py-1.5", "text-[14px]"],
      ["md", "py-2", "text-[14px]"],
    ] as const) {
      const classes = host.querySelector(`[data-size=${size}]`)!.className.split(" ");
      expect(classes).toEqual(
        expect.arrayContaining([paddingClass, fontClass, "[line-height:1.4]", "pl-3", "pr-2"]),
      );
    }
  });

  it("uses eight-pixel slot geometry and twelve-pixel details text", async () => {
    const host = await render(
      <MenuListItem
        details={<span data-slot="details">Detail</span>}
        label="Item"
        leadingItems={<span data-slot="leading">Leading</span>}
        trailingItems={<span data-slot="trailing">Trailing</span>}
      />,
    );
    const label = host.querySelector("[data-test-id=menu-list-item-label]")!;
    const labelContainer = label.parentElement!;
    const content = labelContainer.parentElement!;
    const leading = host.querySelector("[data-slot=leading]")!.parentElement!;
    const trailing = host.querySelector("[data-slot=trailing]")!.parentElement!;
    const details = host.querySelector("[data-slot=details]")!.parentElement!;

    expect(content.className.split(" ")).toContain("gap-2");
    expect(labelContainer.className.split(" ")).toContain("pr-2");
    expect(leading.className.split(" ")).toEqual(expect.arrayContaining(["gap-2", "mr-2"]));
    expect(trailing.className.split(" ")).toContain("gap-2");
    expect(details.className.split(" ")).toContain("text-xs");
    expect(
      [content, labelContainer, leading, trailing].map(({ className }) => className),
    ).not.toEqual(expect.arrayContaining([expect.stringMatching(/\b(?:gap-3|mr-3|pr-3)\b/)]));
  });

  it("renders the canonical fixed overlay surface when focused", async () => {
    const host = await render(
      <MenuListItem
        details="Overlay detail"
        isFocused
        showDetailsInOverlay
        label="Item"
        size="xs"
      />,
    );
    expect(host.textContent).not.toContain("Overlay detail");
    const overlay = document.body.querySelector("[role=tooltip]");
    const wrapper = overlay?.parentElement;
    expect(overlay?.id).toBe(host.querySelector("li")?.getAttribute("aria-describedby"));
    expect(overlay?.getAttribute("data-overlay")).toBe("true");
    expect(wrapper?.className.split(" ")).toEqual(expect.arrayContaining(["fixed", "z-[10003]"]));
    expect(wrapper?.getAttribute("data-popper-reference-hidden")).toBe("false");
    expect(wrapper?.getAttribute("data-popper-escaped")).toBe("false");
    expect(overlay?.className.split(" ")).toEqual(
      expect.arrayContaining([
        "cursor-auto",
        "p-1",
        "rounded-[6px]",
        "shadow-[0_2px_0_var(--scraps-menu-list-item-overlay-shadow,#dad9de)]",
        "text-[12px]",
        "[line-height:1.4]",
        "[user-select:contain]",
      ]),
    );
    expect(overlay?.className).toContain(
      "bg-[var(--scraps-menu-list-item-overlay-background,#ffffff)]",
    );
    expect(overlay?.className).toContain(
      "border-[var(--scraps-menu-list-item-overlay-border,#dad9de)]",
    );
    expect(overlay?.className).not.toMatch(/\b(?:py-1|py-2|py-3|shadow-sm|z-50)\b/);
  });

  it("preserves canonical prop precedence and polymorphic rendering", async () => {
    const ref = createRef<HTMLLIElement>();
    const host = await render(
      <MenuListItem
        aria-describedby="consumer-detail"
        aria-labelledby="consumer-label"
        as="div"
        details="Detail"
        detailsProps={{
          disabled: false,
          id: "detail-prop",
          priority: "danger",
        }}
        disabled
        innerWrapProps={{ disabled: false, size: "xs" }}
        label="Item"
        labelProps={{ id: "label-prop", title: "consumer label" }}
        ref={ref}
        size="md"
      />,
    );
    const item = host.firstElementChild!;
    const inner = item.firstElementChild!;

    expect(item.tagName).toBe("DIV");
    expect(item.getAttribute("aria-describedby")).toBe("consumer-detail");
    expect(item.getAttribute("aria-labelledby")).toBe("consumer-label");
    expect(ref.current).toBe(item);
    expect(inner.className.split(" ")).toEqual(expect.arrayContaining(["py-1", "text-[12px]"]));
    expect(inner.className).not.toContain("cursor-default");
    expect(host.querySelector("#label-prop")?.getAttribute("title")).toBe("consumer label");
    expect(host.querySelector("#detail-prop")?.className).toContain(
      "text-[var(--scraps-content-danger,#d50000)]",
    );
  });

  it("runs callback ref cleanups on unmount", async () => {
    let cleanups = 0;
    await render(
      <MenuListItem
        label="Item"
        ref={() => () => {
          cleanups += 1;
        }}
      />,
    );
    const mounted = roots.pop()!;

    await act(async () => mounted.root.unmount());
    mounted.element.remove();

    expect(cleanups).toBe(1);
  });

  it("exports independently usable canonical inner and leading wrappers", async () => {
    const host = await render(
      <InnerWrap disabled={false} isFocused={false} priority="default" size="sm">
        <LeadingItems disabled size="sm">
          Icon
        </LeadingItems>
      </InnerWrap>,
    );
    expect(host.textContent).toBe("Icon");
    expect(host.querySelector("[class*=opacity]")?.className).toContain("opacity-50");
  });

  it("renders every Emotion-compatible polymorphic slot without leaking as", async () => {
    function CustomItem(props: ComponentPropsWithRef<"article">) {
      return <article data-custom-item {...props} />;
    }

    const host = await render(
      <>
        <MenuListItem
          as={CustomItem}
          details="Detail"
          detailsProps={{ as: "small", id: "polymorphic-details" }}
          innerWrapProps={{ as: "section", id: "polymorphic-inner" }}
          label="Item"
          labelProps={{ as: "p", id: "polymorphic-label" }}
        />
        <LeadingItems as="aside" disabled={false} id="polymorphic-leading">
          Leading
        </LeadingItems>
      </>,
    );

    expect(host.querySelector("article[data-custom-item]")).not.toBeNull();
    expect(host.querySelector("section#polymorphic-inner")).not.toBeNull();
    expect(host.querySelector("p#polymorphic-label")).not.toBeNull();
    expect(host.querySelector("small#polymorphic-details")).not.toBeNull();
    expect(host.querySelector("aside#polymorphic-leading")).not.toBeNull();
    expect(host.querySelector("[as]")).toBeNull();
  });

  it("keeps the focused background pseudo-element square", async () => {
    const host = await render(<InnerWrap disabled={false} isFocused priority="default" />);

    expect(host.firstElementChild?.className).not.toContain("before:rounded-[inherit]");
  });
});
