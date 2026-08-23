"use client";

import type { LocationDescriptor } from "history";
import type {
  AnchorHTMLAttributes,
  DetailedHTMLProps,
  HTMLAttributes,
  RefAttributes,
} from "react";
import type { LinkProps as ReactRouterLinkProps } from "react-router-dom";

import { cn } from "../../lib/utils";
import { useLinkBehavior } from "./link-behavior-context";
import { useClickTracking, type AnalyticsProps } from "./tracking-context";

export { LinkBehaviorContextProvider } from "./link-behavior-context";

export interface LinkProps
  extends RefAttributes<HTMLAnchorElement>,
    AnalyticsProps,
    Pick<
      ReactRouterLinkProps,
      "replace" | "preventScrollReset" | "state" | "reloadDocument"
    >,
    Omit<
      DetailedHTMLProps<HTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>,
      "as" | "css" | "href" | "target"
    > {
  [key: `data-${string}`]: string | undefined;
  to: LocationDescriptor;
  disabled?: boolean;
}

const baseClassName =
  "rounded-[2px] focus-visible:no-underline focus-visible:outline-none focus-visible:shadow-[0_0_0_0_var(--background),0_0_0_2px_var(--ring)]";
const disabledClassName =
  "pointer-events-none text-[var(--scraps-link-disabled)] hover:text-[var(--scraps-link-disabled)]";

function linkClassName(className: string | undefined, disabled: boolean | undefined) {
  return cn(baseClassName, disabled && disabledClassName, className);
}

type AnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> &
  RefAttributes<HTMLAnchorElement> & {
    disabled?: LinkProps["disabled"];
  };

function Anchor({ className, disabled, ...props }: AnchorProps) {
  return <a className={linkClassName(className, disabled)} {...props} />;
}

type LinkPropsWithButtonBehavior = LinkProps & {
  busy?: boolean;
  variant?: string;
};

function removeNonRouterProps(props: LinkPropsWithButtonBehavior) {
  const linkProps = { ...props };
  Reflect.deleteProperty(linkProps, "analyticsEventKey");
  Reflect.deleteProperty(linkProps, "analyticsEventName");
  Reflect.deleteProperty(linkProps, "analyticsParams");
  Reflect.deleteProperty(linkProps, "busy");
  Reflect.deleteProperty(linkProps, "variant");
  return linkProps;
}

function removeRouterProps(props: ReturnType<typeof removeNonRouterProps>) {
  Reflect.deleteProperty(props, "preventScrollReset");
  Reflect.deleteProperty(props, "reloadDocument");
  Reflect.deleteProperty(props, "replace");
  Reflect.deleteProperty(props, "state");
  Reflect.deleteProperty(props, "to");
  return props;
}

function LinkBase(props: LinkPropsWithButtonBehavior) {
  const { Component, behavior } = useLinkBehavior(props);
  const propsWithBehavior = behavior();
  const { handleClick } = useClickTracking(propsWithBehavior, "link");

  if (props.disabled) {
    const restProps = removeRouterProps(removeNonRouterProps(props));
    return <Anchor {...restProps} />;
  }

  const linkProps = removeNonRouterProps(propsWithBehavior);
  return <Component {...linkProps} onClick={handleClick} />;
}

export function Link({ className, ...props }: LinkProps) {
  return (
    <LinkBase
      {...props}
      className={linkClassName(className, props.disabled)}
    />
  );
}

interface ExternalLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  disabled?: LinkProps["disabled"];
  openInNewTab?: boolean;
}

export function ExternalLink({ openInNewTab = true, ...props }: ExternalLinkProps) {
  if (openInNewTab) {
    return <Anchor {...props} target="_blank" rel="noreferrer noopener" />;
  }

  return <Anchor {...props} href={props.href} />;
}
