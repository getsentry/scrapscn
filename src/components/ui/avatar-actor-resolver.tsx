"use client";

import { createContext, useContext, type ReactNode } from "react";

export type AvatarAssetRecord = {
  avatarType: "default" | "gravatar" | "letter_avatar" | "upload";
  avatarUuid: string | null;
  avatarUrl?: string | null;
  color?: boolean;
};

export type AvatarActorRecord = {
  id: string;
  email?: string;
  name?: string;
  type: "team" | "user";
};

export type AvatarUserRecord = {
  email: string;
  id: string;
  ip_address: string;
  name: string;
  username: string;
  avatar?: AvatarAssetRecord | null;
  avatarUrl?: string;
  ip?: string;
  ipAddress?: string;
  lastSeen?: string;
  options?: { avatarType: AvatarAssetRecord["avatarType"] };
};

export type AvatarTeamRecord = {
  id: string;
  slug: string;
  avatar?: AvatarAssetRecord | null;
  name?: string;
};

export type AvatarActorResolver = {
  resolveTeam: (id: string) => Promise<AvatarTeamRecord | null>;
  resolveUser: (id: string) => Promise<AvatarUserRecord | null>;
};

const AvatarActorResolverContext = createContext<AvatarActorResolver | null>(null);

export function AvatarActorResolverProvider({
  children,
  resolver,
}: {
  children: ReactNode;
  resolver: AvatarActorResolver;
}) {
  return <AvatarActorResolverContext value={resolver}>{children}</AvatarActorResolverContext>;
}

export function useAvatarActorResolver() {
  return useContext(AvatarActorResolverContext);
}
