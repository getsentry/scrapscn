"use client";

import {
  autoUpdate,
  computePosition,
  flip,
  hide,
  limitShift,
  offset,
  shift,
} from "@floating-ui/dom";
import { mergeRefs } from "@react-aria/utils";
import {
  memo,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type CSSProperties,
  type ElementType,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "../../lib/utils";
import InteractionStateLayer from "./interaction-state-layer";
import { Tooltip, type TooltipProps } from "./tooltip";

type Priority = "primary" | "danger" | "default";
type FormSize = "xs" | "sm" | "md";

type ItemState = {
  disabled: boolean;
  isFocused: boolean;
  isSelected: boolean;
};

type ExtraContent = ReactNode | ((state: ItemState) => ReactNode);

export type MenuListItemProps = {
  details?: ExtraContent;
  disabled?: boolean;
  label?: ReactNode;
  leadingItems?: ExtraContent;
  priority?: Priority;
  showDetailsInOverlay?: boolean;
  size?: FormSize;
  tooltip?: ExtraContent;
  tooltipOptions?: Omit<TooltipProps, "children" | "title" | "className">;
  trailingItems?: ExtraContent;
};

type PolymorphicSlotProps<Element extends ElementType, OwnProps> = OwnProps & {
  as?: Element;
} & Omit<ComponentPropsWithRef<Element>, keyof OwnProps | "as">;

type InnerWrapOwnProps = {
  disabled: boolean;
  isFocused: boolean;
  priority: Priority;
  size?: FormSize;
};

type InnerWrapProps = Omit<PolymorphicSlotProps<"div", InnerWrapOwnProps>, "as"> & {
  as?: ElementType;
};

type LeadingItemsOwnProps = {
  disabled: boolean;
  size?: FormSize;
};

type DetailsOwnProps = {
  disabled?: boolean;
  priority?: Priority;
};

type DetailsProps = Omit<PolymorphicSlotProps<"div", DetailsOwnProps>, "as"> & {
  as?: ElementType;
};

type LabelProps = Omit<PolymorphicSlotProps<"div", Record<never, never>>, "as"> & {
  as?: ElementType;
};

type MenuListItemOtherProps = Omit<
  ComponentPropsWithRef<"li">,
  "as" | "children" | "color" | "ref"
> & {
  as?: ElementType;
  detailsProps?: Partial<DetailsProps>;
  innerWrapProps?: Partial<InnerWrapProps>;
  isFocused?: boolean;
  isPressed?: boolean;
  isSelected?: boolean;
  labelProps?: LabelProps;
};

type Props = MenuListItemProps &
  MenuListItemOtherProps & {
    ref?: Ref<HTMLLIElement>;
  };

const innerSizeClasses: Record<FormSize, string> = {
  xs: "py-1 text-[12px] [line-height:1.4]",
  sm: "py-1.5 text-[14px] [line-height:1.4]",
  md: "py-2 text-[14px] [line-height:1.4]",
};

const overlayFontSizeClasses: Record<FormSize, string> = {
  xs: "text-[12px] [line-height:1.4]",
  sm: "text-[14px] [line-height:1.4]",
  md: "text-[14px] [line-height:1.4]",
};

function resolveExtraContent(content: ExtraContent | undefined, state: ItemState) {
  return typeof content === "function" ? content(state) : content;
}

function textColor(priority: Priority, disabled: boolean) {
  if (disabled) return "text-[var(--scraps-content-secondary,#6a6772)]";
  if (priority === "primary") return "text-[var(--scraps-content-accent,#653de9)]";
  if (priority === "danger") return "text-[var(--scraps-content-danger,#d50000)]";
  return "text-[var(--scraps-content-primary,#302e36)]";
}

/** The padded, state-aware content area used inside a MenuListItem. */
export function InnerWrap<Element extends ElementType = "div">({
  as,
  children,
  className,
  disabled = false,
  isFocused = false,
  priority = "default",
  size = "md",
  ...props
}: PolymorphicSlotProps<Element, InnerWrapOwnProps>) {
  const Component: ElementType = as ?? "div";

  return (
    <Component
      {...props}
      className={cn(
        "relative box-border flex rounded-[6px] pr-2 pl-3 outline-hidden",
        innerSizeClasses[size],
        textColor(priority, disabled),
        disabled && "cursor-default",
        isFocused &&
          "z-1 before:absolute before:inset-0 before:-z-1 before:bg-[var(--scraps-menu-list-item-overlay-background,#ffffff)]",
        className,
      )}
    >
      {children}
    </Component>
  );
}

/** Leading menu content with the regular Scraps slot spacing and disabled opacity. */
export function LeadingItems<Element extends ElementType = "div">({
  as,
  children,
  className,
  disabled,
  ...props
}: PolymorphicSlotProps<Element, LeadingItemsOwnProps>) {
  const Component: ElementType = as ?? "div";

  return (
    <Component
      {...props}
      className={cn("mr-2 flex shrink-0 items-start gap-2", disabled && "opacity-50", className)}
    >
      {children}
    </Component>
  );
}

function DetailsOverlay({
  children,
  id,
  itemRef,
  size,
}: {
  children: ReactNode;
  id: string;
  itemRef: RefObject<HTMLLIElement | null>;
  size?: FormSize;
}) {
  const [overlayElement, setOverlayElement] = useState<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<{
    escaped: boolean;
    placement: string;
    referenceHidden: boolean;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const item = itemRef.current;
    if (!item || !overlayElement) return;
    const update = () => {
      void computePosition(item, overlayElement, {
        strategy: "fixed",
        placement: "right-start",
        middleware: [
          offset({ mainAxis: 8, crossAxis: -4 }),
          flip(),
          shift({ limiter: limitShift(), padding: 0 }),
          {
            ...hide({ strategy: "referenceHidden" }),
            name: "referenceHidden",
          },
          { ...hide({ strategy: "escaped" }), name: "escaped" },
        ],
      }).then(({ middlewareData, placement, x, y }) =>
        setPosition({
          escaped: middlewareData.escaped?.escaped === true,
          placement,
          referenceHidden: middlewareData.referenceHidden?.referenceHidden === true,
          x,
          y,
        }),
      );
    };
    update();
    return autoUpdate(item, overlayElement, update);
  }, [itemRef, overlayElement]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      ref={setOverlayElement}
      className={cn(
        "fixed z-[10003]",
        position?.referenceHidden && "pointer-events-none opacity-0",
      )}
      data-popper-escaped={position?.escaped}
      data-popper-placement={position?.placement}
      data-popper-reference-hidden={position?.referenceHidden}
      style={
        position
          ? ({ left: position.x, top: position.y } satisfies CSSProperties)
          : { left: 0, top: 0, visibility: "hidden" }
      }
    >
      <div
        className={cn(
          "relative max-h-[80vh] cursor-auto overflow-auto rounded-[6px] border border-[var(--scraps-menu-list-item-overlay-border,#dad9de)] bg-[var(--scraps-menu-list-item-overlay-background,#ffffff)] p-1 shadow-[0_2px_0_var(--scraps-menu-list-item-overlay-shadow,#dad9de)] [will-change:transform,opacity] [user-select:contain]",
          overlayFontSizeClasses[size ?? "md"],
        )}
        data-overlay
        id={id}
        role="tooltip"
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

function BaseMenuListItem({
  label,
  details,
  as: Element = "li",
  priority = "default",
  size,
  disabled = false,
  leadingItems,
  trailingItems,
  isFocused = false,
  isSelected = false,
  isPressed,
  innerWrapProps = {},
  labelProps = {},
  detailsProps = {},
  showDetailsInOverlay = false,
  tooltip,
  tooltipOptions,
  ref,
  ...props
}: Props) {
  const itemRef = useRef<HTMLLIElement>(null);
  const labelId = useId();
  const detailId = useId();
  const state = { disabled, isFocused, isSelected };
  const tooltipTitle = resolveExtraContent(tooltip, state);
  const { className, ...elementProps } = props;
  const { as: LabelElement = "div", className: labelClassName, ...labelElementProps } = labelProps;
  const {
    as: DetailsElement = "div",
    className: detailsClassName,
    disabled: detailsDisabled = disabled,
    priority: detailsPriority = priority,
    ...detailsElementProps
  } = detailsProps;

  return (
    <Element
      aria-describedby={detailId}
      aria-disabled={disabled}
      aria-labelledby={labelId}
      className={cn(
        "static m-0 cursor-pointer scroll-my-1 list-none px-1 outline-hidden",
        className,
      )}
      ref={mergeRefs(ref, itemRef)}
      {...elementProps}
    >
      <Tooltip delay={500} skipWrapper title={tooltipTitle} {...tooltipOptions}>
        <InnerWrap
          disabled={disabled}
          isFocused={isFocused}
          priority={priority}
          size={size}
          {...innerWrapProps}
        >
          <InteractionStateLayer
            className="-z-1"
            higherOpacity={priority !== "default"}
            isHovered={isFocused}
            isPressed={isPressed}
          />
          {leadingItems ? (
            <LeadingItems disabled={disabled} size={size}>
              {resolveExtraContent(leadingItems, state)}
            </LeadingItems>
          ) : null}
          <div className="relative flex w-full min-w-0 items-center justify-between gap-2">
            <div className="w-full min-w-0 pr-2">
              <LabelElement
                className={cn(
                  "block w-full overflow-hidden [line-height:1.4] text-ellipsis whitespace-nowrap",
                  labelClassName,
                )}
                data-test-id="menu-list-item-label"
                id={labelId}
                {...labelElementProps}
              >
                {label}
              </LabelElement>
              {!showDetailsInOverlay && details ? (
                <DetailsElement
                  className={cn(
                    "text-xs [line-height:1.4] text-[var(--scraps-content-secondary,#6a6772)]",
                    detailsPriority !== "default" && textColor(detailsPriority, detailsDisabled),
                    detailsClassName,
                  )}
                  id={detailId}
                  {...detailsElementProps}
                >
                  {resolveExtraContent(details, state)}
                </DetailsElement>
              ) : null}
            </div>
            {trailingItems ? (
              <div
                className={cn("mr-1 flex h-[1.4em] items-center gap-2", disabled && "opacity-50")}
              >
                {resolveExtraContent(trailingItems, state)}
              </div>
            ) : null}
          </div>
        </InnerWrap>
      </Tooltip>
      {showDetailsInOverlay && details && isFocused ? (
        <DetailsOverlay id={detailId} itemRef={itemRef} size={size}>
          {resolveExtraContent(details, state)}
        </DetailsOverlay>
      ) : null}
    </Element>
  );
}

/** A regular Scraps menu item that leaves menu semantics and navigation to its parent. */
export const MenuListItem = memo(BaseMenuListItem);
