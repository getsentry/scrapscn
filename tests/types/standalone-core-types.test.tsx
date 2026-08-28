import { useEffect, useRef } from "react";

import { BoundaryContextProvider, useBoundaryContext } from "@/components/ui/boundary-context";
import {
  DateTimeProvider,
  useClockDisplay,
  useTimezone,
  type DateTimeContextValue,
} from "@/components/ui/datetime";
import { OverlayTrigger, type TriggerProps } from "@/components/ui/overlay-trigger";
import { SizeProvider, useSizeContext } from "@/components/ui/size-context";
import {
  TrackingContextProvider,
  useClickTracking,
  type AnalyticsProps,
  type TrackingProps,
} from "@/components/ui/tracking-context";
import {
  TranslationContextProvider,
  useTranslation,
  type TranslationContextValue,
} from "@/components/ui/translation-context";
import { useIsInsideInteractiveElement } from "@/components/ui/use-is-inside-interactive-element";
import { useScrollLock } from "@/components/ui/use-scroll-lock";

const dateTime: DateTimeContextValue = { clockDisplay: "24", timezone: "America/Toronto" };
<DateTimeProvider value={dateTime}>Time</DateTimeProvider>;
void useTimezone;
void useClockDisplay;
<BoundaryContextProvider value="dialog">Boundary</BoundaryContextProvider>;
void useBoundaryContext;
<SizeProvider size="sm">Sized</SizeProvider>;
void useSizeContext;

const triggerProps: TriggerProps = { children: "Open", role: "button" };
<OverlayTrigger.Button {...triggerProps} prefix="Project" showChevron />;
<OverlayTrigger.IconButton {...triggerProps} aria-label="Open" icon={<span />} />;

const analytics: AnalyticsProps = { analyticsEventName: "clicked" };
const tracked: TrackingProps = { ...analytics, clickType: "button" };
void tracked;
<TrackingContextProvider value={() => () => undefined}>Tracked</TrackingContextProvider>;
void useClickTracking;

const translation: TranslationContextValue = {
  t: (message) => message,
  tct: (template) => template,
};
<TranslationContextProvider value={translation}>Translated</TranslationContextProvider>;
void useTranslation;

function HookContracts({ container }: { container: HTMLElement }) {
  const ref = useRef<HTMLSpanElement>(null);
  const { ref: interactiveRef } = useIsInsideInteractiveElement(ref);
  const lock = useScrollLock(container);
  useEffect(() => {
    lock.acquire();
    return lock.release;
  }, [lock]);
  return <span ref={interactiveRef}>{String(lock.held())}</span>;
}
void HookContracts;

// @ts-expect-error Clock display is a finite canonical union.
<DateTimeProvider value={{ clockDisplay: "system", timezone: "UTC" }}>Time</DateTimeProvider>;
// @ts-expect-error Button triggers require children.
<OverlayTrigger.Button />;
// @ts-expect-error IconButton triggers require an accessible label.
<OverlayTrigger.IconButton icon={<span />} />;
