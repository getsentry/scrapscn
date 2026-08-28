import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  PictureInPicturePortal,
  PictureInPictureProvider,
  usePictureInPicture,
} from "./picture-in-picture";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

type PictureInPictureValue = ReturnType<typeof usePictureInPicture>;

const roots: Array<{ host: HTMLDivElement; root: Root }> = [];
const frames: HTMLIFrameElement[] = [];

async function render(element: ReactNode) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  roots.push({ host, root });
  await act(async () => root.render(element));
  return root;
}

function createFakePipWindow() {
  const frame = document.createElement("iframe");
  document.body.append(frame);
  frames.push(frame);
  const pipWindow = frame.contentWindow;
  if (!pipWindow) throw new Error("Test iframe has no window");

  let closed = false;
  Object.defineProperty(pipWindow, "closed", {
    configurable: true,
    get: () => closed,
  });
  const close = vi.fn(() => {
    if (closed) return;
    closed = true;
    pipWindow.dispatchEvent(new Event("pagehide"));
  });
  const markClosed = () => {
    closed = true;
  };
  Object.defineProperty(pipWindow, "close", {
    configurable: true,
    value: close,
  });
  return { close, markClosed, pipWindow };
}

function installDocumentPipRequest(request: DocumentPictureInPicture["requestWindow"]) {
  const requestWindow = vi.fn(request);
  const api = Object.assign(new EventTarget(), {
    requestWindow,
    window: null,
  }) satisfies DocumentPictureInPicture;
  Object.defineProperty(window, "documentPictureInPicture", {
    configurable: true,
    value: api,
  });
  return requestWindow;
}

function installDocumentPip(pipWindow: Window) {
  return installDocumentPipRequest(async () => pipWindow);
}

function deferred<T>() {
  let resolve: (value: T) => void = () => {
    throw new Error("Deferred promise resolved before initialization");
  };
  const promise = new Promise<T>((fulfill) => {
    resolve = fulfill;
  });
  return { promise, resolve };
}

function Probe({ onValue }: { onValue: (value: PictureInPictureValue) => void }) {
  const value = usePictureInPicture();
  onValue(value);
  return value.pipWindow ? (
    <PictureInPicturePortal pipWindow={value.pipWindow}>
      <div data-testid="pip-content">Popped out</div>
    </PictureInPicturePortal>
  ) : null;
}

describe("PictureInPicture", () => {
  afterEach(async () => {
    for (const { host, root } of roots.splice(0)) {
      await act(async () => root.unmount());
      host.remove();
    }
    for (const frame of frames.splice(0)) frame.remove();
    Reflect.deleteProperty(window, "documentPictureInPicture");
    document.head.querySelectorAll("[data-pip-test]").forEach((node) => node.remove());
    document.documentElement.className = "";
    document.body.className = "";
  });

  it("requires its provider and reports unsupported browsers", async () => {
    function OutsideProvider() {
      usePictureInPicture();
      return null;
    }
    expect(() => renderToStaticMarkup(<OutsideProvider />)).toThrow(
      "usePictureInPicture must be used within a PictureInPictureProvider",
    );

    let current: PictureInPictureValue | undefined;
    await render(
      <PictureInPictureProvider>
        <Probe onValue={(value) => (current = value)} />
      </PictureInPictureProvider>,
    );
    expect(current?.isSupported).toBe(false);
    expect(current?.pipWindow).toBeNull();
  });

  it("opens once, copies Tailwind styles, resolves assets, and portals content", async () => {
    const style = document.createElement("style");
    style.dataset.pipTest = "true";
    style.textContent = ".pip-test{background:url(images/pip.png);color:red}";
    document.head.append(style);
    if (style.sheet) {
      Object.defineProperty(style.sheet, "href", {
        configurable: true,
        value: "https://example.test/assets/app.css",
      });
    }
    document.documentElement.className = "dark";
    document.body.className = "theme-body";

    const { pipWindow } = createFakePipWindow();
    const requestWindow = installDocumentPip(pipWindow);
    let current: PictureInPictureValue | undefined;
    await render(
      <PictureInPictureProvider>
        <Probe onValue={(value) => (current = value)} />
      </PictureInPictureProvider>,
    );

    await act(async () =>
      current?.requestPipWindow({
        height: 600,
        preferInitialWindowPlacement: true,
        width: 400,
      }),
    );
    expect(requestWindow).toHaveBeenCalledWith({
      height: 600,
      preferInitialWindowPlacement: true,
      width: 400,
    });
    expect(current?.pipWindow).toBe(pipWindow);
    expect(pipWindow.document.head.textContent).toContain(
      "https://example.test/assets/images/pip.png",
    );
    expect(pipWindow.document.body.textContent).toContain("Popped out");
    expect(pipWindow.document.documentElement.className).toBe("dark");
    expect(pipWindow.document.body.className).toBe("theme-body");
    expect(pipWindow.document.documentElement.style.height).toBe("100%");
    expect(pipWindow.document.body.style.margin).toBe("0px");

    await act(async () => current?.requestPipWindow({ width: 900 }));
    expect(requestWindow).toHaveBeenCalledTimes(1);

    document.documentElement.className = "light-updated";
    document.body.className = "body-updated";
    await act(async () => Promise.resolve());
    expect(pipWindow.document.documentElement.className).toBe("light-updated");
    expect(pipWindow.document.body.className).toBe("body-updated");
  });

  it("tracks user closure and keeps close idempotent", async () => {
    const { close, pipWindow } = createFakePipWindow();
    installDocumentPip(pipWindow);
    let current: PictureInPictureValue | undefined;
    await render(
      <PictureInPictureProvider>
        <Probe onValue={(value) => (current = value)} />
      </PictureInPictureProvider>,
    );
    await act(async () => current?.requestPipWindow());

    await act(async () => current?.closePipWindow());
    expect(close).toHaveBeenCalledOnce();
    expect(current?.pipWindow).toBeNull();
    await act(async () => current?.closePipWindow());
    expect(close).toHaveBeenCalledOnce();
  });

  it("closes a request that resolves after provider unmount", async () => {
    const pendingWindow = deferred<Window>();
    const { close, pipWindow } = createFakePipWindow();
    const requestWindow = installDocumentPipRequest(() => pendingWindow.promise);
    let current: PictureInPictureValue | undefined;
    const root = await render(
      <PictureInPictureProvider>
        <Probe onValue={(value) => (current = value)} />
      </PictureInPictureProvider>,
    );
    if (!current) throw new Error("PictureInPicture probe did not render");

    const request = current.requestPipWindow();
    await act(async () => root.unmount());
    pendingWindow.resolve(pipWindow);
    await act(async () => request);

    expect(requestWindow).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledOnce();
    expect(current.pipWindow).toBeNull();
  });

  it("blocks concurrent requests and ignores stale pagehide cleanup", async () => {
    const older = createFakePipWindow();
    const newer = createFakePipWindow();
    const pendingWindow = deferred<Window>();
    let requestCount = 0;
    const requestWindow = installDocumentPipRequest(() => {
      requestCount += 1;
      return requestCount === 1 ? Promise.resolve(older.pipWindow) : pendingWindow.promise;
    });
    const addEventListener = vi.spyOn(older.pipWindow, "addEventListener");
    let current: PictureInPictureValue | undefined;
    await render(
      <PictureInPictureProvider>
        <Probe onValue={(value) => (current = value)} />
      </PictureInPictureProvider>,
    );
    if (!current) throw new Error("PictureInPicture probe did not render");

    const initialValue = current;
    await act(async () => initialValue.requestPipWindow());
    const pagehideListener = addEventListener.mock.calls.find(([type]) => type === "pagehide")?.[1];
    if (!pagehideListener) throw new Error("pagehide listener was not added");
    older.markClosed();

    let nextRequest: Promise<void> | undefined;
    let concurrentRequest: Promise<void> | undefined;
    await act(async () => {
      nextRequest = current?.requestPipWindow();
      concurrentRequest = current?.requestPipWindow();
      await Promise.resolve();
    });
    expect(requestWindow).toHaveBeenCalledTimes(2);
    expect(current.pipWindow).toBeNull();
    pendingWindow.resolve(newer.pipWindow);
    await act(async () => Promise.all([nextRequest, concurrentRequest]));
    expect(current.pipWindow).toBe(newer.pipWindow);

    await act(async () => {
      const event = new Event("pagehide");
      if (typeof pagehideListener === "function") {
        pagehideListener.call(older.pipWindow, event);
      } else {
        pagehideListener.handleEvent(event);
      }
    });
    expect(current.pipWindow).toBe(newer.pipWindow);
  });

  it("closes an untracked window when setup fails", async () => {
    const { close, pipWindow } = createFakePipWindow();
    Object.defineProperty(pipWindow.document.body, "className", {
      configurable: true,
      set: () => {
        throw new Error("setup failed");
      },
    });
    installDocumentPip(pipWindow);
    let current: PictureInPictureValue | undefined;
    await render(
      <PictureInPictureProvider>
        <Probe onValue={(value) => (current = value)} />
      </PictureInPictureProvider>,
    );

    await expect(act(async () => current?.requestPipWindow())).rejects.toThrow("setup failed");
    expect(close).toHaveBeenCalledOnce();
    expect(current?.pipWindow).toBeNull();
  });
});
