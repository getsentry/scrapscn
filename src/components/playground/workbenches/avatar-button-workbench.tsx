"use client";

import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { AvatarButton } from "@/components/ui/avatar-button";

const svg = (fill: string, inset = 0) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect x="${inset}" y="${inset}" width="${
      120 - inset * 2
    }" height="${120 - inset * 2}" fill="${fill}"/></svg>`,
  )}`;
const kinds = ["letter", "upload", "padded", "broken", "gravatar"] as const;
const sizes = ["xs", "sm", "md"] as const;
type State = {
  busy: boolean;
  disabled: boolean;
  identifier: string;
  kind: (typeof kinds)[number];
  name: string;
  size: (typeof sizes)[number];
};
const defaults = (): State => ({
  busy: false,
  disabled: false,
  identifier: "user-1",
  kind: "letter",
  name: "Jane Doe",
  size: "md",
});
const parse = (params: URLSearchParams): State => ({
  busy: params.get("avatarButtonBusy") === "true",
  disabled: params.get("avatarButtonDisabled") === "true",
  identifier: params.get("avatarButtonIdentifier") ?? "user-1",
  kind: kinds.find((kind) => kind === params.get("avatarButtonKind")) ?? "letter",
  name: params.get("avatarButtonName") ?? "Jane Doe",
  size: sizes.find((size) => size === params.get("avatarButtonSize")) ?? "md",
});
const serialize = (state: State) =>
  new URLSearchParams(
    Object.entries(state).map(([key, value]) => [
      `avatarButton${key[0]?.toUpperCase()}${key.slice(1)}`,
      String(value),
    ]),
  );
const field = "h-11 rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm";

export function AvatarButtonWorkbench({ children, onSearchChange, sourceSearch }: WorkbenchProps) {
  const [state, setState] = useState(() => parse(new URLSearchParams(sourceSearch)));
  const [clicks, setClicks] = useState(0);
  const update = (next: State) => {
    setState(next);
    onSearchChange(serialize(next));
  };
  const avatar =
    state.kind === "letter"
      ? {
          type: "letter_avatar" as const,
          identifier: state.identifier,
          name: state.name,
        }
      : state.kind === "gravatar"
        ? {
            type: "gravatar" as const,
            identifier: state.identifier,
            name: state.name,
            gravatarId: "",
          }
        : {
            type: "upload" as const,
            identifier: state.identifier,
            name: state.name,
            uploadUrl:
              state.kind === "padded"
                ? svg("#ff9838", 24)
                : state.kind === "broken"
                  ? "data:image/svg+xml,broken"
                  : svg("#7553ff"),
          };
  return children({
    breadcrumbs: ["Components", "AvatarButton"],
    controls: (
      <div className="grid gap-4">
        <div>
          <h2 className="text-sm font-semibold">Avatar button setup</h2>
          <p className="text-xs text-muted-foreground">
            Choose a local avatar source and share its state.
          </p>
        </div>
        <label className="grid gap-1 text-sm">
          Avatar type
          <select
            aria-label="Avatar type"
            className={field}
            onChange={(event) =>
              update({
                ...state,
                kind: kinds.find((kind) => kind === event.target.value) ?? "letter",
              })
            }
            value={state.kind}
          >
            {kinds.map((kind) => (
              <option key={kind}>{kind}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Avatar size
          <select
            aria-label="Avatar button size"
            className={field}
            onChange={(event) =>
              update({
                ...state,
                size: sizes.find((size) => size === event.target.value) ?? "md",
              })
            }
            value={state.size}
          >
            {sizes.map((size) => (
              <option key={size}>{size}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Avatar name
          <input
            aria-label="Avatar name"
            className={field}
            onChange={(event) => update({ ...state, name: event.target.value })}
            value={state.name}
          />
        </label>
        <label className="grid gap-1 text-sm">
          Avatar identifier
          <input
            aria-label="Avatar identifier"
            className={field}
            onChange={(event) => update({ ...state, identifier: event.target.value })}
            value={state.identifier}
          />
        </label>
        {(["disabled", "busy"] as const).map((key) => (
          <label className="flex min-h-11 items-center gap-2 text-sm" key={key}>
            <input
              aria-label={`${key} avatar button`}
              checked={state[key]}
              className="size-5"
              onChange={(event) => update({ ...state, [key]: event.target.checked })}
              type="checkbox"
            />
            {key}
          </label>
        ))}
      </div>
    ),
    description:
      "Test regular Scraps AvatarButton sizing, image fallback, letter avatars, and Button behavior.",
    preview: (
      <div
        className="grid min-h-72 content-center justify-items-center gap-4 rounded-md border border-border"
        data-testid="avatar-button-preview"
      >
        <AvatarButton
          aria-label="Open profile"
          avatar={avatar}
          busy={state.busy}
          disabled={state.disabled}
          onClick={() => setClicks((value) => value + 1)}
          size={state.size}
        />
        <p className="text-sm">Clicks: {clicks}</p>
      </div>
    ),
    reset: () => {
      const next = defaults();
      setState(next);
      setClicks(0);
      return serialize(next);
    },
    serialize: () => serialize(state),
    title: "AvatarButton",
  });
}
