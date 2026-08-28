"use client";

import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { Image } from "@/components/ui/image";

const imageSource =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='360' viewBox='0 0 640 360'%3E%3Crect width='640' height='360' fill='%237553ff'/%3E%3Ccircle cx='470' cy='120' r='100' fill='%23fc5cb4'/%3E%3Ctext x='48' y='210' fill='white' font-family='sans-serif' font-size='48'%3ESentry%3C/text%3E%3C/svg%3E";
const brokenImageSource = "data:image/svg+xml,broken";

const aspectRatios = ["auto", "1 / 1", "4 / 3", "16 / 9"] as const;
const fits = ["contain", "cover"] as const;
const positions = ["center", "top", "bottom", "left", "right"] as const;
const radii = ["0", "sm", "md", "lg", "full"] as const;
const loadings = ["lazy", "eager"] as const;
const responsivePresets = ["fixed", "responsive"] as const;

type AspectRatio = (typeof aspectRatios)[number];
type Fit = (typeof fits)[number];
type Position = (typeof positions)[number];
type Radius = (typeof radii)[number];
type Loading = (typeof loadings)[number];
type ResponsivePreset = (typeof responsivePresets)[number];

interface ImageWorkbenchState {
  aspectRatio: AspectRatio;
  broken: boolean;
  fit: Fit;
  loading: Loading;
  position: Position;
  radius: Radius;
  responsive: ResponsivePreset;
}

function choose<T extends readonly string[]>(
  values: T,
  value: string | null,
  fallback: T[number],
): T[number] {
  return values.find((candidate) => candidate === value) ?? fallback;
}

function defaultState(): ImageWorkbenchState {
  return {
    aspectRatio: "16 / 9",
    broken: false,
    fit: "cover",
    loading: "lazy",
    position: "center",
    radius: "md",
    responsive: "fixed",
  };
}

function parseImageWorkbench(params: URLSearchParams): ImageWorkbenchState {
  return {
    aspectRatio: choose(aspectRatios, params.get("imageAspectRatio"), "16 / 9"),
    broken: params.get("imageBroken") === "true",
    fit: choose(fits, params.get("imageFit"), "cover"),
    loading: choose(loadings, params.get("imageLoading"), "lazy"),
    position: choose(positions, params.get("imagePosition"), "center"),
    radius: choose(radii, params.get("imageRadius"), "md"),
    responsive: choose(responsivePresets, params.get("imageResponsive"), "fixed"),
  };
}

function serializeImageWorkbench(state: ImageWorkbenchState): URLSearchParams {
  return new URLSearchParams({
    imageAspectRatio: state.aspectRatio,
    imageBroken: String(state.broken),
    imageFit: state.fit,
    imageLoading: state.loading,
    imagePosition: state.position,
    imageRadius: state.radius,
    imageResponsive: state.responsive,
  });
}

const selectClassName =
  "h-11 rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm";

function ImageSelect<T extends string>({
  label,
  onChange,
  value,
  values,
}: {
  label: string;
  onChange: (value: T) => void;
  value: T;
  values: readonly T[];
}) {
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <select
        aria-label={label}
        className={selectClassName}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {values.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ImageWorkbench({ children, onSearchChange, sourceSearch }: WorkbenchProps) {
  const [state, setState] = useState(() => parseImageWorkbench(new URLSearchParams(sourceSearch)));
  const [didFallback, setDidFallback] = useState(false);

  function update(next: ImageWorkbenchState) {
    setState(next);
    setDidFallback(false);
    onSearchChange(serializeImageWorkbench(next));
  }

  const controls = (
    <div className="grid gap-4">
      <div>
        <h2 className="text-sm font-semibold">Image setup</h2>
        <p className="text-xs text-muted-foreground">Changes stay in the share URL.</p>
      </div>
      <ImageSelect
        label="Aspect ratio"
        value={state.aspectRatio}
        values={aspectRatios}
        onChange={(aspectRatio) => update({ ...state, aspectRatio })}
      />
      <ImageSelect
        label="Object fit"
        value={state.fit}
        values={fits}
        onChange={(fit) => update({ ...state, fit })}
      />
      <ImageSelect
        label="Object position"
        value={state.position}
        values={positions}
        onChange={(position) => update({ ...state, position })}
      />
      <ImageSelect
        label="Radius"
        value={state.radius}
        values={radii}
        onChange={(radius) => update({ ...state, radius })}
      />
      <ImageSelect
        label="Loading"
        value={state.loading}
        values={loadings}
        onChange={(loading) => update({ ...state, loading })}
      />
      <ImageSelect
        label="Responsive preset"
        value={state.responsive}
        values={responsivePresets}
        onChange={(responsive) => update({ ...state, responsive })}
      />
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          aria-label="Broken image"
          checked={state.broken}
          className="size-5 touch-manipulation"
          type="checkbox"
          onChange={(event) => update({ ...state, broken: event.target.checked })}
        />
        Use broken source
      </label>
    </div>
  );
  const responsiveSize =
    state.responsive === "responsive"
      ? {
          height: { zero: "180px", md: "280px" },
          width: { zero: "100%", md: "480px" },
        }
      : { height: "240px", width: "360px" };
  const preview = (
    <div className="grid gap-3 rounded-md border border-border p-4">
      <Image
        alt="Sentry image workbench preview"
        aspectRatio={state.aspectRatio}
        data-testid="image-preview"
        height={responsiveSize.height}
        loading={state.loading}
        objectFit={state.fit}
        objectPosition={state.position}
        radius={state.radius}
        src={state.broken ? brokenImageSource : imageSource}
        width={responsiveSize.width}
        onError={(event) => {
          event.currentTarget.src = imageSource;
          setDidFallback(true);
        }}
      />
      <output data-testid="image-fallback-state">Fallback: {String(didFallback)}</output>
    </div>
  );

  return children({
    breadcrumbs: ["Components", "Image"],
    controls,
    description:
      "Test regular Scraps responsive dimensions, radius, image fitting, loading, and error fallback.",
    preview,
    reset: () => {
      const next = defaultState();
      setState(next);
      setDidFallback(false);
      return serializeImageWorkbench(next);
    },
    serialize: () => serializeImageWorkbench(state),
    title: "Image",
  });
}
