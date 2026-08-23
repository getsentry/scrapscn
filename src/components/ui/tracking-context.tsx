"use client";

import { createContext, useContext, type MouseEvent, type ReactNode } from "react";

export interface AnalyticsProps {
  analyticsEventKey?: string;
  analyticsEventName?: string;
  analyticsParams?: Record<string, unknown>;
}

type ClickTrackingType = "button" | "link";

export type TrackingProps = AnalyticsProps &
  Record<string, unknown> & {
    clickType: ClickTrackingType;
  };

type TrackableElement = HTMLAnchorElement | HTMLButtonElement;

type TrackableProps<Element extends TrackableElement> = AnalyticsProps & {
  "aria-label"?: string;
  busy?: boolean;
  children?: ReactNode;
  disabled?: boolean;
  onClick?: (event: MouseEvent<Element>) => void;
  variant?: string;
};

const TrackingContext = createContext<() => (props: TrackingProps) => void>(
  () => () => {}
);

export const TrackingContextProvider = TrackingContext.Provider;

export function useClickTracking<Element extends TrackableElement>(
  props: TrackableProps<Element>,
  clickType: ClickTrackingType
) {
  const clickTracking = useContext(TrackingContext)();
  const accessibleLabel =
    props["aria-label"] ??
    (typeof props.children === "string" ? props.children : undefined);

  function handleClick(event: MouseEvent<Element>) {
    if (props.disabled || props.busy) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    clickTracking({
      "aria-label": accessibleLabel || "",
      analyticsEventKey: props.analyticsEventKey,
      analyticsEventName: props.analyticsEventName,
      analyticsParams: {
        variant: props.variant,
        ...props.analyticsParams,
      },
      clickType,
    });
    props.onClick?.(event);
  }

  return { handleClick };
}
