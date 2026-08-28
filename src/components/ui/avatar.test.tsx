import { act, type ComponentProps, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ActorAvatar,
  Avatar,
  AvatarList,
  DocIntegrationAvatar,
  ImageAvatar,
  OrganizationAvatar,
  ProjectAvatar,
  SentryAppAvatar,
  TeamAvatar,
  UserAvatar,
} from "./avatar";
import { AvatarActorResolverProvider } from "./avatar-actor-resolver";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const roots: ReturnType<typeof createRoot>[] = [];

async function render(node: ReactNode) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => root.render(node));
  return container;
}

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.stubGlobal("matchMedia", () => ({
    addEventListener: vi.fn(),
    matches: false,
    removeEventListener: vi.fn(),
  }));
});

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((root) => root.unmount()));
  document.documentElement.className = "";
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Avatar", () => {
  it("forwards span attributes and handlers without leaking avatar props", async () => {
    const onClick = vi.fn();
    const spanProps = {
      "aria-label": "Jane's avatar",
      "data-avatar-source": "member-list",
      id: "jane-avatar",
      onClick,
    };
    const container = await render(
      <Avatar
        {...spanProps}
        identifier="jane"
        name="Jane Doe"
        type="upload"
        uploadUrl="data:image/svg+xml,jane"
      />,
    );
    const avatar = container.querySelector<HTMLElement>("#jane-avatar");
    expect(avatar?.getAttribute("aria-label")).toBe("Jane's avatar");
    expect(avatar?.dataset.avatarSource).toBe("member-list");
    expect(avatar?.hasAttribute("identifier")).toBe(false);
    expect(avatar?.hasAttribute("name")).toBe(false);
    expect(avatar?.hasAttribute("type")).toBe(false);
    expect(avatar?.hasAttribute("uploadurl")).toBe(false);
    await act(async () => avatar?.click());
    expect(onClick).toHaveBeenCalledOnce();
  });

  it.each([
    ["Jane Bloggs", "JB"],
    ["jane", "J"],
    ["Jane Austen Bloggs", "JB"],
    ["☃super ☃duper", "☃☃"],
    ["[Filtered]", "?"],
    ["   ", "?"],
  ])("renders initials for %s", async (name, initials) => {
    const container = await render(<Avatar identifier="person" name={name} type="letter_avatar" />);
    expect(container.querySelector("text")?.textContent).toBe(initials);
  });

  it.each([
    ["https://example.com/avatar.jpg", "https://example.com/avatar.jpg?s=120"],
    ["https://example.com/avatar.jpg?version=2", "https://example.com/avatar.jpg?version=2&s=120"],
    ["data:image/svg+xml,avatar", "data:image/svg+xml,avatar"],
  ])("resolves upload source %s", async (uploadUrl, expected) => {
    const container = await render(
      <Avatar identifier="person" name="Jane Bloggs" type="upload" uploadUrl={uploadUrl} />,
    );
    expect(container.querySelector("img")?.getAttribute("src")).toBe(expected);
  });

  it("loads the public ImageAvatar lazily by default", async () => {
    const container = await render(
      <ImageAvatar
        configuration={{
          alt: "Lazy avatar",
          ref: null,
          src: "data:image/svg+xml,lazy",
        }}
      />,
    );
    expect(container.querySelector("img")?.getAttribute("loading")).toBe("lazy");
  });

  it("forwards the canonical Image props and configuration ref", async () => {
    const imageRef = { current: null as HTMLImageElement | null };
    const container = await render(
      <ImageAvatar
        aspectRatio="4 / 3"
        configuration={{
          alt: "Configurable avatar",
          ref: imageRef,
          src: "data:image/svg+xml,configurable",
        }}
        data-image-attribute="forwarded"
        decoding="async"
        height={{ zero: "32px", md: "64px" }}
        objectFit="contain"
        objectPosition="top"
        radius={{ zero: "sm", md: "full" }}
        width={{ zero: "48px", md: "96px" }}
      />,
    );
    const image = container.querySelector("img");
    expect(imageRef.current).toBe(image);
    expect(image?.dataset.imageAttribute).toBe("forwarded");
    expect(image?.getAttribute("decoding")).toBe("async");
    expect(image?.style.aspectRatio).toBe("4 / 3");
    expect(image?.style.objectFit).toBe("contain");
    expect(image?.style.objectPosition).toBe("top");
    expect(image?.style.getPropertyValue("--scraps-layout-base-width")).toBe("48px");
    expect(image?.style.getPropertyValue("--scraps-layout-base-height")).toBe("32px");
    expect(image?.style.getPropertyValue("--scraps-layout-container-md-width")).toBe("96px");
    expect(image?.style.getPropertyValue("--scraps-layout-container-md-height")).toBe("64px");
    expect(image?.style.getPropertyValue("--scraps-layout-base-border-radius")).toBe("5px");
    expect(image?.style.getPropertyValue("--scraps-layout-container-md-border-radius")).toBe(
      "999px",
    );
    expect(image?.className).not.toContain("object-cover");
  });

  it("falls back to initials when an image fails", async () => {
    const container = await render(
      <Avatar
        identifier="person"
        name="Jane Bloggs"
        type="upload"
        uploadUrl="https://example.com/broken.jpg"
      />,
    );
    await act(async () => {
      container.querySelector("img")?.dispatchEvent(new Event("error"));
    });
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("text")?.textContent).toBe("JB");
  });

  it("hashes a trimmed gravatar identifier", async () => {
    const digest = vi.fn(async (algorithm: AlgorithmIdentifier, data: BufferSource) => {
      void algorithm;
      void data;
      return new Uint8Array([1, 2, 255]).buffer;
    });
    vi.stubGlobal("crypto", { subtle: { digest } });
    const container = await render(
      <Avatar
        gravatarId=" person@example.com "
        identifier="person"
        name="Jane Bloggs"
        type="gravatar"
      />,
    );
    await act(async () => Promise.resolve());
    expect(digest).toHaveBeenCalledOnce();
    expect(digest.mock.calls[0]?.[1]).toEqual(new TextEncoder().encode("person@example.com"));
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "https://gravatar.com/avatar/0102ff?d=404&s=120",
    );
  });

  it("uses deterministic light and dark swatches without a theme runtime", async () => {
    const container = await render(
      <Avatar identifier="person" name="Jane Bloggs" type="letter_avatar" />,
    );
    const root = container.querySelector<HTMLElement>(".avatar");
    expect(root?.style.getPropertyValue("--scraps-avatar-letter-background-light")).toMatch(
      /^#[0-9a-f]{6}$/,
    );
    expect(root?.style.getPropertyValue("--scraps-avatar-letter-background-dark")).toMatch(
      /^#[0-9a-f]{6}$/,
    );
  });

  it("uses exact light and dark suggested border fallbacks", async () => {
    const container = await render(
      <Avatar identifier="suggested" name="Suggested" suggested type="letter_avatar" />,
    );
    const avatar = container.querySelector(".avatar");
    expect(avatar?.className).toContain("border-[var(--scraps-border-neutral-vibrant,#a29faa)]");
    expect(avatar?.className).toContain(
      "dark:border-[var(--scraps-border-neutral-vibrant,#b5b0bd)]",
    );
  });

  it("uses canonical root defaults until a truthy size overrides them", async () => {
    const container = await render(
      <div>
        <Avatar identifier="default" name="Default" type="letter_avatar" />
        <Avatar identifier="zero" name="Zero" size={0} type="letter_avatar" />
        <Avatar identifier="explicit" name="Explicit" size={32} type="letter_avatar" />
      </div>,
    );
    const avatars = container.querySelectorAll<HTMLElement>(".avatar");
    for (const avatar of [avatars[0], avatars[1]]) {
      expect(avatar?.className).toContain("size-5");
      expect(avatar?.className).toContain("inline-block");
      expect(avatar?.className).toContain("align-middle");
      expect(avatar?.style.height).toBe("");
      expect(avatar?.style.width).toBe("");
    }
    expect(avatars[2]?.style.height).toBe("32px");
    expect(avatars[2]?.style.width).toBe("32px");
  });

  it("uses the actor id swatch without UserAvatar title behavior", async () => {
    const resolver = {
      resolveTeam: vi.fn(async () => null),
      resolveUser: vi.fn(async () => null),
    };
    const container = await render(
      <AvatarActorResolverProvider resolver={resolver}>
        <ActorAvatar actor={{ id: "1", name: "Jane Doe", type: "user" }} />
      </AvatarActorResolverProvider>,
    );
    const avatar = container.querySelector<HTMLElement>(".avatar");
    expect(avatar?.style.getPropertyValue("--scraps-avatar-letter-background-light")).toBe(
      "#67c800",
    );
    expect(avatar?.style.getPropertyValue("--scraps-avatar-letter-background-dark")).toBe(
      "#67c800",
    );
    expect(avatar?.hasAttribute("title")).toBe(false);
    expect(resolver.resolveUser).not.toHaveBeenCalled();
  });

  it("uses letters for an empty-email gravatar asset without hashing its URL", async () => {
    const digest = vi.fn();
    vi.stubGlobal("crypto", { subtle: { digest } });
    const container = await render(
      <UserAvatar
        user={{
          avatar: {
            avatarType: "gravatar",
            avatarUrl: "legacy-gravatar-identifier",
            avatarUuid: "avatar-uuid",
          },
          email: "",
          id: "user-id",
          ip_address: "",
          name: "Jane Doe",
          username: "jane",
        }}
      />,
    );
    expect(container.querySelector("text")?.textContent).toBe("JD");
    expect(container.querySelector("img")).toBeNull();
    expect(digest).not.toHaveBeenCalled();
  });

  it("derives user, team, organization, and documentation avatars", async () => {
    const container = await render(
      <div>
        <UserAvatar user={{ id: "1", name: "Jane Doe", type: "user" }} />
        <TeamAvatar team={{ id: "2", name: "Old", slug: "frontend-team" }} />
        <OrganizationAvatar organization={{ slug: "sentry-org" }} />
        <DocIntegrationAvatar docIntegration={{ name: "Issue Sync", slug: "issue-sync" }} />
      </div>,
    );
    expect([...container.querySelectorAll("text")].map((node) => node.textContent)).toEqual([
      "JD",
      "FT",
      "S",
      "IS",
    ]);
    expect(
      container.querySelector('[data-test-id="letter_avatar-avatar"][title="frontend team"]'),
    ).not.toBeNull();
  });

  it("selects the requested Sentry app image or exact generic fallback", async () => {
    const app = {
      avatars: [
        {
          avatarType: "upload",
          avatarUrl: "data:image/svg+xml,color",
          avatarUuid: "color-avatar",
          color: true,
        },
      ],
      name: "Build App",
      slug: "build-app",
      uuid: "build-app-uuid",
    } satisfies ComponentProps<typeof SentryAppAvatar>["sentryApp"];
    const container = await render(
      <div>
        <SentryAppAvatar sentryApp={app} />
        <SentryAppAvatar isColor={false} sentryApp={app} />
      </div>,
    );
    expect(container.querySelector("img")?.getAttribute("src")).toBe("data:image/svg+xml,color");
    expect(container.querySelector('[data-test-id="default-sentry-app-avatar"]')).not.toBeNull();
    expect(
      container.querySelector('[data-test-id="default-sentry-app-avatar"] path')?.getAttribute("d"),
    ).toBe(
      "M8 0C6.42 0 4.87 0.47 3.56 1.35C2.24 2.23 1.21 3.48 0.61 4.94C0 6.4 -0.15 8.01 0.15 9.56C0.46 11.11 1.22 12.54 2.34 13.66C3.46 14.78 4.89 15.54 6.44 15.85C7.99 16.16 9.6 16 11.06 15.39C12.52 14.79 13.77 13.76 14.65 12.44C15.53 11.13 16 9.58 16 8C16 5.88 15.16 3.84 13.66 2.34C12.16 0.84 10.12 0 8 0ZM7.5 13.3L7.37 13.25L3.77 11.43C3.54 11.31 3.34 11.13 3.2 10.9C3.07 10.68 3 10.42 3 10.16V5.84C2.99 5.76 2.99 5.67 3 5.59L7.5 7.85V13.3ZM3.5 4.73C3.57 4.67 3.65 4.62 3.73 4.58L7.38 2.76C7.57 2.66 7.79 2.61 8.01 2.61C8.22 2.61 8.44 2.66 8.63 2.76L12.23 4.58C12.32 4.62 12.4 4.67 12.47 4.74L8 7L3.5 4.73ZM13 10.17C13 10.43 12.93 10.69 12.79 10.91C12.66 11.13 12.46 11.31 12.23 11.43L8.63 13.25L8.5 13.3V7.85L13 5.6C13.01 5.68 13.01 5.76 13 5.84V10.17Z",
    );
  });

  it("forwards the Sentry app ref to uploaded Avatar spans", async () => {
    const uploadedRef = { current: null as HTMLSpanElement | null };
    const fallbackRef = { current: null as HTMLSpanElement | null };
    const sentryApp = {
      avatars: [
        {
          avatarType: "upload",
          avatarUrl: "data:image/svg+xml,color",
          avatarUuid: "color-avatar",
          color: true,
        },
      ],
      name: "Build App",
      slug: "build-app",
      uuid: "build-app-uuid",
    } satisfies ComponentProps<typeof SentryAppAvatar>["sentryApp"];
    await render(
      <div>
        <SentryAppAvatar ref={uploadedRef} sentryApp={sentryApp} />
        <SentryAppAvatar isDefault ref={fallbackRef} sentryApp={sentryApp} />
      </div>,
    );
    expect(uploadedRef.current?.tagName).toBe("SPAN");
    expect(fallbackRef.current).toBeNull();
  });

  it("renders portable actor fallbacks and rejects unknown actor types", async () => {
    const container = await render(
      <div>
        <ActorAvatar actor={{ id: "1", name: "Jane Doe", type: "user" }} />
        <ActorAvatar actor={{ id: "2", name: "frontend-team", type: "team" }} />
        <ActorAvatar
          actor={{
            id: "3",
            name: "Tea Pot",
            // @ts-expect-error runtime guard evidence
            type: "teapot",
          }}
        />
      </div>,
    );
    expect([...container.querySelectorAll("text")].map((node) => node.textContent)).toEqual([
      "JD",
      "2",
    ]);
  });

  it("resolves ID-only users and teams through the portable actor resolver", async () => {
    const pendingUser = deferred<{
      avatar: {
        avatarType: "upload";
        avatarUrl: string;
        avatarUuid: string;
      };
      email: string;
      id: string;
      ip_address: string;
      name: string;
      username: string;
    } | null>();
    const pendingTeam = deferred<{
      id: string;
      name: string;
      slug: string;
    } | null>();
    const resolver = {
      resolveTeam: vi.fn(() => pendingTeam.promise),
      resolveUser: vi.fn(() => pendingUser.promise),
    };
    const container = await render(
      <AvatarActorResolverProvider resolver={resolver}>
        <ActorAvatar actor={{ id: "user-1", type: "user" }} />
        <ActorAvatar actor={{ id: "team-1", type: "team" }} />
      </AvatarActorResolverProvider>,
    );
    expect(container.querySelectorAll('[data-slot="avatar-placeholder"]')).toHaveLength(2);

    await act(async () => {
      pendingUser.resolve({
        avatar: {
          avatarType: "upload",
          avatarUrl: "data:image/svg+xml,resolved-user",
          avatarUuid: "resolved-user-avatar",
        },
        email: "resolved@example.com",
        id: "user-1",
        ip_address: "",
        name: "Resolved User",
        username: "resolved-user",
      });
      pendingTeam.resolve({
        id: "team-1",
        name: "Team",
        slug: "resolved-team",
      });
      await Promise.all([pendingUser.promise, pendingTeam.promise]);
    });

    expect(resolver.resolveUser).toHaveBeenCalledWith("user-1");
    expect(resolver.resolveTeam).toHaveBeenCalledWith("team-1");
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "data:image/svg+xml,resolved-user",
    );
    expect(container.querySelector("text")?.textContent).toBe("RT");
  });

  it("collapses more than max plus one avatars and expands a single remainder", async () => {
    const users = Array.from({ length: 7 }, (_, index) => ({
      id: String(index),
      name: `User ${index}`,
      type: "user" as const,
    }));
    const collapsed = await render(<AvatarList users={users} />);
    expect(
      collapsed.querySelector('[data-test-id="avatarList-collapsedavatars"]')?.textContent,
    ).toBe("+2");

    const expanded = await render(<AvatarList maxVisibleAvatars={5} users={users.slice(0, 6)} />);
    expect(expanded.querySelector('[data-test-id="avatarList-collapsedavatars"]')).toBeNull();
    expect(expanded.querySelectorAll(".avatar")).toHaveLength(6);
  });

  it("lets a custom collapsed renderer suppress the marker", async () => {
    const renderCollapsedAvatars = vi.fn(() => null);
    const container = await render(
      <AvatarList
        renderCollapsedAvatars={renderCollapsedAvatars}
        users={Array.from({ length: 7 }, (_, index) => ({
          id: String(index),
          name: `User ${index}`,
          type: "user" as const,
        }))}
      />,
    );
    expect(renderCollapsedAvatars).toHaveBeenCalledWith(28, 2);
    expect(container.querySelector('[data-test-id="avatarList-collapsedavatars"]')).toBeNull();
  });

  it("renders a project platform icon", async () => {
    const container = await render(
      <ProjectAvatar
        direction="left"
        project={{ platform: "python", slug: "avatar-project" }}
        size={32}
      />,
    );
    const icon = container.querySelector<HTMLElement>('[data-test-id="platform-icon-python"]');
    expect(icon).not.toBeNull();
    expect(icon?.className).toContain("rounded-[6px]");
    expect(icon?.className).toContain("shadow-[0_0_0_1px_var(");
    expect(icon?.style.height).toBe("32px");
    expect(icon?.style.minWidth).toBe("32px");
    expect(container.querySelector("[direction]")).toBeNull();
  });

  it("keeps image titles exact for users, docs, and teams", async () => {
    const container = await render(
      <div>
        <UserAvatar
          title="Caller title"
          user={{
            avatar: {
              avatarType: "upload",
              avatarUrl: "data:image/svg+xml,user",
              avatarUuid: "user-avatar",
            },
            email: "upload@example.com",
            id: "user",
            ip_address: "",
            name: "Upload User",
            username: "upload-user",
          }}
        />
        <DocIntegrationAvatar
          docIntegration={{
            avatar: {
              avatarType: "upload",
              avatarUrl: "data:image/svg+xml,doc",
              avatarUuid: "doc-avatar",
            },
            name: "Upload Doc",
            slug: "upload-doc",
          }}
        />
        <TeamAvatar
          team={{
            avatar: {
              avatarType: "upload",
              avatarUrl: "data:image/svg+xml,team",
              avatarUuid: "team-avatar",
            },
            id: "team",
            slug: "upload-team",
          }}
        />
      </div>,
    );
    const avatars = container.querySelectorAll<HTMLElement>('[data-test-id="upload-avatar"]');
    expect(avatars[0]?.title).toBe("Caller title");
    expect(avatars[1]?.hasAttribute("title")).toBe(false);
    expect(avatars[2]?.title).toBe("upload team");
  });
});
