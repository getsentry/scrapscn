"use client";

import * as Sentry from "@sentry/react";
import { createContext, useContext, type Context, type FunctionComponent } from "react";
import { Link as RouterLink } from "react-router-dom";

import type { LinkProps } from "./link";

type LinkBehavior<T extends LinkProps> = {
  behavior: (props: T) => T;
  component: FunctionComponent<T>;
};

const LinkBehaviorContext = createContext<LinkBehavior<LinkProps> | null>(null);

const defaultLinkBehavior = <T extends LinkProps>() =>
  ({
    behavior: (props: T) => props,
    component: RouterLink,
  }) satisfies LinkBehavior<T>;

export const LinkBehaviorContextProvider = LinkBehaviorContext.Provider;

export function useLinkBehavior<T extends LinkProps>(props: T) {
  const linkBehavior = useContext(
    LinkBehaviorContext as Context<LinkBehavior<T> | null>
  );

  if (process.env.NODE_ENV === "production" && !linkBehavior) {
    Sentry.logger.warn("LinkBehaviorContext not found");
  }

  const { component, behavior } = linkBehavior ?? defaultLinkBehavior<T>();
  return { Component: component, behavior: () => behavior(props) };
}
