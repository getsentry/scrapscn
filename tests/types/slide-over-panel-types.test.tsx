import { createRef } from "react";

import { SlideOverPanel } from "@/components/ui/slide-over-panel";
// @ts-expect-error The canonical module does not publish its props type.
import type { SlideOverPanelProps } from "@/components/ui/slide-over-panel";

export function SlideOverPanelTypeEvidence() {
  return <SlideOverPanel ariaLabel="Details" className="panel" data-test-id="panel" mode="passive" panelWidth="36rem" position="left" ref={createRef<HTMLDivElement>()}>{({ isOpening }) => isOpening ? "Opening" : "Ready"}</SlideOverPanel>;
}

type UnpublishedSlideOverPanelProps = SlideOverPanelProps;

export type { UnpublishedSlideOverPanelProps };
