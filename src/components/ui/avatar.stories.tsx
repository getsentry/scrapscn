import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import {
  Avatar,
  AvatarList,
  OrganizationAvatar,
  ProjectAvatar,
  TeamAvatar,
  UserAvatar,
} from "./avatar";

const localAvatar =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%237553ff'/%3E%3C/svg%3E";

const meta = {
  component: Avatar,
  parameters: { layout: "padded" },
  title: "Scraps/Avatar",
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const VisualAcceptanceMatrix: Story = {
  args: { identifier: "jane", name: "Jane Doe", type: "letter_avatar" },
  render: () => (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar identifier="jane" name="Jane Doe" size={24} type="letter_avatar" />
        <Avatar identifier="team" name="Frontend Team" size={32} type="letter_avatar" />
        <Avatar
          identifier="upload"
          name="Uploaded Avatar"
          size={40}
          type="upload"
          uploadUrl={localAvatar}
        />
        <Avatar identifier="suggested" name="Suggested" size={40} suggested type="letter_avatar" />
        <UserAvatar user={{ id: "1", name: "Grace Hopper", type: "user" }} />
        <TeamAvatar team={{ id: "2", slug: "performance-team" }} />
        <OrganizationAvatar organization={{ slug: "sentry-organization" }} />
        <ProjectAvatar project={{ platform: "python", slug: "avatar-project" }} size={32} />
      </div>
      <AvatarList
        teams={[{ id: "team", slug: "frontend-team" }]}
        users={Array.from({ length: 6 }, (_, index) => ({
          id: String(index),
          name: `User ${index}`,
          type: "user" as const,
        }))}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("JD")).toBeInTheDocument();
    await expect(canvas.getByText("GH")).toBeInTheDocument();
    await expect(canvas.getByText("+2")).toBeInTheDocument();
  },
};
