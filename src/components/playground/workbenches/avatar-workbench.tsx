"use client";

import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import {
  ActorAvatar,
  Avatar,
  AvatarList,
  OrganizationAvatar,
  ProjectAvatar,
  TeamAvatar,
  UserAvatar,
  type BaseAvatarProps,
} from "@/components/ui/avatar";
import {
  AvatarActorResolverProvider,
  type AvatarActorResolver,
} from "@/components/ui/avatar-actor-resolver";

const kinds = ["letter", "upload", "broken", "gravatar"] as const;
const sizes = [24, 32, 40, 48] as const;
type State = {
  kind: (typeof kinds)[number];
  name: string;
  round: boolean;
  size: (typeof sizes)[number];
  suggested: boolean;
};
const defaults = (): State => ({
  kind: "letter",
  name: "Jane Doe",
  round: false,
  size: 40,
  suggested: false,
});
const localAvatar =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%237553ff'/%3E%3C/svg%3E";
const field = "h-11 rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm";
const actorResolver: AvatarActorResolver = {
  resolveTeam: async (id) => ({
    id,
    name: "Resolved Team",
    slug: "resolved-team",
  }),
  resolveUser: async (id) => ({
    email: "resolved@example.com",
    id,
    ip_address: "",
    name: "Resolved User",
    username: "resolved-user",
  }),
};

function parse(params: URLSearchParams): State {
  const size = Number(params.get("avatarSize"));
  return {
    kind: kinds.find((kind) => kind === params.get("avatarKind")) ?? "letter",
    name: params.get("avatarName") ?? "Jane Doe",
    round: params.get("avatarRound") === "true",
    size: sizes.find((candidate) => candidate === size) ?? 40,
    suggested: params.get("avatarSuggested") === "true",
  };
}

function serialize(state: State) {
  return new URLSearchParams({
    avatarKind: state.kind,
    avatarName: state.name,
    avatarRound: String(state.round),
    avatarSize: String(state.size),
    avatarSuggested: String(state.suggested),
  });
}

function avatarProps(state: State): BaseAvatarProps {
  const shared = {
    identifier: "playground-avatar",
    name: state.name,
    round: state.round,
    size: state.size,
    suggested: state.suggested,
  };
  if (state.kind === "upload") {
    return { ...shared, type: "upload", uploadUrl: localAvatar };
  }
  if (state.kind === "broken") {
    return {
      ...shared,
      type: "upload",
      uploadUrl: "data:image/svg+xml,broken",
    };
  }
  if (state.kind === "gravatar") {
    return { ...shared, gravatarId: "", type: "gravatar" };
  }
  return { ...shared, type: "letter_avatar" };
}

export function AvatarWorkbench({ children, onSearchChange, sourceSearch }: WorkbenchProps) {
  const [state, setState] = useState(() => parse(new URLSearchParams(sourceSearch)));
  function update(next: State) {
    setState(next);
    onSearchChange(serialize(next));
  }

  return children({
    breadcrumbs: ["Components", "Avatar"],
    controls: (
      <div className="grid gap-4">
        <div>
          <h2 className="text-sm font-semibold">Avatar setup</h2>
          <p className="text-xs text-muted-foreground">
            Test local image fallback, shapes, sizes, and derived avatar types.
          </p>
        </div>
        <label className="grid gap-1 text-sm">
          Avatar type
          <select
            aria-label="Avatar type"
            className={field}
            value={state.kind}
            onChange={(event) =>
              update({
                ...state,
                kind: kinds.find((kind) => kind === event.target.value) ?? "letter",
              })
            }
          >
            {kinds.map((kind) => (
              <option key={kind}>{kind}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Size
          <select
            aria-label="Avatar size"
            className={field}
            value={state.size}
            onChange={(event) =>
              update({
                ...state,
                size: sizes.find((size) => size === Number(event.target.value)) ?? 40,
              })
            }
          >
            {sizes.map((size) => (
              <option key={size}>{size}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Name
          <input
            aria-label="Avatar name"
            className={field}
            value={state.name}
            onChange={(event) => update({ ...state, name: event.target.value })}
          />
        </label>
        {(["round", "suggested"] as const).map((key) => (
          <label className="flex min-h-11 items-center gap-2 text-sm" key={key}>
            <input
              aria-label={`${key} avatar`}
              checked={state[key]}
              className="size-5"
              type="checkbox"
              onChange={(event) => update({ ...state, [key]: event.target.checked })}
            />
            {key}
          </label>
        ))}
      </div>
    ),
    description:
      "Test the regular Scraps Avatar union, image fallback, derived user and group components, platform avatar, and collapsed lists.",
    preview: (
      <AvatarActorResolverProvider resolver={actorResolver}>
        <div
          className="grid min-h-80 w-full max-w-2xl content-center gap-8 rounded-md border border-border p-8"
          data-testid="avatar-preview"
        >
          <div className="flex flex-wrap items-center gap-5">
            <Avatar {...avatarProps(state)} />
            <span>
              <Avatar
                data-test-id="default-size-avatar"
                identifier="default-size"
                name="Default Size"
                type="letter_avatar"
              />
            </span>
            <span>
              <Avatar
                data-test-id="zero-size-avatar"
                identifier="zero-size"
                name="Zero Size"
                size={0}
                type="letter_avatar"
              />
            </span>
            <UserAvatar size={state.size} user={{ id: "1", name: "Grace Hopper", type: "user" }} />
            <TeamAvatar size={state.size} team={{ id: "2", slug: "frontend-team" }} />
            <OrganizationAvatar size={state.size} organization={{ slug: "sentry-org" }} />
            <ProjectAvatar
              project={{ platform: "python", slug: "avatar-project" }}
              size={state.size}
            />
            <ActorAvatar actor={{ id: "resolved-user", type: "user" }} size={state.size} />
            <ActorAvatar actor={{ id: "resolved-team", type: "team" }} size={state.size} />
          </div>
          <AvatarList
            avatarSize={32}
            teams={[{ id: "team", slug: "frontend-team" }]}
            users={Array.from({ length: 7 }, (_, index) => ({
              id: String(index),
              name: `User ${index}`,
              type: "user" as const,
            }))}
          />
        </div>
      </AvatarActorResolverProvider>
    ),
    reset: () => {
      const next = defaults();
      setState(next);
      return serialize(next);
    },
    serialize: () => serialize(state),
    title: "Avatar",
  });
}
