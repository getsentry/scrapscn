"use client";

import { useNumberFormatter } from "@react-aria/i18n";
import type { AriaSliderProps } from "@react-aria/slider";
import { useSlider, useSliderThumb } from "@react-aria/slider";
import { VisuallyHidden } from "@react-aria/visually-hidden";
import { useSliderState } from "@react-stately/slider";
import {
  useImperativeHandle,
  useMemo,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type Ref,
} from "react";

import { cn } from "../../lib/utils";

type Ticks =
  | { count: number; labels?: boolean }
  | { interval: number; labels?: boolean }
  | { values: number[]; labels?: boolean };

interface BaseProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "defaultValue" | "id" | "onChange"
> {
  defaultValue?: number;
  disabled?: boolean;
  formatOptions?: Intl.NumberFormatOptions | "hidden";
  id?: string;
  max?: number;
  min?: number;
  name?: string;
  onChangeEnd?: (value: number) => void;
  ref?: Ref<HTMLInputElement>;
  step?: number;
  ticks?: Ticks;
}

interface ControlledProps extends BaseProps {
  onChange: (value: number) => void;
  value: number | "";
}

interface UncontrolledProps extends BaseProps {
  onChange?: never;
  value?: never;
}

export type SliderProps = ControlledProps | UncontrolledProps;

export function Slider({
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  ticks,
  formatOptions,
  name,
  id,
  onChangeEnd,
  className,
  ref,
  ...props
}: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { value, onChange, defaultValue, "aria-valuetext": ariaValueText, ...htmlProps } = props;
  const effectiveValue = value === "" ? undefined : value;
  const hidden = formatOptions === "hidden";
  const numberFormatter = useNumberFormatter(hidden ? {} : (formatOptions ?? {}));
  const ariaProps: AriaSliderProps = {
    minValue: min,
    maxValue: max,
    step,
    isDisabled: disabled,
    "aria-label": htmlProps["aria-label"],
    "aria-labelledby": htmlProps["aria-labelledby"],
    ...(effectiveValue !== undefined ? { value: [effectiveValue] } : {}),
    ...(defaultValue !== undefined && effectiveValue === undefined
      ? { defaultValue: [defaultValue] }
      : {}),
    onChange: (values) => {
      const nextValue = Array.isArray(values) ? (values[0] ?? min) : values;
      onChange?.(nextValue);
    },
    onChangeEnd: onChangeEnd
      ? (values) => {
          const nextValue = Array.isArray(values) ? (values[0] ?? min) : values;
          onChangeEnd(nextValue);
        }
      : undefined,
  };
  const state = useSliderState({ ...ariaProps, numberFormatter });
  const { groupProps, trackProps } = useSlider(ariaProps, state, trackRef);
  const { thumbProps, inputProps } = useSliderThumb(
    { index: 0, inputRef, isDisabled: disabled, trackRef },
    state,
  );

  useImperativeHandle(ref, () => inputRef.current!, []);

  const thumbPercent = state.getThumbPercent(0);
  const thumbValue = state.values[0] ?? min;
  const allTickValues = useMemo(() => {
    if (!ticks) return [];
    if ("values" in ticks) return ticks.values;
    if ("interval" in ticks) {
      const count = Math.floor((max - min) / ticks.interval) + 1;
      return Array.from({ length: count }, (_, index) => min + index * ticks.interval);
    }
    if (ticks.count < 2) return [];
    const range = max - min;
    return Array.from(
      { length: ticks.count },
      (_, index) => min + index * (range / (ticks.count - 1)),
    );
  }, [max, min, ticks]);
  const intermediateTickValues = useMemo(
    () => allTickValues.filter((tickValue) => tickValue !== min && tickValue !== max),
    [allTickValues, max, min],
  );
  const getFormattedValue = (nextValue: number | "") =>
    nextValue === "" ? "" : state.getFormattedValue(nextValue);
  const hasTicks = allTickValues.length > 0;
  const tickAnimationDuration = hasTicks ? 160 : 60;
  const tickDelay = hasTicks ? tickAnimationDuration / intermediateTickValues.length : 0;
  const valueLabelStyle = {
    "--thumb-offset": `${(2 * thumbPercent - 1) * 12}px`,
    "--thumb-value": `${thumbPercent * 100}%`,
    left: "var(--thumb-value)",
    transform:
      "translateX(calc(-1 * var(--thumb-value) + var(--thumb-offset))) translateY(var(--thumb-y, 0px))",
  } satisfies CSSProperties & Record<"--thumb-offset" | "--thumb-value", string>;

  return (
    <div
      {...groupProps}
      {...htmlProps}
      aria-disabled={disabled || undefined}
      className={cn(
        "group/slider relative isolate flex h-16 w-full flex-col whitespace-nowrap select-none",
        className,
      )}
      data-disabled={disabled || undefined}
    >
      <div
        {...trackProps}
        className="relative w-full cursor-pointer pt-5 pb-1.5 group-data-[disabled]/slider:pointer-events-none group-data-[disabled]/slider:cursor-not-allowed group-data-[disabled]/slider:opacity-60"
        data-slot="slider-track-area"
        ref={trackRef}
      >
        <div className="pointer-events-none relative flex h-6 w-full items-center">
          <div
            className="pointer-events-none h-3 rounded-s-[8px] border-t-2 border-r-0 border-b border-l border-solid border-[var(--scraps-slider-accent-chonk)] bg-[var(--scraps-slider-accent-background)]"
            data-slot="slider-active-track"
            style={{ width: `${thumbPercent * 100}%` }}
          />
          <div
            className="pointer-events-none h-3 flex-1 rounded-e-[8px] border-t-2 border-r border-b border-l-0 border-solid border-[var(--scraps-slider-neutral-chonk)] bg-[var(--scraps-slider-neutral-background)]"
            data-slot="slider-inactive-track"
            style={{ width: `${(1 - thumbPercent) * 100}%` }}
          />
          {intermediateTickValues.map((tickValue) => (
            <span
              aria-hidden
              className="pointer-events-none absolute top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 border border-solid border-[var(--scraps-slider-neutral-chonk)] data-[filled]:border-[var(--scraps-slider-accent-chonk)]"
              data-filled={tickValue <= thumbValue || undefined}
              data-slot="slider-tick"
              key={tickValue}
              style={{
                left: `${(state.getValuePercent(tickValue) * 100).toFixed(2)}%`,
              }}
            />
          ))}
        </div>

        <div
          {...thumbProps}
          className="absolute top-8 flex size-6 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center"
          data-slot="slider-thumb-hitbox"
          style={{ left: `${thumbPercent * 100}%` }}
        >
          <div
            className="pointer-events-none flex h-[23px] w-[22px] shrink-0 items-start justify-center rounded-[6px] bg-[var(--scraps-slider-neutral-chonk)] transition-[background,box-shadow] duration-120 ease-[ease] group-focus-within/slider:bg-[var(--scraps-slider-accent-chonk)] group-hover/slider:bg-[var(--scraps-slider-accent-chonk)] group-active/slider:bg-[var(--scraps-slider-accent-chonk)] group-data-[disabled]/slider:!bg-[var(--scraps-slider-neutral-chonk)]"
            data-slot="slider-thumb-chonk"
          >
            <div
              className="pointer-events-none mt-px size-5 rounded-[5px] bg-[var(--scraps-slider-thumb-surface)]"
              data-slot="slider-thumb-surface"
            />
          </div>
          <VisuallyHidden>
            <input
              {...inputProps}
              aria-invalid={htmlProps["aria-invalid"]}
              {...(ariaValueText !== undefined ? { "aria-valuetext": ariaValueText } : {})}
              id={id ?? inputProps.id}
              name={name}
              ref={inputRef}
            />
          </VisuallyHidden>
        </div>

        {!hidden ? (
          <output
            aria-hidden
            className="pointer-events-none absolute top-0 min-w-6 rounded-[4px] border border-transparent px-0.5 py-px text-center text-[12px]/none font-medium text-[var(--scraps-slider-label-content)] tabular-nums transition-[background,color,padding,border-color] duration-160 ease-[cubic-bezier(0.8,-0.4,0.5,1)] group-focus-within/slider:border-[var(--scraps-slider-accent-chonk)] group-focus-within/slider:bg-[var(--scraps-slider-accent-background)] group-focus-within/slider:text-[var(--scraps-slider-on-vibrant)] group-active/slider:border-[var(--scraps-slider-accent-chonk)] group-active/slider:bg-[var(--scraps-slider-accent-background)] group-active/slider:text-[var(--scraps-slider-on-vibrant)] group-data-[disabled]/slider:!border-transparent group-data-[disabled]/slider:!bg-transparent group-data-[disabled]/slider:!text-[var(--scraps-slider-disabled-content)] group-[&:hover:not(:active,:focus-within)]/slider:text-[var(--scraps-slider-label-hover)] after:absolute after:inset-[-4px] after:bottom-[-32px] after:rounded-[6px] after:content-[''] group-has-[input:focus-visible]/slider:after:[box-shadow:0_0_0_0_var(--scraps-slider-focus-mask),0_0_0_2px_var(--scraps-slider-focus)]"
            data-slot="slider-value-label"
            style={valueLabelStyle}
          >
            {getFormattedValue(thumbValue)}
          </output>
        ) : null}
      </div>

      {!hidden ? (
        <div
          aria-hidden
          className="pointer-events-none relative flex h-5 w-full items-center justify-between [--tx:0] [--ty:-0.25rem] group-not-data-[disabled]/slider:group-focus-within/slider:[--opacity:1] group-not-data-[disabled]/slider:group-focus-within/slider:[--ty:0] group-not-data-[disabled]/slider:group-hover/slider:[--opacity:1] group-not-data-[disabled]/slider:group-hover/slider:[--ty:0]"
        >
          <span
            className="block translate-x-[var(--tx)] translate-y-[var(--ty)] text-[11px] font-normal whitespace-nowrap text-[var(--scraps-slider-label-content)] tabular-nums opacity-[var(--opacity,0)] transition-[transform,opacity] duration-120 ease-[cubic-bezier(0.24,1,0.32,1)] group-data-[disabled]/slider:text-[var(--scraps-slider-disabled-content)]"
            data-position="start"
            style={{ transitionDelay: "0ms" }}
          >
            {getFormattedValue(min)}
          </span>
          {hasTicks
            ? intermediateTickValues.map((tickValue, index) => (
                <span
                  className={cn(
                    "absolute block translate-x-[var(--tx)] translate-y-[var(--ty)] text-[11px] font-normal whitespace-nowrap text-[var(--scraps-slider-label-content)] tabular-nums opacity-[var(--opacity,0)] transition-[transform,opacity] duration-120 ease-[cubic-bezier(0.24,1,0.32,1)] [--tx:-50%] group-data-[disabled]/slider:text-[var(--scraps-slider-disabled-content)]",
                    !ticks?.labels && "!opacity-0",
                  )}
                  data-intermediate=""
                  data-show={ticks?.labels || undefined}
                  key={tickValue}
                  style={{
                    left: `${(state.getValuePercent(tickValue) * 100).toFixed(2)}%`,
                    transitionDelay: `${((index + 1) * tickDelay).toFixed(2)}ms`,
                  }}
                >
                  {getFormattedValue(tickValue)}
                </span>
              ))
            : null}
          <span
            className="block translate-x-[var(--tx)] translate-y-[var(--ty)] text-[11px] font-normal whitespace-nowrap text-[var(--scraps-slider-label-content)] tabular-nums opacity-[var(--opacity,0)] transition-[transform,opacity] duration-120 ease-[cubic-bezier(0.24,1,0.32,1)] group-data-[disabled]/slider:text-[var(--scraps-slider-disabled-content)]"
            data-position="end"
            style={{ transitionDelay: `${tickAnimationDuration}ms` }}
          >
            {getFormattedValue(max)}
          </span>
        </div>
      ) : null}
    </div>
  );
}
