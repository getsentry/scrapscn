import { createRef, type ComponentProps } from "react";

import { AvatarButton } from "@/components/ui/avatar-button";

const sharedAvatarFields = {
  "data-test-id": "avatar",
  className: "avatar-class",
  hasTooltip: true,
  ref: createRef<HTMLSpanElement>(),
  round: true,
  size: 32,
  style: { opacity: 0.8 },
  suggested: false,
  title: "Avatar title",
  tooltip: "Avatar tooltip",
  tooltipOptions: {
    delay: 100,
    disabled: false,
    maxWidth: 220,
    position: "top-start" as const,
    showUnderline: true,
  },
};

const letter = {
  "aria-label": "Letter",
  analyticsEventKey: "avatar.open",
  avatar: {
    ...sharedAvatarFields,
    identifier: "letter-id",
    name: "Jane Doe",
    type: "letter_avatar" as const,
  },
  busy: false,
  disabled: false,
  ref: createRef<HTMLButtonElement>(),
  size: "md" as const,
  tooltipProps: { title: "Open profile" },
} satisfies ComponentProps<typeof AvatarButton>;

const upload = {
  "aria-label": "Upload",
  avatar: {
    ...sharedAvatarFields,
    identifier: "upload-id",
    name: "Jane Doe",
    type: "upload" as const,
    uploadUrl: "https://example.com/avatar.png",
  },
  size: "xs" as const,
} satisfies ComponentProps<typeof AvatarButton>;

const gravatar = {
  "aria-label": "Gravatar",
  avatar: {
    ...sharedAvatarFields,
    gravatarId: "jane@example.com",
    identifier: "gravatar-id",
    name: "Jane Doe",
    type: "gravatar" as const,
  },
  size: "sm" as const,
} satisfies ComponentProps<typeof AvatarButton>;

void letter;
void upload;
void gravatar;

// @ts-expect-error AvatarButton owns children.
<AvatarButton aria-label="Open" avatar={{ type: "letter_avatar", identifier: "id", name: "Jane" }}>
  no
</AvatarButton>;
<AvatarButton
  aria-label="Open"
  avatar={{ type: "letter_avatar", identifier: "id", name: "Jane" }}
  // @ts-expect-error AvatarButton owns the icon.
  icon="x"
/>;
<AvatarButton
  aria-label="Open"
  avatar={{ type: "letter_avatar", identifier: "id", name: "Jane" }}
  // @ts-expect-error AvatarButton owns the variant.
  variant="primary"
/>;
<AvatarButton
  aria-label="Open"
  avatar={{ type: "letter_avatar", identifier: "id", name: "Jane" }}
  // @ts-expect-error AvatarButton has no priority prop.
  priority="primary"
/>;
<AvatarButton
  aria-label="Open"
  avatar={{ type: "letter_avatar", identifier: "id", name: "Jane" }}
  // @ts-expect-error zero is not a valid AvatarButton size.
  size="zero"
/>;
// @ts-expect-error An aria label is required.
<AvatarButton avatar={{ type: "letter_avatar", identifier: "id", name: "Jane" }} />;
<AvatarButton
  aria-label="Open"
  // @ts-expect-error Upload avatars require uploadUrl.
  avatar={{ type: "upload", identifier: "id", name: "Jane" }}
/>;
<AvatarButton
  aria-label="Open"
  // @ts-expect-error Gravatar avatars require gravatarId.
  avatar={{ type: "gravatar", identifier: "id", name: "Jane" }}
/>;
<AvatarButton
  aria-label="Open"
  // @ts-expect-error The avatar union has no image type.
  avatar={{ type: "image", identifier: "id", name: "Jane" }}
/>;
<AvatarButton
  aria-label="Open"
  // @ts-expect-error Avatar names are strings.
  avatar={{ type: "letter_avatar", identifier: "id", name: 123 }}
/>;

const invalidDataSize = {
  "aria-label": "Open",
  avatar: { type: "letter_avatar" as const, identifier: "id", name: "Jane" },
  // @ts-expect-error AvatarButton owns data-size.
  "data-size": "sm",
} satisfies ComponentProps<typeof AvatarButton>;
void invalidDataSize;

const canonicalSerializedStyles = { name: "avatar-button", styles: "color:red;" };
<AvatarButton
  aria-label="Open"
  avatar={{ type: "letter_avatar", identifier: "id", name: "Jane" }}
  tooltipProps={{
    title: "Open",
    // @ts-expect-error Emotion SerializedStyles is an excluded portable input.
    overlayStyle: canonicalSerializedStyles,
  }}
/>;
