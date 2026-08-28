"use client";

import Color from "color";
import {
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
  type Ref,
  type SyntheticEvent,
} from "react";

import { Button, type ButtonProps } from "./button";
import { useSizeContext } from "./size-context";
import type { TooltipProps } from "./tooltip";

type BaseAvatarStyleProps = {
  round?: boolean;
  size?: number;
  suggested?: boolean;
};

type AvatarProps = BaseAvatarStyleProps & {
  "data-test-id"?: string;
  className?: string;
  hasTooltip?: boolean;
  ref?: Ref<HTMLSpanElement>;
  style?: CSSProperties;
  title?: string;
  tooltip?: ReactNode;
  tooltipOptions?: Omit<TooltipProps, "children" | "title">;
};

type BaseAvatarProps =
  | (AvatarProps & {
      gravatarId: string;
      identifier: string;
      name: string;
      type: "gravatar";
    })
  | (AvatarProps & {
      identifier: string;
      name: string;
      type: "letter_avatar";
    })
  | (AvatarProps & {
      identifier: string;
      name: string;
      type: "upload";
      uploadUrl: string;
    });

type AvatarButtonProps = Omit<
  ButtonProps,
  "children" | "data-size" | "icon" | "size" | "variant"
> & {
  "aria-label": string;
  avatar: BaseAvatarProps;
  size?: "xs" | "sm" | "md";
};

type Sample = {
  darkChonk: string;
  lightChonk: string;
  padded: boolean;
};

type ResourceState<Value> = { status: "pending" } | { status: "settled"; value: Value };

type ResourceEntry<Value> = {
  gcTimer: ReturnType<typeof setTimeout> | null;
  listeners: Set<() => void>;
  observers: number;
  state: ResourceState<Value>;
};

type ResourceCache<Value> = Map<string, ResourceEntry<Value>>;

type AvatarVariables = CSSProperties & {
  "--avatar-chonk-dark"?: string;
  "--avatar-chonk-light"?: string;
  "--avatar-letter-background-dark": string;
  "--avatar-letter-background-light": string;
  "--avatar-letter-content-dark": string;
  "--avatar-letter-content-light": string;
};

const SWATCHES = {
  dark: {
    backgrounds: [
      "#7553FF",
      "#5D3EB2",
      "#50219C",
      "#7C2282",
      "#B0009C",
      "#F0369A",
      "#FA6769",
      "#FF9838",
      "#FFD00E",
      "#67C800",
    ],
  },
  light: {
    backgrounds: [
      "#7553FF",
      "#5533B2",
      "#3A1873",
      "#7C2282",
      "#B82D90",
      "#F0369A",
      "#FA6769",
      "#FF9838",
      "#FFD00E",
      "#67C800",
    ],
  },
} as const;

const RESOURCE_GC_TIME = 5 * 60 * 1000;
const sampleResources: ResourceCache<Sample | null> = new Map();
const gravatarHashResources: ResourceCache<string | null> = new Map();

const buttonSizeClasses = {
  md: "size-9 min-w-9 rounded-[8px] [--avatar-lift:2px]",
  sm: "size-8 min-w-8 rounded-[6px] [--avatar-lift:2px]",
  xs: "size-7 min-w-7 rounded-[5px] [--avatar-lift:1px]",
} as const;

const frameSizeClasses = {
  md: "size-9 rounded-[8px]",
  sm: "size-8 rounded-[6px]",
  xs: "size-7 rounded-[5px]",
} as const;

const letterThemeClasses =
  "[--avatar-letter-background:var(--avatar-letter-background-light)] [--avatar-letter-content:var(--avatar-letter-content-light)] dark:[--avatar-letter-background:var(--avatar-letter-background-dark)] dark:[--avatar-letter-content:var(--avatar-letter-content-dark)]";
const chonkThemeClasses =
  "[--avatar-chonk:var(--avatar-chonk-light)] dark:[--avatar-chonk:var(--avatar-chonk-dark)]";
const chonkOverrideClasses =
  "before:!bg-[var(--avatar-chonk)] before:!shadow-[0_var(--avatar-lift)_0_0_var(--avatar-chonk)] after:!border-[var(--avatar-chonk)]";

function getInitials(name: string | undefined) {
  const sanitized = name === undefined ? undefined : String(name).trim();
  if (!sanitized || sanitized === "[Filtered]") return "?";
  const words = sanitized.split(" ");
  const first = Array.from(words[0] ?? "")[0] ?? "";
  const last = words.length > 1 ? (Array.from(words[words.length - 1] ?? "")[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
}

function swatch(identifier: string, theme: "light" | "dark") {
  let hash = 0;
  for (let index = 0; index < identifier.length; index += 1) {
    hash += identifier.charCodeAt(index);
  }
  const index = hash % 10;
  const background = SWATCHES[theme].backgrounds[index];
  return {
    background,
    chonk: Color(background).darken(0.65).hex(),
    content: index < 6 ? "#fff" : "#000",
  };
}

function uploadSource(source: string) {
  if (source.startsWith("data:")) return source;
  return `${source}${source.includes("?") ? "&" : "?"}s=120`;
}

function gravatarBaseUrl() {
  const fallback = "https://gravatar.com";
  if (typeof window === "undefined") return fallback;
  const candidate = (
    window as Window & {
      __initialData?: { gravatarBaseUrl?: unknown };
    }
  ).__initialData?.gravatarBaseUrl;
  if (typeof candidate !== "string") return fallback;
  try {
    const parsed = new URL(candidate.trim());
    if (parsed.protocol !== "https:") return fallback;
    return parsed.href.replace(/\/+$/, "");
  } catch {
    return fallback;
  }
}

function loadGravatarHash(identifier: string) {
  if (typeof window === "undefined" || window.crypto?.subtle?.digest === undefined) {
    return Promise.resolve(null);
  }
  try {
    return window.crypto.subtle
      .digest("SHA-256", new TextEncoder().encode(identifier))
      .then((value) =>
        Array.from(new Uint8Array(value))
          .map((byte) => byte.toString(16).padStart(2, "0"))
          .join(""),
      )
      .catch(() => null);
  } catch {
    return Promise.resolve(null);
  }
}

function observeResource<Value>(
  cache: ResourceCache<Value>,
  key: string,
  load: (resourceKey: string) => Promise<Value>,
  listener: () => void,
) {
  let entry = cache.get(key);
  if (!entry) {
    entry = {
      gcTimer: null,
      listeners: new Set(),
      observers: 0,
      state: { status: "pending" },
    };
    cache.set(key, entry);
    const pendingEntry = entry;
    void load(key).then((value) => {
      if (cache.get(key) !== pendingEntry) return;
      pendingEntry.state = { status: "settled", value };
      for (const notify of pendingEntry.listeners) notify();
    });
  }

  if (entry.gcTimer) {
    clearTimeout(entry.gcTimer);
    entry.gcTimer = null;
  }
  entry.observers += 1;
  entry.listeners.add(listener);

  const observedEntry = entry;
  return () => {
    observedEntry.listeners.delete(listener);
    observedEntry.observers -= 1;
    if (observedEntry.observers !== 0) return;
    observedEntry.gcTimer = setTimeout(() => {
      if (observedEntry.observers === 0 && cache.get(key) === observedEntry) {
        cache.delete(key);
      }
    }, RESOURCE_GC_TIME);
  };
}

function useObservedResource<Value>(
  cache: ResourceCache<Value>,
  key: string | null,
  load: (resourceKey: string) => Promise<Value>,
) {
  const subscribe = useCallback(
    (notify: () => void) => {
      if (!key) return () => {};
      return observeResource(cache, key, load, notify);
    },
    [cache, key, load],
  );
  const getSnapshot = useCallback(() => (key ? cache.get(key)?.state : undefined), [cache, key]);
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return state?.status === "settled" ? state.value : undefined;
}

function shouldPad(data: Uint8ClampedArray) {
  const alpha = (x: number, y: number) => data[(y * 12 + x) * 4 + 3] ?? 0;
  const opaqueEdge = (coordinate: (index: number) => number) =>
    Array.from({ length: 12 }, (_, index) => coordinate(index)).some((value) => value >= 128);
  if (
    !opaqueEdge((index) => alpha(index, 0)) ||
    !opaqueEdge((index) => alpha(index, 11)) ||
    !opaqueEdge((index) => alpha(0, index)) ||
    !opaqueEdge((index) => alpha(11, index))
  ) {
    return true;
  }
  return alpha(0, 0) < 128 || alpha(11, 0) < 128 || alpha(0, 11) < 128 || alpha(11, 11) < 128;
}

function sampleImage(image: HTMLImageElement): Sample | null {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 12;
    canvas.height = 12;
    const context = canvas.getContext("2d");
    if (!context) return null;
    const naturalWidth = image.naturalWidth || image.width;
    const naturalHeight = image.naturalHeight || image.height;
    const scale =
      naturalWidth && naturalHeight ? Math.min(12 / naturalWidth, 12 / naturalHeight) : 1;
    const width = naturalWidth ? naturalWidth * scale : 12;
    const height = naturalHeight ? naturalHeight * scale : 12;
    context.drawImage(image, (12 - width) / 2, (12 - height) / 2, width, height);
    const data = context.getImageData(0, 0, 12, 12).data;
    const all: Array<[number, number, number]> = [];
    const chromatic: Array<[number, number, number]> = [];
    for (let index = 0; index < data.length; index += 4) {
      const red = data[index] ?? 0;
      const green = data[index + 1] ?? 0;
      const blue = data[index + 2] ?? 0;
      const alpha = data[index + 3] ?? 0;
      if (alpha < 128) continue;
      const pixel: [number, number, number] = [red, green, blue];
      all.push(pixel);
      if ((Math.max(red, green, blue) - Math.min(red, green, blue)) / 255 >= 0.15) {
        chromatic.push(pixel);
      }
    }
    const pixels = chromatic.length ? chromatic : all;
    if (!pixels.length) return null;
    const mean = [0, 1, 2].map((channel) =>
      Math.round(pixels.reduce((sum, pixel) => sum + (pixel[channel] ?? 0), 0) / pixels.length),
    );
    const hex = `#${mean.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
    return {
      darkChonk: Color(hex).darken(0.85).hex(),
      lightChonk: Color(hex).darken(0.45).hex(),
      padded: shouldPad(data),
    };
  } catch {
    return null;
  }
}

function fetchAvatarSample(source: string): Promise<Sample | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(sampleImage(image));
    image.onerror = () => resolve(null);
    image.src = source;
  });
}

function useImageSource(avatar: BaseAvatarProps) {
  const gravatarId = avatar.type === "gravatar" ? avatar.gravatarId.trim() : "";
  const gravatarHash = useObservedResource(
    gravatarHashResources,
    gravatarId || null,
    loadGravatarHash,
  );
  const [failedSource, setFailedSource] = useState<string | null>(null);

  let resolvedSource: string | null = null;
  if (avatar.type === "upload") {
    resolvedSource = uploadSource(avatar.uploadUrl);
  } else if (avatar.type === "gravatar" && gravatarHash) {
    resolvedSource = `${gravatarBaseUrl()}/avatar/${gravatarHash}?d=404&s=120`;
  }

  const source = resolvedSource === failedSource ? null : resolvedSource;
  return {
    onError: (event: SyntheticEvent<HTMLImageElement>) =>
      setFailedSource(event.currentTarget.getAttribute("src")),
    source,
  };
}

export function AvatarButton({
  avatar,
  className,
  size: explicitSize,
  style,
  ...props
}: AvatarButtonProps) {
  const contextSize = useSizeContext();
  const size = explicitSize ?? contextSize ?? "md";
  const { source, onError } = useImageSource(avatar);
  const sample = useObservedResource(sampleResources, source, fetchAvatarSample) ?? null;
  const letters = useMemo(
    () => ({
      dark: swatch(avatar.identifier, "dark"),
      light: swatch(avatar.identifier, "light"),
    }),
    [avatar.identifier],
  );
  const chonk = source
    ? sample
    : {
        darkChonk: letters.dark.chonk,
        lightChonk: letters.light.chonk,
        padded: false,
      };
  const variables: AvatarVariables = {
    "--avatar-letter-background-dark": letters.dark.background,
    "--avatar-letter-background-light": letters.light.background,
    "--avatar-letter-content-dark": letters.dark.content,
    "--avatar-letter-content-light": letters.light.content,
    ...(chonk
      ? {
          "--avatar-chonk-dark": chonk.darkChonk,
          "--avatar-chonk-light": chonk.lightChonk,
        }
      : {}),
    ...style,
  };

  return (
    <Button
      {...props}
      className={[
        "!p-0",
        buttonSizeClasses[size],
        letterThemeClasses,
        chonk ? chonkThemeClasses : null,
        chonk ? chonkOverrideClasses : null,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      size={size}
      style={variables}
    >
      <div
        className={[
          "relative flex box-border overflow-hidden border will-change-transform",
          frameSizeClasses[size],
          chonk ? "border-[var(--avatar-chonk)]" : "border-transparent",
          sample?.padded ? "bg-[var(--scraps-avatar-padded-background)] p-1" : null,
        ]
          .filter(Boolean)
          .join(" ")}
        data-slot="avatar-button-frame"
      >
        {source ? (
          // eslint-disable-next-line @next/next/no-img-element -- The canonical source and error fallback require a native image element.
          <img
            alt={avatar.name}
            className="relative top-0 left-0 size-full rounded-none object-contain select-none"
            key={source}
            loading="lazy"
            onError={onError}
            src={source}
          />
        ) : (
          <svg
            aria-hidden="true"
            className="relative top-0 left-0 size-full rounded-none select-none"
            viewBox="0 0 120 120"
          >
            <rect fill="var(--avatar-letter-background)" height="120" width="120" x="0" y="0" />
            <text
              dominantBaseline="central"
              fill="var(--avatar-letter-content)"
              fontSize="65"
              fontWeight="bold"
              textAnchor="middle"
              x="50%"
              y="50%"
            >
              {getInitials(avatar.name)}
            </text>
          </svg>
        )}
      </div>
    </Button>
  );
}
