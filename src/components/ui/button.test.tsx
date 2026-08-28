import { act, createRef, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { Button, ButtonBar, LinkButton } from "./button";
import { LinkBehaviorContextProvider, type LinkProps } from "./link";
import { SizeProvider } from "./size-context";
import { TrackingContextProvider } from "./tracking-context";

function render(ui: ReactElement) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  act(() => root.render(ui));
  return {
    host,
    unmount() {
      act(() => root.unmount());
      host.remove();
    },
  };
}

function ConsumerLink({ to, ...props }: LinkProps) {
  return <a {...props} href={typeof to === "string" ? to : to.pathname} />;
}

const linkBehavior = {
  behavior: (props: LinkProps) => props,
  component: ConsumerLink,
};

describe("Button", () => {
  it("defaults to the secondary md button contract", () => {
    const view = render(<Button>Save</Button>);
    const button = view.host.querySelector("button");

    expect(button?.type).toBe("button");
    expect(button?.getAttribute("aria-label")).toBe("Save");
    expect(button?.dataset.variant).toBe("secondary");
    expect(button?.dataset.size).toBe("md");
    expect(button?.dataset.shape).toBe("rectangular");
    view.unmount();
  });

  it("supports icon-only accessibility and a React 19 ref", () => {
    const ref = createRef<HTMLButtonElement>();
    const view = render(
      <Button aria-label="Add issue" icon={<svg data-testid="icon" />} ref={ref} />,
    );

    expect(ref.current).toBe(view.host.querySelector("button"));
    expect(ref.current?.dataset.shape).toBe("square");
    expect(view.host.querySelector("[data-button-icon]")?.getAttribute("aria-hidden")).toBe("true");
    view.unmount();
    expect(ref.current).toBeNull();
  });

  it("treats zero as visible children", () => {
    const view = render(<Button>{0}</Button>);
    expect(view.host.querySelector("button")?.dataset.shape).toBe("rectangular");
    view.unmount();
  });

  it("inherits a size and lets an explicit size win", () => {
    const view = render(
      <SizeProvider size="xs">
        <div>
          <Button>Inherited</Button>
          <Button size="sm">Explicit</Button>
        </div>
      </SizeProvider>,
    );
    const buttons = view.host.querySelectorAll("button");
    expect(buttons[0]?.dataset.size).toBe("xs");
    expect(buttons[1]?.dataset.size).toBe("sm");
    view.unmount();
  });

  it("blocks busy clicks and renders the monochrome loader", () => {
    const onClick = vi.fn();
    const view = render(
      <Button busy onClick={onClick}>
        Save
      </Button>,
    );
    const button = view.host.querySelector("button")!;

    act(() => button.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(onClick).not.toHaveBeenCalled();
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.querySelector('[aria-hidden="true"][role="progressbar"]')).not.toBeNull();
    view.unmount();
  });

  it("tracks the accessible label and calls the original handler once", () => {
    const tracking = vi.fn();
    const onClick = vi.fn();
    const view = render(
      <TrackingContextProvider value={() => tracking}>
        <Button analyticsEventKey="save.clicked" onClick={onClick}>
          Save
        </Button>
      </TrackingContextProvider>,
    );

    act(() =>
      view.host.querySelector("button")?.dispatchEvent(new MouseEvent("click", { bubbles: true })),
    );
    expect(tracking).toHaveBeenCalledOnce();
    expect(tracking).toHaveBeenCalledWith(
      expect.objectContaining({
        "aria-label": "Save",
        analyticsEventKey: "save.clicked",
        clickType: "button",
      }),
    );
    expect(onClick).toHaveBeenCalledOnce();
    view.unmount();
  });
});

describe("LinkButton", () => {
  it("renders internal, external, and disabled destinations", () => {
    const view = render(
      <LinkBehaviorContextProvider value={linkBehavior}>
        <MemoryRouter>
          <div>
            <LinkButton to="/issues/">Issues</LinkButton>
            <LinkButton external href="https://docs.sentry.io">
              Docs
            </LinkButton>
            <LinkButton disabled href="/disabled/">
              Disabled
            </LinkButton>
          </div>
        </MemoryRouter>
      </LinkBehaviorContextProvider>,
    );
    const links = view.host.querySelectorAll("a");
    expect(links[0]?.getAttribute("href")).toBe("/issues/");
    expect(links[0]?.getAttribute("role")).toBe("button");
    expect(links[1]?.getAttribute("target")).toBe("_blank");
    expect(links[1]?.getAttribute("rel")).toBe("noreferrer noopener");
    expect(links[2]?.getAttribute("href")).toBeNull();
    expect(links[2]?.getAttribute("aria-disabled")).toBe("true");
    view.unmount();
  });

  it("gives a router destination precedence when both destination props exist", () => {
    const view = render(
      <LinkBehaviorContextProvider value={linkBehavior}>
        <MemoryRouter>
          <LinkButton href="/fallback/" to="/issues/">
            Issues
          </LinkButton>
        </MemoryRouter>
      </LinkBehaviorContextProvider>,
    );
    expect(view.host.querySelector("a")?.getAttribute("href")).toBe("/issues/");
    view.unmount();
  });
});

describe("ButtonBar", () => {
  it("sets orientation and provides a shared child size", () => {
    const view = render(
      <ButtonBar align="end" flow="row" orientation="vertical" role="toolbar" size="sm">
        <Button>One</Button>
        <Button>Two</Button>
      </ButtonBar>,
    );
    const group = view.host.firstElementChild;
    expect(group?.getAttribute("role")).toBe("toolbar");
    expect(view.host.querySelector("button")?.dataset.size).toBe("sm");
    view.unmount();
  });
});
