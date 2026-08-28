"use client";

import type { AriaRadioProps } from "@react-aria/radio";
import { useRadio, useRadioGroup } from "@react-aria/radio";
import { Item, useCollection } from "@react-stately/collections";
import { ListCollection } from "@react-stately/list";
import type { RadioGroupProps, RadioGroupState } from "@react-stately/radio";
import { useRadioGroupState } from "@react-stately/radio";
import type { CollectionChildren, Node } from "@react-types/shared";
import { useMemo, useRef, type CSSProperties, type ReactNode } from "react";

import { Tooltip, type TooltipProps } from "./tooltip";

type FormSize = "xs" | "sm" | "md";
type Priority = "default" | "primary" | "secondary";

interface SegmentedControlItemProps<Value extends string> {
  key: Value;
  "aria-label"?: string;
  children?: ReactNode;
  disabled?: boolean;
  icon?: ReactNode;
  textValue?: string;
  tooltip?: ReactNode;
  tooltipOptions?: Omit<TooltipProps, "children" | "className" | "title">;
}

interface SegmentedControlProps<Value extends string> {
  children: CollectionChildren<Value>;
  onChange: (value: Value) => void;
  priority?: Priority;
  size?: FormSize;
  value: Value;
}

const collectionFactory = <T,>(nodes: Iterable<Node<T>>) => new ListCollection(nodes);

function mergeClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const sizeClasses: Record<FormSize, string> = {
  md: "h-9 min-h-9 text-sm/4",
  sm: "h-8 min-h-8 text-sm/4",
  xs: "h-7 min-h-7 text-xs/4",
};

const segmentGeometryClasses: Record<FormSize, string> = {
  md: "[--segment-lift:2px] [--segment-lift-base:2px] rounded-[8px]",
  sm: "[--segment-lift:2px] [--segment-lift-base:2px] rounded-[6px]",
  xs: "[--segment-lift:1px] [--segment-lift-base:1px] rounded-[5px]",
};

const rectangularPaddingClasses: Record<FormSize, string> = {
  md: "px-4 py-2",
  sm: "px-3 py-2",
  xs: "px-2 py-1.5",
};

const squareShapeClasses: Record<FormSize, string> = {
  md: "min-w-9 p-0",
  sm: "min-w-8 p-0",
  xs: "min-w-7 p-0",
};

const neutralSurfaceClasses =
  "[--segment-chonk:var(--scraps-button-secondary-chonk)] [--segment-surface:var(--scraps-button-secondary-surface)]";
const primarySurfaceClasses =
  "[--segment-chonk:var(--scraps-button-primary-chonk)] [--segment-surface:#7553ff]";
const unselectedContentClasses = "[--segment-content:var(--scraps-content-secondary)]";
const selectedNeutralContentClasses = "[--segment-content:var(--scraps-button-link-content)]";
const selectedPrimaryContentClasses = "[--segment-content:#fff]";
const selectedSegmentMotionClasses = "after:transition-none";
const unselectedSegmentMotionClasses =
  "after:transition-transform after:duration-[120ms] after:ease-[cubic-bezier(0.8,-0.4,0.5,1)]";
const selectedContentMotionClasses = "transition-none";
const unselectedContentMotionClasses =
  "transition-transform duration-[120ms] ease-[cubic-bezier(0.8,-0.4,0.5,1)]";

const segmentClasses =
  "relative z-0 inline-flex min-w-0 [transform:translateX(calc(-1px*var(--segment-index)))] cursor-pointer items-center justify-center whitespace-nowrap border-0 bg-transparent font-medium text-[var(--segment-content)] before:pointer-events-none before:absolute before:inset-0 before:top-[var(--segment-lift-base)] before:block before:h-[calc(100%-var(--segment-lift-base))] before:[transform:translateY(calc(-1*var(--segment-lift-base)))] before:rounded-[inherit] before:bg-[var(--segment-chonk)] before:shadow-[0_var(--segment-lift-base)_0_0_var(--segment-chonk)] before:content-[''] after:pointer-events-none after:absolute after:inset-0 after:block after:[transform:translateY(calc(-1*var(--segment-lift)))] after:rounded-[inherit] after:border after:border-[var(--segment-chonk)] after:bg-[var(--segment-surface)] after:content-[''] hover:[--segment-lift:calc(var(--segment-lift-base)+1px)] active:[--segment-lift:0px] data-[selected=true]:z-1 data-[selected=true]:[--segment-lift:0px] aria-[disabled=true]:[--segment-lift:0px] aria-[disabled=true]:opacity-60 has-[:focus-visible]:outline-hidden has-[:focus-visible]:[box-shadow:0_0_0_0_var(--scraps-segmented-control-focus-mask),0_0_0_2px_var(--scraps-segmented-control-focus)] [&:has(input:focus-visible)_span]:![box-shadow:none]";

const segmentInputClasses =
  "peer absolute inset-0 z-[-1] m-0 appearance-none rounded-[6px] p-0 transition-shadow duration-[125ms] ease-out focus:outline-hidden";

const labelWrapClasses =
  "relative z-1 inline-flex flex-1 items-center justify-center [gap:inherit] overflow-hidden whitespace-nowrap [transform:translateY(calc(-1*var(--segment-lift)))] peer-focus-visible:[box-shadow:0_0_0_0_var(--scraps-segmented-control-focus-mask),0_0_0_2px_var(--scraps-segmented-control-focus)]";

const visibleLabelClasses =
  "block w-full select-none overflow-hidden text-center font-medium text-ellipsis whitespace-nowrap";

type SegmentStyle = CSSProperties & { "--segment-index": number };

export function SegmentedControl<Value extends string>({
  value,
  onChange,
  size = "md",
  priority = "default",
  ...props
}: SegmentedControlProps<Value>) {
  const ref = useRef<HTMLDivElement>(null);
  const collection = useCollection<Value, ListCollection<Value>>(props, collectionFactory);
  const ariaProps = {
    ...props,
    value,
    onChange: onChange as (nextValue: string) => void,
    orientation: "horizontal",
  } satisfies RadioGroupProps;
  const state = useRadioGroupState(ariaProps);
  const { radioGroupProps } = useRadioGroup(ariaProps, state);
  const options = useMemo(() => [...collection], [collection]);

  return (
    <div
      {...radioGroupProps}
      ref={ref}
      className={mergeClasses(
        "relative inline-grid min-w-0 grid-flow-col [&>label:first-child]:rounded-r-none [&>label:last-child]:rounded-l-none [&>label:not(:first-child):not(:last-child)]:rounded-none",
        sizeClasses[size],
      )}
    >
      {options.map((option, index) => (
        <Segment
          {...option.props}
          key={option.key}
          isDisabled={option.props.disabled}
          priority={priority}
          size={size}
          state={state}
          style={{ "--segment-index": index }}
          value={String(option.key)}
        >
          {option.rendered}
        </Segment>
      ))}
    </div>
  );
}

SegmentedControl.Item = Item as <Value extends string>(
  props: SegmentedControlItemProps<Value>,
) => React.JSX.Element;

interface SegmentProps<Value extends string>
  extends SegmentedControlItemProps<Value>, AriaRadioProps {
  priority: Priority;
  size: FormSize;
  state: RadioGroupState;
  style: SegmentStyle;
}

function Segment<Value extends string>({
  state,
  size,
  priority,
  tooltip,
  tooltipOptions = {},
  icon,
  style,
  ...props
}: SegmentProps<Value>) {
  const ref = useRef<HTMLInputElement>(null);
  const { inputProps } = useRadio(props, state, ref);
  const isSelected = state.selectedValue === props.value;
  const usesPrimarySurface = isSelected && priority === "primary";
  const surfaceClasses = usesPrimarySurface ? primarySurfaceClasses : neutralSurfaceClasses;
  const contentClasses = isSelected
    ? priority === "primary"
      ? selectedPrimaryContentClasses
      : selectedNeutralContentClasses
    : unselectedContentClasses;
  const shapeClasses = props.children ? rectangularPaddingClasses[size] : squareShapeClasses[size];
  const segmentMotionClasses = isSelected
    ? selectedSegmentMotionClasses
    : unselectedSegmentMotionClasses;
  const contentMotionClasses = isSelected
    ? selectedContentMotionClasses
    : unselectedContentMotionClasses;

  const content = (
    <label
      aria-disabled={props.isDisabled}
      className={mergeClasses(
        "group/segment",
        segmentClasses,
        sizeClasses[size],
        segmentGeometryClasses[size],
        shapeClasses,
        surfaceClasses,
        contentClasses,
        segmentMotionClasses,
      )}
      data-selected={isSelected || undefined}
      data-test-id={props.value}
      style={style}
    >
      <input {...inputProps} ref={ref} className={segmentInputClasses} />
      <span className={mergeClasses(labelWrapClasses, contentMotionClasses)} role="presentation">
        {icon}
        {props.children ? <span className={visibleLabelClasses}>{props.children}</span> : null}
      </span>
    </label>
  );

  if (!tooltip) return content;

  return (
    <Tooltip skipWrapper title={tooltip} {...{ delay: 500, position: "bottom", ...tooltipOptions }}>
      {content}
    </Tooltip>
  );
}
