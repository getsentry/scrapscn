import { act, createRef, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

const sentryWarn = vi.hoisted(() => vi.fn());
vi.mock("@sentry/react", () => ({ logger: { warn: sentryWarn } }));

import {
  ExternalLink,
  Link,
  LinkBehaviorContextProvider,
  type LinkProps,
} from "./link";
import { TrackingContextProvider } from "./tracking-context";

function render(ui: ReactElement) {
  const host = document.createElement("div");
  const root = createRoot(host);
  act(() => root.render(ui));
  return {
    host,
    unmount: () => act(() => root.unmount()),
  };
}

function RouterFixture({ children }: { children: ReactElement }) {
  return (
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      {children}
    </MemoryRouter>
  );
}

describe("Link", () => {
  it.each([
    ["a string", "https://www.sentry.io/", "https://www.sentry.io/"],
    ["a location descriptor", { pathname: "/settings/account/" }, "/settings/account/"],
  ])("renders %s destination as an href", (_name, to, href) => {
    const view = render(
      <RouterFixture>
        <Link to={to}>Link</Link>
      </RouterFixture>
    );

    expect(view.host.querySelector("a")?.getAttribute("href")).toBe(href);
    view.unmount();
  });

  it.each([
    ["a string", "https://www.sentry.io/"],
    ["a location descriptor", { pathname: "/settings/account/" }],
  ])("removes %s destination when disabled", (_name, to) => {
    const view = render(
      <RouterFixture>
        <Link
          disabled
          preventScrollReset
          reloadDocument
          replace
          state={{ source: "test" }}
          to={to}
        >
          Link
        </Link>
      </RouterFixture>
    );

    const link = view.host.querySelector("a");
    expect(link?.getAttribute("href")).toBeNull();
    expect(link?.getAttribute("disabled")).toBeNull();
    expect(link?.getAttribute("preventScrollReset")).toBeNull();
    expect(link?.getAttribute("reloadDocument")).toBeNull();
    expect(link?.getAttribute("replace")).toBeNull();
    expect(link?.getAttribute("state")).toBeNull();
    view.unmount();
  });

  it("tracks the accessible label, analytics fields, and original click", () => {
    const tracking = vi.fn();
    const onClick = vi.fn((event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
    });
    const view = render(
      <TrackingContextProvider value={() => tracking}>
        <RouterFixture>
          <Link
            analyticsEventKey="link.clicked"
            analyticsEventName="Link Clicked"
            analyticsParams={{ source: "test" }}
            aria-label="Open issue details"
            onClick={onClick}
            to="/issues/"
          >
            Open
          </Link>
        </RouterFixture>
      </TrackingContextProvider>
    );

    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    act(() => view.host.querySelector("a")?.dispatchEvent(click));

    expect(tracking).toHaveBeenCalledOnce();
    expect(tracking).toHaveBeenCalledWith({
      "aria-label": "Open issue details",
      analyticsEventKey: "link.clicked",
      analyticsEventName: "Link Clicked",
      analyticsParams: { source: "test", variant: undefined },
      clickType: "link",
    });
    expect(onClick).toHaveBeenCalledOnce();
    view.unmount();
  });

  it("uses the behavior provider and forwards the React 19 ref", () => {
    const behavior = vi.fn((props: LinkProps) => ({
      ...props,
      "aria-label": "Adapted link",
    }));
    const ref = createRef<HTMLAnchorElement>();

    function AdaptedLink({ to, ...props }: LinkProps) {
      const href = typeof to === "string" ? `/adapted${to}` : to.pathname;
      return <a {...props} href={href} />;
    }

    const view = render(
      <LinkBehaviorContextProvider value={{ behavior, component: AdaptedLink }}>
        <Link ref={ref} to="/issues/">Open</Link>
      </LinkBehaviorContextProvider>
    );

    expect(behavior).toHaveBeenCalledOnce();
    expect(view.host.querySelector("a")?.getAttribute("href")).toBe("/adapted/issues/");
    expect(view.host.querySelector("a")?.getAttribute("aria-label")).toBe("Adapted link");
    expect(ref.current).toBe(view.host.querySelector("a"));
    view.unmount();
    expect(ref.current).toBeNull();
  });

  it("reports a missing behavior provider in production", () => {
    sentryWarn.mockClear();
    vi.stubEnv("NODE_ENV", "production");

    const view = render(
      <RouterFixture>
        <Link to="/issues/">Open</Link>
      </RouterFixture>
    );

    expect(sentryWarn).toHaveBeenCalledWith("LinkBehaviorContext not found");
    view.unmount();
    vi.unstubAllEnvs();
  });
});

describe("ExternalLink", () => {
  it("uses the canonical new-tab attributes by default", () => {
    const view = render(
      <ExternalLink href="https://www.sentry.io/">External</ExternalLink>
    );
    const link = view.host.querySelector("a");

    expect(link?.getAttribute("target")).toBe("_blank");
    expect(link?.getAttribute("rel")).toBe("noreferrer noopener");
    view.unmount();
  });

  it("keeps an ordinary href when the new tab is disabled", () => {
    const view = render(
      <ExternalLink href="https://www.sentry.io/" openInNewTab={false}>
        External
      </ExternalLink>
    );
    const link = view.host.querySelector("a");

    expect(link?.getAttribute("href")).toBe("https://www.sentry.io/");
    expect(link?.getAttribute("target")).toBeNull();
    expect(link?.getAttribute("rel")).toBeNull();
    view.unmount();
  });
});
