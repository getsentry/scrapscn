import {
  act,
  Component,
  createRef,
  forwardRef,
  isValidElement,
  memo,
  useState,
  type ReactNode,
} from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Select, type SelectValue } from "./select";
import type { SelectComponentPropsMap, SelectController } from "./select-types";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const roots: ReturnType<typeof createRoot>[] = [];

async function render(element: ReactNode) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => root.render(element));
  return { container, root };
}

async function key(input: HTMLInputElement, value: string) {
  await act(async () =>
    input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: value })),
  );
}

async function type(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  await act(async () => input.dispatchEvent(new Event("input", { bubbles: true })));
}

async function focus(input: HTMLInputElement) {
  await act(async () => input.focus());
}

function svgForPath(container: HTMLElement, pathPrefix: string) {
  const svg = container.querySelector<SVGPathElement>(`path[d^="${pathPrefix}"]`)?.ownerSVGElement;
  if (!svg) throw new Error(`Missing SVG for path ${pathPrefix}`);
  return svg;
}

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((root) => root.unmount()));
  document.body.replaceChildren();
  document.body.style.cssText = "";
  document.documentElement.classList.remove("dark");
  document.documentElement.style.removeProperty("--scrollbar-size");
  vi.restoreAllMocks();
});

const options: SelectValue<string>[] = [
  { label: "Álpha", value: "a" },
  { label: "Beta", value: "b" },
  { disabled: true, label: "Gamma", value: "g" },
];

describe("Select", () => {
  it("keeps v4 input metadata while options expose radio menu roles", async () => {
    const { container } = await render(
      <Select searchable aria-label="Project" options={options} />,
    );
    const input = container.querySelector<HTMLInputElement>("input:not([type=hidden])")!;
    await focus(input);
    await key(input, "ArrowDown");
    expect(input.getAttribute("role")).toBeNull();
    expect(input.getAttribute("aria-expanded")).toBeNull();
    expect(input.getAttribute("aria-autocomplete")).toBe("list");
    expect(input.getAttribute("autocomplete")).toBe("off");
    expect(container.querySelector("[role=listbox]")).toBeNull();
    expect(container.querySelector("[role=menuitemradio]")).not.toBeNull();
    expect(container.querySelector("[aria-live=polite]")?.textContent).toContain("3");
  });

  it("maps raw values, preserves groups, and gives choices precedence", async () => {
    const { container } = await render(
      <Select
        choices={[["choice", "Choice label"]]}
        defaultMenuIsOpen
        defaultValue="choice"
        options={[{ label: "Ignored", value: "ignored" }]}
      />,
    );
    expect(container.textContent).toContain("Choice label");
    expect(container.textContent).not.toContain("Ignored");
  });

  it("maps grouped multiple values and emits checkbox options", async () => {
    const { container } = await render(
      <Select
        defaultMenuIsOpen
        defaultValue={["a", "b"]}
        multiple
        name="project"
        options={[{ label: "Projects", options }]}
      />,
    );
    expect(
      [...container.querySelectorAll<HTMLInputElement>('input[type="hidden"]')].map(
        (input) => input.value,
      ),
    ).toEqual(["a", "b"]);
    expect(container.textContent).toContain("Projects");
    expect(container.querySelectorAll("[role=menuitemcheckbox]")).toHaveLength(3);
  });

  it("keeps canonical empty headings and group dividers", async () => {
    const { container } = await render(
      <Select
        defaultMenuIsOpen
        formatGroupLabel={(group) => group.label ?? null}
        options={[{ options: [options[0]] }, { label: "Second group", options: [options[1]] }]}
        styles={{
          group: (provided) => provided,
          groupHeading: (provided) => provided,
        }}
      />,
    );
    const groups = container.querySelectorAll<HTMLElement>("[role=group]");
    const emptyHeading = groups[0]?.firstElementChild as HTMLElement | null;
    expect(emptyHeading?.className).toContain("empty:hidden");
    expect(emptyHeading?.className).toContain("cursor-default");
    expect(emptyHeading?.className).toContain("text-[75%]/[1.5]");
    expect(emptyHeading?.className).toContain("uppercase");
    expect(emptyHeading?.style.display).toBe("");
    expect(emptyHeading?.style.getPropertyValue("--scraps-select-group-heading-display")).toBe(
      "block",
    );
    expect(groups[0]?.className).toContain("[&:not(:last-of-type)::after]:border-b");
    expect(groups[0]?.className).toContain("[&:not(:last-of-type)]:mb-2");
    expect(groups[0]?.className).toContain("[&:not(:last-of-type)::after]:inset-x-3");
    expect(groups[0]?.className).toContain(
      "[&:not(:last-of-type)::after]:border-[var(--scraps-select-border-secondary,var(--scraps-theme-border-secondary,#e6e6e9))]",
    );
    expect(groups[1]?.className).toContain("[&:last-of-type]:pb-0");
    expect(groups[1]?.style.paddingBottom).toBe("");
    expect(groups[1]?.style.getPropertyValue("--scraps-select-group-padding-bottom")).toBe("8px");
  });

  it("keeps canonical default nested interaction states", async () => {
    const multi = await render(<Select defaultValue={["a"]} multiple options={options} />);
    const remove = multi.container.querySelector<HTMLButtonElement>(
      'button[aria-label="Remove item"]',
    )!;
    expect(remove.className).toContain("var(--scraps-select-transparent-hover,#10103008)");
    expect(remove.className).toContain("cursor-pointer");

    const disabledMulti = await render(
      <Select defaultValue={["a"]} disabled multiple options={options} />,
    );
    const disabledRemove = disabledMulti.container.querySelector<HTMLButtonElement>(
      'button[aria-label="Remove item"]',
    )!;
    expect(disabledRemove.className).toContain("pointer-events-none");
    expect(disabledRemove.className).not.toContain("cursor-pointer");

    const clearable = await render(<Select clearable defaultValue="a" options={options} />);
    const clearButton = clearable.container.querySelector<HTMLButtonElement>(
      'button[aria-label="Clear choices"]',
    )!;
    expect(clearButton.className).toContain("cursor-pointer");
    expect(clearButton.parentElement?.className).toContain("px-1");

    const loading = await render(<Select isLoading options={options} />);
    const spinner = [
      ...loading.container.querySelectorAll<HTMLElement>('span[aria-hidden="true"]'),
    ].find((element) => element.className.includes("spin_550ms"))!;
    expect(spinner.className).toContain("size-3.5");
    expect(spinner.className).toContain("border-l-[#6c5fc7]");
    expect(spinner.className).toContain("motion-reduce:animate-none");
    expect(spinner.parentElement?.className).toContain("cursor-pointer");
    expect(spinner.parentElement?.className).toContain("px-1");
    const dropdown =
      loading.container.querySelector<HTMLElement>('path[d^="M8 5C8.21"]')?.parentElement
        ?.parentElement;
    expect(dropdown?.className).toContain("hover:text-current");
    expect(dropdown?.className).toContain("cursor-pointer");
    expect(dropdown?.className).toContain("px-1");

    const disabled = await render(<Select disabled options={options} />);
    const disabledDropdown =
      disabled.container.querySelector<HTMLElement>('path[d^="M8 5C8.21"]')?.parentElement
        ?.parentElement;
    expect(disabledDropdown?.className).toContain("cursor-not-allowed");
  });

  it("keeps the canonical size-dependent indicator-container margin", async () => {
    for (const [size, marginClass] of [
      ["md", "mr-2"],
      ["sm", "mr-1.5"],
      ["xs", "mr-1"],
    ] as const) {
      const { container } = await render(<Select options={options} size={size} />);
      const dropdown =
        container.querySelector<HTMLElement>('path[d^="M8 5C8.21"]')?.parentElement?.parentElement;
      const indicators = dropdown?.parentElement;
      expect(indicators?.className).toContain(marginClass);
      expect(indicators?.className).not.toMatch(/\b(?:gap|p[xy]?)-/);
    }
  });

  it("keeps canonical control, disabled, input, and message styles", async () => {
    const focused = await render(<Select id="focused-select" options={options} />);
    const focusedInput = focused.container.querySelector<HTMLInputElement>(
      "#focused-select input:not([type=hidden])",
    )!;
    const focusedControl = focused.container.querySelector<HTMLElement>("#focused-select > div")!;
    expect(focusedControl.className).toContain("duration-[120ms]");
    expect(focusedControl.className).toContain("ease-[cubic-bezier(0.72,0,0.16,1)]");
    await focus(focusedInput);
    expect(focusedControl.className).toContain("0_0_0_2px_var(--scraps-select-focus");
    expect(focusedControl.className).not.toMatch(/\bring-/);

    const disabled = await render(
      <Select defaultMenuIsOpen disabled id="disabled-select" options={[]} />,
    );
    const disabledControl =
      disabled.container.querySelector<HTMLElement>("#disabled-select > div")!;
    const disabledInput = disabled.container.querySelector<HTMLInputElement>(
      "#disabled-select input:not([type=hidden])",
    )!;
    expect(disabledControl.className).toContain("--scraps-select-disabled");
    expect(disabledInput.parentElement?.className).toContain("invisible");
    expect(disabledInput.parentElement?.parentElement?.className).toContain("cursor-not-allowed");
    expect(disabled.container.querySelector("[role=menu]")?.firstElementChild?.className).toContain(
      "--scraps-select-disabled",
    );

    const loading = await render(<Select defaultMenuIsOpen isLoading options={[]} />);
    expect(loading.container.querySelector("[role=menu]")?.firstElementChild?.className).toContain(
      "text-[hsl(0_0%_60%)]",
    );
  });

  it("keeps canonical value-container padding without an extra gap", async () => {
    for (const [size, padding] of [
      ["md", ["pl-4", "pr-2"]],
      ["sm", ["pl-3", "pr-1.5"]],
      ["xs", ["pl-2", "pr-1"]],
    ] as const) {
      const { container } = await render(
        <Select id={`select-${size}`} options={options} size={size} />,
      );
      const valueContainer = container.querySelector<HTMLElement>(`#select-${size} > div > div`)!;
      expect(valueContainer.className).toContain(padding[0]);
      expect(valueContainer.className).toContain(padding[1]);
      expect(valueContainer.className).toContain("cursor-default");
      expect(valueContainer.className).not.toMatch(/\b(?:gap|py)-/);
    }

    const nonSearchable = await render(<Select isSearchable={false} options={options} />);
    const valueContainer = nonSearchable.container.querySelector<HTMLInputElement>(
      "input:not([type=hidden])",
    )!.parentElement!.parentElement!;
    expect(valueContainer.className).toContain("cursor-pointer");

    const multiple = await render(<Select multiple options={options} />);
    const multipleValueContainer = multiple.container.querySelector<HTMLInputElement>(
      "input:not([type=hidden])",
    )!.parentElement!.parentElement!;
    expect(multipleValueContainer.className).toContain("[scrollbar-color:");
  });

  it("keeps canonical menu gutter, surface, and message alignment", async () => {
    const { container } = await render(<Select defaultMenuIsOpen options={[]} />);
    const menuList = container.querySelector<HTMLElement>("[role=menu]")!;
    const menu = menuList.parentElement!;
    expect(menu.className).toContain("my-2");
    expect(menu.className).not.toMatch(/\b(?:overflow-hidden|shadow-)/);
    expect(menuList.firstElementChild?.className).toContain("text-center");
  });

  it("keeps canonical multi-value label padding and remove margin", async () => {
    for (const [size, labelClasses] of [
      ["md", ["h-5", "p-1"]],
      ["sm", ["h-[18px]", "p-0.5"]],
      ["xs", ["h-4", "p-0.5"]],
    ] as const) {
      const { container } = await render(
        <Select defaultValue={["a"]} multiple options={options} size={size} />,
      );
      const remove = container.querySelector<HTMLButtonElement>(
        'button[aria-label="Remove item"]',
      )!;
      const label = remove.previousElementSibling as HTMLElement;
      const chip = remove.parentElement!;
      expect(chip.className).not.toContain("text-[85%]");
      expect(chip.className).not.toMatch(/\bh-/);
      expect(chip.className).not.toMatch(/\b(?:gap|p[xy]?)-/);
      expect(label.className).toContain(labelClasses[0]);
      expect(label.className).toContain(labelClasses[1]);
      expect(label.className).toContain("text-[85%]");
      expect(remove.className).toContain("m-1");
    }
  });

  it("uses the canonical Sentry Select icon paths and sizes", async () => {
    const single = await render(
      <Select clearable defaultMenuIsOpen defaultValue="a" options={options} />,
    );
    const chevron = svgForPath(single.container, "M8 5C8.21");
    const clear = svgForPath(single.container, "M12.72 2.22");
    const singleCheck = svgForPath(single.container, "M13.72 3.22");
    expect(chevron.getAttribute("width")).toBe("12");
    expect(chevron.style.transform).toBe("rotate(180deg)");
    expect(clear.getAttribute("width")).toBe("10");
    expect(singleCheck.getAttribute("width")).toBe("14");
    expect(singleCheck.getAttribute("fill")).toBe("currentColor");

    const multiple = await render(
      <Select defaultMenuIsOpen defaultValue={["a"]} multiple options={options} />,
    );
    const multiCheck = svgForPath(multiple.container, "M13.72 3.22");
    const remove = svgForPath(multiple.container, "M12.72 2.22");
    expect(multiCheck.getAttribute("width")).toBe("12");
    expect(multiCheck.parentElement?.className).toContain("--scraps-select-vibrant-accent");
    expect(multiCheck.parentElement?.className).not.toContain("text-white");
    expect(remove.getAttribute("width")).toBe("8");

    const creatable = await render(
      <Select creatable defaultInputValue="Delta" defaultMenuIsOpen options={[]} />,
    );
    const add = svgForPath(creatable.container, "M8 1C8.41");
    expect(add.getAttribute("width")).toBe("14");
  });

  it("uses getOptionValue as option identity for selection and removal", async () => {
    type KeyedOption = SelectValue<string> & { identity: string };
    const keyedOptions: KeyedOption[] = [
      { identity: "shared", label: "First", value: "first" },
      { identity: "shared", label: "Second", value: "second" },
    ];
    const onChange = vi.fn();
    const { container } = await render(
      <Select
        defaultMenuIsOpen
        defaultValue={[keyedOptions[0]]}
        getOptionValue={(option) => option.identity}
        hideSelectedOptions={false}
        multiple
        onChange={onChange}
        options={keyedOptions}
      />,
    );
    const rows = container.querySelectorAll<HTMLElement>("[role=menuitemcheckbox]");
    expect(rows[1]?.getAttribute("aria-checked")).toBe("true");
    await act(async () => rows[1]?.click());
    expect(onChange.mock.calls.at(-1)?.[0]).toEqual([]);
  });

  it("keeps the pinned multi and searchable compatibility aliases", async () => {
    const { container } = await render(
      <Select defaultMenuIsOpen isSearchable={false} multi options={options} searchable />,
    );
    expect(container.querySelectorAll("[role=menuitemcheckbox]")).toHaveLength(3);
    expect(container.querySelector<HTMLInputElement>("input:not([type=hidden])")?.readOnly).toBe(
      false,
    );
  });

  it("constrains automatic menu height to the available viewport space", async () => {
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(400);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      bottom: 200,
      height: 40,
      left: 10,
      right: 110,
      top: 160,
      width: 100,
      x: 10,
      y: 160,
      toJSON: () => ({}),
    });
    const { container } = await render(
      <Select defaultMenuIsOpen maxMenuHeight={300} minMenuHeight={140} options={options} />,
    );
    const menuList = [...container.querySelectorAll<HTMLElement>("div")].find(
      (element) => element.style.maxHeight === "196px",
    );
    expect(menuList).toBeDefined();
  });

  it("renders ReactNode labels and uses textValue or getOptionLabel for text", async () => {
    const richOptions: SelectValue<string>[] = [
      {
        label: (
          <span data-rich-label>
            <strong>Alpha</strong> project
          </span>
        ),
        textValue: "First project",
        value: "alpha",
      },
      {
        label: (
          <span data-rich-label>
            <strong>Beta</strong> project
          </span>
        ),
        value: "beta",
      },
    ];
    const { container } = await render(
      <Select
        defaultMenuIsOpen
        defaultValue="alpha"
        getOptionLabel={(option) => (option.value === "beta" ? "Second project" : "Ignored alias")}
        options={richOptions}
      />,
    );
    expect(container.querySelectorAll("[data-rich-label]")).toHaveLength(3);
    expect(container.textContent).not.toContain("[object Object]");

    const input = container.querySelector<HTMLInputElement>("input")!;
    await type(input, "First project");
    expect(container.querySelector('[data-test-id="alpha"]')).not.toBeNull();
    expect(container.querySelector('[data-test-id="beta"]')).toBeNull();
    await type(input, "Second project");
    expect(container.querySelector('[data-test-id="alpha"]')).toBeNull();
    expect(container.querySelector('[data-test-id="beta"] [data-rich-label]')).not.toBeNull();
    await focus(input);
    await key(input, "ArrowDown");
    expect(container.querySelector("[aria-live]")?.textContent).toContain("Second project focused");
  });

  it("preserves explicit null labels, messages, and placeholder content", async () => {
    const menu = await render(
      <Select
        components={{
          GroupHeading: (props) => <div data-group-label>{props.children}</div>,
          Option: (props) => (
            <div {...props.innerProps} data-option-label>
              {props.children}
            </div>
          ),
        }}
        defaultMenuIsOpen
        formatGroupLabel={() => null}
        formatOptionLabel={() => null}
        options={[{ label: "Fallback group", options: [options[0]] }]}
      />,
    );
    expect(menu.container.querySelector("[data-group-label]")?.textContent).toBe("");
    expect(menu.container.querySelector("[data-option-label]")?.textContent).toBe("");

    const value = await render(
      <Select
        components={{ SingleValue: (props) => <div data-value-label>{props.children}</div> }}
        defaultValue="a"
        formatOptionLabel={() => null}
        options={options}
      />,
    );
    expect(value.container.querySelector("[data-value-label]")?.textContent).toBe("");

    const placeholder = await render(
      <Select
        components={{ Placeholder: (props) => <div data-placeholder>{props.children}</div> }}
        options={options}
        placeholder={null}
      />,
    );
    expect(placeholder.container.querySelector("[data-placeholder]")?.textContent).toBe("");

    const noOptions = await render(
      <Select defaultMenuIsOpen noOptionsMessage={() => null} options={[]} />,
    );
    expect(noOptions.container.textContent).not.toContain("No options");
    expect(noOptions.container.querySelector("[class*=min-w-full]")).toBeNull();

    const loading = await render(
      <Select defaultMenuIsOpen isLoading loadingMessage={() => null} options={[]} />,
    );
    expect(loading.container.textContent).not.toContain("Loading");
    expect(loading.container.querySelector("[class*=min-w-full]")).toBeNull();
  });

  it("has exact hidden form semantics for empty, delimiter, and disabled values", async () => {
    const { container, root } = await render(<Select multiple name="tag" options={options} />);
    expect(container.querySelector<HTMLInputElement>('input[type="hidden"]')?.value).toBe("");
    await act(async () =>
      root.render(
        <Select delimiter="," multiple name="tag" options={options} value={["a", "b"]} />,
      ),
    );
    expect(
      [...container.querySelectorAll<HTMLInputElement>('input[type="hidden"]')].map(
        (input) => input.value,
      ),
    ).toEqual(["a,b"]);
    await act(async () =>
      root.render(<Select disabled multiple name="tag" options={options} value={["a"]} />),
    );
    expect(container.querySelector('input[type="hidden"]')).toBeNull();
  });

  it("keeps the controller ref separate from inputRef", async () => {
    const controller = createRef<SelectController>();
    const input = createRef<HTMLInputElement>();
    await render(<Select inputRef={input} options={options} ref={controller} />);
    expect(controller.current).not.toBe(input.current);
    await act(async () => controller.current?.focus());
    expect(document.activeElement).toBe(input.current);
    await act(async () => controller.current?.blur());
    expect(document.activeElement).not.toBe(input.current);
  });

  it("preserves the pinned state-manager select ref access", async () => {
    const controller = createRef<SelectController>();
    const inputCleanup = vi.fn();
    const inputCallback = vi.fn(() => inputCleanup);
    const { container, root } = await render(
      <Select inputRef={inputCallback} options={options} ref={controller} />,
    );
    const input = container.querySelector<HTMLInputElement>("input:not([type=hidden])")!;

    const select = controller.current!.select;
    expect(select.inputRef).toBe(input);
    await act(async () => controller.current!.select.focus());
    expect(document.activeElement).toBe(input);
    await act(async () => controller.current!.select.blur());
    expect(document.activeElement).not.toBe(input);
    expect(controller.current!.select).toBe(select);

    const cleanupCallsBeforeUnmount = inputCleanup.mock.calls.length;
    await act(async () => root.unmount());
    roots.splice(roots.indexOf(root), 1);
    expect(inputCleanup).toHaveBeenCalledTimes(cleanupCallsBeforeUnmount + 1);
    expect(select.inputRef).toBeNull();
  });

  it("runs cleanup returned by the controller callback ref", async () => {
    const controllerCleanup = vi.fn();
    const controllerCallback = vi.fn(() => controllerCleanup);
    const { root } = await render(<Select options={options} ref={controllerCallback} />);

    const cleanupCallsBeforeUnmount = controllerCleanup.mock.calls.length;
    await act(async () => root.unmount());
    roots.splice(roots.indexOf(root), 1);
    expect(controllerCleanup).toHaveBeenCalledTimes(cleanupCallsBeforeUnmount + 1);
  });

  it("filters accent-insensitively and applies flat option callback declarations", async () => {
    const style = vi.fn(() => ({ ":hover": { color: "blue" }, color: "red", label: "option" }));
    const { container } = await render(
      <Select defaultMenuIsOpen options={options} searchable styles={{ option: style }} />,
    );
    const input = container.querySelector<HTMLInputElement>('input:not([type="hidden"])')!;
    await type(input, "alpha");
    expect(container.textContent).toContain("Álpha");
    expect(container.textContent).not.toContain("Beta");
    expect(style).toHaveBeenCalledWith(
      expect.objectContaining({ boxSizing: "border-box", display: "block" }),
      expect.objectContaining({ data: options[0], isFocused: false }),
    );
    expect(container.querySelector<HTMLElement>('[data-test-id="a"]')?.style.color).toBe("red");
    expect(
      container.querySelector<HTMLElement>('[data-test-id="a"]')?.getAttribute("style"),
    ).not.toContain(":hover");
  });

  it("applies flat callback declarations to default slots without adding base inline styles", async () => {
    const { container } = await render(
      <Select
        defaultMenuIsOpen
        defaultValue={["a"]}
        id="styled-select"
        multiple
        options={options}
        styles={{
          container: () => ({ borderWidth: 3 }),
          control: () => ({ backgroundColor: "red" }),
          input: () => ({ color: "blue" }),
          menu: () => ({ marginTop: 7 }),
          menuList: () => ({ paddingBottom: 9 }),
          multiValue: () => ({ backgroundColor: "green" }),
          multiValueLabel: () => ({ color: "purple" }),
          multiValueRemove: () => ({ marginLeft: 11 }),
          valueContainer: () => ({ gap: 5 }),
        }}
      />,
    );
    const root = container.querySelector<HTMLElement>("#styled-select")!;
    const control = root.firstElementChild as HTMLElement;
    const input = container.querySelector<HTMLInputElement>('input:not([type="hidden"])')!;
    const value = container.querySelector<HTMLElement>('button[aria-label="Remove item"]')!;
    expect(root.style.borderWidth).toBe("3px");
    expect(control.style.backgroundColor).toBe("red");
    expect(input.style.color).toBe("");
    expect(input.parentElement?.style.color).toBe("blue");
    expect((value.previousElementSibling as HTMLElement | null)?.style.color).toBe("purple");
    expect(value.parentElement?.style.backgroundColor).toBe("green");
    expect(value.style.marginLeft).toBe("11px");

    const plain = await render(<Select defaultMenuIsOpen options={options} />);
    expect((plain.container.firstElementChild as HTMLElement).getAttribute("style")).toBeNull();
    expect(
      plain.container.querySelector<HTMLElement>('[data-test-id="a"]')?.getAttribute("style"),
    ).toBeNull();
  });

  it("keeps nested callback CSS available to replacement components without applying it to defaults", async () => {
    const resolved: unknown[] = [];
    await render(
      <Select
        components={{
          Control: (props) => {
            resolved.push(props.getStyles("control", props));
            return <div>{props.children}</div>;
          },
        }}
        options={options}
        styles={{ control: () => ({ ":hover": { backgroundColor: "red" }, color: "blue" }) }}
      />,
    );
    expect(resolved[0]).toEqual({ ":hover": { backgroundColor: "red" }, color: "blue" });
  });

  it("applies the pinned nested styles to default slots without injecting a stylesheet", async () => {
    const styleCount = document.querySelectorAll("style").length;
    const styledOptions = [
      {
        label: "Alpha",
        leadingItems: <svg aria-label="Option icon" />,
        value: "a",
      },
    ];
    const option = await render(
      <Select
        defaultMenuIsOpen
        defaultValue="a"
        options={styledOptions}
        styles={{
          option: (_provided, state) => ({ svg: { color: state.isSelected ? "#fff" : undefined } }),
        }}
      />,
    );
    const optionRow = option.container.querySelector<HTMLElement>('[data-test-id="a"]')!;
    expect(optionRow.style.getPropertyValue("--scraps-select-option-svg-color")).toBe("#fff");
    expect(optionRow.className).toContain("[&_svg]:text-");

    const input = await render(
      <Select
        options={options}
        styles={{
          input: () => ({
            ":before": {
              backgroundColor: "#eee",
              borderRadius: 3,
              content: '\"\"',
              height: 24,
              marginRight: 8,
              width: 38,
            },
          }),
        }}
      />,
    );
    const inputBefore = input.container.querySelector<HTMLInputElement>("input")
      ?.previousElementSibling as HTMLElement;
    expect(inputBefore.getAttribute("aria-hidden")).toBe("true");
    expect(
      inputBefore.parentElement?.style.getPropertyValue("--scraps-select-input-before-width"),
    ).toBe("38px");

    const singleValue = await render(
      <Select
        defaultValue="a"
        inFieldLabel="Team:"
        options={options}
        styles={{
          singleValue: (provided) => {
            const providedBefore = provided[":before"];
            return {
              ...provided,
              ":before": {
                ...(typeof providedBefore === "object" && providedBefore !== null
                  ? providedBefore
                  : {}),
                color: "#111",
                marginLeft: 2,
                marginRight: 12,
              },
            };
          },
        }}
      />,
    );
    const singleValueBefore = [
      ...singleValue.container.querySelectorAll<HTMLElement>('[aria-hidden="true"]'),
    ].find(
      (element) =>
        element.parentElement?.style.getPropertyValue(
          "--scraps-select-single-value-before-color",
        ) === "#111",
    );
    expect(
      singleValueBefore?.parentElement?.style.getPropertyValue(
        "--scraps-select-single-value-before-margin-right",
      ),
    ).toBe("12px");
    expect(singleValueBefore?.textContent).toBe("Team:");
    expect(singleValue.container.querySelector("strong")).toBeNull();

    const placeholder = await render(
      <Select
        options={options}
        styles={{
          placeholder: () => ({
            ":before": { backgroundColor: "#ddd", content: '\"\"', height: 24, width: 24 },
          }),
        }}
      />,
    );
    const placeholderBefore = [
      ...placeholder.container.querySelectorAll<HTMLElement>('[aria-hidden="true"]'),
    ].find(
      (element) =>
        element.parentElement?.style.getPropertyValue(
          "--scraps-select-placeholder-before-width",
        ) === "24px",
    );
    expect(placeholderBefore).toBeDefined();

    const multiValue = await render(
      <Select
        defaultValue={["a"]}
        multiple
        options={options}
        styles={{
          multiValueRemove: (provided) => ({
            ...provided,
            ":hover": { backgroundColor: "#f00", color: "#fff" },
          }),
        }}
      />,
    );
    const remove = multiValue.container.querySelector<HTMLElement>(
      'button[aria-label="Remove item"]',
    )!;
    expect(
      remove.style.getPropertyValue("--scraps-select-multi-value-remove-hover-background-color"),
    ).toBe("#f00");
    expect(remove.style.getPropertyValue("--scraps-select-multi-value-remove-hover-color")).toBe(
      "#fff",
    );
    expect(remove.className).toContain("hover:bg-");
    expect(remove.className).toContain("hover:text-");
    expect(document.querySelectorAll("style")).toHaveLength(styleCount);
  });

  it("does not restore the removed indicator separator through a style callback", async () => {
    const { container } = await render(
      <Select
        options={options}
        styles={{ indicatorSeparator: () => ({ backgroundColor: "red", width: 1 }) }}
      />,
    );
    expect(container.querySelector('[style*="background-color: red"]')).toBeNull();
  });

  it("passes exact v4 and Scraps base styles to consumer callbacks", async () => {
    const controlBases: unknown[] = [];
    const optionBases: unknown[] = [];
    const portalBases: unknown[] = [];
    const { container } = await render(
      <Select
        components={{
          MenuPortal: (props) => {
            portalBases.push(
              props.getStyles("menuPortal", {
                offset: 42,
                position: "fixed",
                rect: { left: 12, width: 88 },
              }),
            );
            return props.children;
          },
        }}
        defaultMenuIsOpen
        isInsideModal
        maxMenuWidth={320}
        menuPosition="fixed"
        multiple
        options={options}
        size="sm"
        styles={{
          control: (base) => {
            controlBases.push(base);
            return base;
          },
          option: (base) => {
            optionBases.push(base);
            return base;
          },
        }}
      />,
    );
    expect(controlBases[0]).toEqual({
      alignItems: "center",
      backgroundColor: "#10103008",
      border: "1px solid #DAD9DE",
      borderRadius: "6px",
      boxShadow: "0px 1px 0px 0px #DAD9DE inset",
      color: "#302E36",
      display: "flex",
      fontSize: "0.875rem",
      lineHeight: "1rem",
      maxHeight: "12em",
      minHeight: "32px",
      overflow: "hidden",
      transition:
        "border 120ms cubic-bezier(0.72, 0, 0.16, 1), box-shadow 120ms cubic-bezier(0.72, 0, 0.16, 1)",
    });
    expect(optionBases[0]).toEqual({
      ":active": { background: "transparent" },
      WebkitTapHighlightColor: "rgba(0, 0, 0, 0)",
      background: "transparent",
      backgroundColor: "transparent",
      boxSizing: "border-box",
      color: "#302E36",
      cursor: "default",
      display: "block",
      fontSize: "inherit",
      label: "option",
      padding: 0,
      userSelect: "none",
      width: "100%",
    });
    expect(portalBases).toContainEqual({
      boxSizing: "border-box",
      left: 12,
      maxWidth: 320,
      position: "fixed",
      top: 42,
      width: 88,
      zIndex: 10001,
    });

    await focus(container.querySelector<HTMLInputElement>("input")!);
    expect(controlBases.at(-1)).toEqual({
      alignItems: "center",
      backgroundColor: "#10103008",
      border: "1px solid #DAD9DE",
      borderRadius: "6px",
      boxShadow: "0px 1px 0px 0px #DAD9DE inset, 0 0 0 2px #7553FF",
      color: "#302E36",
      display: "flex",
      fontSize: "0.875rem",
      lineHeight: "1rem",
      maxHeight: "12em",
      minHeight: "32px",
      outline: "none",
      overflow: "hidden",
      transition:
        "border 120ms cubic-bezier(0.72, 0, 0.16, 1), box-shadow 120ms cubic-bezier(0.72, 0, 0.16, 1)",
    });
  });

  it("passes the measured v4 portal rect, offset, and position to styles", async () => {
    const portal = document.createElement("div");
    document.body.append(portal);
    vi.spyOn(window, "pageYOffset", "get").mockReturnValue(25);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      bottom: 100,
      height: 40,
      left: 12,
      right: 100,
      top: 60,
      width: 88,
      x: 12,
      y: 60,
      toJSON: () => ({}),
    });
    const bases: unknown[] = [];
    const states: unknown[] = [];
    await render(
      <Select
        defaultMenuIsOpen
        isInsideModal
        maxMenuWidth={320}
        menuPortalTarget={portal}
        options={options}
        styles={{
          menuPortal: (base, state) => {
            bases.push(base);
            states.push(state);
            return base;
          },
        }}
      />,
    );

    expect(states.at(-1)).toEqual({
      offset: 125,
      position: "absolute",
      rect: {
        bottom: 100,
        height: 40,
        left: 12,
        right: 100,
        top: 60,
        width: 88,
      },
    });
    expect(bases.at(-1)).toMatchObject({
      left: 12,
      maxWidth: 320,
      position: "absolute",
      top: 125,
      width: 88,
      zIndex: 10001,
    });
    expect((portal.firstElementChild as HTMLElement).style.cssText).toContain("left: 12px");
    expect((portal.firstElementChild as HTMLElement).style.cssText).toContain("top: 125px");
    expect((portal.firstElementChild as HTMLElement).style.cssText).not.toContain("width: 0px");
  });

  it("positions a default body portal from live control geometry", async () => {
    const portal = document.createElement("div");
    document.body.append(portal);
    vi.spyOn(window, "pageYOffset", "get").mockReturnValue(25);
    let rect = {
      bottom: 100,
      height: 40,
      left: 12,
      right: 100,
      top: 60,
      width: 88,
      x: 12,
      y: 60,
      toJSON: () => ({}),
    };
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(() => rect);
    const { root } = await render(
      <Select defaultMenuIsOpen menuPortalTarget={portal} options={options} />,
    );

    let wrapper = portal.firstElementChild as HTMLElement;
    let menu = wrapper.firstElementChild as HTMLElement;
    expect(wrapper.style.position).toBe("absolute");
    expect(wrapper.style.left).toBe("12px");
    expect(wrapper.style.top).toBe("125px");
    expect(wrapper.style.width).toBe("88px");
    expect(menu.style.top).toBe("100%");

    rect = { ...rect, bottom: 160, left: 32, right: 152, top: 120, width: 120, x: 32, y: 120 };
    await act(async () => window.dispatchEvent(new Event("scroll")));
    wrapper = portal.firstElementChild as HTMLElement;
    expect(wrapper.style.left).toBe("32px");
    expect(wrapper.style.top).toBe("185px");
    expect(wrapper.style.width).toBe("120px");

    rect = {
      ...rect,
      bottom: 740,
      left: 32,
      right: 152,
      top: 700,
      width: 120,
      x: 32,
      y: 700,
    };
    await act(async () =>
      root.render(
        <Select
          defaultMenuIsOpen
          menuPortalTarget={portal}
          menuPosition="fixed"
          options={options}
        />,
      ),
    );
    wrapper = portal.firstElementChild as HTMLElement;
    menu = wrapper.firstElementChild as HTMLElement;
    expect(wrapper.style.position).toBe("fixed");
    expect(wrapper.style.top).toBe("700px");
    expect(menu.style.bottom).toBe("100%");
    expect(menu.style.top).toBe("");

    rect = {
      ...rect,
      bottom: 720,
      left: 48,
      right: 188,
      top: 680,
      width: 140,
      x: 48,
      y: 680,
    };
    await act(async () => window.dispatchEvent(new Event("resize")));
    wrapper = portal.firstElementChild as HTMLElement;
    expect(wrapper.style.left).toBe("48px");
    expect(wrapper.style.top).toBe("680px");
    expect(wrapper.style.width).toBe("140px");
  });

  it("uses the active Scraps theme and disabled state in style callback data", async () => {
    document.documentElement.classList.add("dark");
    const bases: unknown[] = [];
    await render(
      <Select
        disabled
        options={options}
        size="xs"
        styles={{
          control: (base) => {
            bases.push(base);
            return base;
          },
        }}
      />,
    );
    expect(bases[0]).toEqual({
      alignItems: "center",
      background: "#2E2936",
      backgroundColor: "#00002033",
      border: "1px solid #141119",
      borderRadius: "5px",
      boxShadow: "0px 1px 0px 0px #141119 inset",
      color: "#958E9F",
      cursor: "not-allowed",
      display: "flex",
      fontSize: "0.75rem",
      lineHeight: "1rem",
      minHeight: "28px",
      opacity: "60%",
      transition:
        "border 120ms cubic-bezier(0.72, 0, 0.16, 1), box-shadow 120ms cubic-bezier(0.72, 0, 0.16, 1)",
    });
  });

  it("selects, removes, pops, and clears values with the canonical callbacks", async () => {
    const onChange = vi.fn();
    const onClear = vi.fn();
    const { container } = await render(
      <Select
        clearable
        defaultMenuIsOpen
        multiple
        onChange={onChange}
        onClear={onClear}
        options={options}
      />,
    );
    await act(async () => (container.querySelector('[data-test-id="a"]') as HTMLElement).click());
    expect(onChange.mock.calls.at(-1)?.[0]).toEqual([options[0]]);
    expect(onChange.mock.calls.at(-1)?.[1]).toEqual({
      action: "select-option",
      name: undefined,
      option: options[0],
    });
    const input = container.querySelector<HTMLInputElement>('input:not([type="hidden"])')!;
    await key(input, "Backspace");
    expect(onChange.mock.calls.at(-1)?.[0]).toEqual([]);
    await act(async () => (container.querySelector('[data-test-id="b"]') as HTMLElement).click());
    await act(async () =>
      (container.querySelector('button[aria-label="Clear choices"]') as HTMLButtonElement).click(),
    );
    expect(onClear).toHaveBeenCalledOnce();
    expect(onChange.mock.calls.at(-1)?.[1]).toEqual({
      action: "clear",
      name: undefined,
      removedValues: [options[1]],
    });
  });

  it("matches v4 multi-value right-arrow and Delete behavior", async () => {
    const onChange = vi.fn();
    const { container } = await render(
      <Select defaultValue={["a", "b"]} multiple onChange={onChange} options={options} />,
    );
    const input = container.querySelector<HTMLInputElement>("input:not([type=hidden])")!;
    await focus(input);

    await key(input, "ArrowRight");
    expect(container.querySelector("#aria-context")?.textContent).toContain("press Down to open");
    await key(input, "ArrowLeft");
    expect(container.querySelector("[aria-live]")?.textContent).toContain(
      "value Beta focused, 2 of 2",
    );
    await key(input, "ArrowRight");
    expect(container.querySelector("#aria-context")?.textContent).toContain("press Down to open");
    await key(input, "Delete");
    expect(onChange.mock.calls.at(-1)?.[0]).toEqual([options[0]]);
    expect(onChange.mock.calls.at(-1)?.[1]).toEqual({
      action: "pop-value",
      name: undefined,
      removedValue: options[1],
    });

    await key(input, "ArrowLeft");
    await key(input, "Delete");
    expect(onChange.mock.calls.at(-1)?.[0]).toEqual([]);
    expect(onChange.mock.calls.at(-1)?.[1]).toEqual({
      action: "remove-value",
      name: undefined,
      removedValue: options[0],
    });
  });

  it("supports Home, End, Page, Space, and disabled option keyboard behavior", async () => {
    const onChange = vi.fn();
    const { container } = await render(
      <Select onChange={onChange} options={options} pageSize={2} />,
    );
    const input = container.querySelector<HTMLInputElement>("input:not([type=hidden])")!;
    await focus(input);
    await key(input, "ArrowDown");
    await key(input, "End");
    await key(input, "Enter");
    expect(onChange).not.toHaveBeenCalled();
    expect(container.querySelector("[aria-live]")?.textContent).toContain("Gamma");
    expect(container.querySelector("[aria-live]")?.textContent).toContain("disabled");
    await key(input, "ArrowUp");
    await key(input, "Enter");
    expect(onChange.mock.calls.at(-1)?.[0]).toEqual(options[1]);
    await key(input, "ArrowDown");
    await key(input, "Home");
    await key(input, " ");
    expect(onChange.mock.calls.at(-1)?.[0]).toEqual(options[0]);

    const closedChange = vi.fn();
    const closed = await render(<Select onChange={closedChange} options={options} />);
    const closedInput = closed.container.querySelector<HTMLInputElement>("input")!;
    await key(closedInput, " ");
    expect(closed.container.querySelector('[data-test-id="a"]')).not.toBeNull();
    await key(closedInput, " ");
    expect(closedChange.mock.calls.at(-1)?.[0]).toEqual(options[0]);

    const pageChange = vi.fn();
    const page = await render(
      <Select
        blurInputOnSelect={false}
        closeMenuOnSelect={false}
        defaultMenuIsOpen
        onChange={pageChange}
        options={[options[0], options[2], options[1]]}
        pageSize={1}
      />,
    );
    const pageInput = page.container.querySelector<HTMLInputElement>("input")!;
    await focus(pageInput);
    await key(pageInput, "ArrowDown");
    await key(pageInput, "PageDown");
    await key(pageInput, "Enter");
    expect(pageChange).not.toHaveBeenCalled();
    expect(page.container.querySelector("[aria-live]")?.textContent).toContain("disabled");
    await key(pageInput, "PageDown");
    await key(pageInput, "Enter");
    expect(pageChange.mock.calls.at(-1)?.[0]).toEqual(options[1]);
    await key(pageInput, "PageUp");
    await key(pageInput, "Enter");
    expect(pageChange).toHaveBeenCalledTimes(1);
    await key(pageInput, "PageUp");
    await key(pageInput, "Enter");
    expect(pageChange.mock.calls.at(-1)?.[0]).toEqual(options[0]);
  });

  it("lets a consumer isOptionDisabled replace the Scraps disabled default", async () => {
    const onChange = vi.fn();
    const { container } = await render(
      <Select
        defaultMenuIsOpen
        isOptionDisabled={(option) => option.value === "a"}
        onChange={onChange}
        options={options}
      />,
    );
    expect(container.querySelector('[data-test-id="a"]')?.getAttribute("aria-disabled")).toBe(
      "true",
    );
    expect(container.querySelector('[data-test-id="g"]')?.getAttribute("aria-disabled")).toBeNull();
    await act(async () => {
      container
        .querySelector('[data-test-id="g"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(onChange.mock.calls.at(-1)?.[0]).toEqual(options[2]);
  });

  it("announces the exact v4 singular and plural result text", async () => {
    const { container } = await render(<Select defaultMenuIsOpen options={options} searchable />);
    const input = container.querySelector<HTMLInputElement>("input")!;
    await focus(input);
    expect(container.querySelector("[aria-live]")?.textContent).toContain("3 results available");
    await type(input, "beta");
    expect(container.querySelector("[aria-live]")?.textContent).toContain("1 result available");
  });

  it("does not act on IME keyCode 229", async () => {
    const onChange = vi.fn();
    const { container } = await render(
      <Select defaultMenuIsOpen onChange={onChange} options={options} />,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;
    await act(async () =>
      input.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, key: "Enter", keyCode: 229 }),
      ),
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it("supports controlled menu and input state", async () => {
    const onInputChange = vi.fn();
    const onMenuClose = vi.fn();
    const { container } = await render(
      <Select
        inputValue="be"
        menuIsOpen
        onInputChange={onInputChange}
        onMenuClose={onMenuClose}
        options={options}
        searchable
      />,
    );
    expect(container.textContent).toContain("Beta");
    const input = container.querySelector<HTMLInputElement>("input")!;
    await key(input, "Escape");
    expect(onMenuClose).toHaveBeenCalledOnce();
    expect(container.querySelector("[role=menuitemradio]")).not.toBeNull();
  });

  it("creates an option and localizes the create row", async () => {
    const onCreateOption = vi.fn();
    const { container } = await render(
      <Select
        creatable
        defaultMenuIsOpen
        onCreateOption={onCreateOption}
        options={[]}
        searchable
      />,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;
    await type(input, "Delta");
    expect(container.textContent).toContain('Create "Delta"');
    await act(async () =>
      (container.querySelector('[data-test-id="create-option"]') as HTMLElement).click(),
    );
    expect(onCreateOption).toHaveBeenCalledWith("Delta");
    expect(input.value).toBe("");
    expect(container.querySelector('[data-test-id="create-option"]')).toBeNull();
    expect(document.activeElement).not.toBe(input);
  });

  it("invalidates older async requests when a newer input is served from cache", async () => {
    const callbacks = new Map<string, (next?: SelectValue<string>[]) => void>();
    const loadOptions = vi.fn((query: string, callback: (next?: SelectValue<string>[]) => void) => {
      callbacks.set(query, callback);
    });
    const { container } = await render(
      <Select async cacheOptions defaultMenuIsOpen loadOptions={loadOptions} searchable />,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;
    await type(input, "b");
    await act(async () => callbacks.get("b")?.([{ label: "Bravo", value: "bravo" }]));
    expect(container.textContent).toContain("Bravo");
    await type(input, "a");
    await type(input, "b");
    expect(container.textContent).toContain("Bravo");
    await act(async () => callbacks.get("a")?.([{ label: "Old", value: "old" }]));
    expect(container.textContent).toContain("Bravo");
    expect(container.textContent).not.toContain("Old");
    expect(loadOptions.mock.calls.filter(([query]) => query === "b")).toHaveLength(1);
  });

  it("keeps default async requests independent and clears blank-query loading", async () => {
    const callbacks = new Map<string, (next?: SelectValue<string>[]) => void>();
    const LoadingIndicator = () => <span data-async-loading />;
    const { container } = await render(
      <Select
        async
        components={{ LoadingIndicator }}
        defaultMenuIsOpen
        defaultOptions
        loadOptions={(query, callback) => {
          callbacks.set(query, callback);
        }}
      />,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;
    await type(input, "a");
    expect(container.querySelector("[data-async-loading]")).not.toBeNull();
    await type(input, "");
    expect(container.querySelector("[data-async-loading]")).toBeNull();
    await act(async () => callbacks.get("")?.([{ label: "Default result", value: "default" }]));
    expect(container.textContent).toContain("Default result");
    await act(async () => callbacks.get("a")?.([{ label: "Stale search", value: "stale" }]));
    expect(container.textContent).not.toContain("Stale search");
  });

  it("loads async default options from promise and restores them for blank input", async () => {
    const loadOptions = vi.fn(async (query: string) =>
      query ? [{ label: "Query", value: "q" }] : [{ label: "Default", value: "d" }],
    );
    const { container } = await render(
      <Select async defaultMenuIsOpen defaultOptions loadOptions={loadOptions} searchable />,
    );
    await act(async () => Promise.resolve());
    expect(container.textContent).toContain("Default");
    const input = container.querySelector<HTMLInputElement>("input")!;
    await type(input, "q");
    await act(async () => Promise.resolve());
    expect(container.textContent).toContain("Query");
    await type(input, "");
    expect(container.textContent).toContain("Default");
  });

  it("synchronizes changed async default option arrays", async () => {
    const first = [{ label: "First default", value: "first" }];
    const second = [{ label: "Second default", value: "second" }];
    const { container, root } = await render(
      <Select async defaultMenuIsOpen defaultOptions={first} />,
    );
    expect(container.textContent).toContain("First default");
    await act(async () => root.render(<Select async defaultMenuIsOpen defaultOptions={second} />));
    expect(container.textContent).toContain("Second default");
    expect(container.textContent).not.toContain("First default");
  });

  it("retains an async multiple selection after the query clears", async () => {
    const callbacks = new Map<string, (next?: SelectValue<string>[]) => void>();
    const loadOptions = vi.fn((query: string, callback: (next?: SelectValue<string>[]) => void) => {
      callbacks.set(query, callback);
    });
    const { container } = await render(
      <Select async defaultMenuIsOpen loadOptions={loadOptions} multiple name="project" />,
    );
    const input = container.querySelector<HTMLInputElement>("input:not([type=hidden])")!;
    await type(input, "remote");
    const remote = { label: "Remote project", value: "remote" };
    await act(async () => callbacks.get("remote")?.([remote]));
    await act(async () => {
      container
        .querySelector('[data-test-id="remote"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(input.value).toBe("");
    expect(container.textContent).toContain("Remote project");
    expect(
      container.querySelector<HTMLInputElement>('input[type="hidden"][name="project"]')?.value,
    ).toBe("remote");
  });

  it("passes commonProps and innerProps through replacement slots", async () => {
    const seen: unknown[] = [];
    const { container } = await render(
      <Select
        clearable
        components={{
          CrossIcon: () => <i data-slot="cross" />,
          GroupHeading: (slotProps) => <h3>{slotProps.children}</h3>,
          IndicatorSeparator: () => <i data-slot="separator" />,
          Option: (slotProps) => {
            seen.push(slotProps);
            return (
              <div {...slotProps.innerProps} data-custom={slotProps.data?.value}>
                {slotProps.label}
              </div>
            );
          },
        }}
        defaultMenuIsOpen
        defaultValue="a"
        options={[{ label: "Group", options }]}
      />,
    );
    expect(container.querySelector("h3")?.textContent).toBe("Group");
    expect(container.querySelector('[data-custom="a"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="cross"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="separator"]')).not.toBeNull();
    expect(seen[0]).toMatchObject({
      cx: expect.any(Function),
      getStyles: expect.any(Function),
      hasValue: true,
      isMulti: false,
      options: [{ label: "Group", options }],
      selectOption: expect.any(Function),
      selectProps: expect.objectContaining({
        blurInputOnSelect: true,
        closeMenuOnSelect: true,
        hideSelectedOptions: false,
        inputValue: "",
        isClearable: true,
        isDisabled: false,
        isMulti: false,
        isSearchable: true,
        menuIsOpen: true,
        menuPlacement: "auto",
        tabSelectsValue: false,
        value: options[0],
      }),
      theme: expect.objectContaining({ borderRadius: 4 }),
    });
  });

  it("supplies working v4 Menu and DropdownIndicator handlers", async () => {
    type ComponentProps = SelectComponentPropsMap<SelectValue<string>>;
    function Menu(props: ComponentProps["Menu"]) {
      return (
        <div {...props.innerProps} data-custom-menu>
          {props.children}
        </div>
      );
    }
    function DropdownIndicator(props: ComponentProps["DropdownIndicator"]) {
      return (
        <button {...props.innerProps} data-custom-dropdown type="button">
          toggle
        </button>
      );
    }
    const { container } = await render(
      <Select components={{ DropdownIndicator, Menu }} defaultMenuIsOpen options={options} />,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;
    const menuMouseDown = new MouseEvent("mousedown", {
      bubbles: true,
      button: 0,
      cancelable: true,
    });
    await act(async () => {
      container.querySelector("[data-custom-menu]")?.dispatchEvent(menuMouseDown);
    });
    expect(menuMouseDown.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(input);
    await act(async () => {
      container
        .querySelector("[data-custom-dropdown]")
        ?.dispatchEvent(
          new MouseEvent("mousedown", { bubbles: true, button: 0, cancelable: true }),
        );
    });
    expect(container.querySelector("[data-custom-menu]")).toBeNull();

    const onChange = vi.fn();
    const opening = await render(
      <Select
        components={{ DropdownIndicator, Menu }}
        onChange={onChange}
        openMenuOnClick={false}
        options={options}
      />,
    );
    await act(async () => {
      opening.container
        .querySelector("[data-custom-dropdown]")
        ?.dispatchEvent(
          new MouseEvent("mousedown", { bubbles: true, button: 0, cancelable: true }),
        );
    });
    expect(opening.container.querySelector("[data-custom-menu]")).not.toBeNull();
    await key(opening.container.querySelector<HTMLInputElement>("input")!, "Enter");
    expect(onChange.mock.calls.at(-1)?.[0]).toEqual(options[0]);
  });

  it("supplies native Input and root SelectContainer replacement props", async () => {
    const seenInputs: Array<Record<string, unknown>> = [];
    const seenContainers: Array<Record<string, unknown>> = [];
    const onChange = vi.fn();
    const { container } = await render(
      <Select
        aria-label="Project"
        components={{
          Input: (props) => {
            seenInputs.push(props);
            const native = props as typeof props & {
              "aria-autocomplete": "list";
              "aria-label"?: string;
              disabled: boolean;
              form?: string;
              id: string;
              onBlur: React.FocusEventHandler<HTMLInputElement>;
              onChange: React.ChangeEventHandler<HTMLInputElement>;
              onFocus: React.FocusEventHandler<HTMLInputElement>;
              readOnly: boolean;
              value: string;
            };
            return (
              <input
                aria-autocomplete={native["aria-autocomplete"]}
                aria-label={native["aria-label"]}
                data-replacement-input
                disabled={native.disabled}
                form={native.form}
                id={native.id}
                onBlur={native.onBlur}
                onChange={native.onChange}
                onFocus={native.onFocus}
                readOnly={native.readOnly}
                ref={props.innerRef as React.Ref<HTMLInputElement>}
                value={native.value}
              />
            );
          },
          SelectContainer: (props) => {
            seenContainers.push(props);
            return (
              <div data-replacement-container {...props.innerProps}>
                {props.children}
              </div>
            );
          },
        }}
        defaultMenuIsOpen
        form="settings"
        id="project-select"
        onChange={onChange}
        options={options}
      />,
    );
    const input = container.querySelector<HTMLInputElement>("[data-replacement-input]")!;
    expect(seenInputs.at(-1)).toMatchObject({
      "aria-autocomplete": "list",
      "aria-label": "Project",
      form: "settings",
      id: expect.stringContaining("-input"),
      innerRef: expect.any(Function),
      onBlur: expect.any(Function),
      onChange: expect.any(Function),
      onFocus: expect.any(Function),
      value: "",
    });
    expect(seenContainers.at(-1)).toMatchObject({
      children: expect.anything(),
      innerProps: { id: "project-select", onKeyDown: expect.any(Function) },
    });
    await key(input, "ArrowDown");
    await key(input, "Enter");
    expect(onChange.mock.calls.at(-1)?.[0]).toEqual(options[0]);
  });

  it("renders hook, memo, forwardRef, and class replacement components", async () => {
    type ComponentProps = SelectComponentPropsMap<SelectValue<string>>;
    function HookOption(props: ComponentProps["Option"]) {
      const [mounted] = useState(true);
      return (
        <div {...props.innerProps} data-hook={mounted}>
          {props.label}
        </div>
      );
    }
    const MemoValueContainer = memo(function MemoValueContainer({
      children,
    }: {
      children?: ReactNode;
    }) {
      return <div data-memo>{children}</div>;
    });
    let receivedControlRef = false;
    const ForwardControl = forwardRef<HTMLDivElement, { children?: ReactNode }>(
      function ForwardControl({ children }, ref) {
        receivedControlRef = ref !== null;
        return (
          <div data-forward-ref ref={ref}>
            {children}
          </div>
        );
      },
    );
    class ClassMenu extends Component<ComponentProps["Menu"]> {
      override render() {
        return <section data-class>{this.props.children}</section>;
      }
    }
    const { container } = await render(
      <Select
        components={{
          Control: ForwardControl,
          Menu: ClassMenu,
          Option: HookOption,
          ValueContainer: MemoValueContainer,
        }}
        defaultMenuIsOpen
        options={options}
      />,
    );
    expect(container.querySelectorAll("[data-hook=true]")).toHaveLength(3);
    expect(container.querySelector("[data-memo]")).not.toBeNull();
    expect(container.querySelector("[data-forward-ref]")).not.toBeNull();
    expect(receivedControlRef).toBe(true);
    expect(container.querySelector("[data-class]")).not.toBeNull();
    await type(container.querySelector<HTMLInputElement>("input")!, "beta");
    expect(container.querySelectorAll("[data-hook=true]")).toHaveLength(1);
  });

  it("gives a v4 MultiValue replacement its resolved subcomponents", async () => {
    type MultiValueProps = SelectComponentPropsMap<SelectValue<string>>["MultiValue"];
    const onChange = vi.fn();
    function V4MultiValue(props: MultiValueProps) {
      const { Container, Label, Remove } = props.components;
      return (
        <Container {...props} innerProps={{ className: "container" }}>
          <Label {...props} innerProps={{ className: "label" }}>
            {props.children}
          </Label>
          <Remove
            data={props.data}
            innerProps={{ className: "remove", ...props.removeProps }}
            selectProps={props.selectProps}
          />
        </Container>
      );
    }
    const { container } = await render(
      <Select
        components={{ MultiValue: V4MultiValue }}
        defaultValue={["a"]}
        multiple
        onChange={onChange}
        options={options}
      />,
    );
    expect(container.querySelector(".container .label")?.textContent).toBe("Álpha");
    const removeButton = container.querySelector<HTMLButtonElement>(
      '.remove[aria-label="Remove item"]',
    );
    expect(removeButton).not.toBeNull();
    await act(async () => removeButton?.click());
    expect(onChange.mock.calls.at(-1)?.[0]).toEqual([]);

    const disabled = await render(
      <Select
        components={{ MultiValue: V4MultiValue }}
        defaultValue={["a"]}
        disabled
        multiple
        options={options}
      />,
    );
    expect(disabled.container.querySelector<HTMLButtonElement>(".remove")?.disabled).toBe(true);
  });

  it("lets the default v4 MultiValue call custom subcomponents", async () => {
    type ComponentProps = SelectComponentPropsMap<SelectValue<string>>;
    const seenRemoveProps: Array<ComponentProps["MultiValueRemove"]> = [];
    function Container(props: ComponentProps["MultiValueContainer"]) {
      return (
        <span {...props.innerProps} data-custom-container>
          {props.children}
        </span>
      );
    }
    function Label(props: ComponentProps["MultiValueLabel"]) {
      return (
        <span {...props.innerProps} data-custom-label>
          {props.children}
        </span>
      );
    }
    function Remove(props: ComponentProps["MultiValueRemove"]) {
      seenRemoveProps.push(props);
      const { onClick, onMouseDown, onTouchEnd, ...htmlProps } = props.innerProps;
      return (
        <button
          {...htmlProps}
          data-custom-remove
          onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
          onMouseDown={onMouseDown as React.MouseEventHandler<HTMLButtonElement>}
          onTouchEnd={onTouchEnd as React.TouchEventHandler<HTMLButtonElement>}
          type="button"
        >
          {props.children ?? "custom remove"}
        </button>
      );
    }
    const onChange = vi.fn();
    const { container } = await render(
      <Select
        components={{
          MultiValueContainer: Container,
          MultiValueLabel: Label,
          MultiValueRemove: Remove,
        }}
        defaultValue={["a"]}
        multiple
        onChange={onChange}
        options={options}
      />,
    );
    expect(container.querySelector("[data-custom-label]")?.textContent).toBe("Álpha");
    const removeButton = container.querySelector<HTMLButtonElement>("[data-custom-remove]");
    expect(removeButton?.textContent).toBe("custom remove");
    expect(seenRemoveProps.at(-1)?.innerProps.className).toContain("items-center");
    await act(async () => removeButton?.click());
    expect(onChange.mock.calls.at(-1)?.[0]).toEqual([]);
  });

  it("provides live MenuList and Option refs and scrolls the focused option", async () => {
    type ComponentProps = SelectComponentPropsMap<SelectValue<string>>;
    const menuListNodes: Array<HTMLElement | null> = [];
    const optionNodes: Array<HTMLElement | null> = [];
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });
    function MenuList(props: ComponentProps["MenuList"]) {
      return (
        <div
          data-replacement-menu-list
          ref={(node) => {
            menuListNodes.push(node);
            if (typeof props.innerRef === "function") props.innerRef(node);
            else if (props.innerRef) props.innerRef.current = node;
          }}
        >
          {props.children}
        </div>
      );
    }
    function Option(props: ComponentProps["Option"]) {
      const { key: optionKey, ...innerProps } = props.innerProps;
      return (
        <div
          {...innerProps}
          key={optionKey}
          ref={(node) => {
            optionNodes.push(node);
            if (typeof props.innerRef === "function") props.innerRef(node);
            else if (props.innerRef) props.innerRef.current = node;
          }}
        >
          {props.label}
        </div>
      );
    }
    const { container } = await render(
      <Select components={{ MenuList, Option }} defaultMenuIsOpen options={options} />,
    );
    expect(menuListNodes.some((node) => node instanceof HTMLElement)).toBe(true);
    expect(new Set(optionNodes.filter((node) => node instanceof HTMLElement)).size).toBe(3);
    scrollIntoView.mockClear();
    await key(container.querySelector<HTMLInputElement>("input")!, "ArrowDown");
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest" });
    expect(scrollIntoView.mock.contexts.at(-1)).toBe(container.querySelector('[data-test-id="a"]'));
    scrollIntoView.mockClear();
    await act(async () => {
      container
        .querySelector('[data-test-id="b"]')
        ?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    });
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("gives a virtualized MenuList direct Option children and focused identity", async () => {
    type ComponentProps = SelectComponentPropsMap<SelectValue<string>>;
    const focusedValues: Array<string | undefined> = [];
    function VirtualizedMenuList(props: ComponentProps["MenuList"]) {
      const items = Array.isArray(props.children) ? props.children : [];
      const focusedIndex = items.findIndex(
        (item) =>
          isValidElement<{ data?: SelectValue<string> }>(item) &&
          item.props.data === props.focusedOption,
      );
      focusedValues.push(props.focusedOption?.value);
      return (
        <div ref={props.innerRef as React.Ref<HTMLDivElement>}>
          {items[focusedIndex < 0 ? 0 : focusedIndex]}
        </div>
      );
    }
    const { container } = await render(
      <Select components={{ MenuList: VirtualizedMenuList }} defaultMenuIsOpen options={options} />,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;
    await key(input, "ArrowDown");
    await key(input, "ArrowDown");
    expect(focusedValues).toContain("b");
    expect(container.querySelector('[data-test-id="b"]')).not.toBeNull();
    expect(container.querySelectorAll("[role=menuitemradio]")).toHaveLength(1);
  });

  it("forwards showDetailsInOverlay to the Scraps menu item", async () => {
    const { container } = await render(
      <Select
        defaultMenuIsOpen
        options={[
          {
            details: "Project details",
            label: "Project",
            showDetailsInOverlay: true,
            value: "project",
          },
        ]}
      />,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;
    expect(container.querySelector('[data-test-id="project"]')?.textContent).toBe("Project");
    await focus(input);
    await key(input, "ArrowDown");
    expect(document.body.querySelector("[data-overlay]")?.textContent).toContain("Project details");
    expect(container.querySelector('[data-test-id="project"]')?.textContent).toBe("Project");
  });

  it("keeps scroll-boundary callbacks on a replacement MenuList", async () => {
    type MenuListProps = SelectComponentPropsMap<SelectValue<string>>["MenuList"];
    const onMenuScrollToBottom = vi.fn();
    const onMenuScrollToTop = vi.fn();
    function MenuList(props: MenuListProps) {
      return (
        <div data-scroll-list ref={props.innerRef as React.Ref<HTMLDivElement>}>
          {props.children}
        </div>
      );
    }
    const { container } = await render(
      <Select
        components={{ MenuList }}
        defaultMenuIsOpen
        onMenuScrollToBottom={onMenuScrollToBottom}
        onMenuScrollToTop={onMenuScrollToTop}
        options={options}
      />,
    );
    const menuList = container.querySelector<HTMLElement>("[data-scroll-list]")!;
    Object.defineProperties(menuList, {
      clientHeight: { configurable: true, value: 100 },
      scrollHeight: { configurable: true, value: 300 },
      scrollTop: { configurable: true, value: 0, writable: true },
    });
    await act(async () => menuList.dispatchEvent(new Event("scroll")));
    expect(onMenuScrollToTop).toHaveBeenCalledOnce();
    menuList.scrollTop = 200;
    await act(async () => menuList.dispatchEvent(new Event("scroll")));
    expect(onMenuScrollToBottom).toHaveBeenCalledOnce();
  });

  it("captures wheel and touch overscroll at menu boundaries", async () => {
    type MenuListProps = SelectComponentPropsMap<SelectValue<string>>["MenuList"];
    const onMenuScrollToBottom = vi.fn();
    const onMenuScrollToTop = vi.fn();
    function MenuList(props: MenuListProps) {
      return (
        <div data-capture-list ref={props.innerRef as React.Ref<HTMLDivElement>}>
          {props.children}
        </div>
      );
    }
    const { container } = await render(
      <Select
        captureMenuScroll
        components={{ MenuList }}
        defaultMenuIsOpen
        onMenuScrollToBottom={onMenuScrollToBottom}
        onMenuScrollToTop={onMenuScrollToTop}
        options={options}
      />,
    );
    const menuList = container.querySelector<HTMLElement>("[data-capture-list]")!;
    Object.defineProperties(menuList, {
      clientHeight: { configurable: true, value: 100 },
      scrollHeight: { configurable: true, value: 300 },
      scrollTop: { configurable: true, value: 0, writable: true },
    });
    const topWheel = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaY: -20,
    });
    await act(async () => menuList.dispatchEvent(topWheel));
    expect(topWheel.defaultPrevented).toBe(true);
    expect(onMenuScrollToTop).toHaveBeenCalledOnce();

    menuList.scrollTop = 200;
    const bottomWheel = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaY: 20,
    });
    await act(async () => menuList.dispatchEvent(bottomWheel));
    expect(bottomWheel.defaultPrevented).toBe(true);
    expect(onMenuScrollToBottom).toHaveBeenCalledOnce();

    menuList.scrollTop = 0;
    const touchStart = new Event("touchstart", { bubbles: true, cancelable: true });
    Object.defineProperty(touchStart, "changedTouches", { value: [{ clientY: 100 }] });
    Object.defineProperty(touchStart, "touches", { value: [{ clientX: 0, clientY: 100 }] });
    const touchMove = new Event("touchmove", { bubbles: true, cancelable: true });
    Object.defineProperty(touchMove, "changedTouches", { value: [{ clientY: 120 }] });
    Object.defineProperty(touchMove, "touches", { value: [{ clientX: 0, clientY: 120 }] });
    await act(async () => {
      menuList.dispatchEvent(touchStart);
      menuList.dispatchEvent(touchMove);
    });
    expect(touchMove.defaultPrevented).toBe(true);
    expect(onMenuScrollToTop).toHaveBeenCalledTimes(2);
  });

  it("moves scroll-boundary listeners when a replacement MenuList swaps nodes", async () => {
    type MenuListProps = SelectComponentPropsMap<SelectValue<string>>["MenuList"];
    const callbacks = new Map<string, (next?: SelectValue<string>[]) => void>();
    const onMenuScrollToTop = vi.fn();
    function MenuList(props: MenuListProps) {
      if (Array.isArray(props.children)) {
        return (
          <div data-options-node ref={props.innerRef as React.Ref<HTMLDivElement>}>
            {props.children}
          </div>
        );
      }
      return (
        <section data-message-node ref={props.innerRef as React.Ref<HTMLElement>}>
          {props.children}
        </section>
      );
    }
    const { container } = await render(
      <Select
        async
        components={{ MenuList }}
        defaultMenuIsOpen
        loadOptions={(query, callback) => {
          callbacks.set(query, callback);
        }}
        onMenuScrollToTop={onMenuScrollToTop}
      />,
    );
    expect(container.querySelector("[data-message-node]")).not.toBeNull();
    const input = container.querySelector<HTMLInputElement>("input")!;
    await type(input, "a");
    await act(async () => callbacks.get("a")?.([options[0]]));
    const optionsNode = container.querySelector<HTMLElement>("[data-options-node]")!;
    await act(async () => optionsNode.dispatchEvent(new Event("scroll")));
    expect(onMenuScrollToTop).toHaveBeenCalledOnce();
  });

  it("clears through native click and does not route touch through the control", async () => {
    const onChange = vi.fn();
    const { container } = await render(
      <Select clearable defaultValue="a" onChange={onChange} options={options} />,
    );
    const clearButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Clear choices"]',
    )!;
    await act(async () => {
      clearButton.focus();
      const enter = new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key: "Enter",
      });
      clearButton.dispatchEvent(enter);
      expect(enter.defaultPrevented).toBe(false);
      clearButton.dispatchEvent(new Event("touchend", { bubbles: true }));
      clearButton.click();
    });
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls.at(-1)?.[0]).toBeNull();
    expect(container.querySelector('[data-test-id="a"]')).toBeNull();
  });

  it("does not close or prevent caret interaction when the input is pressed", async () => {
    const onMenuOpen = vi.fn();
    const { container } = await render(
      <Select defaultMenuIsOpen onMenuOpen={onMenuOpen} options={options} />,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;
    const mouseDown = new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
    });
    await act(async () => input.dispatchEvent(mouseDown));
    expect(mouseDown.defaultPrevented).toBe(false);
    expect(container.querySelector('[data-test-id="a"]')).not.toBeNull();

    const openingChange = vi.fn();
    const opening = await render(
      <Select
        onChange={openingChange}
        onMenuOpen={onMenuOpen}
        openMenuOnClick
        openMenuOnFocus
        options={options}
      />,
    );
    const control =
      opening.container.querySelector<HTMLElement>("[data-slot=select-control]") ??
      opening.container.querySelector<HTMLElement>("input")?.parentElement?.parentElement;
    await act(async () =>
      control?.dispatchEvent(
        new MouseEvent("mousedown", {
          bubbles: true,
          button: 0,
          cancelable: true,
        }),
      ),
    );
    expect(onMenuOpen).toHaveBeenCalledOnce();
    await key(opening.container.querySelector<HTMLInputElement>("input")!, "Enter");
    expect(openingChange.mock.calls.at(-1)?.[0]).toEqual(options[0]);

    const focusChange = vi.fn();
    const focusOpening = await render(
      <Select onChange={focusChange} openMenuOnFocus options={options} />,
    );
    const focusInput = focusOpening.container.querySelector<HTMLInputElement>("input")!;
    await focus(focusInput);
    await key(focusInput, "Enter");
    expect(focusChange.mock.calls.at(-1)?.[0]).toEqual(options[0]);
  });

  it("omits the clear indicator while disabled or loading", async () => {
    const ClearIndicator = () => <button data-custom-clear type="button" />;
    const disabledSelect = await render(
      <Select clearable components={{ ClearIndicator }} disabled options={options} value="a" />,
    );
    const loadingSelect = await render(
      <Select clearable components={{ ClearIndicator }} isLoading options={options} value="a" />,
    );
    expect(disabledSelect.container.querySelector("[data-custom-clear]")).toBeNull();
    expect(loadingSelect.container.querySelector("[data-custom-clear]")).toBeNull();
  });

  it("does not route remove-button keyboard or touch events through the control", async () => {
    const onChange = vi.fn();
    const { container } = await render(
      <Select defaultValue={["a"]} multiple onChange={onChange} options={options} />,
    );
    const removeButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Remove item"]',
    )!;
    const enter = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "Enter",
    });
    await act(async () => removeButton.dispatchEvent(enter));
    expect(enter.defaultPrevented).toBe(false);
    expect(container.querySelector('[data-test-id="a"]')).toBeNull();
    await act(async () => removeButton.dispatchEvent(new Event("touchend", { bubbles: true })));
    expect(onChange.mock.calls.at(-1)?.[0]).toEqual([]);
  });

  it("uses default search and multi clearability while preserving explicit false", async () => {
    const first = await render(<Select defaultMenuIsOpen options={options} />);
    const searchableInput = first.container.querySelector<HTMLInputElement>("input")!;
    expect(searchableInput.readOnly).toBe(false);
    await type(searchableInput, "beta");
    expect(first.container.textContent).toContain("Beta");
    expect(first.container.textContent).not.toContain("Álpha");

    const onChange = vi.fn();
    const multi = await render(
      <Select defaultValue={["a"]} multiple onChange={onChange} options={options} />,
    );
    const clearButton = multi.container.querySelector<HTMLButtonElement>(
      'button[aria-label="Clear choices"]',
    );
    expect(clearButton).not.toBeNull();
    await act(async () => clearButton?.click());
    expect(onChange.mock.calls.at(-1)?.[0]).toEqual([]);

    const explicit = await render(
      <Select isClearable={false} isSearchable={false} multiple options={options} value={["a"]} />,
    );
    expect(explicit.container.querySelector<HTMLInputElement>("input")?.readOnly).toBe(true);
    expect(explicit.container.querySelector('[aria-label="Clear choices"]')).toBeNull();
  });

  it("removes a multi value through the default removeProps pointer boundary", async () => {
    const onChange = vi.fn();
    const { container } = await render(
      <Select defaultValue={["a", "b"]} multiple onChange={onChange} options={options} />,
    );
    const removeButtons = container.querySelectorAll<HTMLButtonElement>(
      'button[aria-label="Remove item"]',
    );
    expect(removeButtons).toHaveLength(2);
    const input = container.querySelector<HTMLInputElement>("input")!;
    await focus(input);
    await key(input, "ArrowLeft");
    expect(container.querySelector("[aria-live]")?.textContent).toContain(
      "value Beta focused, 2 of 2",
    );
    await act(async () => removeButtons[0]?.click());
    expect(onChange.mock.calls.at(-1)?.[0]).toEqual([options[1]]);
    expect(container.querySelector("[aria-live]")?.textContent).toContain("Álpha, deselected");
  });

  it("uses Tailwind portal layering unless a menuPortal callback supplies flat declarations", async () => {
    const dropdownPortal = document.createElement("div");
    const modalPortal = document.createElement("div");
    document.body.append(dropdownPortal, modalPortal);
    await render(
      <Select
        defaultMenuIsOpen
        menuPortalTarget={dropdownPortal}
        options={options}
        styles={{ menuPortal: () => ({ zIndex: 1001 }) }}
      />,
    );
    await render(
      <Select
        defaultMenuIsOpen
        isInsideModal
        menuPortalTarget={modalPortal}
        options={options}
        styles={{ menuPortal: () => ({ zIndex: 10001 }) }}
      />,
    );
    expect((dropdownPortal.firstElementChild as HTMLElement).style.zIndex).toBe("1001");
    expect(getComputedStyle(dropdownPortal.firstElementChild as HTMLElement).zIndex).toBe("1001");
    expect((modalPortal.firstElementChild as HTMLElement).style.zIndex).toBe("10001");
    expect(getComputedStyle(modalPortal.firstElementChild as HTMLElement).zIndex).toBe("10001");
  });

  it("lets a replacement MenuPortal own fixed portal positioning", async () => {
    const portalProps: unknown[] = [];
    const { container } = await render(
      <Select
        components={{
          MenuPortal: (props) => {
            portalProps.push(props);
            return props.children;
          },
        }}
        defaultMenuIsOpen
        menuPosition="fixed"
        options={options}
      />,
    );
    const menu = [...container.querySelectorAll<HTMLElement>("[style]")].find(
      (element) => element.style.position === "absolute" && element.style.top === "100%",
    );
    expect(menu).toBeDefined();
    expect(
      [...container.querySelectorAll<HTMLElement>("[style]")].some(
        (element) => element.style.position === "fixed",
      ),
    ).toBe(false);
    expect(portalProps.at(-1)).toMatchObject({
      appendTo: undefined,
      controlElement: expect.any(HTMLElement),
      menuPlacement: "auto",
      menuPosition: "fixed",
    });
  });

  it("supports the inherited creatable validation, data, position, and loading props", async () => {
    const defaultChange = vi.fn();
    const defaultPosition = await render(
      <Select
        creatable
        defaultInputValue="Delta"
        defaultMenuIsOpen
        filterOption={null}
        onChange={defaultChange}
        options={options}
      />,
    );
    const defaultRows = [...defaultPosition.container.querySelectorAll("[role=menuitemradio]")];
    expect(defaultRows.at(-1)?.textContent).toContain('Create "Delta"');
    await act(async () =>
      (
        defaultPosition.container.querySelector('[data-test-id="create-option"]') as HTMLElement
      ).click(),
    );
    expect(defaultChange.mock.calls.at(-1)?.[0]).toEqual(
      expect.objectContaining({ label: "Delta", value: "Delta" }),
    );
    expect(defaultChange.mock.calls.at(-1)?.[1]).toEqual(
      expect.objectContaining({
        action: "create-option",
        option: expect.objectContaining({ label: "Delta", value: "Delta" }),
      }),
    );

    const getNewOptionData = vi.fn((value: string, label: ReactNode) => ({
      label,
      source: "custom",
      value: `new:${value}`,
    }));
    const onChange = vi.fn();
    const custom = await render(
      <Select
        creatable
        createOptionPosition="first"
        defaultMenuIsOpen
        filterOption={null}
        formatCreateLabel={(value) => `Add ${value}`}
        getNewOptionData={getNewOptionData}
        onChange={onChange}
        options={options}
      />,
    );
    const input = custom.container.querySelector<HTMLInputElement>("input")!;
    await type(input, "Delta");
    const customRows = [...custom.container.querySelectorAll("[role=menuitemradio]")];
    expect(customRows.map((node) => node.textContent?.trim())[0]).toContain("Add Delta");
    expect(customRows.map((node) => node.id)).toEqual([
      expect.stringMatching(/-option-0$/),
      expect.stringMatching(/-option-1$/),
      expect.stringMatching(/-option-2$/),
      expect.stringMatching(/-option-3$/),
    ]);
    expect(new Set(customRows.map((node) => node.id)).size).toBe(customRows.length);
    await act(async () =>
      (custom.container.querySelector('[data-test-id="create-option"]') as HTMLElement).click(),
    );
    expect(getNewOptionData.mock.calls).toEqual([
      ["Delta", "Add Delta"],
      ["Delta", "Delta"],
    ]);
    expect(onChange.mock.calls.at(-1)?.[0]).toEqual(
      expect.objectContaining({ label: "Delta", source: "custom", value: "new:Delta" }),
    );

    const rejected = await render(
      <Select
        creatable
        defaultInputValue="No"
        defaultMenuIsOpen
        isValidNewOption={() => false}
        options={[]}
      />,
    );
    expect(rejected.container.querySelector('[data-test-id="create-option"]')).toBeNull();
    const blocked = await render(
      <Select creatable defaultInputValue="Wait" defaultMenuIsOpen isLoading options={[]} />,
    );
    expect(blocked.container.querySelector('[data-test-id="create-option"]')).toBeNull();
    const allowed = await render(
      <Select
        allowCreateWhileLoading
        creatable
        defaultInputValue="Wait"
        defaultMenuIsOpen
        isLoading
        options={[]}
      />,
    );
    expect(allowed.container.querySelector('[data-test-id="create-option"]')).not.toBeNull();
  });

  it("preserves a ReactNode create label and announces its single result", async () => {
    const getNewOptionData = vi.fn((value: string, label: ReactNode) => ({ label, value }));
    const onChange = vi.fn();
    const { container } = await render(
      <Select
        blurInputOnSelect={false}
        closeMenuOnSelect={false}
        creatable
        defaultMenuIsOpen
        formatCreateLabel={(value) => (
          <span data-create-label>
            Add <strong>{value}</strong>
          </span>
        )}
        getNewOptionData={getNewOptionData}
        onChange={onChange}
        options={[]}
      />,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;
    await focus(input);
    await type(input, "Delta");
    expect(
      container.querySelector('[data-test-id="create-option"] [data-create-label]')?.textContent,
    ).toBe("Add Delta");
    expect(container.querySelector("#aria-context")?.textContent).toContain(
      "1 result available for search term Delta",
    );
    await act(async () => {
      container
        .querySelector('[data-test-id="create-option"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(getNewOptionData).toHaveBeenCalledTimes(2);
    expect(isValidElement(getNewOptionData.mock.calls[0]?.[1])).toBe(true);
    expect(getNewOptionData.mock.calls[1]?.[1]).toBe("Delta");
    expect(onChange.mock.calls.at(-1)?.[0].label).toBe("Delta");
  });

  it("exposes working common slot actions and v4 live-region guidance", async () => {
    const onClear = vi.fn();
    const onChange = vi.fn();
    const controlStyle = vi.fn((provided, state) => ({
      ...provided,
      color: state.isFocused ? "focused" : "idle",
    }));
    const styleValues: unknown[] = [];
    const { container } = await render(
      <Select
        aria-label="Project"
        blurInputOnSelect={false}
        classNamePrefix="sentry"
        clearable
        closeMenuOnSelect={false}
        components={{
          Option: (slotProps) => (
            <button
              data-custom-option={slotProps.cx({ option: true }, "extra")}
              onClick={() =>
                slotProps.data.disabled
                  ? slotProps.selectOption(slotProps.data)
                  : slotProps.setValue(slotProps.data, "select-option", slotProps.data)
              }
              type="button"
            >
              {String(
                (styleValues.push(slotProps.getStyles("control", slotProps)), slotProps.label),
              )}
            </button>
          ),
        }}
        defaultMenuIsOpen
        onChange={onChange}
        onClear={onClear}
        options={options}
        styles={{ control: controlStyle }}
      />,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;
    expect(
      container.querySelector("[data-custom-option]")?.getAttribute("data-custom-option"),
    ).toBe("extra sentry__option");
    await focus(input);
    expect(container.querySelector("[aria-live]")?.textContent).toContain("Use Up and Down");
    expect(styleValues[0]).toMatchObject({
      color: "idle",
      display: "flex",
      minHeight: "36px",
    });
    expect(controlStyle).toHaveBeenCalledWith(
      expect.objectContaining({ display: "flex", minHeight: "36px" }),
      expect.objectContaining({ isFocused: false, menuIsOpen: true }),
    );
    await act(async () =>
      (container.querySelector("[data-custom-option]") as HTMLButtonElement).click(),
    );
    expect(onChange.mock.calls.at(-1)?.[0]).toEqual(options[0]);
    expect(container.querySelector("[aria-live]")?.textContent).toContain("selected");
    const disabledButton = [
      ...container.querySelectorAll<HTMLButtonElement>("[data-custom-option]"),
    ].find((button) => button.textContent === "Gamma");
    await act(async () => disabledButton?.click());
    expect(container.querySelector("[aria-live]")?.textContent).toContain("Gamma is disabled");
    await key(input, "ArrowUp");
    expect(container.querySelector("[aria-live]")?.textContent).toContain("Gamma focused disabled");
    await key(input, "ArrowUp");
    expect(container.querySelector("[aria-live]")?.textContent).toContain("Beta focused");
    await type(input, "beta");
    expect(container.querySelector("[aria-live]")?.textContent).toContain("for search term beta");
  });

  it("runs v4 input and menu transitions before consumer onChange", async () => {
    const events: string[] = [];
    const { container } = await render(
      <Select
        defaultMenuIsOpen
        onBlur={() => events.push("blur")}
        onChange={(_value, meta) => events.push(`change:${meta.action}`)}
        onInputChange={(_value, meta) => {
          events.push(`input:${meta.action}`);
        }}
        onMenuClose={() => events.push("menu-close")}
        options={options}
      />,
    );
    await focus(container.querySelector<HTMLInputElement>("input")!);
    await act(async () => {
      container
        .querySelector('[data-test-id="a"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(events.slice(0, 4)).toEqual([
      "input:set-value",
      "input:menu-close",
      "menu-close",
      "change:select-option",
    ]);
    expect(events.indexOf("change:select-option")).toBeLessThan(events.indexOf("blur"));
  });

  it("uses the exact v4 single-select ActionMeta shape", async () => {
    const onChange = vi.fn();
    const { container } = await render(
      <Select defaultMenuIsOpen name="project" onChange={onChange} options={options} />,
    );
    await act(async () => {
      container
        .querySelector('[data-test-id="a"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(onChange.mock.calls.at(-1)?.[1]).toEqual({
      action: "select-option",
      name: "project",
      option: undefined,
    });
  });

  it("uses custom v4 live-region guidance, focus, filter, and change messages", async () => {
    const messages = {
      guidance: vi.fn(({ context }: { context: string }) => `guidance:${context}`),
      onChange: vi.fn(
        ({ action, label }: { action: string; label?: string }) => `change:${action}:${label}`,
      ),
      onFilter: vi.fn(({ inputValue }: { inputValue: string }) => `filter:${inputValue}`),
      onFocus: vi.fn(
        ({ context, label }: { context: string; label?: string }) => `focus:${context}:${label}`,
      ),
    };
    const { container } = await render(
      <Select
        aria-label="Project"
        ariaLiveMessages={messages}
        defaultMenuIsOpen
        name="project"
        options={options}
      />,
    );
    const input = container.querySelector<HTMLInputElement>("input:not([type=hidden])")!;
    await focus(input);
    await key(input, "ArrowDown");
    expect(container.querySelector("[aria-live]")?.textContent).toContain("focus:menu:Álpha");
    expect(container.querySelector("[aria-live]")?.textContent).toContain("guidance:menu");
    await act(async () => {
      container
        .querySelector('[data-test-id="b"]')
        ?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    });
    expect(messages.onFocus).toHaveBeenLastCalledWith(
      expect.objectContaining({
        context: "menu",
        focused: options[1],
        label: "Beta",
      }),
    );
    const focusCalls = messages.onFocus.mock.calls.length;
    await act(async () => {
      container
        .querySelector('[data-test-id="g"]')
        ?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    });
    expect(messages.onFocus).toHaveBeenCalledTimes(focusCalls);
    await type(input, "beta");
    expect(container.querySelector("[aria-live]")?.textContent).toContain("filter:beta");
    await key(input, "ArrowDown");
    await key(input, "Enter");
    expect(messages.onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "select-option",
        label: "Beta",
        name: "project",
        selectValue: [options[1]],
        value: options[1],
      }),
    );

    const multiple = await render(
      <Select
        ariaLiveMessages={messages}
        clearable
        defaultMenuIsOpen
        defaultValue={["a", "b"]}
        multiple
        name="project"
        options={options}
      />,
    );
    await act(async () => {
      multiple.container
        .querySelector('[data-test-id="a"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(messages.onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        action: "deselect-option",
        option: options[0],
      }),
    );
    expect(messages.onChange.mock.calls.at(-1)?.[0]).not.toHaveProperty("removedValue");
    await act(async () => {
      multiple.container
        .querySelector<HTMLButtonElement>('button[aria-label="Clear choices"]')
        ?.click();
    });
    expect(messages.onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        action: "clear",
        removedValues: [options[1]],
      }),
    );
  });

  it("matches v4 closed Enter, Tab, and outside-pointer blur ordering", async () => {
    const closed = await render(<Select options={options} />);
    const closedInput = closed.container.querySelector<HTMLInputElement>("input")!;
    await focus(closedInput);
    const enter = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "Enter",
    });
    await act(async () => closedInput.dispatchEvent(enter));
    expect(enter.defaultPrevented).toBe(false);
    expect(closed.container.querySelector('[data-test-id="a"]')).toBeNull();

    const events: string[] = [];
    const tabbed = await render(
      <Select
        defaultMenuIsOpen
        onBlur={() => events.push("blur")}
        onInputChange={(_value, meta) => {
          events.push(`input:${meta.action}`);
        }}
        onMenuClose={() => events.push("menu-close")}
        options={options}
        tabSelectsValue={false}
      />,
    );
    const tabInput = tabbed.container.querySelector<HTMLInputElement>("input")!;
    await focus(tabInput);
    const tab = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "Tab",
    });
    await act(async () => tabInput.dispatchEvent(tab));
    expect(tab.defaultPrevented).toBe(false);
    expect(tabbed.container.querySelector('[data-test-id="a"]')).not.toBeNull();
    expect(events).toEqual([]);

    await act(async () => {
      document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });
    expect(events).toEqual(["blur", "input:input-blur", "input:menu-close", "menu-close"]);
    expect(tabbed.container.querySelector('[data-test-id="a"]')).toBeNull();
  });

  it("keeps the latest managed state after controlled props are removed", async () => {
    const value = await render(<Select defaultMenuIsOpen options={options} value="a" />);
    await act(async () => {
      value.container
        .querySelector('[data-test-id="b"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(value.container.textContent).toContain("Álpha");
    await act(async () => value.root.render(<Select options={options} />));
    expect(value.container.textContent).toContain("Beta");

    const controlledInput = await render(
      <Select inputValue="fixed" options={options} searchable />,
    );
    const input = controlledInput.container.querySelector<HTMLInputElement>("input")!;
    await type(input, "next");
    expect(input.value).toBe("fixed");
    await act(async () => controlledInput.root.render(<Select options={options} searchable />));
    expect(controlledInput.container.querySelector<HTMLInputElement>("input")?.value).toBe("next");

    const controlledMenu = await render(<Select menuIsOpen={false} options={options} />);
    const menuInput = controlledMenu.container.querySelector<HTMLInputElement>("input")!;
    await key(menuInput, "ArrowDown");
    expect(controlledMenu.container.querySelector('[data-test-id="a"]')).toBeNull();
    await act(async () => controlledMenu.root.render(<Select options={options} />));
    expect(controlledMenu.container.querySelector('[data-test-id="a"]')).not.toBeNull();
  });

  it("closes for body scroll but not menu-list scroll when closeMenuOnScroll is true", async () => {
    type MenuListProps = SelectComponentPropsMap<SelectValue<string>>["MenuList"];
    function MenuList(props: MenuListProps) {
      return (
        <div data-close-scroll-list ref={props.innerRef as React.Ref<HTMLDivElement>}>
          {props.children}
        </div>
      );
    }
    const { container } = await render(
      <Select closeMenuOnScroll components={{ MenuList }} defaultMenuIsOpen options={options} />,
    );
    const menuList = container.querySelector<HTMLElement>("[data-close-scroll-list]")!;
    await act(async () => menuList.dispatchEvent(new Event("scroll")));
    expect(container.querySelector('[data-test-id="a"]')).not.toBeNull();
    await act(async () => document.body.dispatchEvent(new Event("scroll")));
    expect(container.querySelector('[data-test-id="a"]')).toBeNull();
  });

  it("shares the body scroll lock, preserves layout, and contains touch scroll", async () => {
    vi.spyOn(window, "innerWidth", "get").mockReturnValue(1000);
    vi.spyOn(document.body, "clientWidth", "get").mockReturnValue(980);
    vi.spyOn(window, "scrollX", "get").mockReturnValue(17);
    vi.spyOn(window, "scrollY", "get").mockReturnValue(91);
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    document.body.style.cssText =
      "height:80%;overflow:auto;padding-right:6px;position:relative;top:3px";

    const first = await render(<Select menuIsOpen menuShouldBlockScroll options={options} />);
    const second = await render(<Select menuIsOpen menuShouldBlockScroll options={options} />);
    expect(document.body.style.position).toBe("fixed");
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.body.style.height).toBe("100%");
    expect(document.body.style.paddingRight).toBe("26px");

    const outsideTouch = new Event("touchmove", { bubbles: true, cancelable: true });
    document.body.dispatchEvent(outsideTouch);
    expect(outsideTouch.defaultPrevented).toBe(true);
    const insideTouch = new Event("touchmove", { bubbles: true, cancelable: true });
    Object.defineProperty(insideTouch, "touches", {
      value: [{ clientX: 0, clientY: 1 }],
    });
    second.container.querySelector('[data-test-id="a"]')?.dispatchEvent(insideTouch);
    expect(insideTouch.defaultPrevented).toBe(false);

    await act(async () =>
      first.root.render(<Select menuIsOpen={false} menuShouldBlockScroll options={options} />),
    );
    expect(document.body.style.position).toBe("fixed");
    expect(document.body.style.overflow).toBe("hidden");
    await act(async () =>
      second.root.render(<Select menuIsOpen={false} menuShouldBlockScroll options={options} />),
    );
    expect(document.body.style.position).toBe("relative");
    expect(document.body.style.overflow).toBe("auto");
    expect(document.body.style.height).toBe("80%");
    expect(document.body.style.paddingRight).toBe("6px");
    expect(document.body.style.top).toBe("3px");
    expect(scrollTo).toHaveBeenCalledWith(17, 91);
  });

  it("passes live grouped, menu, portal, and disabled-option replacement props", async () => {
    type ComponentProps = SelectComponentPropsMap<SelectValue<string>>;
    type LiveGroupProps = ComponentProps["Group"] & {
      data: { label: string; options: SelectValue<string>[] };
      headingProps: {
        data: { label: string; options: SelectValue<string>[] };
        id: string;
      };
      options: Array<{
        data: SelectValue<string>;
        index: number;
        type: "option";
      }>;
    };
    let groupProps: LiveGroupProps | undefined;
    let menuProps: ComponentProps["Menu"] | undefined;
    let portalProps: ComponentProps["MenuPortal"] | undefined;
    let disabledProps: ComponentProps["Option"] | undefined;
    function Group(props: ComponentProps["Group"]) {
      groupProps = props as LiveGroupProps;
      return <section>{props.children}</section>;
    }
    function Menu(props: ComponentProps["Menu"]) {
      menuProps = props;
      return <div {...props.innerProps}>{props.children}</div>;
    }
    function MenuPortal(props: ComponentProps["MenuPortal"]) {
      portalProps = props;
      return props.children;
    }
    function Option(props: ComponentProps["Option"]) {
      if (props.isDisabled) disabledProps = props;
      const { key: optionKey, ...innerProps } = props.innerProps;
      return (
        <div {...innerProps} key={optionKey}>
          {props.label}
        </div>
      );
    }
    await render(
      <Select
        components={{ Group, Menu, MenuPortal, Option }}
        defaultMenuIsOpen
        instanceId="slots"
        isLoading
        maxMenuHeight={240}
        menuPosition="fixed"
        options={[{ label: "Projects", options }]}
      />,
    );
    expect(groupProps).toMatchObject({
      data: { label: "Projects", options },
      headingProps: {
        data: { label: "Projects", options },
        id: "react-select-slots-group-0-heading",
      },
      options: [
        expect.objectContaining({ data: options[0], index: 0, type: "option" }),
        expect.objectContaining({ data: options[1], index: 1, type: "option" }),
        expect.objectContaining({ data: options[2], index: 2, type: "option" }),
      ],
    });
    expect(menuProps).toMatchObject({
      getPortalPlacement: expect.any(Function),
      isLoading: true,
      maxHeight: 240,
      maxMenuHeight: 240,
      menuPlacement: "auto",
      placement: "bottom",
    });
    expect(portalProps).toMatchObject({
      appendTo: undefined,
      controlElement: expect.any(HTMLElement),
      menuPlacement: "auto",
      menuPosition: "fixed",
    });
    expect(disabledProps?.innerProps).toMatchObject({
      onClick: undefined,
      onMouseMove: undefined,
      onMouseOver: undefined,
    });
    await act(async () =>
      menuProps?.getPortalPlacement({
        maxHeight: 120,
        placement: "top",
      }),
    );
    expect(menuProps?.placement).toBe("top");
  });

  it("loads one async default request for initial input and focuses its result", async () => {
    const onChange = vi.fn();
    const loadOptions = vi.fn(
      (_query: string, callback: (next?: SelectValue<string>[]) => void) => {
        callback([options[1]]);
      },
    );
    const { container } = await render(
      <Select
        async
        defaultInputValue="be"
        defaultMenuIsOpen
        defaultOptions
        loadOptions={loadOptions}
        onChange={onChange}
      />,
    );
    expect(loadOptions).toHaveBeenCalledOnce();
    expect(loadOptions).toHaveBeenCalledWith("be", expect.any(Function));
    await key(container.querySelector<HTMLInputElement>("input")!, "Enter");
    expect(onChange.mock.calls.at(-1)?.[0]).toEqual(options[1]);
  });

  it("scrolls the initially selected pointer-open option but not pointer hover", async () => {
    type Control = SelectComponentPropsMap<SelectValue<string>>["Control"];
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });
    function Control(props: Control) {
      return (
        <div
          {...props.innerProps}
          data-pointer-control
          ref={props.innerRef as React.Ref<HTMLDivElement>}
        >
          {props.children}
        </div>
      );
    }
    const { container } = await render(
      <Select components={{ Control }} defaultValue="b" options={options} />,
    );
    await act(async () => {
      container
        .querySelector("[data-pointer-control]")
        ?.dispatchEvent(
          new MouseEvent("mousedown", { bubbles: true, button: 0, cancelable: true }),
        );
    });
    expect(scrollIntoView.mock.contexts.at(-1)).toBe(container.querySelector('[data-test-id="b"]'));
    scrollIntoView.mockClear();
    await act(async () => {
      container
        .querySelector('[data-test-id="a"]')
        ?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    });
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("does not mutate frozen or reused getNewOptionData results", async () => {
    const shared = Object.freeze({ label: "Shared", value: "shared" });
    const getNewOptionData = vi.fn(() => shared);
    const onChange = vi.fn();
    const { container } = await render(
      <Select
        creatable
        defaultMenuIsOpen
        getNewOptionData={getNewOptionData}
        onChange={onChange}
        options={[]}
      />,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;
    await type(input, "Shared");
    await act(async () => {
      container
        .querySelector('[data-test-id="create-option"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(onChange.mock.calls.at(-1)?.[0]).toBe(shared);
    expect(shared).not.toHaveProperty("__isNew__");
    expect(getNewOptionData).toHaveBeenCalledTimes(2);
  });

  it("uses v4 instance prefixes, live ids, and empty clear/create announcements", async () => {
    const clearable = await render(
      <Select
        clearable
        defaultMenuIsOpen
        defaultValue="a"
        instanceId="project"
        options={options}
      />,
    );
    const clearInput = clearable.container.querySelector<HTMLInputElement>(
      "input:not([type=hidden])",
    )!;
    expect(clearInput.id).toBe("react-select-project-input");
    expect(clearable.container.querySelector('[data-test-id="a"]')?.id).toBe(
      "react-select-project-option-0",
    );
    await focus(clearInput);
    expect(clearable.container.querySelector("#aria-selection")).not.toBeNull();
    expect(clearable.container.querySelector("#aria-context")).not.toBeNull();
    await act(async () => {
      clearable.container
        .querySelector<HTMLButtonElement>('button[aria-label="Clear choices"]')
        ?.click();
    });
    expect(clearable.container.querySelector("#aria-selection")?.textContent).toBe("");

    const creatable = await render(
      <Select
        blurInputOnSelect={false}
        closeMenuOnSelect={false}
        creatable
        defaultMenuIsOpen
        options={[]}
      />,
    );
    const createInput = creatable.container.querySelector<HTMLInputElement>("input")!;
    await focus(createInput);
    await type(createInput, "Created");
    await act(async () => {
      creatable.container
        .querySelector('[data-test-id="create-option"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(creatable.container.querySelector("#aria-selection")?.textContent).toBe("");

    const automatic = await render(<Select instanceId={0} options={options} />);
    expect(automatic.container.querySelector<HTMLInputElement>("input")?.id).toMatch(
      /^react-select-[\w-]+-input$/,
    );
  });

  it("keeps automatic instance ids stable through server hydration", async () => {
    const element = <Select aria-label="Hydrated project" options={options} />;
    const container = document.createElement("div");
    container.innerHTML = renderToString(element);
    document.body.append(container);
    const serverId = container.querySelector<HTMLInputElement>("input")?.id;
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    await act(async () => roots.push(hydrateRoot(container, element)));
    expect(container.querySelector<HTMLInputElement>("input")?.id).toBe(serverId);
    expect(error.mock.calls.flat().join(" ")).not.toContain("hydrated");
  });

  it("keeps dark StylesConfig base values stable through hydration", async () => {
    document.documentElement.classList.add("dark");
    const element = (
      <Select
        aria-label="Hydrated dark project"
        classNamePrefix="hydrated"
        options={options}
        styles={{ control: (provided) => ({ ...provided }) }}
      />
    );
    const container = document.createElement("div");
    container.innerHTML = renderToString(element);
    document.body.append(container);
    const serverControlStyle = container
      .querySelector<HTMLElement>(".hydrated__control")
      ?.getAttribute("style");
    expect(serverControlStyle).toContain("background-color:#10103008");
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    await act(async () => roots.push(hydrateRoot(container, element)));
    expect(error.mock.calls.flat().join(" ")).not.toContain("hydrated");
    expect(
      container.querySelector<HTMLElement>(".hydrated__control")?.getAttribute("style"),
    ).toContain("background-color: rgba(0, 0, 32, 0.2)");
  });

  it("applies canonical classNamePrefix classes and RTL direction to default slots", async () => {
    const { container } = await render(
      <Select
        className="root-only"
        classNamePrefix="sentry"
        clearable
        defaultMenuIsOpen
        defaultValue={["a"]}
        isRtl
        multiple
        options={options}
      />,
    );
    const select = container.firstElementChild as HTMLElement;
    expect(select.dir).toBe("rtl");
    expect(container.querySelectorAll(".root-only")).toHaveLength(1);
    expect(select.classList).toContain("sentry--is-rtl");
    expect(select.classList).not.toContain("sentry__--is-rtl");
    for (const className of [
      "sentry__control",
      "sentry__value-container",
      "sentry__value-container--has-value",
      "sentry__value-container--is-multi",
      "sentry__multi-value",
      "sentry__multi-value__label",
      "sentry__multi-value__remove",
      "sentry__input",
      "sentry__indicators",
      "sentry__clear-indicator",
      "sentry__dropdown-indicator",
      "sentry__menu",
      "sentry__menu-list",
      "sentry__menu-list--is-multi",
      "sentry__option",
      "sentry__option--is-selected",
    ]) {
      expect(container.querySelector(`.${className}`), className).not.toBeNull();
    }
  });

  it("keeps the multi-value ValueContainer vertically scrollable", async () => {
    const { container } = await render(
      <Select defaultValue={["a", "b"]} multiple options={options} />,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;
    expect(input.parentElement?.parentElement?.className).toContain("max-h-[12em]");
    expect(input.parentElement?.parentElement?.className).toContain("overflow-y-auto");
  });

  it("portals the menu and closes for outside pointer interaction", async () => {
    const portal = document.createElement("div");
    document.body.append(portal);
    const { container } = await render(
      <Select defaultMenuIsOpen menuPortalTarget={portal} options={options} />,
    );
    expect(portal.querySelector("[role=menuitemradio]")).not.toBeNull();
    await act(async () =>
      document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true })),
    );
    expect(portal.querySelector("[role=menuitemradio]")).toBeNull();
    expect(container.querySelector("[aria-live]")?.textContent).toBe("");
  });
});
