import { act, createRef, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { configureScrapsLocale } from "../../lib/scraps-locale";
import { AlertBadge, Badge, DeployBadge, FeatureBadge, ProjectsBadge, Tag } from "./badge";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const roots: Array<{ host: HTMLDivElement; root: Root }> = [];
const localeRestores: Array<() => void> = [];

const deploy = {
  dateFinished: "2026-08-26T12:01:00Z",
  dateStarted: "2026-08-26T12:00:00Z",
  environment: "production",
  id: "deploy-1",
  name: "Production deploy",
  url: "https://example.com/deploys/1",
  version: "1.2.3",
};

async function render(ui: ReactNode) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  roots.push({ host, root });
  await act(async () => root.render(ui));
  return host;
}

afterEach(async () => {
  for (const mounted of roots.splice(0)) {
    await act(async () => mounted.root.unmount());
    mounted.host.remove();
  }
  for (const restore of localeRestores.splice(0).reverse()) restore();
  document.body.replaceChildren();
});

describe("Badge", () => {
  it("renders all 12 canonical variants with exact geometry", async () => {
    const variants = [
      "muted",
      "internal",
      "info",
      "success",
      "warning",
      "danger",
      "highlight",
      "promotion",
      "alpha",
      "beta",
      "new",
      "experimental",
    ] as const;
    const host = await render(
      <>
        {variants.map((variant) => (
          <Badge key={variant} variant={variant}>
            {variant}
          </Badge>
        ))}
      </>,
    );
    const badges = host.querySelectorAll("span");
    expect(badges).toHaveLength(12);
    expect(badges[0]?.className).toContain("rounded-[5px]");
    expect(badges[0]?.className).toContain("py-1");
    expect(badges[8]?.className).toContain("--scraps-badge-promotion-vibrant");
    expect(badges[11]?.className).toContain("--scraps-badge-neutral-muted");
  });

  it("renders Tag as a div with icon, truncating text, ref, and six variants", async () => {
    const ref = createRef<HTMLDivElement>();
    const variants = ["muted", "info", "promotion", "danger", "warning", "success"] as const;
    const host = await render(
      <>
        {variants.map((variant, index) => (
          <Tag
            data-test-id={index === 0 ? "custom-tag" : undefined}
            icon={index === 0 ? <svg data-icon="leading" /> : undefined}
            key={variant}
            ref={index === 0 ? ref : undefined}
            variant={variant}
          >
            {variant}
          </Tag>
        ))}
      </>,
    );
    expect(host.querySelectorAll('[data-test-id="tag-background"]')).toHaveLength(5);
    expect(host.querySelector('[data-test-id="custom-tag"]')).toBe(ref.current);
    expect(ref.current?.tagName).toBe("DIV");
    expect(ref.current?.className).toContain("rounded-[4px]");
    expect(ref.current?.querySelector('[data-icon="leading"]')).not.toBeNull();
    expect(ref.current?.textContent).toBe("muted");
  });

  it("defaults unsized Tag SVGs to 12px and preserves explicit dimensions", async () => {
    const host = await render(
      <>
        <Tag icon={<svg data-icon="unsized" />} variant="info">
          Unsized
        </Tag>
        <Tag icon={<svg data-icon="explicit" height="24" width="24" />} variant="info">
          Explicit
        </Tag>
      </>,
    );
    const unsized = host.querySelector('[data-icon="unsized"]');
    const explicit = host.querySelector('[data-icon="explicit"]');
    expect(unsized?.parentElement?.className).toContain(
      "[&_svg:not([width]):not([height])]:size-3",
    );
    expect(unsized?.getAttribute("width")).toBeNull();
    expect(unsized?.getAttribute("height")).toBeNull();
    expect(explicit?.getAttribute("width")).toBe("24");
    expect(explicit?.getAttribute("height")).toBe("24");
  });

  it("prevents the dismiss button default and invokes onDismiss", async () => {
    const onDismiss = vi.fn();
    const parentClick = vi.fn((event: React.MouseEvent) => event.defaultPrevented);
    const host = await render(
      <div onClick={parentClick}>
        <Tag onDismiss={onDismiss} variant="info">
          Dismissable
        </Tag>
      </div>,
    );
    await act(async () => host.querySelector<HTMLButtonElement>("button")?.click());
    expect(onDismiss).toHaveBeenCalledOnce();
    expect(parentClick).toHaveReturnedWith(true);
    expect(host.querySelector("button path")?.getAttribute("d")).toContain("M12.72 2.22");
  });

  it("uses exact FeatureBadge variants and icons and removes nested tab stops", async () => {
    const host = await render(
      <>
        <FeatureBadge type="alpha" />
        <FeatureBadge type="beta" />
        <FeatureBadge type="new" />
        <FeatureBadge type="experimental" />
        <FeatureBadge type="debug" />
        <button type="button">
          <FeatureBadge type="new" />
        </button>
      </>,
    );
    const badges = host.querySelectorAll<HTMLElement>('[data-test-id="tag-background"]');
    expect(badges).toHaveLength(6);
    expect(badges[0]?.tabIndex).toBe(0);
    expect(badges[5]?.getAttribute("tabindex")).toBeNull();
    expect(badges[0]?.querySelector("path")?.getAttribute("d")).toContain("M12.25 0.5");
    expect(badges[2]?.querySelector("path")?.getAttribute("d")).toContain("M2.9 1.84");
    expect(badges[4]?.querySelectorAll("path")).toHaveLength(2);
    expect(badges[4]?.querySelectorAll("path")[1]?.getAttribute("d")).toContain("M8 0a3 3");
  });

  it("uses the roving role=tab parent as the FeatureBadge focus-visible target", async () => {
    vi.useFakeTimers();
    try {
      const host = await render(
        <div role="tab" tabIndex={-1}>
          <FeatureBadge type="new" />
        </div>,
      );
      const tab = host.querySelector<HTMLElement>('[role="tab"]');
      const badge = host.querySelector<HTMLElement>('[data-test-id="tag-background"]');
      expect(badge?.getAttribute("tabindex")).toBeNull();

      await act(async () => tab?.focus());
      expect(tab).toBe(document.activeElement);
      await act(async () => vi.advanceTimersByTimeAsync(400));
      expect(document.querySelector('[role="tooltip"]')?.textContent).toContain(
        "This feature is new! Try it out and let us know what you think",
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("resolves FeatureBadge and AlertBadge translations after module import", async () => {
    const translations: Record<string, string> = {
      "This feature is internal and available for QA purposes":
        "Función interna para control de calidad",
      Critical: "Crítico",
      Warning: "Advertencia",
    };
    localeRestores.push(
      configureScrapsLocale({
        t: (message) => translations[message] ?? message,
        tct: (message) => message,
      }),
    );

    const host = await render(
      <>
        <FeatureBadge tooltipProps={{ forceVisible: true }} type="alpha" />
        <AlertBadge status={20} withText />
        <AlertBadge status={10} />
      </>,
    );
    expect(document.querySelector('[role="tooltip"]')?.textContent).toBe(
      "Función interna para control de calidad",
    );
    expect(host.textContent).toContain("Crítico");
    expect(
      host
        .querySelectorAll('[data-test-id="alert-badge"]')[1]
        ?.querySelector('[role="presentation"]')
        ?.getAttribute("aria-label"),
    ).toBe("Advertencia");
  });

  it("does not forward arbitrary Tag props through FeatureBadge", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);

    await act(async () => root.render(<FeatureBadge type="new" />));
    expect(host.querySelector("[role=img]")?.getAttribute("class")).toContain("w-5");

    await act(async () => root.unmount());
    host.remove();
  });

  it("applies AlertBadge precedence, labels, icon paths, and 26px geometry", async () => {
    const host = await render(
      <>
        <AlertBadge status={20} withText />
        <AlertBadge status={10} withText />
        <AlertBadge status={1} />
        <AlertBadge isIssue status={20} withText />
      </>,
    );
    expect(host.textContent).toBe("CriticalWarningIssue");
    const badges = host.querySelectorAll('[data-test-id="alert-badge"]');
    expect(badges[0]?.querySelector("path")?.getAttribute("d")).toContain("M9.18 0");
    expect(badges[1]?.querySelector("path")?.getAttribute("d")).toContain("M6.81 0.65");
    expect(badges[2]?.querySelector("path")?.getAttribute("d")).toContain("M13.72 3.22");
    expect(badges[2]?.querySelector('[role="presentation"]')?.getAttribute("aria-label")).toBe(
      "Resolved",
    );
    expect(badges[3]?.querySelector("path")?.getAttribute("d")).toContain("M13.25 1");
    expect(badges[0]?.querySelector("svg")?.getAttribute("width")).toBe("13");
    expect(badges[0]?.querySelector('[role="presentation"]')?.className).toContain("size-[26px]");
  });

  it("matches the pinned MutableSearch release-token oracle", async () => {
    const cases = [
      ["", "release:"],
      ["has space", "release:has space"],
      ["has ( paren )", "release:has ( paren )"],
      ["has,comma", "release:has,comma"],
      ['a"b', 'release:a"b'],
      ["a\\b", "release:a\\b"],
      ["[alpha,beta]", "release:[alpha,beta]"],
      ['"already quoted"', 'release:"already quoted"'],
      ["4.9.0 build (0.0.01)", "release:4.9.0 build (0.0.01"],
      ["foo:bar", "release:foo:bar"],
      ["a*b", "release:a*b"],
    ] as const;
    const host = await render(
      <MemoryRouter>
        {cases.map(([version]) => (
          <DeployBadge
            deploy={deploy}
            key={version}
            orgSlug="sentry"
            projectId={1}
            version={version}
          />
        ))}
      </MemoryRouter>,
    );
    expect(
      Array.from(host.querySelectorAll("a"), (link) =>
        new URL(link.href).searchParams.get("query"),
      ),
    ).toEqual(cases.map(([, expected]) => expected));
    expect(host.querySelector('[data-test-id="tag-background"]')?.className).toContain("max-w-24");
  });

  it("keeps the ordinary DeployBadge release URL unchanged", async () => {
    const host = await render(
      <MemoryRouter>
        <DeployBadge deploy={deploy} orgSlug="sentry" projectId={1} version="1.2.3" />
      </MemoryRouter>,
    );
    expect(host.querySelector("a")?.getAttribute("href")).toBe(
      "/organizations/sentry/issues/?environment=production&project=1&query=release%3A1.2.3",
    );
  });

  it("throws the canonical errors for unsupported runtime variants", () => {
    const invokeAtUntypedBoundary = (
      component: (props: never) => unknown,
      props: Record<string, unknown>,
    ) => Reflect.apply(component, undefined, [props]);

    expect(() =>
      invokeAtUntypedBoundary(Badge, {
        children: "Invalid",
        variant: "unsupported",
      }),
    ).toThrow(new TypeError("Unsupported badge variant: unsupported"));
    expect(() =>
      invokeAtUntypedBoundary(Tag, {
        children: "Invalid",
        variant: "unsupported",
      }),
    ).toThrow(new TypeError("Unsupported badge type: unsupported"));
  });

  it("renders exact zero, one, and two-plus ProjectsBadge branches", async () => {
    const host = await render(
      <>
        <ProjectsBadge projectPlatforms={[]} />
        <ProjectsBadge allProjects projectPlatforms={[]} />
        <ProjectsBadge projectPlatforms={["javascript"]} />
        <ProjectsBadge projectPlatforms={["python", "javascript", "ruby"]} />
      </>,
    );
    const badges = host.querySelectorAll('[aria-hidden="true"].relative');
    expect(badges).toHaveLength(4);
    expect(badges[0]?.querySelector("path")?.getAttribute("d")).toContain("M11.25 0C12.22");
    expect(badges[1]?.querySelector("path")?.getAttribute("d")).toContain("M11.25 0C12.216");
    expect(badges[2]?.querySelector("div")?.className).toContain("rounded-[3px]");
    expect(badges[2]?.querySelectorAll("img")).toHaveLength(1);
    expect(badges[3]?.querySelectorAll(":scope > div")).toHaveLength(2);
  });
});
