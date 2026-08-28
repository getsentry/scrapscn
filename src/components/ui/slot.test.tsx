import { act, useContext, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ContainerQueryContext } from "./container-query-context";
import { SizeProvider, useSizeContext } from "./size-context";
import { slot, withSlots } from "./slot";

const sentryMocks = vi.hoisted(() => ({
  captureException: vi.fn(),
  setFingerprint: vi.fn(),
  setLevel: vi.fn(),
  setTag: vi.fn(),
  withScope: vi.fn(),
}));

vi.mock("@sentry/react", () => ({
  captureException: sentryMocks.captureException,
  withScope: sentryMocks.withScope.mockImplementation((callback) =>
    callback({
      setFingerprint: sentryMocks.setFingerprint,
      setLevel: sentryMocks.setLevel,
      setTag: sentryMocks.setTag,
    }),
  ),
}));

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

const mountedRoots: Array<{ container: HTMLDivElement; root: Root }> = [];

async function render(ui: ReactNode) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  mountedRoots.push({ container, root });
  await act(async () => root.render(ui));
  return {
    container,
    rerender: async (nextUi: ReactNode) => {
      await act(async () => root.render(nextUi));
    },
    unmount: async () => {
      await act(async () => root.unmount());
      container.remove();
      const index = mountedRoots.findIndex((entry) => entry.root === root);
      if (index >= 0) mountedRoots.splice(index, 1);
    },
  };
}

function byTestId(container: ParentNode, testId: string): HTMLElement {
  const element = container.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
  if (!element) throw new Error(`Missing test element: ${testId}`);
  return element;
}

afterEach(async () => {
  for (const { root, container } of mountedRoots.splice(0)) {
    await act(async () => root.unmount());
    container.remove();
  }
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  for (const mock of Object.values(sentryMocks)) mock.mockClear();
});

describe("production missing-provider warnings", () => {
  it("reports to Sentry once per component and slot name", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const Slot = slot(["prod-one", "prod-two"] as const);
    const ui = (
      <>
        <Slot name="prod-one">One</Slot>
        <Slot name="prod-one">Again</Slot>
        <Slot.Outlet name="prod-two">{(props) => <div {...props} />}</Slot.Outlet>
        <Slot.Fallback>Fallback</Slot.Fallback>
      </>
    );
    const view = await render(ui);
    await view.rerender(ui);

    expect(sentryMocks.withScope).toHaveBeenCalledTimes(3);
    expect(sentryMocks.setLevel).toHaveBeenCalledTimes(3);
    expect(sentryMocks.setLevel).toHaveBeenCalledWith("warning");
    expect(sentryMocks.setTag).toHaveBeenCalledWith("slot.component", "Consumer");
    expect(sentryMocks.setTag).toHaveBeenCalledWith("slot.name", "prod-one");
    expect(sentryMocks.setTag).toHaveBeenCalledWith("slot.component", "Outlet");
    expect(sentryMocks.setTag).toHaveBeenCalledWith("slot.name", "prod-two");
    expect(sentryMocks.setTag).toHaveBeenCalledWith("slot.component", "Fallback");
    expect(sentryMocks.setTag).toHaveBeenCalledWith("slot.name", "unknown");
    expect(sentryMocks.setFingerprint).toHaveBeenCalledWith([
      "slot-missing-provider",
      "Consumer",
      "prod-one",
    ]);
    expect(sentryMocks.setFingerprint).toHaveBeenCalledWith([
      "slot-missing-provider",
      "Outlet",
      "prod-two",
    ]);
    expect(sentryMocks.setFingerprint).toHaveBeenCalledWith([
      "slot-missing-provider",
      "Fallback",
      "unknown",
    ]);
    expect(sentryMocks.captureException).toHaveBeenCalledTimes(3);
    for (const [error] of sentryMocks.captureException.mock.calls)
      expect(error).toBeInstanceOf(Error);
  });
});

describe("slot portal behavior", () => {
  it("provides the module API and renders provider children", async () => {
    const Slot = slot(["header", "footer"] as const);
    expect(Slot.Provider).toBeTypeOf("function");
    expect(Slot.Outlet).toBeTypeOf("function");
    expect(Slot.Fallback).toBeTypeOf("function");
    expect(Slot.useSlotOutletRef).toBeTypeOf("function");

    const view = await render(
      <Slot.Provider>
        <span data-testid="provider-child" />
      </Slot.Provider>,
    );
    expect(byTestId(view.container, "provider-child")).toBeTruthy();
  });

  it("portals a consumer into its outlet", async () => {
    const Slot = slot(["content"] as const);
    const view = await render(
      <Slot.Provider>
        <Slot.Outlet name="content">
          {(props) => <div {...props} data-testid="target" />}
        </Slot.Outlet>
        <Slot name="content">
          <span data-testid="portaled">Portaled content</span>
        </Slot>
      </Slot.Provider>,
    );

    expect(byTestId(view.container, "target").contains(byTestId(view.container, "portaled"))).toBe(
      true,
    );
  });

  it("renders multiple consumers independently without outlets and none without a provider", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const Slot = slot(["a", "b", "outside"] as const);
    const view = await render(
      <>
        <Slot.Provider>
          <Slot name="a">
            <span data-testid="without-outlet-a" />
          </Slot>
          <Slot name="b">
            <span data-testid="without-outlet-b" />
          </Slot>
        </Slot.Provider>
        <Slot name="outside">
          <span data-testid="without-provider" />
        </Slot>
      </>,
    );

    expect(view.container.querySelector("[data-testid=without-outlet-a]")).toBeNull();
    expect(view.container.querySelector("[data-testid=without-outlet-b]")).toBeNull();
    expect(view.container.querySelector("[data-testid=without-provider]")).toBeNull();
    expect(warn).toHaveBeenCalledOnce();
  });

  it("renders an Outlet outside its provider with no consumers", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const Slot = slot(["aside"] as const);
    const view = await render(
      <Slot.Outlet name="aside">
        {(props, hasConsumers) => (
          <div {...props} data-testid="outside-outlet">
            {hasConsumers ? "consumer" : "no consumer"}
          </div>
        )}
      </Slot.Outlet>,
    );

    expect(byTestId(view.container, "outside-outlet").textContent).toBe("no consumer");
  });

  it("updates hasConsumers as consumers are added and removed", async () => {
    const Slot = slot(["content"] as const);
    function App({ consumerCount }: { consumerCount: number }) {
      return (
        <Slot.Provider>
          <Slot.Outlet name="content">
            {(props, hasConsumers) => (
              <>
                <output data-testid="consumer-state">
                  {hasConsumers ? "has consumer" : "no consumers"}
                </output>
                <div {...props} data-testid="consumer-target" />
              </>
            )}
          </Slot.Outlet>
          {Array.from({ length: consumerCount }, (_, index) => (
            <Slot name="content" key={index}>
              <span>{index}</span>
            </Slot>
          ))}
        </Slot.Provider>
      );
    }

    const view = await render(<App consumerCount={0} />);
    expect(byTestId(view.container, "consumer-state").textContent).toBe("no consumers");
    await view.rerender(<App consumerCount={2} />);
    expect(byTestId(view.container, "consumer-state").textContent).toBe("has consumer");
    expect(byTestId(view.container, "consumer-target").textContent).toBe("01");
    await view.rerender(<App consumerCount={1} />);
    expect(byTestId(view.container, "consumer-state").textContent).toBe("has consumer");
    expect(byTestId(view.container, "consumer-target").textContent).toBe("0");
    await view.rerender(<App consumerCount={0} />);
    expect(byTestId(view.container, "consumer-state").textContent).toBe("no consumers");
  });

  it("unregisters an outlet and registers its replacement", async () => {
    const Slot = slot(["panel"] as const);
    function App({ showOutlet }: { showOutlet: boolean }) {
      return (
        <Slot.Provider>
          {showOutlet ? (
            <Slot.Outlet name="panel">
              {(props) => <div {...props} data-testid="panel" />}
            </Slot.Outlet>
          ) : null}
          <Slot name="panel">
            <span data-testid="panel-content" />
          </Slot>
        </Slot.Provider>
      );
    }

    const view = await render(<App showOutlet />);
    expect(
      byTestId(view.container, "panel").contains(byTestId(view.container, "panel-content")),
    ).toBe(true);
    await view.rerender(<App showOutlet={false} />);
    expect(view.container.querySelector("[data-testid=panel-content]")).toBeNull();
    await view.rerender(<App showOutlet />);
    expect(
      byTestId(view.container, "panel").contains(byTestId(view.container, "panel-content")),
    ).toBe(true);
  });
});

describe("Slot.Fallback", () => {
  it("transitions between fallback and consumer content", async () => {
    const Slot = slot(["feedback"] as const);
    function App({ withConsumer }: { withConsumer: boolean }) {
      return (
        <Slot.Provider>
          <Slot.Outlet name="feedback">
            {(props) => (
              <div {...props} data-testid="feedback">
                <Slot.Fallback>
                  <span data-testid="fallback" />
                </Slot.Fallback>
              </div>
            )}
          </Slot.Outlet>
          {withConsumer ? (
            <Slot name="feedback">
              <span data-testid="custom" />
            </Slot>
          ) : null}
        </Slot.Provider>
      );
    }

    const view = await render(<App withConsumer={false} />);
    expect(
      byTestId(view.container, "feedback").contains(byTestId(view.container, "fallback")),
    ).toBe(true);
    await view.rerender(<App withConsumer />);
    expect(view.container.querySelector("[data-testid=fallback]")).toBeNull();
    expect(byTestId(view.container, "feedback").contains(byTestId(view.container, "custom"))).toBe(
      true,
    );
    await view.rerender(<App withConsumer={false} />);
    expect(
      byTestId(view.container, "feedback").contains(byTestId(view.container, "fallback")),
    ).toBe(true);
  });

  it("renders nothing outside a provider", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const Slot = slot(["empty-fallback"] as const);
    const view = await render(
      <Slot.Fallback>
        <span data-testid="fallback" />
      </Slot.Fallback>,
    );
    expect(view.container.innerHTML).toBe("");
  });

  it("throws outside an Outlet", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const Slot = slot(["invalid-fallback"] as const);
    await expect(
      render(
        <Slot.Provider>
          <Slot.Fallback>Invalid</Slot.Fallback>
        </Slot.Provider>,
      ),
    ).rejects.toThrow("Slot.Fallback must be rendered inside Slot.Outlet");
  });
});

describe("outlet refs", () => {
  it("keeps the render-prop ref stable across rerenders", async () => {
    const Slot = slot(["menu"] as const);
    const refs: Array<(element: HTMLElement | null) => void> = [];
    function App({ label }: { label: string }) {
      return (
        <Slot.Provider>
          <Slot.Outlet name="menu">
            {(props) => {
              refs.push(props.ref);
              return <div {...props}>{label}</div>;
            }}
          </Slot.Outlet>
        </Slot.Provider>
      );
    }

    const view = await render(<App label="first" />);
    const firstRef = refs.at(-1);
    await view.rerender(<App label="second" />);
    expect(refs.at(-1)).toBe(firstRef);
  });

  it("exposes the registered outlet element through useSlotOutletRef", async () => {
    const Slot = slot(["menu-ref"] as const);
    function RefReader() {
      const ref = Slot.useSlotOutletRef();
      return <output data-testid="outlet-ref">{ref.current?.dataset.testid ?? "none"}</output>;
    }

    const view = await render(
      <Slot.Provider>
        <Slot.Outlet name="menu-ref">
          {(props) => (
            <div {...props} data-testid="menu-element">
              <RefReader />
            </div>
          )}
        </Slot.Outlet>
      </Slot.Provider>,
    );
    expect(byTestId(view.container, "outlet-ref").textContent).toBe("menu-element");
  });
});

describe("context bridging", () => {
  it("bridges and updates SizeContext and ContainerQueryContext", async () => {
    const Slot = slot(["bridge"] as const);
    function Reader() {
      const size = useSizeContext();
      const breakpoint = useContext(ContainerQueryContext);
      return (
        <output data-testid="contexts">
          {size ?? "none"}:{breakpoint ?? "none"}
        </output>
      );
    }
    function App({ size, breakpoint }: { size?: "sm" | "md"; breakpoint: "xs" | "lg" | null }) {
      let outlet: ReactNode = (
        <Slot.Outlet name="bridge">{(props) => <div {...props} />}</Slot.Outlet>
      );
      if (breakpoint)
        outlet = <ContainerQueryContext value={breakpoint}>{outlet}</ContainerQueryContext>;
      if (size) outlet = <SizeProvider size={size}>{outlet}</SizeProvider>;
      return (
        <Slot.Provider>
          {outlet}
          <Slot name="bridge">
            <Reader />
          </Slot>
        </Slot.Provider>
      );
    }

    const view = await render(<App size="sm" breakpoint="xs" />);
    expect(byTestId(view.container, "contexts").textContent).toBe("sm:xs");
    await view.rerender(<App size="md" breakpoint="lg" />);
    expect(byTestId(view.container, "contexts").textContent).toBe("md:lg");
    await view.rerender(<App breakpoint={null} />);
    expect(byTestId(view.container, "contexts").textContent).toBe("none:none");
  });
});

describe("slot system composition", () => {
  it("keeps separate slot systems independent", async () => {
    const First = slot(["zone"] as const);
    const Second = slot(["zone"] as const);
    const view = await render(
      <First.Provider>
        <First.Outlet name="zone">{(props) => <div {...props} data-testid="first" />}</First.Outlet>
        <Second name="zone">
          <span data-testid="wrong-system" />
        </Second>
      </First.Provider>,
    );
    expect(view.container.querySelector("[data-testid=wrong-system]")).toBeNull();
  });

  it("withSlots preserves component runtime behavior and attaches Slot", async () => {
    const Slot = slot(["title"] as const);
    function Card({ label }: { label: string }) {
      return (
        <section data-testid="card">
          {label}
          <Slot.Outlet name="title">{(props) => <h2 {...props} />}</Slot.Outlet>
        </section>
      );
    }
    const CardWithSlots = withSlots(Card, Slot);
    expect(CardWithSlots).toBe(Card);
    expect(CardWithSlots.Slot).toBe(Slot);

    const view = await render(
      <CardWithSlots.Slot.Provider>
        <CardWithSlots label="Card" />
        <CardWithSlots.Slot name="title">
          <span data-testid="title">Title</span>
        </CardWithSlots.Slot>
      </CardWithSlots.Slot.Provider>,
    );
    expect(byTestId(view.container, "card").textContent).toBe("CardTitle");
  });
});

describe("development missing-provider warnings", () => {
  it("warns once per component and slot name in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const Slot = slot(["dev-one", "dev-two"] as const);
    const ui = (
      <>
        <Slot name="dev-one">One</Slot>
        <Slot name="dev-one">Again</Slot>
        <Slot name="dev-two">Two</Slot>
      </>
    );
    const view = await render(ui);
    await view.rerender(ui);

    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledWith(
      '<Slot.Consumer> for slot "dev-one" rendered without a <Slot.Provider>',
    );
    expect(warn).toHaveBeenCalledWith(
      '<Slot.Consumer> for slot "dev-two" rendered without a <Slot.Provider>',
    );
    expect(sentryMocks.withScope).not.toHaveBeenCalled();
  });
});
