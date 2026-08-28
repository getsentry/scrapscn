import {
  ActorAvatar,
  Avatar,
  AvatarList,
  CollapsedAvatars,
  DocIntegrationAvatar,
  ImageAvatar,
  LetterAvatar,
  OrganizationAvatar,
  ProjectAvatar,
  SentryAppAvatar,
  TeamAvatar,
  UserAvatar,
  useAvatar,
  type ActorAvatarProps,
  type AvatarProps,
  type BaseAvatarProps,
} from "../../src/components/ui/avatar";
import {
  AvatarActorResolverProvider,
  type AvatarActorResolver,
  type AvatarUserRecord,
} from "../../src/components/ui/avatar-actor-resolver";

const avatarProps: AvatarProps = {
  hasTooltip: true,
  round: true,
  size: 32,
  suggested: false,
  tooltip: "Jane Doe",
  tooltipOptions: { overlayStyle: { padding: 4 } },
};
const emotionLikeSerializedStyles = {
  name: "avatar-tooltip",
  styles: "padding:4px;",
};
const invalidAvatarTooltip: AvatarProps = {
  tooltipOptions: {
    // @ts-expect-error SerializedStyles objects require the excluded Emotion runtime.
    overlayStyle: emotionLikeSerializedStyles,
  },
};
void invalidAvatarTooltip;
const baseAvatarProps: BaseAvatarProps = {
  identifier: "jane@example.com",
  name: "Jane Doe",
  type: "upload",
  uploadUrl: "data:image/svg+xml,avatar",
};
const actorProps: ActorAvatarProps = {
  actor: { id: "1", name: "Jane Doe", type: "user" },
  size: 24,
};
const actorResolver: AvatarActorResolver = {
  resolveTeam: async (id) => ({ id, slug: "resolved-team" }),
  resolveUser: async (id) => ({
    email: "resolved@example.com",
    id,
    ip_address: "",
    name: "Resolved User",
    username: "resolved-user",
  }),
};
const avatarUser: AvatarUserRecord = {
  email: "jane@example.com",
  id: "1",
  ip_address: "",
  name: "Jane Doe",
  username: "jane",
};
const sentryAppRef = { current: null as HTMLSpanElement | null };
const avatarSpanProps = {
  "aria-label": "Jane's avatar",
  "data-avatar-source": "type-fixture",
  id: "jane-avatar",
  onClick: (event: React.MouseEvent<HTMLSpanElement>) => event.currentTarget.id,
};

<Avatar {...avatarProps} {...avatarSpanProps} {...baseAvatarProps} />;
<ActorAvatar {...actorProps} />;
<AvatarActorResolverProvider resolver={actorResolver}>
  <ActorAvatar actor={{ id: "1", type: "user" }} />
</AvatarActorResolverProvider>;
<UserAvatar user={{ id: "1", name: "Jane Doe", type: "user" }} />;
<UserAvatar user={avatarUser} />;
<UserAvatar
  user={{
    avatar: {
      avatarType: "letter_avatar",
      avatarUuid: null,
    },
    email: "canonical@example.com",
    id: "canonical-user",
    ip_address: "",
    name: "Canonical User",
    username: "canonical",
  }}
/>;
<TeamAvatar team={{ id: "2", name: "Old name", slug: "frontend-team" }} />;
<OrganizationAvatar organization={{ name: "Sentry", slug: "sentry" }} />;
<DocIntegrationAvatar docIntegration={{ name: "Jira", slug: "jira" }} />;
<ProjectAvatar
  direction="right"
  project={{ id: 7, platform: "python", slug: "canonical-project" }}
  ref={{ current: null }}
/>;
<SentryAppAvatar
  ref={sentryAppRef}
  sentryApp={{
    avatars: [
      {
        avatarType: "upload",
        avatarUrl: "data:image/svg+xml,app",
        avatarUuid: "app-avatar",
        color: true,
      },
    ],
    name: "Build App",
    slug: "build-app",
    uuid: "build-app-uuid",
  }}
/>;
<AvatarList
  avatarSize={28}
  maxVisibleAvatars={5}
  renderCollapsedAvatars={(size, count) => `${size}:${count}`}
  teams={[{ id: "2", slug: "frontend-team" }]}
  users={[{ id: "1", name: "Jane Doe", type: "user" }]}
/>;
<CollapsedAvatars>+2</CollapsedAvatars>;

function AvatarHookEvidence() {
  const letter = useAvatar({ identifier: "jane", name: "Jane Doe" });
  const image = useAvatar({
    identifier: "jane",
    imageDefinition: { type: "upload", uploadUrl: "data:image/svg+xml,avatar" },
    name: "Jane Doe",
  });
  return (
    <>
      {letter.type === "letter" ? (
        <LetterAvatar configuration={letter.configuration} round />
      ) : null}
      {image.type === "image" ? (
        <ImageAvatar
          aspectRatio="1 / 1"
          configuration={image.configuration}
          height={{ zero: 24, md: 48 }}
          loading="eager"
          objectFit="contain"
          objectPosition="top"
          radius={{ zero: "2xs", md: "full" }}
          width={{ zero: 24, md: 48 }}
        />
      ) : null}
    </>
  );
}
<AvatarHookEvidence />;

// @ts-expect-error Avatar requires the discriminated type-specific source.
<Avatar identifier="jane" name="Jane Doe" type="upload" />;
// @ts-expect-error Actor types are limited to users and teams.
<ActorAvatar actor={{ id: "1", type: "teapot" }} />;
const invalidActorResolver: AvatarActorResolver = {
  resolveTeam: async (id) => ({ id, slug: "resolved-team" }),
  // @ts-expect-error Resolver user results require canonical AvatarUser email discrimination.
  resolveUser: async (id) => ({
    id,
    ip_address: "",
    name: "Missing Email",
    username: "missing-email",
  }),
};
void invalidActorResolver;
