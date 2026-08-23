import type { CSSProperties } from "react";

import {
  Tooltip,
  TooltipContext,
  type TooltipProps,
} from "@/components/ui/tooltip";

const props: TooltipProps = {
  title: "Details",
  position: "bottom-start",
  forceVisible: "delayed",
  overlayStyle: { maxWidth: 320 } satisfies CSSProperties,
  onOverflowChange: (isOverflowing) => isOverflowing,
  underlineColor: "warning",
};

<Tooltip {...props}>Trigger</Tooltip>;
<TooltipContext.Provider value={{ container: document.body }}>
  <Tooltip title={<strong>Rich details</strong>} />
</TooltipContext.Provider>;

// @ts-expect-error Tooltip position uses the canonical Popper placement values.
<Tooltip position="center" title="Details" />;
// @ts-expect-error Tooltip underline colors are a closed semantic set.
<Tooltip title="Details" underlineColor="purple" />;
// @ts-expect-error TooltipContext requires the canonical container field.
<TooltipContext.Provider value={{}} />;

// @ts-expect-error Compatibility primitive exports are intentionally absent.
import { TooltipContent } from "@/components/ui/tooltip";
void TooltipContent;
