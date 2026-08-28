"use client";

import { useButton } from "@react-aria/button";
import { useLocale } from "@react-aria/i18n";
import { type AriaNumberFieldProps, useNumberField } from "@react-aria/numberfield";
import { mergeRefs } from "@react-aria/utils";
import { useNumberFieldState } from "@react-stately/numberfield";
import {
  OTPInput as OTPInputPrimitive,
  REGEXP_ONLY_DIGITS,
  REGEXP_ONLY_DIGITS_AND_CHARS,
} from "input-otp";
import {
  createContext,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type Ref,
  type SetStateAction,
} from "react";

import { t, tct } from "../../lib/scraps-locale";
import { cn } from "../../lib/utils";
import { Button } from "./button";

import "./roboto-mono.css";
import { TextArea, type TextAreaProps } from "./textarea";
import { Tooltip } from "./tooltip";

type FormSize = "xs" | "sm" | "md";

export interface InputStylesProps {
  monospace?: boolean;
  nativeSize?: InputHTMLAttributes<HTMLInputElement>["size"];
  readOnly?: InputHTMLAttributes<HTMLInputElement>["readOnly"];
  size?: FormSize;
  type?: React.HTMLInputTypeAttribute;
}

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "readOnly">, InputStylesProps {
  ref?: Ref<HTMLInputElement>;
}

const inputClasses =
  "block h-auto w-full resize-y border border-[var(--scraps-theme-border-primary,var(--border))] bg-[var(--scraps-input-background)] text-foreground inset-shadow-[0_1px_0_0_var(--input-shadow)] text-start transition-[border-color,box-shadow] duration-[120ms] ease-[var(--ease-smooth)] outline-none placeholder:text-[var(--scraps-input-content-secondary)] placeholder:opacity-100 read-only:cursor-default focus:ring-2 focus:ring-ring focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:text-[#878490] disabled:opacity-60 disabled:placeholder:text-[#878490] aria-disabled:cursor-not-allowed aria-disabled:text-[#878490] aria-disabled:opacity-60 aria-disabled:placeholder:text-[#878490] dark:disabled:text-[#958e9f] dark:disabled:placeholder:text-[#958e9f] dark:aria-disabled:text-[#958e9f] dark:aria-disabled:placeholder:text-[#958e9f] [&[type=number]]:appearance-textfield [&[type=number]]:tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

const inputSizeClasses: Record<FormSize, string> = {
  xs: "h-7 min-h-7 rounded-[5px] px-2 py-1.5 text-xs/4",
  sm: "h-8 min-h-8 rounded-[6px] px-3 py-2 text-sm/4",
  md: "h-9 min-h-9 rounded-[8px] px-4 py-3 text-sm/4",
};

export function Input({
  className,
  monospace = false,
  nativeSize,
  ref,
  size = "md",
  ...props
}: InputProps) {
  return (
    <input
      {...props}
      className={cn(
        inputClasses,
        inputSizeClasses[size],
        monospace ? "font-mono font-[425]" : "font-sans font-normal",
        className,
      )}
      data-size={size}
      data-slot="input"
      ref={ref}
      size={nativeSize}
    />
  );
}

type FormatToken = "0" | "A";
type FormatParserState = "start" | "token" | "separator";

type IsValidOTPFormat<
  Format extends string,
  SelectedToken extends FormatToken | null = null,
  State extends FormatParserState = "start",
> = Format extends ""
  ? State extends "token"
    ? true
    : false
  : Format extends `${infer Character}${infer Rest}`
    ? Character extends FormatToken
      ? SelectedToken extends null
        ? IsValidOTPFormat<Rest, Character, "token">
        : Character extends SelectedToken
          ? IsValidOTPFormat<Rest, SelectedToken, "token">
          : false
      : Character extends "-"
        ? State extends "token"
          ? IsValidOTPFormat<Rest, SelectedToken, "separator">
          : false
        : false
    : false;

type OTPFormat<Format extends string> = IsValidOTPFormat<Format> extends true ? Format : never;

export interface OTPInputProps<Format extends string> {
  format: OTPFormat<Format>;
  onComplete: (value: string) => void;
  disabled?: boolean;
  uppercase?: boolean;
}

export function OTPInput<const Format extends string>({
  disabled = false,
  format,
  onComplete,
  uppercase = false,
}: OTPInputProps<Format>) {
  const [value, setValue] = useState("");
  const normalizeValue = (nextValue: string) => (uppercase ? nextValue.toUpperCase() : nextValue);
  const formatCharacters = [...format];
  const isAlphanumeric = format.includes("A");
  const length = formatCharacters.filter((character) => character !== "-").length;

  return (
    <OTPInputPrimitive
      aria-label={t("One-time password")}
      autoComplete="one-time-code"
      disabled={disabled}
      inputMode={isAlphanumeric ? "text" : "numeric"}
      maxLength={length}
      pattern={isAlphanumeric ? REGEXP_ONLY_DIGITS_AND_CHARS : REGEXP_ONLY_DIGITS}
      pasteTransformer={(pastedValue) => pastedValue.replaceAll("-", "")}
      value={value}
      onChange={(nextValue) => setValue(normalizeValue(nextValue))}
      onComplete={(nextValue) => onComplete(normalizeValue(nextValue))}
      render={({ slots }) => (
        <div aria-hidden="true" className="flex items-center gap-1 pr-3">
          {formatCharacters.map((character, formatIndex) => {
            if (character === "-") {
              return (
                <Fragment key={formatIndex}>
                  <span className="px-1 text-lg/5">-</span>
                </Fragment>
              );
            }

            const slotIndex = formatCharacters
              .slice(0, formatIndex)
              .filter((formatCharacter) => formatCharacter !== "-").length;
            const slot = slots[slotIndex];
            if (!slot) return null;

            return (
              <span
                aria-disabled={disabled}
                className={cn(
                  inputClasses,
                  inputSizeClasses.md,
                  "flex min-w-9 justify-center p-0 font-sans",
                  slot.isActive
                    ? "ring-2 [box-shadow:inset_0_1px_0_0_var(--scraps-theme-border-primary,var(--border))] ring-ring"
                    : undefined,
                )}
                data-input-otp-slot=""
                key={formatIndex}
              >
                {slot.char ?? slot.placeholderChar}
              </span>
            );
          })}
        </div>
      )}
    />
  );
}

interface InputGroupContextValue {
  inputProps: Pick<InputProps, "disabled" | "size">;
  leadingWidth?: number;
  setInputProps?: (props: Pick<InputProps, "disabled" | "size">) => void;
  setLeadingWidth?: Dispatch<SetStateAction<number | undefined>>;
  setTrailingWidth?: Dispatch<SetStateAction<number | undefined>>;
  trailingWidth?: number;
}

const InputGroupContext = createContext<InputGroupContextValue>({ inputProps: {} });
const itemsPadding: Record<FormSize, number> = { md: 8, sm: 6, xs: 4 };
const inputHorizontalPadding: Record<FormSize, number> = { md: 16, sm: 12, xs: 8 };
const itemOffsetClasses: Record<FormSize, Record<"leading" | "trailing", string>> = {
  md: { leading: "left-[17px]", trailing: "right-[17px]" },
  sm: { leading: "left-[13px]", trailing: "right-[13px]" },
  xs: { leading: "left-[9px]", trailing: "right-[9px]" },
};

function InputGroupRoot({ children, ...props }: HTMLAttributes<HTMLDivElement>) {
  const [leadingWidth, setLeadingWidth] = useState<number>();
  const [trailingWidth, setTrailingWidth] = useState<number>();
  const [inputProps, setInputProps] = useState<Pick<InputProps, "disabled" | "size">>({});
  const value = useMemo(
    () => ({
      inputProps,
      leadingWidth,
      setInputProps,
      setLeadingWidth,
      setTrailingWidth,
      trailingWidth,
    }),
    [inputProps, leadingWidth, trailingWidth],
  );

  return (
    <InputGroupContext value={value}>
      <div
        {...props}
        className={cn(
          "relative",
          inputProps.disabled ? "text-[#878490] dark:text-[#958e9f]" : undefined,
          props.className,
        )}
      >
        {children}
      </div>
    </InputGroupContext>
  );
}

function groupPadding(
  size: FormSize,
  leadingWidth: number | undefined,
  trailingWidth: number | undefined,
) {
  return {
    ...(leadingWidth
      ? {
          paddingLeft: `calc(${inputHorizontalPadding[size]}px + ${itemsPadding[size]}px + ${leadingWidth}px)`,
        }
      : {}),
    ...(trailingWidth
      ? {
          paddingRight: `calc(${inputHorizontalPadding[size]}px + ${itemsPadding[size]}px + ${trailingWidth}px)`,
        }
      : {}),
  };
}

function GroupInput({ ref, size, disabled, style, ...props }: InputProps) {
  const { leadingWidth, setInputProps, trailingWidth } = useContext(InputGroupContext);
  useLayoutEffect(() => {
    setInputProps?.({ disabled, size });
  }, [disabled, setInputProps, size]);
  return (
    <Input
      {...props}
      disabled={disabled}
      ref={ref}
      size={size}
      style={{ ...groupPadding(size ?? "md", leadingWidth, trailingWidth), ...style }}
    />
  );
}

function GroupTextArea({ ref, size, disabled, style, ...props }: TextAreaProps) {
  const { leadingWidth, setInputProps, trailingWidth } = useContext(InputGroupContext);
  useLayoutEffect(() => {
    setInputProps?.({ disabled, size });
  }, [disabled, setInputProps, size]);
  return (
    <TextArea
      {...props}
      disabled={disabled}
      ref={ref}
      size={size}
      style={{ ...groupPadding(size ?? "md", leadingWidth, trailingWidth), ...style }}
    />
  );
}

interface InputItemsProps extends HTMLAttributes<HTMLDivElement> {
  disablePointerEvents?: boolean;
}

function useInputItemsWidthRef(setWidth: Dispatch<SetStateAction<number | undefined>> | undefined) {
  return useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || !setWidth) return;
      const updateWidth = () => setWidth(node.offsetWidth);
      updateWidth();
      const observer = new ResizeObserver(updateWidth);
      observer.observe(node);
      return () => {
        observer.disconnect();
        setWidth(undefined);
      };
    },
    [setWidth],
  );
}

function InputItems({
  children,
  disablePointerEvents,
  side,
  ...props
}: InputItemsProps & { side: "leading" | "trailing" }) {
  const {
    inputProps: { disabled, size = "md" },
    setLeadingWidth,
    setTrailingWidth,
  } = useContext(InputGroupContext);
  const ref = useInputItemsWidthRef(side === "leading" ? setLeadingWidth : setTrailingWidth);
  return (
    <div
      {...props}
      className={cn(
        "absolute top-0 bottom-0 grid grid-flow-col items-center gap-2",
        itemOffsetClasses[size][side],
        disabled || disablePointerEvents ? "pointer-events-none" : undefined,
        props.className,
      )}
      data-test-id={side === "leading" ? "input-leading-items" : "input-trailing-items"}
      ref={ref}
    >
      {children}
    </div>
  );
}

function LeadingItems(props: InputItemsProps) {
  return <InputItems {...props} side="leading" />;
}

function TrailingItems(props: InputItemsProps) {
  return <InputItems {...props} side="trailing" />;
}

export const InputGroup = Object.assign(InputGroupRoot, {
  Input: GroupInput,
  LeadingItems,
  TextArea: GroupTextArea,
  TrailingItems,
});

interface NumberInputProps
  extends
    InputStylesProps,
    AriaNumberFieldProps,
    Pick<
      InputHTMLAttributes<HTMLInputElement>,
      "className" | "disabled" | "name" | "readOnly" | "required"
    > {
  max?: number;
  min?: number;
  ref?: Ref<HTMLInputElement>;
}

export function NumberInput({
  className,
  disabled,
  max,
  min,
  monospace,
  nativeSize,
  placeholder,
  readOnly,
  ref,
  size,
  ...props
}: NumberInputProps) {
  const localRef = useRef<HTMLInputElement>(null);
  const ariaProps = {
    isDisabled: disabled,
    isReadOnly: readOnly,
    maxValue: max,
    minValue: min,
    placeholder,
    ...props,
  };
  const { locale } = useLocale();
  const state = useNumberFieldState({ locale, ...ariaProps });
  const { decrementButtonProps, groupProps, incrementButtonProps, inputProps } = useNumberField(
    ariaProps,
    state,
    localRef,
  );
  const incrementButtonRef = useRef<HTMLButtonElement>(null);
  const { buttonProps: incrementProps } = useButton(incrementButtonProps, incrementButtonRef);
  const decrementButtonRef = useRef<HTMLButtonElement>(null);
  const { buttonProps: decrementProps } = useButton(decrementButtonProps, decrementButtonRef);

  return (
    <InputGroup {...groupProps}>
      <InputGroup.Input
        {...inputProps}
        className={className}
        monospace={monospace}
        nativeSize={nativeSize}
        placeholder={placeholder}
        ref={mergeRefs(localRef, ref)}
        size={size}
      />
      <InputGroup.TrailingItems>
        <div className={cn("flex w-3 flex-col items-center", size === "xs" ? "h-4" : "h-5")}>
          <NumberStepButton
            {...incrementProps}
            aria-label={incrementProps["aria-label"] ?? t("Increment")}
            icon={<Chevron direction="up" />}
            ref={incrementButtonRef}
          />
          <NumberStepButton
            {...decrementProps}
            aria-label={decrementProps["aria-label"] ?? t("Decrement")}
            icon={<Chevron direction="down" />}
            ref={decrementButtonRef}
          />
        </div>
      </InputGroup.TrailingItems>
    </InputGroup>
  );
}

function NumberStepButton({
  icon,
  ref,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  "aria-label": string;
  icon: React.ReactNode;
  ref?: Ref<HTMLButtonElement>;
}) {
  return (
    <Button
      {...props}
      className={cn(
        "flex h-1/2 min-h-0 px-0.5 text-[var(--scraps-input-content-secondary)]",
        props.className,
      )}
      icon={icon}
      ref={ref}
      size="zero"
      variant="transparent"
    />
  );
}

export interface NumberDragInput extends Omit<InputProps, "onPointerMove" | "type"> {
  axis?: "x" | "y";
  max?: number;
  min?: number;
  shiftKeyMultiplier?: number;
}

export function NumberDragInput({
  axis = "x",
  ref,
  shiftKeyMultiplier = 10,
  ...props
}: NumberDragInput) {
  const inputRef = useRef<HTMLInputElement>(null);
  const draggingRef = useRef(false);
  const dragTargetRef = useRef<HTMLElement>(null);
  const dragRequestRef = useRef(0);
  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      if (
        (event.movementX === 0 && event.movementY === 0) ||
        !inputRef.current ||
        props.disabled ||
        props.readOnly
      ) {
        return;
      }
      const step = Number.parseFloat(props.step?.toString() ?? "1");
      if (Number.isNaN(step)) {
        throw new TypeError(`Step must be of type number, got ${props.step}`);
      }
      const pointerDelta = axis === "x" ? event.movementX : -event.movementY;
      const delta =
        pointerDelta > 0 ? Math.ceil(pointerDelta / 100) : Math.floor(pointerDelta / 100);
      const multiplier = event.shiftKey ? shiftKeyMultiplier : step;
      const value = clamp(
        Number(inputRef.current.value) + delta * multiplier,
        props.min ?? Number.NEGATIVE_INFINITY,
        props.max ?? Number.POSITIVE_INFINITY,
      );
      setInputValueAndDispatchChange(inputRef.current, String(value));
    },
    [axis, props.disabled, props.max, props.min, props.readOnly, props.step, shiftKeyMultiplier],
  );
  const stopDragging = useCallback(
    function handleStopDragging(event?: Event) {
      if (
        event?.type === "pointerlockchange" &&
        document.pointerLockElement === dragTargetRef.current
      ) {
        return;
      }
      if (!draggingRef.current) return;
      const target = dragTargetRef.current;
      draggingRef.current = false;
      dragTargetRef.current = null;
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", handleStopDragging);
      document.removeEventListener("pointercancel", handleStopDragging);
      document.removeEventListener("pointerlockchange", handleStopDragging);
      if (document.pointerLockElement === target) {
        document.exitPointerLock?.();
      }
    },
    [onPointerMove],
  );
  useEffect(() => stopDragging, [stopDragging]);
  const onPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (
      event.button !== 0 ||
      props.disabled ||
      props.readOnly ||
      !event.currentTarget.requestPointerLock
    ) {
      return;
    }
    const requestId = dragRequestRef.current + 1;
    dragRequestRef.current = requestId;
    const target = event.currentTarget;
    draggingRef.current = true;
    dragTargetRef.current = target;
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", stopDragging);
    document.addEventListener("pointercancel", stopDragging);
    document.addEventListener("pointerlockchange", stopDragging);
    try {
      void Promise.resolve(target.requestPointerLock())
        .then(() => {
          const requestIsActive =
            draggingRef.current &&
            dragRequestRef.current === requestId &&
            dragTargetRef.current === target;
          const newerRequestOwnsTarget =
            draggingRef.current &&
            dragRequestRef.current !== requestId &&
            dragTargetRef.current === target;
          if (
            !requestIsActive &&
            !newerRequestOwnsTarget &&
            document.pointerLockElement === target
          ) {
            document.exitPointerLock?.();
          }
        })
        .catch(() => {
          if (dragRequestRef.current === requestId) stopDragging();
        });
    } catch {
      stopDragging();
    }
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    props.onKeyDown?.(event);
    if (
      !inputRef.current ||
      props.disabled ||
      props.readOnly ||
      (event.key !== "ArrowUp" && event.key !== "ArrowDown")
    ) {
      return;
    }
    event.preventDefault();
    const step = Number.parseFloat(props.step?.toString() ?? "1");
    const value = Number.parseFloat(inputRef.current.value);
    setInputValueAndDispatchChange(
      inputRef.current,
      String(
        clamp(
          value + (event.key === "ArrowUp" ? step : -step),
          props.min ?? Number.NEGATIVE_INFINITY,
          props.max ?? Number.POSITIVE_INFINITY,
        ),
      ),
    );
  };

  return (
    <InputGroup>
      <InputGroup.Input
        {...props}
        onKeyDown={onKeyDown}
        ref={mergeRefs(inputRef, ref)}
        type="text"
      />
      <InputGroup.TrailingItems>
        <Tooltip
          skipWrapper
          title={tct("Drag to adjust threshold[break]You can hold shift to fine tune", {
            break: <br />,
          })}
        >
          <div
            className={cn("flex gap-0.5", axis === "x" ? "flex-row" : "flex-col")}
            onPointerDown={onPointerDown}
          >
            <Arrow direction={axis === "x" ? "left" : "up"} />
            <Arrow direction={axis === "x" ? "right" : "down"} />
          </div>
        </Tooltip>
      </InputGroup.TrailingItems>
    </InputGroup>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function setInputValueAndDispatchChange(input: HTMLInputElement, value: string) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function Chevron({ direction }: { direction: "up" | "down" }) {
  return (
    <svg
      aria-hidden="true"
      className={cn("size-2", direction === "down" ? "rotate-180" : undefined)}
      viewBox="0 0 16 16"
    >
      <path d="M8 5c.21 0 .4.09.54.24l4.25 4.5c.29.3.28.77-.03 1.05-.3.29-.77.28-1.06-.03L8 6.84l-3.71 3.92c-.28.31-.75.32-1.05.03-.31-.28-.31-.75-.04-1.05l4.25-4.5C7.6 5.09 7.79 5 8 5Z" />
    </svg>
  );
}

function Arrow({ direction }: { direction: "up" | "right" | "down" | "left" }) {
  const rotation = {
    up: "rotate-0",
    right: "rotate-90",
    down: "rotate-180",
    left: "-rotate-90",
  }[direction];
  return (
    <svg aria-hidden="true" className={cn("size-2", rotation)} viewBox="0 0 16 16">
      <path d="M12.79 6.74C13.08 7.04 13.07 7.51 12.76 7.79C12.46 8.08 11.99 8.07 11.71 7.76L8.75 4.64L8.75 13.25C8.75 13.66 8.41 14 8 14C7.59 14 7.25 13.66 7.25 13.25L7.25 4.63L4.29 7.76C4.01 8.07 3.54 8.08 3.24 7.79C2.93 7.51 2.92 7.04 3.21 6.74L7.46 2.24C7.46 2.23 7.46 2.23 7.46 2.23C7.47 2.22 7.48 2.21 7.48 2.21C7.51 2.18 7.54 2.16 7.57 2.13C7.58 2.13 7.59 2.12 7.6 2.12C7.63 2.1 7.67 2.08 7.7 2.06C7.71 2.06 7.72 2.06 7.73 2.05C7.81 2.02 7.9 2 8 2C8.1 2 8.19 2.02 8.28 2.05C8.29 2.06 8.29 2.06 8.3 2.06C8.34 2.08 8.37 2.1 8.4 2.12C8.41 2.12 8.42 2.13 8.43 2.14C8.46 2.16 8.48 2.18 8.51 2.2C8.52 2.21 8.53 2.22 8.54 2.23C8.54 2.23 8.54 2.23 8.54 2.24L12.79 6.74Z" />
    </svg>
  );
}

interface UseAutosizeInputOptions {
  enabled?: boolean;
  value?: InputHTMLAttributes<HTMLInputElement>["value"];
}

export function useAutosizeInput(options?: UseAutosizeInputOptions) {
  const enabled = options?.enabled ?? true;
  const sourceRef = useRef<HTMLInputElement | null>(null);
  const sizingDivRef = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(
    () => () => {
      sizingDivRef.current?.remove();
      sizingDivRef.current = null;
    },
    [],
  );
  useLayoutEffect(() => {
    if (enabled && sourceRef.current) resizeInput(sourceRef.current, sizingDivRef);
  }, [enabled, options?.value]);
  const onInput = useCallback(() => {
    if (sourceRef.current) resizeInput(sourceRef.current, sizingDivRef);
  }, []);
  return useCallback(
    (element: HTMLInputElement | null) => {
      sourceRef.current?.removeEventListener("input", onInput);
      if (enabled && element) {
        resizeInput(element, sizingDivRef);
        element.addEventListener("input", onInput);
      }
      sourceRef.current = element;
    },
    [enabled, onInput],
  );
}

function resizeInput(
  input: HTMLInputElement,
  sizingDivRef: React.MutableRefObject<HTMLDivElement | null>,
) {
  const styles = getComputedStyle(input);
  if (!sizingDivRef.current) {
    const sizingDiv = document.createElement("div");
    sizingDiv.style.cssText =
      "white-space:pre;width:auto;height:0;position:fixed;pointer-events:none;opacity:0;z-index:-1";
    sizingDiv.style.fontFamily = styles.fontFamily;
    sizingDiv.style.fontSize = styles.fontSize;
    sizingDiv.style.fontWeight = styles.fontWeight;
    document.body.appendChild(sizingDiv);
    sizingDivRef.current = sizingDiv;
  }
  sizingDivRef.current.innerText = input.value || input.placeholder;
  const padding =
    Number.parseInt(styles.paddingLeft, 10) + Number.parseInt(styles.paddingRight, 10);
  const borders = Number.parseInt(styles.borderWidth, 10) * 2;
  input.style.width = `${sizingDivRef.current.offsetWidth + padding + borders + 1}px`;
}
