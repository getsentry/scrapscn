import { act, createRef, useLayoutEffect, type ComponentProps, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AvatarButton } from "./avatar-button";
import { SizeProvider } from "./size-context";
import { TrackingContextProvider } from "./tracking-context";

type View = {
  host: HTMLDivElement;
  rerender: (next: ReactNode) => void;
  unmount: () => void;
};

type SamplerImage = {
  assignments: string[];
  onerror: (() => void) | null;
  onload: (() => void) | null;
  src: string;
};

const views: View[] = [];
const originalCrypto = Object.getOwnPropertyDescriptor(window, "crypto");

function render(node: ReactNode): View {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  act(() => root.render(node));
  let mounted = true;
  const view = {
    host,
    rerender(next: ReactNode) {
      act(() => root.render(next));
    },
    unmount() {
      if (!mounted) return;
      act(() => root.unmount());
      host.remove();
      mounted = false;
    },
  };
  views.push(view);
  return view;
}

function letterAvatar(name: string, identifier = "user") {
  return { identifier, name, type: "letter_avatar" as const };
}

function uploadAvatar(source: string, name = "Test User") {
  return {
    identifier: "upload-user",
    name,
    type: "upload" as const,
    uploadUrl: source,
  };
}

function imagePixels({
  color = [117, 83, 255],
  padded = false,
  transparent = false,
}: {
  color?: [number, number, number];
  padded?: boolean;
  transparent?: boolean;
} = {}) {
  const pixels = new Uint8ClampedArray(12 * 12 * 4);
  for (let y = 0; y < 12; y += 1) {
    for (let x = 0; x < 12; x += 1) {
      const opaque = !transparent && (!padded || (x >= 3 && x <= 8 && y >= 3 && y <= 8));
      const index = (y * 12 + x) * 4;
      pixels[index] = color[0];
      pixels[index + 1] = color[1];
      pixels[index + 2] = color[2];
      pixels[index + 3] = opaque ? 255 : 0;
    }
  }
  return pixels;
}

function mockCanvas(pixels: Uint8ClampedArray) {
  const drawImage = vi.fn();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage,
    getImageData: () => ({ data: pixels }),
  } as unknown as CanvasRenderingContext2D);
  return drawImage;
}

function mockImageSamplers() {
  const samplers: SamplerImage[] = [];
  class ImageSampler {
    assignments: string[] = [];
    height = 120;
    naturalHeight = 120;
    naturalWidth = 120;
    onerror: (() => void) | null = null;
    onload: (() => void) | null = null;
    width = 120;
    #crossOrigin: string | null = null;
    #src = "";

    constructor() {
      samplers.push(this);
    }

    get crossOrigin() {
      return this.#crossOrigin;
    }

    set crossOrigin(value: string | null) {
      this.assignments.push(`crossOrigin:${value}`);
      this.#crossOrigin = value;
    }

    get src() {
      return this.#src;
    }

    set src(value: string) {
      this.assignments.push(`src:${value}`);
      this.#src = value;
    }
  }
  vi.stubGlobal("Image", ImageSampler);
  return samplers;
}

async function completeSampler(sampler: SamplerImage) {
  await act(async () => {
    sampler.onload?.();
    await Promise.resolve();
  });
}

async function failSampler(sampler: SamplerImage) {
  await act(async () => {
    sampler.onerror?.();
    await Promise.resolve();
  });
}

function setCryptoDigest(digest: (algorithm: string, data: BufferSource) => Promise<ArrayBuffer>) {
  Object.defineProperty(window, "crypto", {
    configurable: true,
    value: { subtle: { digest } },
  });
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

afterEach(() => {
  for (const view of views.splice(0)) view.unmount();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  if (originalCrypto) Object.defineProperty(window, "crypto", originalCrypto);
  delete (window as Window & { __initialData?: { gravatarBaseUrl?: unknown } }).__initialData;
});

describe("AvatarButton letters", () => {
  it.each([
    ["", "?"],
    ["   ", "?"],
    ["[Filtered]", "?"],
    ["Jane", "J"],
    ["Jane Bloggs", "JB"],
    ["Jane Middle Bloggs", "JB"],
    ["😀 Person", "😀P"],
  ])("renders canonical initials for %j", (name, expected) => {
    const view = render(<AvatarButton aria-label="Open profile" avatar={letterAvatar(name)} />);
    expect(view.host.textContent).toContain(expected);
  });

  it("coerces a numeric name and updates initials when the name changes", () => {
    const numericAvatar = {
      identifier: "number",
      name: 123,
      type: "letter_avatar",
    } as unknown as ComponentProps<typeof AvatarButton>["avatar"];
    const view = render(<AvatarButton aria-label="Open profile" avatar={numericAvatar} />);
    expect(view.host.textContent).toContain("1");
    view.rerender(
      <AvatarButton aria-label="Open profile" avatar={letterAvatar("New Name", "number")} />,
    );
    expect(view.host.textContent).toContain("NN");
  });

  it("sets deterministic light and dark swatch variables without theme JavaScript", () => {
    const view = render(
      <AvatarButton aria-label="Open profile" avatar={letterAvatar("Jane", "a")} />,
    );
    const button = view.host.querySelector("button")!;
    expect(button.style.getPropertyValue("--avatar-letter-background-light")).toBe("#FF9838");
    expect(button.style.getPropertyValue("--avatar-letter-background-dark")).toBe("#FF9838");
    expect(button.style.getPropertyValue("--avatar-letter-content-light")).toBe("#000");
    expect(button.style.getPropertyValue("--avatar-chonk-light")).toBe("#6D3500");
    expect(button.style.getPropertyValue("--avatar-chonk-dark")).toBe("#6D3500");
    expect(button.className).toContain(
      "dark:[--avatar-letter-background:var(--avatar-letter-background-dark)]",
    );
    expect(button.className).toContain("dark:[--avatar-chonk:var(--avatar-chonk-dark)]");

    view.rerender(<AvatarButton aria-label="Open profile" avatar={letterAvatar("Emoji", "😀")} />);
    expect(button.style.getPropertyValue("--avatar-letter-background-light")).toBe("#67C800");
  });
});

describe("AvatarButton image sources", () => {
  it.each([
    ["data:image/svg+xml,test", "data:image/svg+xml,test"],
    ["https://example.com/avatar.jpg", "https://example.com/avatar.jpg?s=120"],
    [
      "https://example.com/avatar.jpg?quality=80",
      "https://example.com/avatar.jpg?quality=80&s=120",
    ],
    ["", "?s=120"],
  ])("builds the canonical upload URL for %j", (source, expected) => {
    const view = render(<AvatarButton aria-label="Open" avatar={uploadAvatar(source)} />);
    expect(view.host.querySelector("img")?.getAttribute("src")).toBe(expected);
    expect(view.host.querySelector("img")?.getAttribute("loading")).toBe("lazy");
  });

  it("falls back after an error and recovers when the source changes", () => {
    const view = render(
      <AvatarButton aria-label="Open" avatar={uploadAvatar("https://example.com/broken.png")} />,
    );
    const image = view.host.querySelector("img")!;
    act(() => image.dispatchEvent(new Event("error", { bubbles: true })));
    expect(view.host.querySelector("img")).toBeNull();
    expect(view.host.textContent).toContain("TU");

    view.rerender(
      <AvatarButton aria-label="Open" avatar={uploadAvatar("https://example.com/recovered.png")} />,
    );
    expect(view.host.querySelector("img")?.getAttribute("src")).toBe(
      "https://example.com/recovered.png?s=120",
    );
  });

  it("does not override the secondary chonk until an image sample exists", () => {
    const view = render(
      <AvatarButton aria-label="Open" avatar={uploadAvatar("https://example.com/pending.png")} />,
    );
    const button = view.host.querySelector("button")!;
    const frame = view.host.querySelector('[data-slot="avatar-button-frame"]')!;
    expect(button.className).not.toContain("before:!bg-[var(--avatar-chonk)]");
    expect(button.className).not.toContain("[--avatar-chonk:var(");
    expect(button.style.getPropertyValue("--avatar-chonk-light")).toBe("");
    expect(frame.className).toContain("border-transparent");
    expect(frame.className).not.toContain("border-[var(--avatar-chonk)]");
  });

  it("uses a separate CORS sampler without risking the visible image", async () => {
    vi.useFakeTimers();
    const samplers = mockImageSamplers();
    const source = "https://images.example.com/remote-avatar.png?s=120";
    const first = render(
      <AvatarButton
        aria-label="Remote"
        avatar={uploadAvatar("https://images.example.com/remote-avatar.png")}
      />,
    );
    const visibleImage = first.host.querySelector("img")!;

    expect(visibleImage.getAttribute("src")).toBe(source);
    expect(visibleImage.hasAttribute("crossorigin")).toBe(false);
    expect(samplers).toHaveLength(1);
    expect(samplers[0]?.assignments).toEqual(["crossOrigin:anonymous", `src:${source}`]);

    await failSampler(samplers[0]!);
    expect(first.host.querySelector("img")).toBe(visibleImage);

    first.unmount();
    act(() => vi.advanceTimersByTime(5 * 60 * 1000));
    const second = render(
      <AvatarButton
        aria-label="Remote again"
        avatar={uploadAvatar("https://images.example.com/remote-avatar.png")}
      />,
    );
    expect(second.host.querySelector("img")).not.toBeNull();
    expect(samplers).toHaveLength(2);
  });
});

describe("AvatarButton image sampling", () => {
  it("samples one filled image into light and dark chonks", async () => {
    const samplers = mockImageSamplers();
    const drawImage = mockCanvas(imagePixels());
    const view = render(
      <AvatarButton aria-label="Open" avatar={uploadAvatar("data:image/png;base64,filled-a")} />,
    );
    await completeSampler(samplers[0]!);
    const button = view.host.querySelector("button")!;
    const frame = view.host.querySelector('[data-slot="avatar-button-frame"]')!;
    expect(drawImage).toHaveBeenCalledOnce();
    expect(button.style.getPropertyValue("--avatar-chonk-light")).toBe("#2500BA");
    expect(button.style.getPropertyValue("--avatar-chonk-dark")).toBe("#0A0033");
    expect(button.className).toContain("before:!bg-[var(--avatar-chonk)]");
    expect(frame.className).toContain("border-[var(--avatar-chonk)]");
    expect(frame.className).not.toContain("p-1");
  });

  it("adds canonical padding and background for an inset image", async () => {
    const samplers = mockImageSamplers();
    mockCanvas(imagePixels({ color: [255, 152, 56], padded: true }));
    const view = render(
      <AvatarButton aria-label="Open" avatar={uploadAvatar("data:image/png;base64,padded-a")} />,
    );
    await completeSampler(samplers[0]!);
    const frame = view.host.querySelector('[data-slot="avatar-button-frame"]')!;
    expect(frame.className).toContain("p-1");
    expect(frame.className).toContain("bg-[var(--scraps-avatar-padded-background)]");
  });

  it("prefers chromatic pixels and falls back to grayscale pixels", async () => {
    const samplers = mockImageSamplers();
    const chromatic = imagePixels({ color: [128, 128, 128] });
    chromatic.set([255, 0, 0, 255], 4 * 13);
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
      getImageData: () => ({ data: chromatic }),
    } as unknown as CanvasRenderingContext2D);
    const chromaticView = render(
      <AvatarButton
        aria-label="Chromatic"
        avatar={uploadAvatar("data:image/png;base64,chromatic-a")}
      />,
    );
    await completeSampler(samplers[0]!);
    expect(
      chromaticView.host.querySelector("button")?.style.getPropertyValue("--avatar-chonk-light"),
    ).toBe("#8C0000");

    getContext.mockReturnValue({
      drawImage: vi.fn(),
      getImageData: () => ({
        data: imagePixels({ color: [128, 128, 128] }),
      }),
    } as unknown as CanvasRenderingContext2D);
    const grayscaleView = render(
      <AvatarButton
        aria-label="Grayscale"
        avatar={uploadAvatar("data:image/png;base64,grayscale-a")}
      />,
    );
    await completeSampler(samplers[1]!);
    expect(
      grayscaleView.host.querySelector("button")?.style.getPropertyValue("--avatar-chonk-light"),
    ).toBe("#464646");
  });

  it("keeps base styling when pixels are transparent or canvas sampling fails", async () => {
    const samplers = mockImageSamplers();
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
      getImageData: () => ({ data: imagePixels({ transparent: true }) }),
    } as unknown as CanvasRenderingContext2D);
    const transparent = render(
      <AvatarButton
        aria-label="Transparent"
        avatar={uploadAvatar("data:image/png;base64,transparent-a")}
      />,
    );
    await completeSampler(samplers[0]!);
    expect(transparent.host.querySelector("button")?.className).not.toContain(
      "before:!bg-[var(--avatar-chonk)]",
    );

    getContext.mockImplementation(() => {
      throw new Error("canvas unavailable");
    });
    const failed = render(
      <AvatarButton
        aria-label="Failed"
        avatar={uploadAvatar("data:image/png;base64,canvas-failure-a")}
      />,
    );
    await completeSampler(samplers[1]!);
    expect(failed.host.querySelector("button")?.className).not.toContain(
      "before:!bg-[var(--avatar-chonk)]",
    );
  });

  it("uses a source-keyed cache and never shows the previous source sample", async () => {
    const samplers = mockImageSamplers();
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
      getImageData: () => ({
        data: imagePixels({ color: [255, 152, 56], padded: true }),
      }),
    } as unknown as CanvasRenderingContext2D);
    const view = render(
      <AvatarButton aria-label="Open" avatar={uploadAvatar("data:image/png;base64,source-a")} />,
    );
    await completeSampler(samplers[0]!);
    const firstImage = view.host.querySelector("img");
    expect(view.host.querySelector('[data-slot="avatar-button-frame"]')?.className).toContain(
      "p-1",
    );

    view.rerender(
      <AvatarButton aria-label="Open" avatar={uploadAvatar("data:image/png;base64,source-b")} />,
    );
    expect(view.host.querySelector("img")).not.toBe(firstImage);
    expect(view.host.querySelector('[data-slot="avatar-button-frame"]')?.className).not.toContain(
      "p-1",
    );
    expect(view.host.querySelector("button")?.className).not.toContain(
      "before:!bg-[var(--avatar-chonk)]",
    );

    getContext.mockReturnValue({
      drawImage: vi.fn(),
      getImageData: () => ({ data: imagePixels({ color: [128, 128, 128] }) }),
    } as unknown as CanvasRenderingContext2D);
    await completeSampler(samplers[1]!);
    expect(view.host.querySelector("button")?.style.getPropertyValue("--avatar-chonk-light")).toBe(
      "#464646",
    );
  });

  it("retains a sampled source while observed and collects it five minutes later", async () => {
    vi.useFakeTimers();
    const samplers = mockImageSamplers();
    mockCanvas(imagePixels());
    const source = "data:image/png;base64,gc-sample";
    const first = render(<AvatarButton aria-label="First" avatar={uploadAvatar(source)} />);
    await completeSampler(samplers[0]!);

    act(() => vi.advanceTimersByTime(10 * 60 * 1000));
    const second = render(<AvatarButton aria-label="Second" avatar={uploadAvatar(source)} />);
    expect(second.host.querySelector("button")?.className).toContain(
      "before:!bg-[var(--avatar-chonk)]",
    );
    expect(samplers).toHaveLength(1);

    first.unmount();
    second.unmount();
    act(() => vi.advanceTimersByTime(5 * 60 * 1000));
    render(<AvatarButton aria-label="Third" avatar={uploadAvatar(source)} />);
    expect(samplers).toHaveLength(2);
  });
});

describe("AvatarButton gravatar", () => {
  it("reconciles a hash that settles before a new observer subscribes", () => {
    let settleHash: (() => void) | undefined;
    const digest = vi.fn(() => {
      const digestResult = {
        then(transform: (value: ArrayBuffer) => string) {
          return {
            catch() {
              return {
                then(notify: (value: string | null) => void) {
                  settleHash = () => notify(transform(new Uint8Array(32).fill(17).buffer));
                  return Promise.resolve();
                },
              };
            },
          };
        },
      };
      return digestResult as unknown as Promise<ArrayBuffer>;
    });
    setCryptoDigest(digest);
    const avatar = {
      gravatarId: "subscription-race-id",
      identifier: "user",
      name: "Race User",
      type: "gravatar" as const,
    };
    const first = render(<AvatarButton aria-label="First" avatar={avatar} />);
    expect(first.host.querySelector("img")).toBeNull();
    expect(settleHash).toBeTypeOf("function");

    function SettleHashDuringCommit() {
      useLayoutEffect(() => settleHash?.(), []);
      return null;
    }

    const second = render(
      <>
        <AvatarButton aria-label="Second" avatar={avatar} />
        <SettleHashDuringCommit />
      </>,
    );

    expect(second.host.querySelector("img")?.getAttribute("src")).toContain(
      `/avatar/${"11".repeat(32)}?d=404&s=120`,
    );
    expect(digest).toHaveBeenCalledOnce();
  });

  it("uses the trimmed identifier, exact hash, and full configured base path", async () => {
    const digest = vi.fn(async (_algorithm: string, data: BufferSource) => {
      expect(new TextDecoder().decode(data as ArrayBuffer)).toBe("Mixed@Email.COM");
      return new Uint8Array(32).fill(10).buffer;
    });
    setCryptoDigest(digest);
    (window as Window & { __initialData?: { gravatarBaseUrl?: unknown } }).__initialData = {
      gravatarBaseUrl: " https://images.example.com/proxy/gravatar/// ",
    };
    const view = render(
      <AvatarButton
        aria-label="Open"
        avatar={{
          gravatarId: " Mixed@Email.COM ",
          identifier: "user",
          name: "Test User",
          type: "gravatar",
        }}
      />,
    );
    await flush();
    expect(view.host.querySelector("img")?.getAttribute("src")).toBe(
      `https://images.example.com/proxy/gravatar/avatar/${"0a".repeat(32)}?d=404&s=120`,
    );
    expect(digest).toHaveBeenCalledOnce();
  });

  it("caches hash work without caching the configured base URL", async () => {
    const digest = vi.fn(async () => new Uint8Array(32).fill(11).buffer);
    setCryptoDigest(digest);
    const initialData = window as Window & {
      __initialData?: { gravatarBaseUrl?: unknown };
    };
    initialData.__initialData = {
      gravatarBaseUrl: "https://first.example/base",
    };
    const first = render(
      <AvatarButton
        aria-label="First"
        avatar={{
          gravatarId: "cache-id",
          identifier: "user",
          name: "Test User",
          type: "gravatar",
        }}
      />,
    );
    await flush();
    expect(first.host.querySelector("img")?.getAttribute("src")).toContain(
      "https://first.example/base/avatar/",
    );

    initialData.__initialData = {
      gravatarBaseUrl: "https://second.example/path",
    };
    const second = render(
      <AvatarButton
        aria-label="Second"
        avatar={{
          gravatarId: "cache-id",
          identifier: "user",
          name: "Test User",
          type: "gravatar",
        }}
      />,
    );
    await flush();
    expect(second.host.querySelector("img")?.getAttribute("src")).toContain(
      "https://second.example/path/avatar/",
    );
    expect(digest).toHaveBeenCalledOnce();
  });

  it("renders a settled hash synchronously for a new observer", async () => {
    const digest = vi.fn(async () => new Uint8Array(32).fill(14).buffer);
    setCryptoDigest(digest);
    const avatar = {
      gravatarId: "settled-cache-id",
      identifier: "user",
      name: "Settled User",
      type: "gravatar" as const,
    };
    const first = render(<AvatarButton aria-label="First" avatar={avatar} />);
    await flush();
    expect(first.host.querySelector("img")).not.toBeNull();

    const second = render(<AvatarButton aria-label="Second" avatar={avatar} />);
    expect(second.host.querySelector("img")).not.toBeNull();
    expect(digest).toHaveBeenCalledOnce();
  });

  it("retains an observed hash and collects the raw ID after five minutes", async () => {
    vi.useFakeTimers();
    const identifiers: string[] = [];
    const digest = vi.fn(async (_algorithm: string, data: BufferSource) => {
      identifiers.push(new TextDecoder().decode(data as ArrayBuffer));
      return new Uint8Array(32).fill(15).buffer;
    });
    setCryptoDigest(digest);
    const avatar = {
      gravatarId: "  gc-raw-id  ",
      identifier: "user",
      name: "GC User",
      type: "gravatar" as const,
    };
    const first = render(<AvatarButton aria-label="First" avatar={avatar} />);
    await flush();

    act(() => vi.advanceTimersByTime(10 * 60 * 1000));
    const second = render(<AvatarButton aria-label="Second" avatar={avatar} />);
    expect(second.host.querySelector("img")).not.toBeNull();
    expect(digest).toHaveBeenCalledOnce();

    first.unmount();
    second.unmount();
    act(() => vi.advanceTimersByTime(5 * 60 * 1000));
    const third = render(<AvatarButton aria-label="Third" avatar={avatar} />);
    expect(third.host.querySelector("img")).toBeNull();
    await flush();
    expect(third.host.querySelector("img")).not.toBeNull();
    expect(digest).toHaveBeenCalledTimes(2);
    expect(identifiers).toEqual(["gc-raw-id", "gc-raw-id"]);
  });

  it("retries a transient null hash after its inactive GC window", async () => {
    vi.useFakeTimers();
    let shouldFail = true;
    const digest = vi.fn(async () => {
      if (shouldFail) throw new Error("temporary digest failure");
      return new Uint8Array(32).fill(16).buffer;
    });
    setCryptoDigest(digest);
    const avatar = {
      gravatarId: "transient-hash-id",
      identifier: "user",
      name: "Transient User",
      type: "gravatar" as const,
    };
    const first = render(<AvatarButton aria-label="First" avatar={avatar} />);
    await flush();
    expect(first.host.querySelector("img")).toBeNull();

    first.unmount();
    shouldFail = false;
    act(() => vi.advanceTimersByTime(5 * 60 * 1000));
    const second = render(<AvatarButton aria-label="Second" avatar={avatar} />);
    await flush();
    expect(second.host.querySelector("img")).not.toBeNull();
    expect(digest).toHaveBeenCalledTimes(2);
  });

  it("falls back for an empty identifier, missing crypto, or digest failure", async () => {
    const digest = vi.fn(async () => {
      throw new Error("digest failed");
    });
    setCryptoDigest(digest);
    const empty = render(
      <AvatarButton
        aria-label="Empty"
        avatar={{
          gravatarId: "  ",
          identifier: "user",
          name: "Empty User",
          type: "gravatar",
        }}
      />,
    );
    expect(empty.host.querySelector("img")).toBeNull();
    expect(empty.host.textContent).toContain("EU");

    Object.defineProperty(window, "crypto", {
      configurable: true,
      value: {},
    });
    const unavailable = render(
      <AvatarButton
        aria-label="Unavailable"
        avatar={{
          gravatarId: "no-crypto",
          identifier: "user",
          name: "No Crypto",
          type: "gravatar",
        }}
      />,
    );
    await flush();
    expect(unavailable.host.querySelector("img")).toBeNull();

    setCryptoDigest(digest);
    const failed = render(
      <AvatarButton
        aria-label="Failed"
        avatar={{
          gravatarId: "failure-id",
          identifier: "user",
          name: "Failed Hash",
          type: "gravatar",
        }}
      />,
    );
    await flush();
    expect(failed.host.querySelector("img")).toBeNull();
    expect(digest).toHaveBeenCalledOnce();
  });

  it("falls back after an image error and recovers for a changed gravatar ID", async () => {
    let byte = 12;
    setCryptoDigest(async () => new Uint8Array(32).fill(byte++).buffer);
    const avatar = (gravatarId: string) => ({
      gravatarId,
      identifier: "user",
      name: "Test User",
      type: "gravatar" as const,
    });
    const view = render(<AvatarButton aria-label="Open" avatar={avatar("first-gravatar")} />);
    await flush();
    act(() => view.host.querySelector("img")?.dispatchEvent(new Event("error", { bubbles: true })));
    expect(view.host.querySelector("img")).toBeNull();

    view.rerender(<AvatarButton aria-label="Open" avatar={avatar("second-gravatar")} />);
    await flush();
    expect(view.host.querySelector("img")?.getAttribute("src")).toContain(
      `/avatar/${"0d".repeat(32)}?d=404&s=120`,
    );
  });
});

describe("AvatarButton Button behavior and geometry", () => {
  it("uses the exact default, inherited, and explicit frame sizes", () => {
    const view = render(
      <>
        <AvatarButton aria-label="Default" avatar={letterAvatar("Default", "default")} />
        <SizeProvider size="xs">
          <AvatarButton aria-label="Inherited" avatar={letterAvatar("Inherited", "inherited")} />
          <AvatarButton
            aria-label="Explicit"
            avatar={letterAvatar("Explicit", "explicit")}
            size="sm"
          />
        </SizeProvider>
      </>,
    );
    const expected = [
      ["Default", "size-9", "min-w-9", "rounded-[8px]"],
      ["Inherited", "size-7", "min-w-7", "rounded-[5px]"],
      ["Explicit", "size-8", "min-w-8", "rounded-[6px]"],
    ];
    for (const [label, size, minWidth, radius] of expected) {
      const button = view.host.querySelector(`[aria-label="${label}"]`)!;
      const frame = button.querySelector('[data-slot="avatar-button-frame"]')!;
      expect(frame.tagName).toBe("DIV");
      expect(button.className).toContain(size);
      expect(button.className).toContain(minWidth);
      expect(button.className).toContain(radius);
      expect(button.className).toContain("!p-0");
      expect(frame.className).toContain(size);
      expect(frame.className).toContain(radius);
      expect(frame.className).toContain("box-border");
      expect(frame.className).toContain("overflow-hidden");
      expect(frame.className).toContain("will-change-transform");
    }
  });

  it("forwards ref, native props, style, class, click, disabled, and busy behavior", () => {
    const ref = createRef<HTMLButtonElement>();
    const onClick = vi.fn();
    const view = render(
      <AvatarButton
        aria-label="Open profile"
        avatar={letterAvatar("Jane Doe")}
        className="consumer-class"
        data-consumer="native"
        onClick={onClick}
        ref={ref}
        style={{ marginTop: 3 }}
      />,
    );
    const button = view.host.querySelector("button")!;
    expect(ref.current).toBe(button);
    expect(button.className).toContain("consumer-class");
    expect(button.dataset.consumer).toBe("native");
    expect(button.style.marginTop).toBe("3px");
    act(() => button.click());
    expect(onClick).toHaveBeenCalledOnce();

    view.rerender(
      <AvatarButton
        aria-label="Open profile"
        avatar={letterAvatar("Jane Doe")}
        busy
        onClick={onClick}
        ref={ref}
      />,
    );
    expect(button.getAttribute("aria-busy")).toBe("true");
    act(() => button.click());
    expect(onClick).toHaveBeenCalledOnce();

    view.rerender(
      <AvatarButton
        aria-label="Open profile"
        avatar={letterAvatar("Jane Doe")}
        disabled
        onClick={onClick}
        ref={ref}
      />,
    );
    expect(button.disabled).toBe(true);
    act(() => button.click());
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("preserves Button click tracking", () => {
    const tracking = vi.fn();
    const view = render(
      <TrackingContextProvider value={() => tracking}>
        <AvatarButton
          aria-label="Open profile"
          analyticsEventKey="avatar.open"
          analyticsParams={{ source: "profile" }}
          avatar={letterAvatar("Jane Doe")}
        />
      </TrackingContextProvider>,
    );
    act(() =>
      view.host.querySelector("button")?.dispatchEvent(new MouseEvent("click", { bubbles: true })),
    );
    expect(tracking).toHaveBeenCalledOnce();
    expect(tracking).toHaveBeenCalledWith(
      expect.objectContaining({
        "aria-label": "Open profile",
        analyticsEventKey: "avatar.open",
        analyticsParams: expect.objectContaining({ source: "profile" }),
        clickType: "button",
      }),
    );
  });
});
