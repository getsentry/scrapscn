import { act, createRef, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Switch } from "./switch";

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
afterEach(async () => {
  for (const mounted of roots.splice(0)) {
    await act(async () => mounted.root.unmount());
    mounted.container.remove();
  }
});

describe("Switch", () => {
  it("renders the canonical native checkbox contract and small geometry", async () => {
    const container = await render(<Switch aria-label="Notifications" defaultChecked />);
    const input = container.querySelector<HTMLInputElement>("input");
    const track = container.querySelector("[data-slot='switch-track']");
    const thumb = container.querySelector("[data-slot='switch-thumb']");
    expect(input?.type).toBe("checkbox");
    expect(input?.checked).toBe(true);
    expect(input?.getAttribute("role")).toBeNull();
    expect(container.querySelectorAll("svg[aria-hidden='true']")).toHaveLength(2);
    expect(input?.className).toContain("cursor-pointer");
    expect(track?.className).toContain("h-5 w-9");
    expect(thumb?.className).toContain("size-5");
    expect(track?.className).toContain("rounded-[5px]");
  });
  it("forwards native form, ref, className, style, and remaining HTML attributes", async () => {
    const ref = createRef<HTMLInputElement>();
    const container = await render(
      <form id="form-id">
        <Switch
          aria-label="Forwarded"
          className="consumer"
          data-proof="yes"
          form="form-id"
          id="switch"
          name="notifications"
          ref={ref}
          required
          style={{ color: "rgb(1, 2, 3)" }}
          value="enabled"
        />
      </form>,
    );
    const input = container.querySelector<HTMLInputElement>("input");
    expect(ref.current).toBe(input);
    expect(input?.classList.contains("consumer")).toBe(true);
    expect(input?.getAttribute("data-proof")).toBe("yes");
    expect(input?.style.color).toBe("rgb(1, 2, 3)");
    expect(input?.form?.id).toBe("form-id");
    expect(input?.id).toBe("switch");
    expect(input?.name).toBe("notifications");
    expect(input?.required).toBe(true);
    expect(input?.value).toBe("enabled");
    expect(input?.parentElement?.classList.contains("consumer")).toBe(false);
  });
  it("participates in native uncontrolled form reset", async () => {
    const container = await render(
      <form>
        <Switch aria-label="Resettable" defaultChecked />
      </form>,
    );
    const form = container.querySelector("form")!;
    const input = container.querySelector<HTMLInputElement>("input")!;
    await act(async () => input.click());
    expect(input.checked).toBe(false);
    await act(async () => form.reset());
    expect(input.checked).toBe(true);
  });
  it("supports controlled and uncontrolled native changes", async () => {
    const onChange = vi.fn();
    const controlled = await render(
      <Switch aria-label="Controlled" checked={false} onChange={onChange} />,
    );
    const input = controlled.querySelector<HTMLInputElement>("input")!;
    await act(async () => input.click());
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(input.checked).toBe(false);
    const uncontrolled = await render(<Switch aria-label="Uncontrolled" defaultChecked={false} />);
    const uncontrolledInput = uncontrolled.querySelector<HTMLInputElement>("input")!;
    await act(async () => uncontrolledInput.click());
    expect(uncontrolledInput.checked).toBe(true);
  });
  it("keeps disabled switches non-interactive and applies canonical disabled transforms", async () => {
    const onChange = vi.fn();
    const container = await render(
      <Switch aria-label="Disabled" checked disabled onChange={onChange} />,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;
    const track = container.querySelector("[data-slot='switch-track']");
    await act(async () => input.click());
    expect(input.checked).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
    expect(input.className).toContain("disabled:cursor-not-allowed");
    expect(track?.className).toContain(
      "peer-checked:peer-disabled:[&_[data-slot=switch-thumb]]:[transform:translateY(0px)_translateX(17px)]",
    );
  });
  it("uses canonical icons, colors, springs, focus, and state selectors", async () => {
    const container = await render(<Switch aria-label="Visual" size="lg" />);
    const track = container.querySelector("[data-slot='switch-track']");
    const close = container.querySelector("[data-icon='close'] path");
    const check = container.querySelector("[data-icon='checkmark'] path");
    expect(track?.className).toContain(
      "peer-focus-visible:[box-shadow:0_0_0_0_var(--scraps-switch-focus-mask),0_0_0_2px_var(--scraps-switch-focus)]",
    );
    expect(track?.className).toContain("duration-[350ms]");
    expect(track?.className).toContain(
      "peer-checked:[&_[data-slot=switch-thumb]]:[transform:translateY(-1px)_translateX(-1px)_translateX(17px)]",
    );
    expect(close?.getAttribute("d")).toContain("M12.72 2.22");
    expect(check?.getAttribute("d")).toContain("M13.72 3.22");
    expect(container.innerHTML).toContain("fill-[var(--scraps-switch-close)]");
    expect(container.innerHTML).toContain("fill-[var(--scraps-switch-check)]");
  });
});
