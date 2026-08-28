import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { configureScrapsLocale } from "../../lib/scraps-locale";
import { Pagination, useGetPaginationCaption } from "./pagination";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const pageLinks =
  '<http://localhost/api/0/items/?cursor=0:0:1>; rel="previous"; results="true"; cursor="0:0:1", <http://localhost/api/0/items/?cursor=0:25:0>; rel="next"; results="true"; cursor="0:25:0"';
const noPreviousLinks = pageLinks.replace(
  'results="true"; cursor="0:0:1"',
  'results="false"; cursor="0:0:1"',
);

const roots: ReturnType<typeof createRoot>[] = [];

async function render(element: React.ReactNode) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  roots.push(root);
  await act(async () => root.render(element));
  return host;
}

async function click(element: Element) {
  await act(async () => element.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

describe("Pagination", () => {
  afterEach(async () => {
    for (const root of roots.splice(0)) await act(async () => root.unmount());
    document.body.replaceChildren();
    window.history.replaceState(null, "", "/");
    vi.restoreAllMocks();
  });

  it("renders nothing without page links", async () => {
    expect((await render(<Pagination />)).innerHTML).toBe("");
    expect((await render(<Pagination pageLinks={null} />)).innerHTML).toBe("");
  });

  it("uses the canonical controls, disabled states, caption, and size", async () => {
    const host = await render(
      <Pagination caption="1-25 of 100" pageLinks={noPreviousLinks} size="xs" />,
    );
    expect(host.textContent).toContain("1-25 of 100");
    expect(host.querySelector('[aria-label="Previous"]')).toHaveProperty("disabled", true);
    expect(host.querySelector('[aria-label="Next"]')).toHaveProperty("disabled", false);
    expect(host.querySelector('[data-test-id="pagination"]')?.className).toContain("mt-6");
  });

  it("calls custom cursor and analytics handlers with the canonical values", async () => {
    window.history.replaceState(null, "", "/items/?foo=bar");
    const onCursor = vi.fn();
    const analytics = vi.fn();
    const host = await render(
      <Pagination onCursor={onCursor} pageLinks={pageLinks} paginationAnalyticsEvent={analytics} />,
    );
    await click(host.querySelector('[aria-label="Next"]')!);
    await click(host.querySelector('[aria-label="Previous"]')!);
    expect(onCursor).toHaveBeenNthCalledWith(1, "0:25:0", "/items/", { foo: "bar" }, 1);
    expect(onCursor).toHaveBeenNthCalledWith(2, "0:0:1", "/items/", { foo: "bar" }, -1);
    expect(analytics).toHaveBeenNthCalledWith(1, "Next");
    expect(analytics).toHaveBeenNthCalledWith(2, "Previous");
  });

  it("updates browser history by default and honors to", async () => {
    window.history.replaceState(null, "", "/items/?foo=bar");
    const host = await render(<Pagination pageLinks={pageLinks} to="/other/" />);
    await click(host.querySelector('[aria-label="Next"]')!);
    expect(window.location.pathname).toBe("/other/");
    expect(window.location.search).toBe("?foo=bar&cursor=0%3A25%3A0");
  });
});

function Caption({
  cursor,
  limit,
  pageLength,
  total,
}: {
  cursor: string | string[] | undefined | null;
  limit: number;
  pageLength: number;
  total: number;
}) {
  const getCaption = useGetPaginationCaption();
  return getCaption({ cursor, limit, pageLength, total });
}

describe("useGetPaginationCaption", () => {
  it("returns a localized caption callback for empty, first, and offset pages", async () => {
    expect(
      (await render(<Caption cursor={undefined} limit={25} pageLength={0} total={0} />))
        .textContent,
    ).toBe("");
    expect(
      (await render(<Caption cursor={undefined} limit={25} pageLength={25} total={100} />))
        .textContent,
    ).toBe("1-25 of 100");
    expect(
      (await render(<Caption cursor="0:2:0" limit={25} pageLength={25} total={100} />)).textContent,
    ).toBe("51-75 of 100");
  });

  it("uses the configured locale adapter", async () => {
    const restoreLocale = configureScrapsLocale({
      t: (message) => message,
      tct: (_message, components) =>
        `Resultados: ${components.start}-${components.end} de ${components.total}`,
    });

    try {
      expect(
        (await render(<Caption cursor="0:1:0" limit={25} pageLength={25} total={100} />))
          .textContent,
      ).toBe("Resultados: 26-50 de 100");
    } finally {
      restoreLocale();
    }
  });
});
