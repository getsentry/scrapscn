import type { CSSProperties } from "react";

import { Tooltip, TooltipContext, type TooltipProps } from "@/components/ui/tooltip";

const props: TooltipProps = {
  title: "Details",
  position: "bottom-start",
  forceVisible: "delayed",
  overlayStyle: { maxWidth: 320 } satisfies CSSProperties,
  onOverflowChange: (isOverflowing) => isOverflowing,
  underlineColor: "warning",
};
const emotionLike = { name: "tooltip", styles: "color: red", next: undefined };

<Tooltip {...props}>Trigger</Tooltip>;
<Tooltip overlayStyle={{ color: "red" } satisfies CSSProperties} title="Styled" />;
<Tooltip
  title={
    <>
      <Tooltip.Header leadingItems="Clock" trailingItems={0}>
        Last Seen
      </Tooltip.Header>
      <Tooltip.Grid columns="max-content 1fr max-content" gap="2px 8px">
        <Tooltip.Row leadingItems="UTC" trailingItems="11:40 PM">
          Jul 28, 2026
        </Tooltip.Row>
      </Tooltip.Grid>
      <Tooltip.Footer trailingItems="">Times shown in</Tooltip.Footer>
    </>
  }
/>;
// @ts-expect-error SerializedStyles requires a CSS-in-JS runtime and is not portable.
<Tooltip overlayStyle={emotionLike} title="Styled" />;
<TooltipContext.Provider value={{ container: document.body }}>
  <Tooltip title={<strong>Rich details</strong>} />
</TooltipContext.Provider>;

// @ts-expect-error Tooltip position uses the canonical Popper placement values.
<Tooltip position="center" title="Details" />;
// @ts-expect-error Tooltip underline colors are a closed semantic set.
<Tooltip title="Details" underlineColor="purple" />;
// @ts-expect-error TooltipContext requires the canonical container field.
<TooltipContext.Provider value={{}} />;
// @ts-expect-error Tooltip.Grid columns are CSS grid track values.
<Tooltip.Grid columns={false}>rows</Tooltip.Grid>;

// @ts-expect-error Compatibility primitive exports are intentionally absent.
import { TooltipContent } from "@/components/ui/tooltip";
void TooltipContent;
