import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import { Image } from "./image";

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

describe("Image", () => {
  it("forwards ref", async () => {
    const ref = { current: null as HTMLImageElement | null };
    await render(<Image alt="Example Image" ref={ref} src="data:image/svg+xml,example" />);
    expect(ref.current?.tagName).toBe("IMG");
  });

  it("supports React 19 ref callback cleanup", async () => {
    const calls: string[] = [];
    const container = await render(
      <Image
        alt="Example Image"
        ref={(node) => {
          if (node) {
            calls.push("set");
            return () => {
              calls.push("cleanup");
            };
          }
        }}
        src="data:image/svg+xml,example"
      />,
    );
    const mounted = roots.pop();
    expect(mounted?.container).toBe(container);
    await act(async () => mounted?.root.unmount());
    expect(calls).toEqual(["set", "cleanup"]);
  });

  it("renders the image with the src attribute", async () => {
    const container = await render(<Image alt="Example Image" src="data:image/svg+xml,example" />);
    expect(container.querySelector("img")?.getAttribute("src")).toBe("data:image/svg+xml,example");
  });

  it("calls onError callback when image fails to load", async () => {
    const container = await render(
      <Image
        alt="Example Image"
        src="data:image/svg+xml,broken"
        onError={(event) => {
          event.currentTarget.src = "data:image/svg+xml,fallback";
        }}
      />,
    );
    const image = container.querySelector("img");
    image?.dispatchEvent(new Event("error", { bubbles: true }));
    expect(image?.getAttribute("src")).toBe("data:image/svg+xml,fallback");
  });

  it("renders with aspect-ratio prop", async () => {
    const container = await render(
      <Image alt="Example Image" aspectRatio="16 / 9" src="data:image/svg+xml,example" />,
    );
    expect(container.querySelector("img")?.style.aspectRatio).toBe("16 / 9");
  });

  it("supports responsive width and height props", async () => {
    const container = await render(
      <Image
        alt="Example Image"
        height={{ zero: "auto", md: "300px" }}
        src="data:image/svg+xml,example"
        width={{ zero: "100%", md: "400px" }}
      />,
    );
    expect(container.querySelector("img")).not.toBeNull();
    const markup = renderToStaticMarkup(
      <Image
        alt="Example Image"
        height={{ zero: "auto", md: "300px" }}
        src="data:image/svg+xml,example"
        width={{ zero: "100%", md: "400px" }}
      />,
    );
    expect(markup).toMatch(/--scraps-layout-base-width:100%/);
    expect(markup).toMatch(/--scraps-layout-container-md-width:400px/);
    expect(markup).toMatch(/--scraps-layout-container-md-height:300px/);
  });

  it("uses native defaults and lets consumer classes and styles win", async () => {
    const container = await render(
      <Image
        alt="Example Image"
        className="image-test"
        objectFit="cover"
        objectPosition="top"
        src="data:image/svg+xml,example"
        style={{ objectFit: "contain" }}
      />,
    );
    const image = container.querySelector("img");
    expect(image?.getAttribute("loading")).toBe("lazy");
    expect(image?.classList.contains("image-test")).toBe(true);
    expect(image?.style.objectFit).toBe("contain");
    expect(image?.style.objectPosition).toBe("top");
    expect(image?.hasAttribute("objectFit")).toBe(false);
    const markup = renderToStaticMarkup(
      <Image alt="Example Image" src="data:image/svg+xml,example" />,
    );
    expect(markup).toMatch(/--scraps-layout-base-width:100%/);
    expect(markup).toMatch(/--scraps-layout-base-height:auto/);
  });

  it("renders responsive radius and produces stable server markup", () => {
    const markup = renderToStaticMarkup(
      <Image
        alt="Example Image"
        radius={{ zero: "sm", md: "full" }}
        src="data:image/svg+xml,example"
      />,
    );
    expect(markup).toMatch(/--scraps-layout-base-border-radius:5px/);
    expect(markup).toMatch(/--scraps-layout-container-md-border-radius:999px/);
    expect(markup).toMatch(/loading="lazy"/);
  });
});
