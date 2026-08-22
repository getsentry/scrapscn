import { createRef } from "react";

import { SplitPanel, type SplitPanelHandle } from "@/components/ui/split-panel";

const ref = createRef<SplitPanelHandle>();

<SplitPanel
  ref={ref}
  defaultSize={200}
  fill={<div />}
  fillMinSize={120}
  initialSize={180}
  maxSize={400}
  minSize={100}
  orientation={{ zero: "vertical", "screen:lg": "horizontal" }}
  placement="end"
  sized={<div />}
  onResize={(newSize) => {
    const size: number = newSize;
    void size;
  }}
  onResizeEnd={({ direction, endSize, startSize }) => {
    const resizeDirection: "increase" | "decrease" = direction;
    const sizes: [number, number] = [startSize, endSize];
    void resizeDirection;
    void sizes;
  }}
/>;

ref.current?.setSize(240, true);

// @ts-expect-error SplitPanel is intentionally a two-position component.
<SplitPanel defaultSize={200} placement="middle" sized={<div />} />;

// @ts-expect-error onResizeEnd reports numeric sizes, not strings.
<SplitPanel defaultSize={200} sized={<div />} onResizeEnd={(payload: { endSize: string }) => void payload} />;

export {};
