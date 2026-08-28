"use client";

import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { Button } from "@/components/ui/button";
import {
  PictureInPicturePortal,
  PictureInPictureProvider,
  usePictureInPicture,
} from "@/components/ui/picture-in-picture";

type State = {
  height: number;
  preferInitialWindowPlacement: boolean;
  width: number;
};

function defaults(): State {
  return { height: 600, preferInitialWindowPlacement: true, width: 480 };
}

function positiveInteger(value: number, fallback: number) {
  return Number.isFinite(value) && value > 0 ? Math.round(value) : fallback;
}

function numberParam(params: URLSearchParams, name: string, fallback: number) {
  return positiveInteger(Number(params.get(name)), fallback);
}

function parse(params: URLSearchParams): State {
  return {
    height: numberParam(params, "pipHeight", 600),
    preferInitialWindowPlacement: params.get("pipPreferInitialWindowPlacement") !== "false",
    width: numberParam(params, "pipWidth", 480),
  };
}

function serialize(state: State) {
  return new URLSearchParams({
    pipHeight: String(state.height),
    pipPreferInitialWindowPlacement: String(state.preferInitialWindowPlacement),
    pipWidth: String(state.width),
  });
}

function PictureInPicturePreview({ state }: { state: State }) {
  const { closePipWindow, isSupported, pipWindow, requestPipWindow } = usePictureInPicture();

  return (
    <div className="grid justify-items-center gap-4 text-center">
      <div className="flex flex-wrap justify-center gap-2">
        <Button
          disabled={!isSupported || pipWindow !== null}
          onClick={() => requestPipWindow(state)}
        >
          Open picture-in-picture
        </Button>
        <Button disabled={pipWindow === null} variant="secondary" onClick={closePipWindow}>
          Close picture-in-picture
        </Button>
      </div>
      <output className="text-sm text-muted-foreground" data-testid="pip-status">
        {!isSupported
          ? "Document Picture-in-Picture is unavailable"
          : pipWindow
            ? "Picture-in-picture is open"
            : "Picture-in-picture is ready"}
      </output>
      {pipWindow ? (
        <PictureInPicturePortal pipWindow={pipWindow}>
          <main
            className="grid h-full place-items-center bg-background p-6 text-foreground"
            data-testid="pip-portal-content"
          >
            <section className="max-w-sm rounded-lg border border-border bg-card p-6 text-center shadow-sm">
              <h1 className="text-lg/6 font-semibold">Scrapscn prototype</h1>
              <p className="mt-2 text-sm/5 text-muted-foreground">
                This content is rendered by React in the native picture-in-picture document.
              </p>
            </section>
          </main>
        </PictureInPicturePortal>
      ) : null}
    </div>
  );
}

const fieldClassName =
  "h-11 rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm";

export function PictureInPictureWorkbench({
  children,
  onSearchChange,
  sourceSearch,
}: WorkbenchProps) {
  const [state, setState] = useState(() => parse(new URLSearchParams(sourceSearch)));
  const [providerKey, setProviderKey] = useState(0);
  const update = (next: State) => {
    setState(next);
    onSearchChange(serialize(next));
  };
  const controls = (
    <div className="grid gap-4">
      <div>
        <h2 className="text-sm font-semibold">Picture-in-picture setup</h2>
        <p className="text-xs text-muted-foreground">
          Configure the requested native window size and placement.
        </p>
      </div>
      <label className="grid gap-1 text-sm">
        Window width
        <input
          aria-label="Picture-in-picture width"
          className={fieldClassName}
          min="1"
          type="number"
          value={state.width}
          onChange={(event) =>
            update({
              ...state,
              width: positiveInteger(event.target.valueAsNumber, state.width),
            })
          }
        />
      </label>
      <label className="grid gap-1 text-sm">
        Window height
        <input
          aria-label="Picture-in-picture height"
          className={fieldClassName}
          min="1"
          type="number"
          value={state.height}
          onChange={(event) =>
            update({
              ...state,
              height: positiveInteger(event.target.valueAsNumber, state.height),
            })
          }
        />
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          aria-label="Prefer initial window placement"
          checked={state.preferInitialWindowPlacement}
          className="size-5 touch-manipulation"
          type="checkbox"
          onChange={(event) =>
            update({
              ...state,
              preferInitialWindowPlacement: event.target.checked,
            })
          }
        />
        Prefer the browser&apos;s initial placement
      </label>
    </div>
  );
  const preview = (
    <div data-testid="picture-in-picture-preview">
      <PictureInPictureProvider key={providerKey}>
        <PictureInPicturePreview state={state} />
      </PictureInPictureProvider>
    </div>
  );

  return children({
    breadcrumbs: ["Components", "PictureInPicture"],
    controls,
    description:
      "Open a native Document Picture-in-Picture window, copy Tailwind styles, and portal React content into it.",
    preview,
    reset: () => {
      const next = defaults();
      setState(next);
      setProviderKey((key) => key + 1);
      return serialize(next);
    },
    serialize: () => serialize(state),
    title: "PictureInPicture",
  });
}
