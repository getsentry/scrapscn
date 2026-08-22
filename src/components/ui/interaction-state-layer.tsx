import * as React from "react"

import { cn } from "@/lib/utils"

import styles from "./interaction-state-layer.module.css"

interface InteractionStateLayerProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType
  color?: string
  hasSelectedBackground?: boolean
  higherOpacity?: boolean
  isHovered?: boolean
  isPressed?: boolean
}

function resolveInteractionStateLayerColor(color: string) {
  if (/^[-_a-zA-Z][-_a-zA-Z0-9]*$/.test(color)) {
    return `var(--scraps-theme-${color}, var(--${color}, ${color}))`
  }

  return color
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
  const layerStyle = color
    ? {color: resolveInteractionStateLayerColor(color), ...style}
    : style

  return (
    <Element
      {...htmlProps}
      role="presentation"
      color={color}
      className={cn(styles.interactionStateLayer, className)}
      data-has-selected-background={hasSelectedBackground}
      data-is-hovered={isHovered === undefined ? "undefined" : isHovered}
      data-is-pressed={isPressed === undefined ? "undefined" : isPressed}
      style={{
        ...layerStyle,
        "--interaction-state-layer-hover-opacity": higherOpacity ? 0.085 : 0.06,
        "--interaction-state-layer-press-opacity": higherOpacity ? 0.12 : 0.09,
      } as React.CSSProperties}
    >
      {children}
    </Element>
  )
}

export {InteractionStateLayer as default}
