"use client";

import {
  autoUpdate,
  computePosition,
  flip,
  limitShift,
  offset as floatingOffset,
  shift,
  size as floatingSize,
  type Boundary as FloatingBoundary,
  type FlipOptions as FloatingFlipOptions,
  type LimitShiftOptions,
  type Placement,
  type ShiftOptions,
  type Strategy,
} from "@floating-ui/dom";
import type { Boundary as PopperBoundary, Placement as PopperPlacement } from "@popperjs/core";
import type { FlipModifier } from "@popperjs/core/lib/modifiers/flip";
import type { PreventOverflowModifier } from "@popperjs/core/lib/modifiers/preventOverflow";
import { FocusScope, isElementInChildOfActiveScope, useFocusManager } from "@react-aria/focus";
import type { AriaGridListOptions } from "@react-aria/gridlist";
import { useFocusWithin, useInteractOutside, useKeyboard } from "@react-aria/interactions";
import type { AriaListBoxOptions } from "@react-aria/listbox";
import { mergeRefs } from "@react-aria/utils";
import { Item, Section } from "@react-stately/collections";
import { useListState, type ListProps } from "@react-stately/list";
import {
  Children,
  Fragment,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useInsertionEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type BaseHTMLAttributes,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";

import { t } from "../../lib/scraps-locale";
import { cn } from "../../lib/utils";
import { Alert, type AlertProps } from "./alert";
import { Badge } from "./badge";
import { useBoundaryContext } from "./boundary-context";
import { Button, LinkButton, type ButtonProps, type LinkButtonProps } from "./button";
import { Checkbox, type CheckboxProps } from "./checkbox";
import {
  CompactSelectSize,
  ControlContext,
  GridList,
  HighlightText,
  LeadWrap,
  ListBox,
  ListItemBase,
  ListLabel,
  ListSeparator,
  ListWrap,
  SearchConfig,
  SearchMatchResult,
  SectionGroup,
  SectionHeader,
  SectionSeparator,
  SectionTitle,
  SectionToggle,
  SectionToggles,
  SectionWrap,
  SelectFilterContext,
  SelectKey,
  SelectOption,
  SelectOptionOrSection,
  SelectOptionOrSectionWithKey,
  SelectOptionWithKey,
  SelectSection,
  SelectSectionWithKey,
  SizeLimitMessage,
  TriggerLabel,
  getDisabledOptions,
  getEscapedKey,
  getHiddenOptions,
  getItemsWithKeys,
  getSearchConfig,
  getSelectedOptions,
  getSortedItems,
  itemIsSectionWithKey,
  useVirtualizedItems,
  type CompactSelectOverlayState,
} from "./compact-select-support";
import { InputGroup } from "./input";
import { Text } from "./text";

export type {
  SearchMatchResult,
  SelectKey,
  SelectOption,
  SelectOptionOrSection,
  SelectOptionOrSectionWithKey,
  SelectOptionWithKey,
  SelectSection,
  SelectSectionWithKey,
};
export {
  ControlContext,
  HighlightText,
  LeadWrap,
  ListBox,
  ListLabel,
  ListSeparator,
  ListWrap,
  SectionGroup,
  SectionHeader,
  SectionSeparator,
  SectionTitle,
  SectionToggle,
  SectionWrap,
  SelectFilterContext,
  SizeLimitMessage,
  TriggerLabel,
  getDisabledOptions,
  getEscapedKey,
  getHiddenOptions,
  getItemsWithKeys,
  itemIsSectionWithKey,
  useVirtualizedItems,
};

type DistributedOmit<Type, Keys extends PropertyKey> = Type extends unknown
  ? Omit<Type, Keys>
  : never;

type TriggerProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children: NonNullable<ReactNode>;
  ref?: Ref<HTMLButtonElement>;
};

interface SelectionListProps<Value extends SelectKey>
  extends
    Omit<ListProps<ListItemBase>, "disallowEmptySelection">,
    Omit<
      AriaListBoxOptions<ListItemBase>,
      | "autoFocus"
      | "defaultSelectedKeys"
      | "disabledKeys"
      | "disallowEmptySelection"
      | "isVirtualized"
      | "onSelectionChange"
      | "selectedKeys"
      | "shouldUseVirtualFocus"
    >,
    Omit<
      AriaGridListOptions<ListItemBase>,
      | "autoFocus"
      | "defaultSelectedKeys"
      | "disabledKeys"
      | "disallowEmptySelection"
      | "isVirtualized"
      | "onSelectionChange"
      | "selectedKeys"
      | "shouldUseVirtualFocus"
    > {
  isOptionDisabled?: (option: SelectOptionWithKey<Value>) => boolean;
  items: Array<SelectOptionOrSectionWithKey<Value>>;
  label?: ReactNode;
  mode?: "list" | "grid";
  size?: CompactSelectSize;
  sizeLimit?: number;
  sizeLimitMessage?: string;
  virtualized?: boolean;
}

type CompactSelectionListProps<Value extends SelectKey> = DistributedOmit<
  SelectionListProps<Value>,
  "children" | "items" | "label" | "mode"
>;

type RegionSelectionListProps<Value extends SelectKey> = DistributedOmit<
  SelectionListProps<Value>,
  "children" | "items" | "mode" | "size"
>;

interface ControlProps extends Omit<
  BaseHTMLAttributes<HTMLDivElement>,
  | keyof CompactSelectionListProps<SelectKey>
  | "children"
  | "defaultValue"
  | "onChange"
  | "onSelect"
  | "size"
> {
  children?: ReactNode;
  clearable?: boolean;
  disabled?: boolean;
  emptyMessage?: ReactNode;
  flipOptions?: FlipModifier["options"];
  hideOptions?: boolean;
  isDismissable?: boolean;
  isOpen?: boolean;
  loading?: boolean;
  maxMenuHeight?: number | string;
  menuBody?: ReactNode | ((actions: { closeOverlay: () => void }) => ReactElement);
  menuFooter?:
    | ReactNode
    | ((actions: { closeOverlay: () => void; resetSearch: () => void }) => ReactNode);
  menuHeaderTrailingItems?: ReactNode | ((actions: { closeOverlay: () => void }) => ReactNode);
  menuHeight?: number | string;
  menuMinWidth?: number | string;
  menuTitle?: ReactNode;
  menuWidth?: number | string;
  mode?: "list" | "grid";
  offset?: number | [number, number];
  onClear?: (props: { overlayState: CompactSelectOverlayState }) => void;
  onClose?: () => void;
  onInteractOutside?: () => void;
  onOpenChange?: (newOpenState: boolean) => void;
  position?: PopperPlacement;
  preventOverflowOptions?: PreventOverflowModifier["options"];
  search?: boolean | SearchConfig<SelectKey>;
  shouldCloseOnBlur?: boolean;
  shouldCloseOnInteractOutside?: (element: Element) => boolean;
  size?: CompactSelectSize;
  strategy?: Strategy;
  trigger?: (props: TriggerProps, isOpen: boolean) => ReactNode;
  triggerId?: string;
}

type BaseSelectProps<Value extends SelectKey> = Omit<ControlProps, "clearable" | "onClear"> &
  CompactSelectionListProps<Value> & {
    options: Array<SelectOptionOrSection<Value>>;
    virtualizeThreshold?: number;
  };

type SingleClearableSelectProps<Value extends SelectKey> = BaseSelectProps<Value> & {
  clearable: true;
  multiple?: false;
  onChange: (selectedOption: SelectOption<Value> | undefined) => void;
  value: Value | undefined;
  closeOnSelect?: boolean | ((selectedOption: SelectOption<Value> | undefined) => boolean);
};

type SingleUnclearableSelectProps<Value extends SelectKey> = BaseSelectProps<Value> & {
  clearable?: false;
  multiple?: false;
  onChange: (selectedOption: SelectOption<Value>) => void;
  value: Value | undefined;
  closeOnSelect?: boolean | ((selectedOption: SelectOption<Value>) => boolean);
};

export type SingleSelectProps<Value extends SelectKey> =
  | SingleClearableSelectProps<Value>
  | SingleUnclearableSelectProps<Value>;

export type MultipleSelectProps<Value extends SelectKey> = BaseSelectProps<Value> & {
  clearable?: boolean;
  multiple: true;
  onChange: (selectedOptions: Array<SelectOption<Value>>) => void;
  value: Value[] | undefined;
  closeOnSelect?: boolean | ((selectedOptions: Array<SelectOption<Value>>) => boolean);
};

export type SelectProps<Value extends SelectKey> =
  | SingleSelectProps<Value>
  | MultipleSelectProps<Value>;

function withUnits(value: number | string | undefined) {
  return typeof value === "number" ? `${value}px` : value;
}

function nextFrameCallback(callback: () => void) {
  if ("requestAnimationFrame" in window) {
    window.requestAnimationFrame(() => callback());
  } else {
    setTimeout(callback, 1);
  }
}

function useCompactSelectOpenState({
  controlledOpen,
  onClose,
  onOpenChange,
}: {
  controlledOpen: boolean | undefined;
  onClose: (() => void) | undefined;
  onOpenChange: ((open: boolean) => void) | undefined;
}): [boolean, (open: boolean) => void] {
  const [internalOpen, setInternalOpen] = useState(controlledOpen ?? false);
  const open = controlledOpen ?? internalOpen;
  const requestedOpen = useRef(open);
  const [, resetControlledOpen] = useReducer((version) => version + 1, 0);
  useInsertionEffect(() => {
    requestedOpen.current = open;
  });
  const setOpen = useCallback(
    (nextOpen: boolean) => {
      const currentOpen = requestedOpen.current;
      if (Object.is(currentOpen, nextOpen)) return;
      requestedOpen.current = nextOpen;
      setInternalOpen(nextOpen);
      if (controlledOpen !== undefined) resetControlledOpen();
      onOpenChange?.(nextOpen);
      if (currentOpen && !nextOpen) nextFrameCallback(() => onClose?.());
    },
    [controlledOpen, onClose, onOpenChange],
  );
  return [open, setOpen];
}

const floatingPlacements = new Set<PopperPlacement>([
  "top",
  "top-start",
  "top-end",
  "right",
  "right-start",
  "right-end",
  "bottom",
  "bottom-start",
  "bottom-end",
  "left",
  "left-start",
  "left-end",
]);

function isFloatingPlacement(placement: PopperPlacement): placement is Placement {
  return floatingPlacements.has(placement);
}

function getFloatingBoundary(boundary: PopperBoundary | undefined): FloatingBoundary | undefined {
  if (boundary === "clippingParents") return "clippingAncestors";
  return boundary;
}

function getFloatingFlipOptions(options: FlipModifier["options"]): FloatingFlipOptions {
  return {
    altBoundary: options?.altBoundary,
    boundary: getFloatingBoundary(options?.boundary),
    flipAlignment: options?.flipVariations ?? false,
    mainAxis: options?.mainAxis,
    crossAxis: options?.altAxis,
    padding: options?.padding,
    rootBoundary: options?.rootBoundary,
  };
}

const basePlacements = ["top", "bottom", "right", "left"] as const;

type OverflowOffsets = Record<(typeof basePlacements)[number], number>;

function getPopperAutoPlacements(
  placement: PopperPlacement,
  flipVariations: boolean,
  allowedAutoPlacements: PopperPlacement[] | undefined,
) {
  const alignment = placement.endsWith("-start")
    ? "start"
    : placement.endsWith("-end")
      ? "end"
      : undefined;
  const candidates: Placement[] = alignment
    ? basePlacements.flatMap((side) =>
        flipVariations
          ? ([`${side}-start`, `${side}-end`] as Placement[])
          : ([`${side}-${alignment}`] as Placement[]),
      )
    : [...basePlacements];
  const allowed = candidates.filter((candidate) => allowedAutoPlacements?.includes(candidate));
  return allowed.length ? allowed : candidates;
}

function getPlacementOverflowChecks(
  placement: Placement,
  overflow: OverflowOffsets,
  reference: { height: number; width: number },
  floating: { height: number; width: number },
  mainAxis: boolean,
  altAxis: boolean,
) {
  const [side, alignment] = placement.split("-") as [
    (typeof basePlacements)[number],
    "end" | "start" | undefined,
  ];
  const vertical = side === "top" || side === "bottom";
  let firstAltSide: (typeof basePlacements)[number] = vertical
    ? alignment === "start"
      ? "right"
      : "left"
    : alignment === "start"
      ? "bottom"
      : "top";
  const referenceLength = vertical ? reference.width : reference.height;
  const floatingLength = vertical ? floating.width : floating.height;
  if (referenceLength > floatingLength) {
    firstAltSide = getOppositeSide(firstAltSide);
  }
  const checks: boolean[] = [];
  if (mainAxis) checks.push(overflow[side] <= 0);
  if (altAxis) {
    checks.push(overflow[firstAltSide] <= 0, overflow[getOppositeSide(firstAltSide)] <= 0);
  }
  return checks;
}

function getOppositeSide(side: (typeof basePlacements)[number]) {
  if (side === "top") return "bottom";
  if (side === "bottom") return "top";
  if (side === "right") return "left";
  return "right";
}

function getFloatingAutoPlacementMiddleware(
  placement: PopperPlacement,
  options: FlipModifier["options"],
) {
  const flipVariations = options?.flipVariations ?? false;
  const candidates = getPopperAutoPlacements(
    placement,
    flipVariations,
    options?.allowedAutoPlacements,
  );
  const rankingOverflows = new Map<Placement, OverflowOffsets>();
  const fittingOverflows = new Map<Placement, OverflowOffsets>();
  let candidateIndex = -1;
  let resolvedPlacement: Placement | undefined;

  return {
    name: "autoPlacement",
    options: {
      alignment: placement.endsWith("-start")
        ? "start"
        : placement.endsWith("-end")
          ? "end"
          : undefined,
      allowedPlacements: candidates,
      autoAlignment: flipVariations,
      crossAxis: options?.altAxis ?? true,
      mainAxis: options?.mainAxis ?? true,
    },
    async fn(state) {
      if (!resolvedPlacement) {
        if (candidateIndex >= 0) {
          const candidate = candidates[candidateIndex]!;
          rankingOverflows.set(
            candidate,
            (await state.platform.detectOverflow(state, {
              boundary: getFloatingBoundary(options?.boundary),
              padding: options?.padding,
              rootBoundary: options?.rootBoundary,
            })) as OverflowOffsets,
          );
          fittingOverflows.set(
            candidate,
            (await state.platform.detectOverflow(
              state,
              getFloatingFlipOptions(options),
            )) as OverflowOffsets,
          );
        }
        candidateIndex += 1;
        if (candidateIndex < candidates.length) {
          return { reset: { placement: candidates[candidateIndex]! } };
        }

        const ranked = [...candidates].sort((a, b) => {
          const aSide = a.split("-")[0] as keyof OverflowOffsets;
          const bSide = b.split("-")[0] as keyof OverflowOffsets;
          return (rankingOverflows.get(a)?.[aSide] ?? 0) - (rankingOverflows.get(b)?.[bSide] ?? 0);
        });
        const checks = new Map(
          ranked.map((candidate) => [
            candidate,
            getPlacementOverflowChecks(
              candidate,
              fittingOverflows.get(candidate)!,
              state.rects.reference,
              state.rects.floating,
              options?.mainAxis ?? true,
              options?.altAxis ?? true,
            ),
          ]),
        );
        resolvedPlacement = ranked.find((candidate) => checks.get(candidate)!.every(Boolean));
        if (!resolvedPlacement) {
          resolvedPlacement = ranked[0]!;
          const numberOfChecks = flipVariations ? 3 : 1;
          for (let count = numberOfChecks; count > 0; count -= 1) {
            const fitting = ranked.find((candidate) =>
              checks.get(candidate)!.slice(0, count).every(Boolean),
            );
            if (fitting) {
              resolvedPlacement = fitting;
              break;
            }
          }
        }
      }
      return state.placement === resolvedPlacement
        ? {}
        : { reset: { placement: resolvedPlacement } };
    },
  } satisfies ReturnType<typeof flip>;
}

function getFloatingFlipMiddleware(options: FlipModifier["options"]) {
  const floatingOptions = getFloatingFlipOptions(options);
  const fallbackPlacements = options?.fallbackPlacements;
  const autoFallbacks = fallbackPlacements?.filter((placement) => !isFloatingPlacement(placement));
  if (!autoFallbacks?.length) {
    return flip({
      ...floatingOptions,
      fallbackPlacements: fallbackPlacements?.filter(isFloatingPlacement),
    });
  }

  const candidatesByFallback = new Map<PopperPlacement, Placement[]>();
  for (const placement of autoFallbacks) {
    candidatesByFallback.set(
      placement,
      getPopperAutoPlacements(
        placement,
        options?.flipVariations ?? false,
        options?.allowedAutoPlacements,
      ),
    );
  }
  const candidates = [...new Set([...candidatesByFallback.values()].flat())];
  const overflows = new Map<Placement, number>();
  let candidateIndex = -1;
  let resolvedFallbacks: Placement[] | undefined;

  return {
    name: "flip",
    options: floatingOptions,
    async fn(state) {
      if (!resolvedFallbacks) {
        if (candidateIndex >= 0) {
          const candidate = candidates[candidateIndex]!;
          const overflow = await state.platform.detectOverflow(state, floatingOptions);
          overflows.set(candidate, overflow[candidate.split("-")[0] as keyof typeof overflow]);
        }
        candidateIndex += 1;
        if (candidateIndex < candidates.length) {
          return { reset: { placement: candidates[candidateIndex]! } };
        }
        resolvedFallbacks = fallbackPlacements!.flatMap((placement) => {
          if (isFloatingPlacement(placement)) return placement;
          return [...(candidatesByFallback.get(placement) ?? [])].sort(
            (a, b) => (overflows.get(a) ?? 0) - (overflows.get(b) ?? 0),
          );
        });
        if (state.placement !== state.initialPlacement) {
          return { reset: { placement: state.initialPlacement } };
        }
      }
      return flip({
        ...floatingOptions,
        fallbackPlacements: resolvedFallbacks,
      }).fn(state);
    },
  } satisfies ReturnType<typeof flip>;
}

function getFloatingShiftOptions(
  options: PreventOverflowModifier["options"],
  defaultBoundary?: FloatingBoundary,
): ShiftOptions {
  const tetherOffset = options?.tetherOffset;
  const offset: LimitShiftOptions["offset"] =
    typeof tetherOffset === "function"
      ? ({ placement, rects }) => {
          const value = tetherOffset({
            placement,
            popper: rects.floating,
            reference: rects.reference,
          });
          return typeof value === "number"
            ? { crossAxis: value, mainAxis: value }
            : { crossAxis: value.altAxis, mainAxis: value.mainAxis };
        }
      : typeof tetherOffset === "number"
        ? { crossAxis: tetherOffset, mainAxis: tetherOffset }
        : tetherOffset
          ? { crossAxis: tetherOffset.altAxis, mainAxis: tetherOffset.mainAxis }
          : undefined;
  return {
    altBoundary: options?.altBoundary,
    boundary: getFloatingBoundary(options?.boundary) ?? defaultBoundary,
    crossAxis: options?.altAxis,
    limiter:
      options?.tether === false
        ? undefined
        : limitShift({
            crossAxis: options?.altAxis,
            mainAxis: options?.mainAxis,
            offset,
          }),
    mainAxis: options?.mainAxis,
    padding: options?.padding ?? 16,
    rootBoundary: options?.rootBoundary,
  };
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="size-3 fill-current" viewBox="0 0 16 16">
      <path d="M6.75 0C10.48 0 13.5 3.02 13.5 6.75C13.5 8.34 12.95 9.81 12.02 10.96L15.78 14.72C16.07 15.01 16.07 15.49 15.78 15.78C15.49 16.07 15.01 16.07 14.72 15.78L10.96 12.02C9.81 12.95 8.34 13.5 6.75 13.5C3.02 13.5 0 10.48 0 6.75C0 3.02 3.02 0 6.75 0ZM6.75 1.5C3.85 1.5 1.5 3.85 1.5 6.75C1.5 9.65 3.85 12 6.75 12C9.65 12 12 9.65 12 6.75C12 3.85 9.65 1.5 6.75 1.5Z" />
    </svg>
  );
}

function ChevronIcon({ open, size }: { open: boolean; size: CompactSelectSize }) {
  return (
    <svg
      aria-hidden="true"
      className={cn("ml-1 shrink-0 fill-current", size === "xs" ? "size-3" : "size-3.5")}
      viewBox="0 0 16 16"
    >
      <path
        d={
          open
            ? "M3.22 10.78a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 1 1-1.06 1.06L8 7.06l-3.72 3.72a.75.75 0 0 1-1.06 0Z"
            : "M3.22 5.22a.75.75 0 0 1 1.06 0L8 8.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L3.22 6.28a.75.75 0 0 1 0-1.06Z"
        }
      />
    </svg>
  );
}

function defaultTrigger(
  props: TriggerProps,
  open: boolean,
  disabled: boolean,
  size: CompactSelectSize,
) {
  const { children, className, ...buttonProps } = props;
  return (
    <Button
      {...buttonProps}
      className={cn("relative max-w-full", className)}
      disabled={disabled}
      size={size}
    >
      <span className="flex min-w-0 flex-1 items-center">
        {children}
        <ChevronIcon open={open} size={size} />
      </span>
    </Button>
  );
}

function useOverlayPosition({
  open,
  placement,
  strategy,
  offset,
  flipOptions,
  preventOverflowOptions,
  trigger,
  popup,
}: {
  open: boolean;
  placement: PopperPlacement;
  strategy: Strategy;
  offset: number | [number, number];
  flipOptions?: FlipModifier["options"];
  preventOverflowOptions?: PreventOverflowModifier["options"];
  trigger: HTMLElement | null;
  popup: HTMLElement | null;
}) {
  const boundaryId = useBoundaryContext();
  const defaultBoundary =
    typeof document === "undefined"
      ? undefined
      : ((boundaryId ? document.getElementById(boundaryId) : null) ??
        document.querySelector("main") ??
        document.getElementById("main") ??
        undefined);
  const [position, setPosition] = useState<{
    availableHeight: number;
    availableWidth: number;
    placement: Placement;
    strategy: Strategy;
    x: number;
    y: number;
  }>();
  useEffect(() => {
    if (!open || !trigger || !popup) return;
    const [crossAxis, mainAxis] = Array.isArray(offset) ? offset : [0, offset];
    const automatic = placement.startsWith("auto");
    const initialPlacement = isFloatingPlacement(placement) ? placement : "bottom";
    const update = () => {
      let availableHeight = Number.POSITIVE_INFINITY;
      let availableWidth = Number.POSITIVE_INFINITY;
      void computePosition(trigger, popup, {
        middleware: [
          floatingOffset({ crossAxis, mainAxis }),
          automatic
            ? getFloatingAutoPlacementMiddleware(placement, flipOptions)
            : getFloatingFlipMiddleware(flipOptions),
          shift(getFloatingShiftOptions(preventOverflowOptions, defaultBoundary)),
          floatingSize({
            altBoundary: preventOverflowOptions?.altBoundary,
            boundary: getFloatingBoundary(preventOverflowOptions?.boundary) ?? defaultBoundary,
            padding: preventOverflowOptions?.padding ?? 16,
            rootBoundary: preventOverflowOptions?.rootBoundary,
            apply: (size) => {
              availableHeight = size.availableHeight;
              availableWidth = size.availableWidth;
            },
          }),
        ],
        placement: initialPlacement,
        strategy,
      }).then(({ placement: resolvedPlacement, strategy: resolvedStrategy, x, y }) =>
        setPosition({
          availableHeight,
          availableWidth,
          placement: resolvedPlacement,
          strategy: resolvedStrategy,
          x,
          y,
        }),
      );
    };
    update();
    return autoUpdate(trigger, popup, update);
  }, [
    defaultBoundary,
    flipOptions,
    offset,
    open,
    placement,
    popup,
    preventOverflowOptions,
    strategy,
    trigger,
  ]);
  return position;
}

const visibleCompactSelectOverlays: Array<RefObject<Element | null>> = [];

function getInteractionTarget(event: PointerEvent) {
  return event.composedPath().find((entry): entry is Element => entry instanceof Element) ?? null;
}

function useCompactSelectOverlay({
  isDismissable,
  isOpen,
  onClose,
  overlayRef,
  shouldCloseOnBlur,
  shouldCloseOnInteractOutside,
}: {
  isDismissable: boolean;
  isOpen: boolean;
  onClose: (outsideTarget?: Element) => void;
  overlayRef: RefObject<Element | null>;
  shouldCloseOnBlur: boolean;
  shouldCloseOnInteractOutside: (target: Element) => boolean;
}) {
  const lastVisibleOverlay = useRef<RefObject<Element | null> | undefined>(undefined);
  useEffect(() => {
    if (!isOpen || visibleCompactSelectOverlays.includes(overlayRef)) return;
    const ownerDocument = overlayRef.current?.ownerDocument ?? document;
    const clearPendingInteraction = () => {
      lastVisibleOverlay.current = undefined;
    };
    visibleCompactSelectOverlays.push(overlayRef);
    ownerDocument.addEventListener("pointercancel", clearPendingInteraction, true);
    return () => {
      ownerDocument.removeEventListener("pointercancel", clearPendingInteraction, true);
      clearPendingInteraction();
      const index = visibleCompactSelectOverlays.indexOf(overlayRef);
      if (index >= 0) visibleCompactSelectOverlays.splice(index, 1);
    };
  }, [isOpen, overlayRef]);

  const isTopmost = () => visibleCompactSelectOverlays.at(-1) === overlayRef;
  const onInteractOutsideStart = (event: PointerEvent) => {
    lastVisibleOverlay.current = visibleCompactSelectOverlays.at(-1);
    const target = getInteractionTarget(event);
    if (target && shouldCloseOnInteractOutside(target) && isTopmost()) {
      event.stopPropagation();
    }
  };
  const onInteractOutside = (event: PointerEvent) => {
    const target = getInteractionTarget(event);
    const completedForOverlay = lastVisibleOverlay.current === overlayRef;
    if (completedForOverlay && target && shouldCloseOnInteractOutside(target)) {
      if (isTopmost()) event.stopPropagation();
      onClose(target);
    }
    lastVisibleOverlay.current = undefined;
  };
  useInteractOutside({
    ref: overlayRef,
    onInteractOutside: isDismissable && isOpen ? onInteractOutside : undefined,
    onInteractOutsideStart,
  });
  const { keyboardProps } = useKeyboard({
    shortcuts: {
      Escape: () => {
        if (isTopmost()) {
          lastVisibleOverlay.current = undefined;
          onClose();
        }
      },
    },
  });
  const { focusWithinProps } = useFocusWithin({
    isDisabled: !shouldCloseOnBlur,
    onBlurWithin: (event) => {
      const target = event.relatedTarget;
      if (!(target instanceof Element) || isElementInChildOfActiveScope(target)) {
        return;
      }
      if (shouldCloseOnInteractOutside(target)) {
        lastVisibleOverlay.current = undefined;
        onClose();
      }
    },
  });
  return { overlayProps: { ...keyboardProps, ...focusWithinProps } };
}

function Control<Value extends SelectKey>({
  autoFocus,
  trigger,
  triggerId,
  isOpen,
  onClose,
  isDismissable = true,
  onInteractOutside,
  shouldCloseOnInteractOutside,
  shouldCloseOnBlur = false,
  preventOverflowOptions,
  flipOptions,
  disabled = false,
  position = "bottom-start",
  strategy = "absolute",
  offset = 8,
  hideOptions,
  menuTitle,
  maxMenuHeight = "32rem",
  menuWidth,
  menuMinWidth,
  menuHeight,
  menuHeaderTrailingItems,
  menuBody,
  menuFooter,
  onOpenChange,
  items = [],
  isOptionDisabled,
  value,
  size = "md",
  search: searchConfig,
  clearable = false,
  onClear,
  loading = false,
  mode = "list",
  children,
  menuRef,
  className,
  style,
  ...wrapperProps
}: ControlProps & {
  isOptionDisabled?: (option: SelectOptionWithKey<Value>) => boolean;
  items?: Array<SelectOptionOrSectionWithKey<Value>>;
  menuRef?: Ref<HTMLDivElement>;
  value?: Value | Value[];
}) {
  const generatedTriggerId = useId();
  const resolvedTriggerId = triggerId ?? generatedTriggerId;
  const [open, setOpen] = useCompactSelectOpenState({
    controlledOpen: isOpen,
    onClose,
    onOpenChange,
  });
  const [triggerElement, setTriggerElement] = useState<HTMLButtonElement | null>(null);
  const [positionerElement, setPositionerElement] = useState<HTMLDivElement | null>(null);
  const [popupElement, setPopupElement] = useState<HTMLDivElement | null>(null);
  const popupOverlayRef = useRef<HTMLDivElement>(null);
  const popupRef = useCallback((element: HTMLDivElement | null) => {
    setPopupElement(element);
  }, []);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const normalizedSearch = getSearchConfig(searchConfig);
  const [search, setSearch] = useState("");
  const [searchInputValue, setSearchInputValue] = useState("");
  const [menuFullWidth, setMenuFullWidth] = useState<number>();
  const searchMatcher =
    typeof normalizedSearch?.filter === "function" ? normalizedSearch.filter : undefined;
  const previousOpen = useRef(open);
  const overlayState = useMemo<CompactSelectOverlayState>(
    () => ({
      isOpen: open,
      close: () => setOpen(false),
      open: () => setOpen(true),
      setOpen,
      toggle: () => setOpen(!open),
    }),
    [open, setOpen],
  );
  const isClosing = useRef(false);
  const { overlayProps } = useCompactSelectOverlay({
    isDismissable,
    isOpen: open,
    onClose: (outsideTarget) => {
      isClosing.current = true;
      if (outsideTarget) onInteractOutside?.();
      const targetTrigger = outsideTarget?.closest<HTMLElement>('[aria-expanded="false"]');
      if (targetTrigger?.isConnected) {
        targetTrigger.focus();
        targetTrigger.click();
      }
      setOpen(false);
      isClosing.current = false;
    },
    overlayRef: popupOverlayRef,
    shouldCloseOnBlur,
    shouldCloseOnInteractOutside: (target) => {
      if (wrapperRef.current?.contains(target)) return false;
      return !isClosing.current && (shouldCloseOnInteractOutside?.(target) ?? true);
    },
  });

  useEffect(() => {
    if (previousOpen.current && !open) {
      setSearch("");
      setSearchInputValue("");
      if (
        document.activeElement === document.body ||
        wrapperRef.current?.contains(document.activeElement)
      ) {
        triggerElement?.focus();
      }
    }
    previousOpen.current = open;
  }, [open, triggerElement]);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      if (
        document.activeElement instanceof Element &&
        popupElement?.contains(document.activeElement)
      ) {
        return;
      }
      if (normalizedSearch) searchRef.current?.focus();
      else {
        const selected = popupElement?.querySelector<HTMLElement>(
          `[role="${mode === "grid" ? "row" : "option"}"][aria-selected="true"]`,
        );
        const first = popupElement?.querySelector<HTMLElement>(
          `[role="${mode === "grid" ? "row" : "option"}"]`,
        );
        (selected ?? first)?.focus();
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [mode, normalizedSearch, open, popupElement]);

  useEffect(() => {
    if (!autoFocus || disabled || !triggerElement) return;
    triggerElement.focus();
  }, [autoFocus, disabled, triggerElement]);

  const { hidden: hiddenOptions } = getHiddenOptions(items, search, Infinity, searchMatcher);
  const disabledOptions = new Set(getDisabledOptions(items, isOptionDisabled));
  const selectableOptions = items
    .flatMap((item) => (itemIsSectionWithKey(item) ? item.options : item))
    .filter((item) => !hiddenOptions.has(item.key) && !disabledOptions.has(item.key));
  const selectedOptions = items
    .flatMap((item) => (itemIsSectionWithKey(item) ? item.options : item))
    .filter((item) => (Array.isArray(value) ? value.includes(item.value) : value === item.value));
  const hasSelection = Array.isArray(value) ? value.length > 0 : value !== undefined;
  const triggerLabel = selectedOptions.length ? (
    <Fragment>
      <TriggerLabel>{selectedOptions[0]?.label}</TriggerLabel>
      {selectedOptions.length > 1 ? (
        <Badge className="ml-1 shrink-0" variant="muted">
          +{selectedOptions.length - 1}
        </Badge>
      ) : null}
    </Fragment>
  ) : (
    <TriggerLabel>{t("None")}</TriggerLabel>
  );

  const popupPosition = useOverlayPosition({
    open,
    placement: position,
    strategy,
    offset,
    flipOptions,
    preventOverflowOptions,
    trigger: triggerElement,
    popup: positionerElement,
  });
  const positionerStyle = {
    left: popupPosition?.x ?? 0,
    maxHeight: Number.isFinite(popupPosition?.availableHeight)
      ? popupPosition?.availableHeight
      : undefined,
    maxWidth: Number.isFinite(popupPosition?.availableWidth)
      ? popupPosition?.availableWidth
      : undefined,
    position: popupPosition?.strategy ?? strategy,
    top: popupPosition?.y ?? 0,
    visibility: popupPosition ? "visible" : "hidden",
  } satisfies CSSProperties;
  const popupStyle = {
    height: withUnits(menuHeight),
    maxHeight: Number.isFinite(popupPosition?.availableHeight)
      ? `min(${withUnits(maxMenuHeight)}, ${popupPosition?.availableHeight}px)`
      : withUnits(maxMenuHeight),
    maxWidth: Number.isFinite(popupPosition?.availableWidth)
      ? `min(${(popupPosition?.availableWidth ?? 0) * 0.9}px, 100%)`
      : "100%",
    minWidth: withUnits(menuMinWidth) ?? triggerElement?.offsetWidth,
    width: withUnits(menuWidth ?? menuFullWidth),
  } satisfies CSSProperties;
  const contextValue = {
    disabled,
    highlightSearch: normalizedSearch?.highlight ?? false,
    overlayIsOpen: open,
    overlayState,
    search,
    searchable: Boolean(normalizedSearch),
    searchMatcher,
    size,
  };
  const mergedTriggerProps: TriggerProps = {
    "aria-controls": open ? `${resolvedTriggerId}-menu` : undefined,
    "aria-expanded": open,
    "aria-haspopup": mode === "grid" ? "menu" : "listbox",
    children: triggerLabel,
    disabled,
    id: resolvedTriggerId,
    onClick: () => setOpen(!open),
    onKeyDown: (event) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        setOpen(true);
      }
    },
    ref: setTriggerElement,
    type: "button",
  };

  function updateSearch(value: string) {
    normalizedSearch?.onChange?.(value);
    setSearchInputValue(value);
    if (normalizedSearch?.filter !== false) setSearch(value);
  }

  return (
    <ControlContext value={contextValue}>
      <div
        {...wrapperProps}
        className={cn("relative inline-block max-w-full", className)}
        ref={wrapperRef}
        style={style}
      >
        {trigger
          ? trigger(mergedTriggerProps, open)
          : defaultTrigger(mergedTriggerProps, open, disabled, size)}
        {open ? (
          <div
            className="z-[10002] min-w-full"
            data-placement={popupPosition?.placement}
            data-slot="compact-select-positioner"
            ref={setPositionerElement}
            style={positionerStyle}
          >
            <div
              {...overlayProps}
              className="flex max-h-full max-w-full flex-col overflow-hidden rounded-[6px] border border-[var(--scraps-menu-list-item-overlay-border,#dad9de)] bg-[var(--scraps-menu-list-item-overlay-background,#fff)] text-[var(--scraps-content-primary,#302e36)] shadow-[0_2px_0_var(--scraps-menu-list-item-overlay-shadow,#dad9de)]"
              data-menu-has-footer={Boolean(menuFooter)}
              data-menu-has-header={Boolean(menuTitle || clearable)}
              data-menu-has-search={Boolean(normalizedSearch)}
              data-slot="compact-select-popup"
              id={`${resolvedTriggerId}-menu`}
              ref={mergeRefs(popupOverlayRef, popupRef, menuRef)}
              style={popupStyle}
            >
              <FocusScope contain>
                {menuTitle || menuHeaderTrailingItems || (clearable && hasSelection) ? (
                  <div
                    className={cn(
                      "relative z-2 flex items-center justify-between px-3 text-[var(--scraps-content-primary,#302e36)] shadow-[0_1px_0_var(--scraps-border-secondary,#dad9de)]",
                      size === "xs"
                        ? "py-0.5 text-xs/5"
                        : size === "sm"
                          ? "py-1 text-sm/5"
                          : "py-2 text-sm/5",
                      normalizedSearch && "pb-0 shadow-none",
                    )}
                    data-slot="compact-select-header"
                  >
                    <span className="mr-4 font-medium whitespace-nowrap">{menuTitle}</span>
                    <div className="grid grid-flow-col gap-1">
                      {loading ? (
                        <span
                          aria-label={t("Loading")}
                          className="size-3 animate-spin rounded-full border-2 border-current border-r-transparent"
                          role="status"
                        />
                      ) : null}
                      {typeof menuHeaderTrailingItems === "function"
                        ? menuHeaderTrailingItems({
                            closeOverlay: overlayState.close,
                          })
                        : menuHeaderTrailingItems}
                      {clearable && hasSelection ? (
                        <Button
                          className="-mx-1 -my-0.5 px-1 font-normal text-[var(--scraps-content-secondary,#6a6772)]"
                          onClick={() => onClear?.({ overlayState })}
                          size="zero"
                          variant="transparent"
                        >
                          {t("Clear")}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ) : null}
                {normalizedSearch ? (
                  <InputGroup>
                    <InputGroup.LeadingItems disablePointerEvents>
                      <span className="flex translate-x-px translate-y-px items-center justify-center pl-0.5 text-[var(--scraps-content-secondary,#6a6772)]">
                        <SearchIcon />
                      </span>
                    </InputGroup.LeadingItems>
                    <InputGroup.Input
                      className="m-1 w-[calc(100%-0.5rem)]"
                      data-1p-ignore
                      onChange={(event) => updateSearch(event.target.value)}
                      onBlur={() => {
                        if (!search) setMenuFullWidth(undefined);
                      }}
                      onFocus={() => setMenuFullWidth(popupElement?.offsetWidth)}
                      onKeyDown={(event) => {
                        if (event.key === "ArrowDown") {
                          event.preventDefault();
                          popupElement
                            ?.querySelector<HTMLElement>(
                              `[role="${mode === "grid" ? "row" : "option"}"]`,
                            )
                            ?.focus();
                        }
                        if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                          event.preventDefault();
                          const firstOption = popupElement?.querySelector<HTMLElement>(
                            `[role="${
                              mode === "grid" ? "row" : "option"
                            }"]:not([aria-disabled="true"])`,
                          );
                          if (!loading && selectableOptions.length === 1 && firstOption) {
                            firstOption.click();
                          } else if (!loading && selectableOptions.length > 0) {
                            (
                              firstOption ??
                              popupElement?.querySelector<HTMLElement>(
                                `[role="${mode === "grid" ? "grid" : "listbox"}"]`,
                              )
                            )?.focus();
                          }
                        }
                      }}
                      placeholder={normalizedSearch.placeholder ?? t("Search…")}
                      ref={searchRef}
                      size="xs"
                      value={searchInputValue}
                    />
                  </InputGroup>
                ) : null}
                {typeof menuBody === "function"
                  ? menuBody({ closeOverlay: overlayState.close })
                  : menuBody}
                {!hideOptions ? (
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
                ) : null}
                {menuFooter ? (
                  <div className="z-2 px-3 py-2 shadow-[0_-1px_0_var(--scraps-border-secondary,#dad9de)]">
                    {typeof menuFooter === "function"
                      ? menuFooter({
                          closeOverlay: overlayState.close,
                          resetSearch: () => updateSearch(""),
                        })
                      : menuFooter}
                  </div>
                ) : null}
              </FocusScope>
            </div>
          </div>
        ) : null}
      </div>
    </ControlContext>
  );
}

type InternalListProps<Value extends SelectKey> = SelectionListProps<Value> & {
  ariaLabelledBy?: string;
  clearable: boolean;
  emptyMessage?: ReactNode;
  multiple: boolean;
  onChange: (selected: SelectOption<Value> | Array<SelectOption<Value>> | undefined) => void;
  shouldCloseOnSelect: (selectedOptions: Array<SelectOption<Value>>) => boolean;
  showEmptyMessage?: boolean;
  value: Value | Value[] | undefined;
  visibilityKey?: string;
  onVisibleOptionsChange?: (key: string, hasVisibleOptions: boolean) => void;
};

function InternalList<Value extends SelectKey>({
  items,
  value,
  onChange,
  mode = "list",
  multiple,
  clearable,
  isOptionDisabled,
  size = "md",
  sizeLimit,
  sizeLimitMessage,
  shouldCloseOnSelect,
  virtualized,
  label,
  emptyMessage,
  ariaLabelledBy,
  onAction,
  shouldFocusOnHover = true,
  shouldFocusWrap = true,
  showEmptyMessage = true,
  visibilityKey,
  onVisibleOptionsChange,
  ...selectionProps
}: InternalListProps<Value>) {
  const { overlayState, search, searchable, overlayIsOpen, searchMatcher } =
    useContext(ControlContext);
  const hasSections = useMemo(() => items.some(itemIsSectionWithKey), [items]);
  const isFlatCollectionTruncated =
    searchable && !hasSections && !search && sizeLimit !== undefined && items.length > sizeLimit;
  const { hidden, scores } = useMemo(
    () =>
      isFlatCollectionTruncated
        ? {
            hidden: new Set<SelectKey>(),
            scores: new Map<SelectKey, number>(),
          }
        : getHiddenOptions(items, search, sizeLimit, searchMatcher),
    [isFlatCollectionTruncated, items, search, searchMatcher, sizeLimit],
  );
  const sortedItems = useMemo(
    () => (scores.size ? getSortedItems(items, scores) : items),
    [items, scores],
  );
  const collectionItems = useMemo(
    () => (isFlatCollectionTruncated ? sortedItems.slice(0, sizeLimit) : sortedItems),
    [isFlatCollectionTruncated, sizeLimit, sortedItems],
  );
  const disabledKeys = [...getDisabledOptions(collectionItems, isOptionDisabled), ...hidden];
  const listId = useId();
  const consumerStateProps: Partial<ListProps<ListItemBase>> = {
    allowDuplicateSelectionEvents: selectionProps.allowDuplicateSelectionEvents,
    collection: selectionProps.collection,
    defaultSelectedKeys: selectionProps.defaultSelectedKeys,
    disabledBehavior: selectionProps.disabledBehavior,
    disabledKeys: selectionProps.disabledKeys,
    filter: selectionProps.filter,
    layoutDelegate: selectionProps.layoutDelegate,
    onSelectionChange: selectionProps.onSelectionChange,
    selectedKeys: selectionProps.selectedKeys,
    selectionBehavior: selectionProps.selectionBehavior,
    selectionMode: selectionProps.selectionMode,
    suppressTextValueWarning: selectionProps.suppressTextValueWarning,
  };
  const state = useListState<ListItemBase>({
    ...consumerStateProps,
    allowDuplicateSelectionEvents: true,
    children: (item) => {
      const typedItem = item as SelectOptionOrSectionWithKey<Value>;
      return itemIsSectionWithKey(typedItem) ? (
        <Section key={typedItem.key} title={typedItem.label}>
          {typedItem.options.map((option) => (
            <Item
              {...option}
              key={option.key}
              textValue={
                option.textValue ??
                (typeof option.label === "string" ? option.label : String(option.value))
              }
            >
              {option.label}
            </Item>
          ))}
        </Section>
      ) : (
        <Item
          {...typedItem}
          key={typedItem.key}
          textValue={
            typedItem.textValue ??
            (typeof typedItem.label === "string" ? typedItem.label : String(typedItem.value))
          }
        >
          {typedItem.label}
        </Item>
      );
    },
    disabledKeys,
    disallowEmptySelection: !multiple && !clearable,
    items: collectionItems,
    onSelectionChange: (selection) => {
      const selected = getSelectedOptions(items, selection);
      onChange(multiple ? selected : selected[0]);
      if (shouldCloseOnSelect(selected)) {
        overlayState?.close();
      }
    },
    selectedKeys: Array.isArray(value)
      ? value.map(getEscapedKey)
      : value === undefined
        ? []
        : [getEscapedKey(value)],
    selectionMode: multiple ? "multiple" : "single",
  } satisfies ListProps<ListItemBase>);
  const focusManager = useFocusManager();
  let firstFocusableKey = state.collection.getFirstKey();
  while (
    firstFocusableKey !== null &&
    (state.collection.getItem(firstFocusableKey)?.type === "section" ||
      state.selectionManager.isDisabled(firstFocusableKey))
  ) {
    firstFocusableKey = state.collection.getKeyAfter(firstFocusableKey);
  }
  let lastFocusableKey = state.collection.getLastKey();
  while (
    lastFocusableKey !== null &&
    (state.collection.getItem(lastFocusableKey)?.type === "section" ||
      state.selectionManager.isDisabled(lastFocusableKey))
  ) {
    lastFocusableKey = state.collection.getKeyBefore(lastFocusableKey);
  }
  const keyDownHandler = (event: React.KeyboardEvent<HTMLElement>) => {
    if (shouldFocusWrap && mode !== "grid") return true;
    const acceptsEnabledOption = (element: Element) =>
      (element.getAttribute("role") === "option" || element.getAttribute("role") === "row") &&
      element.getAttribute("aria-disabled") !== "true";
    if (event.key === "ArrowDown" && state.selectionManager.focusedKey === lastFocusableKey) {
      focusManager?.focusNext({ accept: acceptsEnabledOption, wrap: true });
      return false;
    }
    if (event.key === "ArrowUp" && state.selectionManager.focusedKey === firstFocusableKey) {
      focusManager?.focusPrevious({ accept: acceptsEnabledOption, wrap: true });
      return false;
    }
    return true;
  };
  const list =
    mode === "grid" ? (
      <SelectFilterContext value={hidden}>
        <GridList
          aria-describedby={selectionProps["aria-describedby"]}
          aria-details={selectionProps["aria-details"]}
          aria-label={selectionProps["aria-label"]}
          aria-labelledby={
            label ? undefined : (selectionProps["aria-labelledby"] ?? ariaLabelledBy)
          }
          disabledBehavior={selectionProps.disabledBehavior}
          disallowTypeAhead={selectionProps.disallowTypeAhead}
          escapeKeyBehavior={selectionProps.escapeKeyBehavior}
          id={listId}
          keyDownHandler={keyDownHandler}
          keyboardDelegate={selectionProps.keyboardDelegate}
          keyboardNavigationBehavior={selectionProps.keyboardNavigationBehavior}
          label={label}
          layoutDelegate={selectionProps.layoutDelegate}
          linkBehavior={selectionProps.linkBehavior}
          listState={state}
          onAction={onAction}
          onBlur={selectionProps.onBlur}
          onFocus={selectionProps.onFocus}
          onFocusChange={selectionProps.onFocusChange}
          shouldSelectOnPressUp={selectionProps.shouldSelectOnPressUp}
          shouldFocusWrap={shouldFocusWrap}
          size={size}
          sizeLimitMessage={sizeLimitMessage}
          UNSTABLE_focusOnEntry={selectionProps.UNSTABLE_focusOnEntry}
          virtualized={virtualized}
        />
      </SelectFilterContext>
    ) : (
      <ListBox
        aria-describedby={selectionProps["aria-describedby"]}
        aria-details={selectionProps["aria-details"]}
        aria-label={selectionProps["aria-label"]}
        aria-labelledby={label ? undefined : (selectionProps["aria-labelledby"] ?? ariaLabelledBy)}
        disallowTypeAhead={selectionProps.disallowTypeAhead}
        escapeKeyBehavior={selectionProps.escapeKeyBehavior}
        hasSearch={Boolean(search)}
        hiddenOptions={hidden}
        id={listId}
        keyDownHandler={keyDownHandler}
        keyboardDelegate={selectionProps.keyboardDelegate}
        label={label}
        layoutDelegate={selectionProps.layoutDelegate}
        linkBehavior={selectionProps.linkBehavior}
        listState={state}
        onAction={onAction}
        onBlur={selectionProps.onBlur}
        onFocus={selectionProps.onFocus}
        onFocusChange={selectionProps.onFocusChange}
        orientation={selectionProps.orientation}
        overlayIsOpen={overlayIsOpen}
        searchable={searchable}
        selectionBehavior={selectionProps.selectionBehavior}
        shouldFocusOnHover={shouldFocusOnHover}
        shouldFocusWrap={shouldFocusWrap}
        shouldSelectOnPressUp={selectionProps.shouldSelectOnPressUp}
        size={size}
        sizeLimitMessage={sizeLimitMessage}
        virtualized={virtualized}
        UNSTABLE_focusOnEntry={selectionProps.UNSTABLE_focusOnEntry}
      />
    );
  const hasVisibleOptions = [...state.collection].some((item) =>
    item.type === "section"
      ? [...item.childNodes].some((child) => !hidden.has(child.key))
      : !hidden.has(item.key),
  );
  useEffect(() => {
    if (visibilityKey) onVisibleOptionsChange?.(visibilityKey, hasVisibleOptions);
  }, [hasVisibleOptions, onVisibleOptionsChange, visibilityKey]);
  return (
    <Fragment>
      {list}
      {multiple ? <SectionToggles listId={listId} listState={state} /> : null}
      {showEmptyMessage && !hasVisibleOptions ? (
        <p className="m-0 px-3 pt-2 pb-3 text-center text-sm text-[var(--scraps-content-secondary,#6a6772)]">
          {emptyMessage ?? t("No options found")}
        </p>
      ) : null}
    </Fragment>
  );
}

export function CompactSelect<Value extends number>(props: SelectProps<Value>): ReactElement;
export function CompactSelect<Value extends string>(props: SelectProps<Value>): ReactElement;
export function CompactSelect<Value extends SelectKey>(props: SelectProps<Value>): ReactElement;
export function CompactSelect<Value extends SelectKey>(props: SelectProps<Value>) {
  const {
    options,
    value,
    onChange: _onChange,
    multiple = false,
    clearable = false,
    isOptionDisabled,
    collection,
    disabledKeys: consumerDisabledKeys,
    selectionMode: consumerSelectionMode,
    selectedKeys: consumerSelectedKeys,
    defaultSelectedKeys,
    onSelectionChange: consumerOnSelectionChange,
    selectionBehavior,
    allowDuplicateSelectionEvents,
    disabledBehavior,
    filter,
    suppressTextValueWarning,
    layoutDelegate,
    sizeLimit,
    sizeLimitMessage,
    onAction,
    onBlur,
    onFocus,
    onFocusChange,
    id,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    "aria-describedby": ariaDescribedBy,
    "aria-details": ariaDetails,
    escapeKeyBehavior,
    shouldSelectOnPressUp,
    shouldFocusOnHover,
    shouldFocusWrap,
    keyboardDelegate,
    linkBehavior,
    orientation,
    keyboardNavigationBehavior,
    disallowTypeAhead,
    UNSTABLE_focusOnEntry,
    virtualized: consumerVirtualized,
    virtualizeThreshold = 150,
    mode = "list",
    disabled,
    emptyMessage,
    size = "md",
    closeOnSelect: _closeOnSelect,
    ...controlProps
  } = props;
  void _onChange;
  void _closeOnSelect;
  const forwardedListProps = {
    "aria-describedby": ariaDescribedBy,
    "aria-details": ariaDetails,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    UNSTABLE_focusOnEntry,
    allowDuplicateSelectionEvents,
    collection,
    defaultSelectedKeys,
    disabledBehavior,
    disabledKeys: consumerDisabledKeys,
    disallowTypeAhead,
    escapeKeyBehavior,
    filter,
    id,
    keyboardDelegate,
    keyboardNavigationBehavior,
    layoutDelegate,
    linkBehavior,
    onAction,
    onBlur,
    onFocus,
    onFocusChange,
    onSelectionChange: consumerOnSelectionChange,
    orientation,
    selectedKeys: consumerSelectedKeys,
    selectionBehavior,
    selectionMode: consumerSelectionMode,
    shouldFocusOnHover,
    shouldFocusWrap,
    shouldSelectOnPressUp,
    suppressTextValueWarning,
  } satisfies Partial<CompactSelectionListProps<Value>>;
  const triggerId = useId();
  const items = useMemo(() => getItemsWithKeys(options), [options]);
  const controlDisabled = disabled ?? options.length === 0;
  const [measuredMenuWidth, setMeasuredMenuWidth] = useState<number>();
  const [hasMeasuredMenu, setHasMeasuredMenu] = useState(false);
  const shouldVirtualize = (candidateItems: Array<SelectOptionOrSectionWithKey<Value>>) =>
    !candidateItems.some(itemIsSectionWithKey) && candidateItems.length > virtualizeThreshold;
  const needsMenuMeasurement =
    controlProps.menuWidth === undefined && !hasMeasuredMenu && shouldVirtualize(items);
  const measuredItems = useMemo(() => {
    if (!needsMenuMeasurement) return items;
    let longest: SelectOptionOrSectionWithKey<Value> | undefined;
    let longestLength = -1;
    for (const item of items) {
      if (itemIsSectionWithKey(item)) continue;
      const length =
        item.textValue?.length ?? (typeof item.label === "string" ? item.label.length : 0);
      if (length > longestLength) {
        longest = item;
        longestLength = length;
      }
    }
    return longest ? [longest] : [];
  }, [items, needsMenuMeasurement]);
  const virtualized = consumerVirtualized ?? shouldVirtualize(measuredItems);
  const measureMenu = useCallback(
    (element: HTMLDivElement | null) => {
      if (element && needsMenuMeasurement) setMeasuredMenuWidth(element.offsetWidth + 1);
      if (element) setHasMeasuredMenu(true);
    },
    [needsMenuMeasurement],
  );
  const resolveShouldClose = useCallback(
    (selectedOptions: Array<SelectOption<Value>>) => {
      if (props.multiple) {
        return typeof props.closeOnSelect === "function"
          ? props.closeOnSelect(selectedOptions)
          : (props.closeOnSelect ?? false);
      }
      const selectedOption = selectedOptions[0];
      if (props.clearable) {
        return typeof props.closeOnSelect === "function"
          ? props.closeOnSelect(selectedOption)
          : (props.closeOnSelect ?? true);
      }
      if (!selectedOption) return false;
      return typeof props.closeOnSelect === "function"
        ? props.closeOnSelect(selectedOption)
        : (props.closeOnSelect ?? true);
    },
    [props],
  );

  const handleChange = useCallback(
    (selection: SelectOption<Value> | Array<SelectOption<Value>> | undefined) => {
      if (props.multiple) {
        if (Array.isArray(selection)) props.onChange(selection);
        return;
      }
      if (Array.isArray(selection)) return;
      if (props.clearable) {
        props.onChange(selection);
      } else if (selection) {
        props.onChange(selection);
      }
    },
    [props],
  );
  return (
    <Control
      {...controlProps}
      clearable={clearable}
      disabled={controlDisabled}
      isOptionDisabled={isOptionDisabled}
      items={items}
      menuHeight={needsMenuMeasurement ? "1px" : controlProps.menuHeight}
      menuRef={measureMenu}
      menuWidth={controlProps.menuWidth ?? measuredMenuWidth}
      mode={mode}
      onClear={({ overlayState }) => {
        if (!clearable) return;
        if (props.multiple) {
          props.onChange([]);
        } else if (props.clearable) {
          props.onChange(undefined);
        }
        if (resolveShouldClose([])) overlayState.close();
      }}
      size={size}
      triggerId={triggerId}
      value={value}
    >
      <InternalList
        {...forwardedListProps}
        ariaLabelledBy={triggerId}
        clearable={clearable}
        emptyMessage={emptyMessage}
        isOptionDisabled={isOptionDisabled}
        items={measuredItems}
        mode={mode}
        multiple={multiple}
        onChange={handleChange}
        shouldCloseOnSelect={resolveShouldClose}
        size={size}
        sizeLimit={sizeLimit}
        sizeLimitMessage={sizeLimitMessage}
        value={value}
        virtualized={virtualized}
      />
    </Control>
  );
}

interface BaseCompositeSelectRegion<Value extends SelectKey> {
  options: Array<SelectOption<Value>>;
  key?: SelectKey;
  label?: ReactNode;
}

type SingleCompositeSelectRegion<Value extends SelectKey> = BaseCompositeSelectRegion<Value> &
  RegionSelectionListProps<Value> &
  (
    | {
        clearable: true;
        closeOnSelect?: boolean | ((option: SelectOption<Value> | undefined) => boolean);
        multiple?: false;
        onChange: (option: SelectOption<Value> | undefined) => void;
        value: Value | undefined;
      }
    | {
        clearable?: false;
        closeOnSelect?: boolean | ((option: SelectOption<Value>) => boolean);
        multiple?: false;
        onChange: (option: SelectOption<Value>) => void;
        value: Value | undefined;
      }
  );
type MultipleCompositeSelectRegion<Value extends SelectKey> = BaseCompositeSelectRegion<Value> &
  RegionSelectionListProps<Value> & {
    clearable?: boolean;
    closeOnSelect?: boolean | ((options: Array<SelectOption<Value>>) => boolean);
    multiple: true;
    onChange: (options: Array<SelectOption<Value>>) => void;
    value: Value[] | undefined;
  };
type CompositeSelectRegion<Value extends SelectKey> =
  | SingleCompositeSelectRegion<Value>
  | MultipleCompositeSelectRegion<Value>;
type CompositeSelectChild =
  | ReactElement<CompositeSelectRegion<SelectKey>>
  | false
  | null
  | undefined;

interface CompositeSelectProps extends Omit<ControlProps, "clearable" | "trigger"> {
  children: CompositeSelectChild | CompositeSelectChild[];
  trigger: NonNullable<ControlProps["trigger"]>;
}

function CompositeSelectRegion<Value extends SelectKey>(_props: CompositeSelectRegion<Value>) {
  void _props;
  return null;
}

function CompositeSelectClearButton(
  props: DistributedOmit<ButtonProps, "children" | "size" | "variant">,
) {
  return (
    <Button size="zero" variant="transparent" {...props}>
      {t("Clear")}
    </Button>
  );
}

function CompositeSelectRegions({
  children,
  emptyMessage,
  mode,
  size,
}: {
  children: CompositeSelectProps["children"];
  emptyMessage?: ReactNode;
  mode: "grid" | "list";
  size: CompactSelectSize;
}) {
  const { search, searchMatcher } = useContext(ControlContext);
  const regionElements = Children.toArray(children).filter(
    (child): child is ReactElement<CompositeSelectRegion<SelectKey>> =>
      isValidElement<CompositeSelectRegion<SelectKey>>(child),
  );
  const regions = regionElements.map((child, index) => ({
    child,
    id: `${index}:${String(child.key ?? "region")}`,
    items: getItemsWithKeys(child.props.options),
  }));
  const sourceVisibility = new Map(
    regions.map(({ child, id, items }) => {
      const { hidden } = getHiddenOptions(items, search, child.props.sizeLimit, searchMatcher);
      return [id, items.some((item) => !hidden.has(item.key))] as const;
    }),
  );
  const [regionVisibility, setRegionVisibility] = useState(sourceVisibility);
  const updateRegionVisibility = useCallback((key: string, hasVisibleOptions: boolean) => {
    setRegionVisibility((current) => {
      if (current.get(key) === hasVisibleOptions) return current;
      const next = new Map(current);
      next.set(key, hasVisibleOptions);
      return next;
    });
  }, []);
  const hasVisibleOptions = regions.some(
    ({ id }) => regionVisibility.get(id) ?? sourceVisibility.get(id),
  );

  return (
    <div className="min-h-0 overflow-auto py-1 [&>ul]:p-0">
      {regions.map(({ child, id, items }) => {
        const {
          options: _options,
          value,
          onChange: _onChange,
          multiple = false,
          clearable = false,
          closeOnSelect: _closeOnSelect,
          ...regionProps
        } = child.props;
        void _onChange;
        void _closeOnSelect;
        void _options;
        const shouldClose = (selectedOptions: Array<SelectOption<SelectKey>>) => {
          if (child.props.multiple) {
            return typeof child.props.closeOnSelect === "function"
              ? child.props.closeOnSelect(selectedOptions)
              : (child.props.closeOnSelect ?? false);
          }
          const selectedOption = selectedOptions[0];
          if (child.props.clearable) {
            return typeof child.props.closeOnSelect === "function"
              ? child.props.closeOnSelect(selectedOption)
              : (child.props.closeOnSelect ?? true);
          }
          if (!selectedOption) return false;
          return typeof child.props.closeOnSelect === "function"
            ? child.props.closeOnSelect(selectedOption)
            : (child.props.closeOnSelect ?? true);
        };
        return (
          <InternalList
            {...regionProps}
            clearable={clearable}
            items={items}
            key={child.key}
            mode={mode}
            multiple={multiple}
            onChange={(selection) => {
              if (child.props.multiple) {
                if (Array.isArray(selection)) child.props.onChange(selection);
              } else if (!Array.isArray(selection)) {
                if (child.props.clearable) child.props.onChange(selection);
                else if (selection) child.props.onChange(selection);
              }
            }}
            shouldCloseOnSelect={shouldClose}
            shouldFocusWrap={false}
            showEmptyMessage={false}
            size={size}
            value={value}
            visibilityKey={id}
            onVisibleOptionsChange={updateRegionVisibility}
          />
        );
      })}
      {!hasVisibleOptions ? (
        <p className="m-0 px-3 py-2 text-center text-sm text-[var(--scraps-content-secondary,#6a6772)]">
          {emptyMessage ?? t("No options found")}
        </p>
      ) : null}
    </div>
  );
}

function CompositeSelectRoot({
  children,
  mode = "list",
  disabled,
  emptyMessage,
  size = "md",
  ...controlProps
}: CompositeSelectProps) {
  const items = Children.toArray(children).flatMap((child, regionIndex) => {
    if (!isValidElement<CompositeSelectRegion<SelectKey>>(child)) return [];
    return getItemsWithKeys(child.props.options).map((option) => ({
      ...option,
      disabled: option.disabled || child.props.isOptionDisabled?.(option),
      key: `${regionIndex}-${String(option.key)}`,
    }));
  });
  return (
    <Control {...controlProps} disabled={disabled} items={items} mode={mode} size={size}>
      <FocusScope>
        <CompositeSelectRegions emptyMessage={emptyMessage} mode={mode} size={size}>
          {children}
        </CompositeSelectRegions>
      </FocusScope>
    </Control>
  );
}

export const CompositeSelect = Object.assign(CompositeSelectRoot, {
  ClearButton: CompositeSelectClearButton,
  Region: CompositeSelectRegion,
});

function closeAfterClick(
  callback: ButtonProps["onClick"] | undefined,
  close: (() => void) | undefined,
) {
  return (event: React.MouseEvent<HTMLButtonElement>) => {
    callback?.(event);
    close?.();
  };
}

export const MenuComponents = {
  HeaderButton(props: DistributedOmit<ButtonProps, "size" | "variant">) {
    const { className, ...buttonProps } = props;
    return (
      <Button
        className={cn(
          "-mx-1 -my-2 px-1 font-normal text-[var(--scraps-content-secondary,#6a6772)]",
          className,
        )}
        size="zero"
        variant="transparent"
        {...buttonProps}
      />
    );
  },
  ResetButton(props: DistributedOmit<ButtonProps, "children" | "size" | "variant">) {
    const { overlayState } = useContext(ControlContext);
    return (
      <Button
        {...props}
        className={cn(
          "-mx-1 -my-2 px-1 font-normal text-[var(--scraps-content-secondary,#6a6772)]",
          props.className,
        )}
        onClick={closeAfterClick(props.onClick, overlayState?.close)}
        size="zero"
        variant="transparent"
      >
        {t("Reset")}
      </Button>
    );
  },
  ClearButton(props: DistributedOmit<ButtonProps, "children" | "size" | "variant">) {
    const { overlayState } = useContext(ControlContext);
    return (
      <Button
        {...props}
        className={cn(
          "-mx-1 -my-2 px-1 font-normal text-[var(--scraps-content-secondary,#6a6772)]",
          props.className,
        )}
        onClick={closeAfterClick(props.onClick, overlayState?.close)}
        size="zero"
        variant="transparent"
      >
        {t("Clear")}
      </Button>
    );
  },
  CTAButton(props: DistributedOmit<ButtonProps, "size" | "variant">) {
    return <Button size="xs" variant="secondary" {...props} />;
  },
  CTALinkButton(props: DistributedOmit<LinkButtonProps, "size" | "variant">) {
    return <LinkButton size="xs" variant="secondary" {...props} />;
  },
  ApplyButton(props: DistributedOmit<ButtonProps, "children" | "size" | "variant">) {
    const { overlayState } = useContext(ControlContext);
    return (
      <Button
        {...props}
        onClick={closeAfterClick(props.onClick, overlayState?.close)}
        size="xs"
        variant="primary"
      >
        {t("Apply")}
      </Button>
    );
  },
  CancelButton(props: DistributedOmit<ButtonProps, "children" | "size" | "variant">) {
    const { overlayState } = useContext(ControlContext);
    return (
      <Button
        {...props}
        onClick={closeAfterClick(props.onClick, overlayState?.close)}
        size="xs"
        variant="transparent"
      >
        {t("Cancel")}
      </Button>
    );
  },
  Alert({ children, className, ...props }: DistributedOmit<AlertProps, "showIcon" | "system">) {
    return (
      <Alert
        {...props}
        className={cn("px-3 py-1 text-balance", className)}
        showIcon={false}
        system={false}
      >
        <Text size="sm">{children}</Text>
      </Alert>
    );
  },
  Checkbox(props: DistributedOmit<CheckboxProps, "size">) {
    return <Checkbox size="sm" {...props} />;
  },
};
