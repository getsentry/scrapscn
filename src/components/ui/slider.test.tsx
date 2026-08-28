import { act, createRef, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Slider } from "./slider";

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

function ControlledSlider({
  initialValue = 50,
  onChangeEnd,
  ...props
}: Omit<React.ComponentProps<typeof Slider>, "onChange" | "value"> & {
  initialValue?: number;
}) {
  const [value, setValue] = useState(initialValue);
  return <Slider {...props} onChange={setValue} onChangeEnd={onChangeEnd} value={value} />;
}

async function pressKey(input: HTMLInputElement, key: string) {
  input.focus();
  await act(async () => {
    input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key }));
    input.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, cancelable: true, key }));
  });
}

async function setRangeValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  await act(async () => input.dispatchEvent(new Event("input", { bubbles: true })));
}

afterEach(async () => {
  for (const mounted of roots.splice(0)) {
    await act(async () => mounted.root.unmount());
    mounted.container.remove();
  }
});

describe("Slider", () => {
  it("renders the canonical native range contract and geometry", async () => {
    const container = await render(
      <Slider aria-label="Volume" defaultValue={50} max={90} min={10} step={5} />,
    );
    const slider = container.querySelector<HTMLInputElement>("input");
    const wrapper = container.firstElementChild;
    expect(slider?.type).toBe("range");
    expect(slider?.value).toBe("50");
    expect(slider?.getAttribute("min")).toBe("10");
    expect(slider?.getAttribute("max")).toBe("90");
    expect(slider?.getAttribute("step")).toBe("5");
    expect(slider?.getAttribute("aria-valuetext")).toBe("50");
    expect(wrapper?.className).toContain("h-16");
    expect(wrapper?.className).toContain("isolate");
    expect(container.innerHTML).toContain("h-[23px]");
    expect(container.innerHTML).toContain("w-[22px]");
  });

  it("copies aria-invalid to the wrapper and native input", async () => {
    const container = await render(
      <Slider aria-invalid aria-label="Invalid volume" defaultValue={50} />,
    );

    expect(container.firstElementChild?.getAttribute("aria-invalid")).toBe("true");
    expect(container.querySelector("input")?.getAttribute("aria-invalid")).toBe("true");
  });

  it("renders canonical track, thumb, label, focus ring, and transition classes", async () => {
    const container = await render(
      <Slider aria-label="Geometry" defaultValue={50} ticks={{ count: 3, labels: true }} />,
    );
    const active = container.querySelector("[data-slot='slider-active-track']");
    const inactive = container.querySelector("[data-slot='slider-inactive-track']");
    const thumb = container.querySelector("[data-slot='slider-thumb-chonk']");
    const thumbSurface = container.querySelector("[data-slot='slider-thumb-surface']");
    const output = container.querySelector("output");
    const trackLabels = container.querySelectorAll(
      "[data-position='start'], [data-intermediate], [data-position='end']",
    );

    expect(active?.className).toContain("rounded-s-[8px]");
    expect(active?.className).toContain("border-t-2");
    expect(active?.className).toContain("border-r-0");
    expect(active?.className).toContain("border-b");
    expect(active?.className).toContain("border-l");
    expect(inactive?.className).toContain("rounded-e-[8px]");
    expect(thumb?.className).toContain("duration-120");
    expect(thumb?.className).toContain("ease-[ease]");
    expect(thumbSurface?.className).toContain("rounded-[5px]");
    expect(output?.className).toContain("min-w-6");
    expect(output?.className).toContain("rounded-[4px]");
    expect(output?.className).toContain("px-0.5");
    expect(output?.className).toContain("text-[12px]/none");
    expect(output?.className).toContain("after:inset-[-4px]");
    expect(output?.className).toContain("after:bottom-[-32px]");
    expect(output?.className).toContain("after:rounded-[6px]");
    expect(output?.className).toContain("group-has-[input:focus-visible]/slider:after:");
    expect(output?.className).toContain(
      "group-[&:hover:not(:active,:focus-within)]/slider:text-[var(--scraps-slider-label-hover)]",
    );
    expect(output?.className).not.toContain(
      "group-hover/slider:text-[var(--scraps-slider-label-hover)]",
    );
    expect(output?.className).toContain("duration-160");
    expect(output?.className).toContain("ease-[cubic-bezier(0.8,-0.4,0.5,1)]");
    expect(trackLabels).toHaveLength(3);
    for (const label of trackLabels) {
      expect(label.className).toContain("text-[11px]");
    }
  });

  it("supports controlled, empty-string, ref, name, id, and HTML attributes", async () => {
    const ref = createRef<HTMLInputElement>();
    const onChange = vi.fn();
    const container = await render(
      <Slider
        aria-label="Volume"
        className="consumer"
        data-proof="yes"
        id="volume"
        name="volume"
        ref={ref}
        value=""
        onChange={onChange}
      />,
    );
    const slider = container.querySelector<HTMLInputElement>("input")!;
    expect(ref.current).toBe(slider);
    expect(slider.id).toBe("volume");
    expect(slider.name).toBe("volume");
    expect(container.firstElementChild?.getAttribute("data-proof")).toBe("yes");
    expect(container.firstElementChild?.classList.contains("consumer")).toBe(true);
    await setRangeValue(slider, "33");
    expect(onChange).toHaveBeenCalledWith(33);
  });

  it("submits the native input value with its form name", async () => {
    const container = await render(
      <form>
        <Slider aria-label="Volume" defaultValue={42} name="volume" />
      </form>,
    );
    const form = container.querySelector("form")!;

    expect(new FormData(form).get("volume")).toBe("42");
  });

  it("supports uncontrolled and controlled updates", async () => {
    const uncontrolled = await render(<Slider aria-label="Uncontrolled" defaultValue={20} />);
    const uncontrolledInput = uncontrolled.querySelector("input")!;
    await setRangeValue(uncontrolledInput, "30");
    expect(uncontrolledInput.value).toBe("30");

    const controlled = await render(<ControlledSlider aria-label="Controlled" initialValue={40} />);
    const controlledInput = controlled.querySelector("input")!;
    await setRangeValue(controlledInput, "55");
    expect(controlledInput.value).toBe("55");
  });

  it("clamps controlled values to the canonical range", async () => {
    const high = await render(
      <Slider aria-label="High" max={100} onChange={() => undefined} value={150} />,
    );
    const low = await render(
      <Slider aria-label="Low" min={10} onChange={() => undefined} value={-20} />,
    );

    expect(high.querySelector<HTMLInputElement>("input")?.value).toBe("100");
    expect(high.querySelector("input")?.getAttribute("aria-valuetext")).toBe("100");
    expect(low.querySelector<HTMLInputElement>("input")?.value).toBe("10");
  });

  it("uses automatic and custom aria-valuetext", async () => {
    const automatic = await render(<Slider aria-label="Automatic" defaultValue={30} />);
    const custom = await render(
      <Slider aria-label="Custom" aria-valuetext="Thirty percent" defaultValue={30} />,
    );

    expect(automatic.querySelector("input")?.getAttribute("aria-valuetext")).toBe("30");
    expect(custom.querySelector("input")?.getAttribute("aria-valuetext")).toBe("Thirty percent");
  });

  it.each([
    ["ArrowRight", "51"],
    ["ArrowLeft", "49"],
    ["Home", "0"],
    ["End", "100"],
  ])("handles %s keyboard changes", async (key, expected) => {
    const container = await render(<ControlledSlider aria-label="Keyboard" initialValue={50} />);
    const input = container.querySelector("input")!;

    await pressKey(input, key);
    expect(input.value).toBe(expected);
  });

  it("respects step and clamps repeated keyboard changes", async () => {
    const container = await render(
      <ControlledSlider aria-label="Stepped" initialValue={90} max={100} min={0} step={10} />,
    );
    const input = container.querySelector("input")!;

    await pressKey(input, "ArrowRight");
    await pressKey(input, "ArrowRight");
    expect(input.value).toBe("100");
    await pressKey(input, "Home");
    await pressKey(input, "ArrowLeft");
    expect(input.value).toBe("0");
  });

  it("preserves disabled behavior", async () => {
    const disabled = await render(<Slider aria-label="Disabled" defaultValue={20} disabled />);
    expect(disabled.querySelector<HTMLInputElement>("input")?.disabled).toBe(true);
    expect(disabled.firstElementChild?.getAttribute("aria-disabled")).toBe("true");
  });

  it("commits controlled keyboard changes", async () => {
    const onChangeEnd = vi.fn();
    const container = await render(
      <ControlledSlider aria-label="Commit" initialValue={20} onChangeEnd={onChangeEnd} />,
    );
    const input = container.querySelector("input")!;

    await pressKey(input, "ArrowRight");
    expect(onChangeEnd).toHaveBeenLastCalledWith(21);
  });

  it("formats values and renders the canonical tick union", async () => {
    const container = await render(
      <Slider
        aria-label="Cost"
        defaultValue={25}
        formatOptions={{
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }}
        ticks={{ values: [0, 25, 50, 100], labels: true }}
      />,
    );
    expect(container.textContent).toContain("$25");
    expect(container.textContent).toContain("$50");
    expect(container.querySelectorAll("[data-filled]").length).toBe(1);
    const hidden = await render(
      <Slider aria-label="Hidden" defaultValue={10} formatOptions="hidden" />,
    );
    expect(hidden.querySelector("output")).toBeNull();
  });

  it("renders count, values, interval, and hidden tick labels", async () => {
    const count = await render(
      <Slider aria-label="Count" defaultValue={25} ticks={{ count: 3, labels: true }} />,
    );
    const values = await render(
      <Slider
        aria-label="Values"
        defaultValue={50}
        ticks={{ labels: true, values: [0, 25, 75, 100] }}
      />,
    );
    const interval = await render(
      <Slider aria-label="Interval" defaultValue={25} ticks={{ interval: 50, labels: true }} />,
    );
    const hiddenLabels = await render(<Slider aria-label="Hidden ticks" ticks={{ count: 3 }} />);

    expect(count.textContent).toContain("50");
    expect(values.textContent).toContain("25");
    expect(values.textContent).toContain("75");
    expect(interval.textContent).toContain("50");
    expect(hiddenLabels.querySelector("[data-intermediate]")?.hasAttribute("data-show")).toBe(
      false,
    );
  });

  it("uses canonical edge and intermediate label delays", async () => {
    const noTicks = await render(<Slider aria-label="No ticks" defaultValue={20} />);
    const ticks = await render(
      <Slider aria-label="Delayed ticks" defaultValue={20} ticks={{ count: 5, labels: true }} />,
    );

    expect(
      noTicks.querySelector<HTMLElement>("[data-position='start']")?.style.transitionDelay,
    ).toBe("0ms");
    expect(noTicks.querySelector<HTMLElement>("[data-position='end']")?.style.transitionDelay).toBe(
      "60ms",
    );
    expect(ticks.querySelector<HTMLElement>("[data-intermediate]")?.style.transitionDelay).toBe(
      "53.33ms",
    );
    expect(ticks.querySelector<HTMLElement>("[data-position='end']")?.style.transitionDelay).toBe(
      "160ms",
    );
  });
});
