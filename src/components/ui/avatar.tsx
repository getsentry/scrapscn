"use client";

import PlatformIcon from "platformicons/build/platformIcon";
import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
  type Ref,
  type SVGAttributes,
} from "react";

import { cn } from "../../lib/utils";
import {
  useAvatarActorResolver,
  type AvatarActorRecord,
  type AvatarActorResolver,
  type AvatarAssetRecord,
  type AvatarTeamRecord,
  type AvatarUserRecord,
} from "./avatar-actor-resolver";
import { Tag } from "./badge";
import { Image, type ImageProps } from "./image";
import { Tooltip, type TooltipProps } from "./tooltip";

type AvatarTheme = "dark" | "light";
type OrganizationSummary = {
  slug: string;
  avatar?: AvatarAssetRecord | null;
  name?: string;
};
type DocIntegration = {
  name: string;
  slug: string;
  avatar?: AvatarAssetRecord | null;
};
type AvatarSentryApp = {
  name: string;
  slug: string;
  uuid: string;
  avatars?: AvatarAssetRecord[];
};
type AvatarProject = {
  slug: string;
  id?: string | number;
  platform?: string;
};
type BaseAvatarStyleProps = {
  round?: boolean;
  size?: number;
  suggested?: boolean;
};

export interface AvatarProps extends BaseAvatarStyleProps {
  "data-test-id"?: string;
  className?: string;
  hasTooltip?: boolean;
  ref?: Ref<HTMLSpanElement>;
  style?: CSSProperties;
  title?: string;
  tooltip?: ReactNode;
  tooltipOptions?: Omit<TooltipProps, "children" | "title">;
}

type GravatarBaseAvatarProps = AvatarProps & {
  gravatarId: string;
  identifier: string;
  name: string;
  type: "gravatar";
};
type LetterBaseAvatarProps = AvatarProps & {
  identifier: string;
  name: string;
  type: "letter_avatar";
};
type UploadBaseAvatarProps = AvatarProps & {
  identifier: string;
  name: string;
  type: "upload";
  uploadUrl: string;
};

export type BaseAvatarProps =
  | GravatarBaseAvatarProps
  | LetterBaseAvatarProps
  | UploadBaseAvatarProps;

const AVATAR_ROOT_EXCLUDED_PROPS = new Set([
  "className",
  "data-test-id",
  "gravatarId",
  "hasTooltip",
  "identifier",
  "name",
  "ref",
  "round",
  "size",
  "style",
  "suggested",
  "title",
  "tooltip",
  "tooltipOptions",
  "type",
  "uploadUrl",
]);

function getAvatarRootProps(props: BaseAvatarProps) {
  return Object.fromEntries(
    Object.entries(props).filter(([name]) => !AVATAR_ROOT_EXCLUDED_PROPS.has(name)),
  );
}

export interface ActorAvatarProps extends Omit<AvatarProps, "round"> {
  actor: AvatarActorRecord;
}

type AvatarDefinition =
  | { configuration: LetterAvatarProps["configuration"]; type: "letter" }
  | { configuration: ImageAvatarProps["configuration"]; type: "image" };
type AvatarColorVariables = CSSProperties & {
  "--scraps-avatar-letter-background-dark": string;
  "--scraps-avatar-letter-background-light": string;
  "--scraps-avatar-letter-content-dark": string;
  "--scraps-avatar-letter-content-light": string;
};

const SWATCHES = {
  dark: [
    "#7553ff",
    "#5d3eb2",
    "#50219c",
    "#7c2282",
    "#b0009c",
    "#f0369a",
    "#fa6769",
    "#ff9838",
    "#ffd00e",
    "#67c800",
  ],
  light: [
    "#7553ff",
    "#5533b2",
    "#3a1873",
    "#7c2282",
    "#b82d90",
    "#f0369a",
    "#fa6769",
    "#ff9838",
    "#ffd00e",
    "#67c800",
  ],
} as const;
const gravatarHashes = new Map<string, Promise<string | null>>();

function getInitials(name: string | undefined) {
  const sanitized = name === undefined ? undefined : String(name).trim();
  if (!sanitized || sanitized === "[Filtered]") return "?";
  const words = sanitized.split(" ");
  const first = Array.from(words[0] ?? "")[0] ?? "";
  const last = words.length > 1 ? (Array.from(words[words.length - 1] ?? "")[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
}

function getSwatch(identifier: string, theme: AvatarTheme) {
  let hash = 0;
  for (let index = 0; index < identifier.length; index += 1) {
    hash += identifier.charCodeAt(index);
  }
  const index = hash % SWATCHES[theme].length;
  return {
    background: SWATCHES[theme][index],
    content: index < 6 ? "#ffffff" : "#000000",
  };
}

function subscribeToTheme(notify: () => void) {
  if (typeof document === "undefined") return () => {};
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const observer = new MutationObserver(notify);
  observer.observe(document.documentElement, {
    attributeFilter: ["class"],
    attributes: true,
  });
  media.addEventListener("change", notify);
  return () => {
    observer.disconnect();
    media.removeEventListener("change", notify);
  };
}

function getThemeSnapshot(): AvatarTheme {
  if (typeof document === "undefined") return "light";
  if (document.documentElement.classList.contains("dark")) return "dark";
  if (document.documentElement.classList.contains("light")) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function useAvatarTheme() {
  return useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);
}

function getServerThemeSnapshot(): AvatarTheme {
  return "light";
}

function buildUploadUrl(url: string) {
  if (url.startsWith("data:")) return url;
  return `${url}${url.includes("?") ? "&" : "?"}s=120`;
}

function gravatarBaseUrl() {
  const fallback = "https://gravatar.com";
  if (typeof window === "undefined") return fallback;
  const candidate = (window as Window & { __initialData?: { gravatarBaseUrl?: unknown } })
    .__initialData?.gravatarBaseUrl;
  if (typeof candidate !== "string") return fallback;
  try {
    const parsed = new URL(candidate.trim());
    return parsed.protocol === "https:" ? parsed.href.replace(/\/+$/, "") : fallback;
  } catch {
    return fallback;
  }
}

function hashGravatarId(identifier: string) {
  if (typeof window === "undefined" || !window.crypto?.subtle?.digest) {
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

function useGravatarHash(identifier: string) {
  const [resolved, setResolved] = useState<{
    hash: string | null;
    identifier: string;
  }>({ hash: null, identifier: "" });
  useEffect(() => {
    if (!identifier) return;
    let active = true;
    let pending = gravatarHashes.get(identifier);
    if (!pending) {
      pending = hashGravatarId(identifier);
      gravatarHashes.set(identifier, pending);
    }
    void pending.then((value) => {
      if (active) setResolved({ hash: value, identifier });
    });
    return () => {
      active = false;
    };
  }, [identifier]);
  return resolved.identifier === identifier ? resolved.hash : null;
}

function useImageSrc(
  definition?: { gravatarId: string; type: "gravatar" } | { type: "upload"; uploadUrl: string },
) {
  const gravatarId = definition?.type === "gravatar" ? definition.gravatarId.trim() : "";
  const gravatarHash = useGravatarHash(gravatarId);
  const [erroredSrc, setErroredSrc] = useState<string | null>(null);
  const resolvedSrc = definition
    ? definition.type === "upload"
      ? buildUploadUrl(definition.uploadUrl) || null
      : gravatarHash
        ? `${gravatarBaseUrl()}/avatar/${gravatarHash}?d=404&s=120`
        : null
    : null;
  const ref = useCallback((image: HTMLImageElement | null) => {
    const handleError = () => setErroredSrc(image?.getAttribute("src") ?? null);
    image?.addEventListener("error", handleError);
    return () => image?.removeEventListener("error", handleError);
  }, []);
  return { ref, src: resolvedSrc === erroredSrc ? null : resolvedSrc };
}

export function useAvatar(options: {
  identifier: string;
  name: string;
  imageDefinition?:
    | { gravatarId: string; type: "gravatar" }
    | { type: "upload"; uploadUrl: string };
}): AvatarDefinition {
  const theme = useAvatarTheme();
  const { ref, src } = useImageSrc(options.imageDefinition);
  if (src !== null) {
    return { configuration: { alt: options.name, ref, src }, type: "image" };
  }
  const { background, content } = getSwatch(options.identifier, theme);
  return {
    configuration: {
      background,
      content,
      initials: getInitials(options.name),
    },
    type: "letter",
  };
}

type ImageAvatarProps = BaseAvatarStyleProps &
  Omit<ImageProps, "alt" | "ref" | "src"> & {
    configuration: { alt: string; ref: Ref<HTMLImageElement>; src: string };
  };

export function ImageAvatar({
  className,
  configuration,
  radius,
  round,
  suggested,
  ...props
}: ImageAvatarProps) {
  const { alt, ref: imageRef, src } = configuration;
  return (
    <Image
      {...props}
      alt={alt}
      className={cn("absolute top-0 left-0 select-none", suggested && "grayscale", className)}
      radius={radius ?? (round ? "full" : "2xs")}
      ref={imageRef}
      src={src}
    />
  );
}

type LetterAvatarProps = BaseAvatarStyleProps &
  SVGAttributes<SVGSVGElement> & {
    configuration: { background: string; content: string; initials: string };
    ref?: Ref<SVGSVGElement>;
  };

export function LetterAvatar({
  className,
  configuration,
  round,
  suggested,
  ...props
}: LetterAvatarProps) {
  return (
    <svg
      {...props}
      className={cn(
        "absolute inset-0 size-full select-none",
        round ? "rounded-full" : "rounded-[3px]",
        suggested && "grayscale",
        className,
      )}
      viewBox="0 0 120 120"
    >
      <rect
        fill={
          suggested
            ? "var(--scraps-background-primary,var(--background))"
            : configuration.background
        }
        height="120"
        width="120"
        x="0"
        y="0"
      />
      <text
        dominantBaseline="central"
        fill={suggested ? "var(--scraps-content-secondary,#6a6772)" : configuration.content}
        fontSize="65"
        fontWeight="bold"
        textAnchor="middle"
        x="50%"
        y="50%"
      >
        {configuration.initials}
      </text>
    </svg>
  );
}

export function Avatar(props: BaseAvatarProps) {
  const rootProps = getAvatarRootProps(props);
  const {
    ref,
    className,
    size,
    style,
    tooltip,
    tooltipOptions,
    hasTooltip = false,
    "data-test-id": testId,
    ...avatarProps
  } = props;
  const { type, identifier, name, title, round, suggested } = avatarProps;
  const definition = useAvatar({
    identifier,
    name,
    imageDefinition:
      type === "upload"
        ? { type: "upload", uploadUrl: avatarProps.uploadUrl }
        : type === "gravatar"
          ? { type: "gravatar", gravatarId: avatarProps.gravatarId }
          : undefined,
  });
  const light = getSwatch(identifier, "light");
  const dark = getSwatch(identifier, "dark");
  const variables: AvatarColorVariables = {
    "--scraps-avatar-letter-background-dark": dark.background,
    "--scraps-avatar-letter-background-light": light.background,
    "--scraps-avatar-letter-content-dark": dark.content,
    "--scraps-avatar-letter-content-light": light.content,
    ...style,
  };

  return (
    <Tooltip disabled={!hasTooltip} {...tooltipOptions} skipWrapper title={tooltip}>
      <span
        {...rootProps}
        className={cn(
          "avatar relative inline-block size-5 shrink-0 overflow-hidden align-middle",
          "[--scraps-avatar-letter-background:var(--scraps-avatar-letter-background-light)] [--scraps-avatar-letter-content:var(--scraps-avatar-letter-content-light)] dark:[--scraps-avatar-letter-background:var(--scraps-avatar-letter-background-dark)] dark:[--scraps-avatar-letter-content:var(--scraps-avatar-letter-content-dark)]",
          round ? "rounded-full" : "rounded-[3px]",
          suggested &&
            "border border-dashed border-[var(--scraps-border-neutral-vibrant,#a29faa)] bg-[var(--scraps-background-primary,var(--background))] dark:border-[var(--scraps-border-neutral-vibrant,#b5b0bd)]",
          className,
        )}
        data-test-id={testId ?? `${type}-avatar`}
        ref={ref}
        style={{ ...(size ? { height: size, width: size } : {}), ...variables }}
        title={title}
      >
        {definition.type === "image" ? (
          <ImageAvatar
            configuration={definition.configuration}
            loading="eager"
            round={round}
            suggested={suggested}
          />
        ) : (
          <LetterAvatar
            configuration={{
              ...definition.configuration,
              background: "var(--scraps-avatar-letter-background)",
              content: "var(--scraps-avatar-letter-content)",
            }}
            round={round}
            suggested={suggested}
          />
        )}
      </span>
    </Tooltip>
  );
}

function explodeSlug(slug: string) {
  return slug.replace(/[-_]+/g, " ");
}

function avatarPropsFromAsset({
  asset,
  imageTitle,
  identifier,
  name,
  title,
}: {
  asset?: AvatarAssetRecord | null;
  imageTitle?: string;
  identifier: string;
  name: string;
  title?: string;
}): BaseAvatarProps {
  if (asset?.avatarType === "upload" && asset.avatarUrl) {
    return {
      identifier,
      name,
      type: "upload",
      uploadUrl: asset.avatarUrl,
      ...(imageTitle ? { title: imageTitle } : {}),
    };
  }
  if (asset?.avatarType === "gravatar" && asset.avatarUrl) {
    return {
      gravatarId: asset.avatarUrl,
      identifier,
      name,
      type: "gravatar",
      ...(imageTitle ? { title: imageTitle } : {}),
    };
  }
  return { identifier, name, title, type: "letter_avatar" };
}

type UserAvatarProps = AvatarProps & {
  user: AvatarActorRecord | AvatarUserRecord;
  renderTooltip?: (user: AvatarActorRecord | AvatarUserRecord) => ReactNode;
};

function isActor(user: AvatarActorRecord | AvatarUserRecord): user is AvatarActorRecord {
  return user.email === undefined;
}

export function UserAvatar({ renderTooltip, user, ...props }: UserAvatarProps) {
  const actor = isActor(user);
  const identifier = actor
    ? (user.name ?? user.id ?? "")
    : user.email || user.username || user.id || user.ip_address || "";
  const name = actor ? (user.name ?? "") : user.name || user.email || user.username || "";
  let resolved: BaseAvatarProps;
  if (actor) {
    resolved = { identifier, name, title: name, type: "letter_avatar" };
  } else if (user.avatar?.avatarType === "gravatar") {
    resolved = user.email
      ? {
          gravatarId: user.email.toLowerCase(),
          identifier,
          name,
          type: "gravatar",
        }
      : { identifier, name, title: name, type: "letter_avatar" };
  } else {
    resolved = avatarPropsFromAsset({
      asset: user.avatar,
      identifier,
      name,
      title: name,
    });
  }
  const displayName = actor
    ? user.name || user.id
    : user.name || user.email || user.username || user.id || "";
  return (
    <Avatar
      {...props}
      {...resolved}
      round
      tooltip={renderTooltip ? renderTooltip(user) : props.tooltip ? props.tooltip : displayName}
    />
  );
}

type TeamAvatarProps = AvatarProps & { team: AvatarTeamRecord };

export function TeamAvatar({ team, tooltip, ...props }: TeamAvatarProps) {
  const displayName = explodeSlug(team.slug);
  return (
    <Avatar
      {...props}
      {...avatarPropsFromAsset({
        asset: team.avatar,
        imageTitle: displayName,
        identifier: team.slug,
        name: displayName,
        title: displayName,
      })}
      tooltip={tooltip ?? `#${displayName}`}
    />
  );
}

export function OrganizationAvatar({
  organization,
  ...props
}: AvatarProps & { organization: OrganizationSummary }) {
  const displayName = explodeSlug(organization.slug ?? "");
  return (
    <Avatar
      {...props}
      {...avatarPropsFromAsset({
        asset: organization.avatar,
        identifier: organization.slug,
        name: organization.name || organization.slug,
        title: organization.name || organization.slug,
      })}
      title={displayName}
      tooltip={organization.slug ?? ""}
    />
  );
}

export function DocIntegrationAvatar({
  docIntegration,
  ...props
}: AvatarProps & { docIntegration: DocIntegration }) {
  return (
    <Avatar
      {...props}
      {...avatarPropsFromAsset({
        asset: docIntegration.avatar,
        identifier: docIntegration.slug,
        name: docIntegration.name,
        title: docIntegration.name,
      })}
    />
  );
}

function GenericIcon({ className, size = 24 }: Pick<AvatarProps, "className" | "size">) {
  return (
    <svg
      aria-label="Default Sentry app avatar"
      className={className}
      data-test-id="default-sentry-app-avatar"
      height={size}
      role="img"
      viewBox="0 0 16 16"
      width={size}
    >
      <path
        d="M8 0C6.42 0 4.87 0.47 3.56 1.35C2.24 2.23 1.21 3.48 0.61 4.94C0 6.4 -0.15 8.01 0.15 9.56C0.46 11.11 1.22 12.54 2.34 13.66C3.46 14.78 4.89 15.54 6.44 15.85C7.99 16.16 9.6 16 11.06 15.39C12.52 14.79 13.77 13.76 14.65 12.44C15.53 11.13 16 9.58 16 8C16 5.88 15.16 3.84 13.66 2.34C12.16 0.84 10.12 0 8 0ZM7.5 13.3L7.37 13.25L3.77 11.43C3.54 11.31 3.34 11.13 3.2 10.9C3.07 10.68 3 10.42 3 10.16V5.84C2.99 5.76 2.99 5.67 3 5.59L7.5 7.85V13.3ZM3.5 4.73C3.57 4.67 3.65 4.62 3.73 4.58L7.38 2.76C7.57 2.66 7.79 2.61 8.01 2.61C8.22 2.61 8.44 2.66 8.63 2.76L12.23 4.58C12.32 4.62 12.4 4.67 12.47 4.74L8 7L3.5 4.73ZM13 10.17C13 10.43 12.93 10.69 12.79 10.91C12.66 11.13 12.46 11.31 12.23 11.43L8.63 13.25L8.5 13.3V7.85L13 5.6C13.01 5.68 13.01 5.76 13 5.84V10.17Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function SentryAppAvatar({
  sentryApp,
  isColor = true,
  isDefault = false,
  ...props
}: AvatarProps & {
  sentryApp: AvatarSentryApp;
  isColor?: boolean;
  isDefault?: boolean;
}) {
  const selected = sentryApp.avatars?.find(({ color }) => color === isColor);
  if (isDefault || selected?.avatarType !== "upload" || !selected.avatarUrl) {
    return <GenericIcon className={props.className} size={props.size} />;
  }
  return (
    <Avatar
      {...props}
      identifier={sentryApp.slug}
      name={sentryApp.name}
      type="upload"
      uploadUrl={selected.avatarUrl}
    />
  );
}

export function ProjectAvatar({
  ref,
  project,
  hasTooltip,
  tooltip,
  size = 16,
  className,
}: AvatarProps & {
  project: AvatarProject;
  direction?: "left" | "right";
  ref?: Ref<HTMLDivElement>;
}) {
  return (
    <Tooltip disabled={!hasTooltip} title={tooltip}>
      <div className={cn("flex shrink-0 justify-end", className)} ref={ref}>
        <PlatformIcon
          alt=""
          className="relative cursor-default rounded-[6px] shadow-[0_0_0_1px_var(--scraps-background-primary,var(--background))] hover:z-[1]"
          data-test-id={
            project.platform ? `platform-icon-${project.platform}` : "platform-icon-default"
          }
          platform={project.platform || "default"}
          radius={6}
          size={size}
          style={{ height: size, minWidth: size }}
        />
      </div>
    </Tooltip>
  );
}

type ActorResolutionState =
  | { kind: "idle" }
  | {
      key: string;
      kind: "team";
      resolver: AvatarActorResolver;
      team: AvatarTeamRecord | null;
    }
  | {
      key: string;
      kind: "user";
      resolver: AvatarActorResolver;
      user: AvatarUserRecord | null;
    };

type ActorResolution =
  | { kind: "loading" | "unused" }
  | { kind: "team"; team: AvatarTeamRecord | null }
  | { kind: "user"; user: AvatarUserRecord | null };

function useActorResolution(actor: AvatarActorRecord): ActorResolution {
  const resolver = useAvatarActorResolver();
  const shouldResolve =
    actor.type === "team" || (actor.type === "user" && !actor.name && !actor.email);
  const key = `${actor.type}:${actor.id}`;
  const [state, setState] = useState<ActorResolutionState>({ kind: "idle" });

  useEffect(() => {
    if (!resolver || !shouldResolve) return;
    let active = true;

    void (async () => {
      if (actor.type === "team") {
        let team: AvatarTeamRecord | null = null;
        try {
          team = await resolver.resolveTeam(actor.id);
        } catch {
          team = null;
        }
        if (active) setState({ key, kind: "team", resolver, team });
        return;
      }

      let user: AvatarUserRecord | null = null;
      try {
        user = await resolver.resolveUser(actor.id);
      } catch {
        user = null;
      }
      if (active) setState({ key, kind: "user", resolver, user });
    })();

    return () => {
      active = false;
    };
  }, [actor.id, actor.type, key, resolver, shouldResolve]);

  if (!resolver || !shouldResolve) return { kind: "unused" };
  if (actor.type === "team") {
    if (state.kind !== "team" || state.key !== key || state.resolver !== resolver) {
      return { kind: "loading" };
    }
    return { kind: "team", team: state.team };
  }
  if (state.kind !== "user" || state.key !== key || state.resolver !== resolver) {
    return { kind: "loading" };
  }
  return { kind: "user", user: state.user };
}

export function ActorAvatar({ size = 24, hasTooltip = true, actor, ...props }: ActorAvatarProps) {
  const resolution = useActorResolution(actor);
  const avatarProps = { hasTooltip, size, ...props };

  if (resolution.kind === "loading") {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 animate-pulse bg-[var(--scraps-background-secondary,var(--muted))]",
          actor.type === "user" ? "rounded-full" : "rounded-[3px]",
        )}
        data-slot="avatar-placeholder"
        style={{ height: size, width: size }}
      />
    );
  }

  if (actor.type === "user") {
    if (resolution.kind === "user" && resolution.user) {
      return <UserAvatar {...avatarProps} user={resolution.user} />;
    }
    return (
      <Avatar
        {...avatarProps}
        identifier={actor.id}
        name={actor.name || actor.email || actor.id}
        round
        type="letter_avatar"
      />
    );
  }
  if (actor.type === "team") {
    if (resolution.kind === "team" && resolution.team) {
      return <TeamAvatar {...avatarProps} team={resolution.team} />;
    }
    return <Avatar {...avatarProps} identifier={actor.id} name={actor.id} type="letter_avatar" />;
  }
  return null;
}

type AvatarListProps = {
  avatarSize?: number;
  className?: string;
  maxVisibleAvatars?: number;
  renderCollapsedAvatars?: (avatarSize: number, count: number) => ReactNode;
  renderTooltip?: UserAvatarProps["renderTooltip"];
  renderUsersFirst?: boolean;
  teams?: AvatarTeamRecord[];
  tooltipOptions?: UserAvatarProps["tooltipOptions"];
  typeAvatars?: string;
  users?: Array<AvatarActorRecord | AvatarUserRecord>;
};

export function CollapsedAvatars({
  ref,
  children,
}: {
  children: ReactNode;
  ref?: Ref<HTMLDivElement>;
}) {
  return (
    <Tag data-test-id="avatarList-collapsedavatars" ref={ref} variant="muted">
      {children}
    </Tag>
  );
}

export function AvatarList({
  avatarSize = 28,
  maxVisibleAvatars = 5,
  typeAvatars = "users",
  tooltipOptions = {},
  className,
  users = [],
  teams = [],
  renderUsersFirst = false,
  renderTooltip,
  renderCollapsedAvatars,
}: AvatarListProps) {
  const visibleTeamCount = Math.min(teams.length, maxVisibleAvatars);
  const visibleUserCount = Math.max(maxVisibleAvatars - visibleTeamCount, 0);
  const visibleTeams = teams.slice(0, visibleTeamCount).reverse();
  const visibleUsers = users.slice(0, visibleUserCount).reverse();
  let collapsed = users.length + teams.length - visibleTeams.length - visibleUsers.length;
  if (collapsed === 1) {
    if (visibleTeams.length < teams.length) {
      const last = teams.at(-1);
      if (last) visibleTeams.unshift(last);
    } else {
      const last = users.at(-1);
      if (last) visibleUsers.unshift(last);
    }
    collapsed = 0;
  }
  const resolvedTooltipOptions = {
    position: "top" as const,
    ...tooltipOptions,
  };
  const avatarClassName =
    "-ml-2 overflow-hidden border-2 border-[var(--scraps-border-primary,var(--scraps-theme-border-primary,#dad9de))] hover:z-[1] group-hover/avatar-list:cursor-pointer group-hover/avatar-list:border-[var(--scraps-border-transparent-neutral-muted,#00002026)] dark:group-hover/avatar-list:border-[var(--scraps-border-transparent-neutral-muted,#c0a8e03d)]";
  const teamAvatars = visibleTeams.map((team) => (
    <TeamAvatar
      className={avatarClassName}
      hasTooltip
      key={`${team.id}-${team.name}`}
      size={avatarSize}
      team={team}
      tooltipOptions={resolvedTooltipOptions}
    />
  ));
  const userAvatars = visibleUsers.map((user) => (
    <UserAvatar
      className={cn(avatarClassName, "rounded-full")}
      hasTooltip
      key={user.id}
      renderTooltip={renderTooltip}
      size={avatarSize}
      tooltipOptions={resolvedTooltipOptions}
      user={user}
    />
  ));

  return (
    <div
      className={cn("group/avatar-list flex flex-row-reverse items-center", className)}
      data-slot="avatar-list"
    >
      {collapsed > 0 ? (
        renderCollapsedAvatars ? (
          renderCollapsedAvatars(avatarSize, collapsed)
        ) : (
          <Tooltip title={`${collapsed} other ${typeAvatars}`} skipWrapper>
            <CollapsedAvatars>
              {collapsed < 99 ? "+" : null}
              {collapsed}
            </CollapsedAvatars>
          </Tooltip>
        )
      ) : null}
      {renderUsersFirst ? teamAvatars : userAvatars}
      {renderUsersFirst ? userAvatars : teamAvatars}
    </div>
  );
}
