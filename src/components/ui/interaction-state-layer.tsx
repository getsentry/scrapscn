import * as React from "react";

import { cn } from "../../lib/utils";

interface InteractionStateLayerProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  color?: string;
  hasSelectedBackground?: boolean;
  higherOpacity?: boolean;
  isHovered?: boolean;
  isPressed?: boolean;
}

function resolveInteractionStateLayerColor(color: string) {
  if (/^[-_a-zA-Z][-_a-zA-Z0-9]*$/.test(color)) {
    return `var(--scraps-theme-${color}, var(--${color}, ${color}))`;
  }

  return color;
}

/** Renders the regular Scraps interaction state overlay without forwarding state props to the DOM. */
function InteractionStateLayer({
  as: Element = "span",
  color,
  hasSelectedBackground = true,
  higherOpacity = false,
  isHovered,
  isPressed,
  className,
  style,
  children,
  ...htmlProps
}: InteractionStateLayerProps) {
  const layerStyle = color ? { color: resolveInteractionStateLayerColor(color), ...style } : style;

  return (
    <Element
      {...htmlProps}
      role="presentation"
      color={color}
      className={cn(
        "pointer-events-none absolute top-1/2 left-1/2 box-content size-full -translate-x-1/2 -translate-y-1/2 rounded-[inherit] border-current bg-current text-current opacity-0 [border:inherit]",
        "[&[data-is-hovered=true]]:opacity-[var(--interaction-state-layer-hover-opacity)]",
        "[*:hover:not(:focus-visible)>_&[data-is-hovered=undefined]]:opacity-[var(--interaction-state-layer-hover-opacity)]",
        "[&[data-is-pressed=true]]:!opacity-[var(--interaction-state-layer-press-opacity)]",
        "[*:active>_&[data-is-pressed=undefined]]:!opacity-[var(--interaction-state-layer-press-opacity)]",
        "[*[aria-expanded=true]>_&[data-is-pressed=undefined][data-has-selected-background=true]]:!opacity-[var(--interaction-state-layer-press-opacity)]",
        "[*[aria-selected=true]>_&[data-is-pressed=undefined][data-has-selected-background=true]]:!opacity-[var(--interaction-state-layer-press-opacity)]",
        "[*:disabled_&[data-is-hovered][data-is-pressed][data-has-selected-background]]:!opacity-0",
        "[*[aria-disabled=true]_&[data-is-hovered][data-is-pressed][data-has-selected-background]]:!opacity-0",
        className,
      )}
      data-has-selected-background={hasSelectedBackground}
      data-is-hovered={isHovered === undefined ? "undefined" : isHovered}
      data-is-pressed={isPressed === undefined ? "undefined" : isPressed}
      style={
        {
          ...layerStyle,
          "--interaction-state-layer-hover-opacity": higherOpacity ? 0.085 : 0.06,
          "--interaction-state-layer-press-opacity": higherOpacity ? 0.12 : 0.09,
        } as React.CSSProperties
      }
    >
      {children}
    </Element>
  );
}

export { InteractionStateLayer as default };
