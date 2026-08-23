"use client";

import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

import { LinkBehaviorContextProvider, type LinkProps } from "./link";

function locationHref(to: LinkProps["to"]) {
  if (typeof to === "string") {
    return to;
  }

  return `${to.pathname ?? ""}${to.search ?? ""}${to.hash ?? ""}`;
}

function NextLinkAdapter(props: LinkProps) {
  const router = useRouter();
  const href = locationHref(props.to);
  const anchorProps = { ...props };
  Reflect.deleteProperty(anchorProps, "preventScrollReset");
  Reflect.deleteProperty(anchorProps, "reloadDocument");
  Reflect.deleteProperty(anchorProps, "replace");
  Reflect.deleteProperty(anchorProps, "state");
  Reflect.deleteProperty(anchorProps, "to");

  function navigate(event: MouseEvent<HTMLAnchorElement>) {
    props.onClick?.(event);
    if (
      event.defaultPrevented ||
      props.reloadDocument ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    const options = { scroll: !props.preventScrollReset };
    if (props.replace) {
      router.replace(href, options);
    } else {
      router.push(href, options);
    }
  }

  return <a {...anchorProps} href={href} onClick={navigate} />;
}

export function PlaygroundLinkBehaviorProvider({ children }: { children: ReactNode }) {
  return (
    <LinkBehaviorContextProvider
      value={{ behavior: (props: LinkProps) => props, component: NextLinkAdapter }}
    >
      {children}
    </LinkBehaviorContextProvider>
  );
}
