"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import type { DistributedOmit } from "type-fest";

import { t } from "../../lib/scraps-locale";
import { Button } from "./button";
import { useAutoSaveContext } from "./form-auto-save-context";
import { useFieldContext } from "./form-context";
import { DisabledTip } from "./info";
import { Input, type InputProps } from "./input";
import { Radio } from "./radio";
import { Select, type ControlProps, type SelectValue } from "./select";
import { Slider, type SliderProps } from "./slider";
import { Switch, type SwitchProps } from "./switch";
import { TextArea, type TextAreaProps } from "./textarea";
import { Tooltip } from "./tooltip";

export type BaseFieldProps<T extends HTMLElement> = {
  disabled?: boolean | string;
  ref?: Ref<T>;
};

function useFieldId() {
  const field = useFieldContext();
  return `${field.form.formId}${field.name}`;
}

function useHintTextId() {
  return `${useFieldId()}-hint`;
}

function useLabelId() {
  return `${useFieldId()}-label`;
}

function AutoSaveIndicator() {
  const field = useFieldContext();
  const status = useAutoSaveContext()?.status;
  if (status === "pending") {
    return (
      <span
        aria-label={`Saving ${field.name}`}
        aria-live="polite"
        className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
        role="status"
      />
    );
  }
  if (status === "success") {
    return (
      <span aria-label={t("Saved")} className="text-success" role="status">
        ✓
      </span>
    );
  }
  return null;
}

function FieldStatus({ disabled, error }: { disabled?: boolean | string; error?: string }) {
  const field = useFieldContext();
  const message =
    error ??
    (field.state.meta.isValid
      ? undefined
      : field.state.meta.errors
          .map((item: unknown) => {
            if (item instanceof Error) return item.message;
            if (
              item &&
              typeof item === "object" &&
              "message" in item &&
              typeof item.message === "string"
            )
              return item.message;
            return String(item ?? "");
          })
          .filter(Boolean)
          .join(","));
  if (message)
    return (
      <Tooltip forceVisible position="bottom" skipWrapper title={message}>
        <span aria-label="Field error" className="text-danger" role="img">
          !
        </span>
      </Tooltip>
    );
  if (typeof disabled === "string") return <DisabledTip size="sm" title={disabled} />;
  return null;
}

type FieldChildrenProps<T extends HTMLElement> = {
  "aria-describedby": string;
  "aria-invalid": boolean;
  disabled: boolean;
  id: string;
  name: string;
  onBlur: () => void;
  ref: Ref<T>;
};

export function BaseField<T extends HTMLElement>({
  children,
  disabled,
  ref,
}: BaseFieldProps<T> & {
  children: (props: FieldChildrenProps<T>, state: { indicator: ReactNode }) => ReactNode;
}) {
  const autoSave = useAutoSaveContext();
  const field = useFieldContext();
  const localRef = useRef<T>(null);
  const restoreFocusRef = useRef(false);
  const mergedRef = useCallback(
    (node: T | null) => {
      localRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  const indicator = <AutoSaveIndicator />;
  useEffect(() => {
    const node = localRef.current;
    if (!node) return;
    const onBlur = () => {
      if (node.hasAttribute("disabled")) restoreFocusRef.current = true;
    };
    node.addEventListener("blur", onBlur);
    return () => node.removeEventListener("blur", onBlur);
  }, []);
  useEffect(() => {
    if (autoSave?.status === "pending" || !restoreFocusRef.current) return;
    restoreFocusRef.current = false;
    if (document.activeElement === document.body) localRef.current?.focus();
  }, [autoSave?.status]);
  useEffect(() => {
    const focusHashField = () => {
      let hash = "";
      try {
        hash = decodeURIComponent(window.location.hash.slice(1));
      } catch {
        return;
      }
      if (hash !== field.name) return;
      const node = localRef.current;
      node?.scrollIntoView({ behavior: "smooth", block: "center" });
      node?.focus();
      node
        ?.closest<HTMLElement>(`#${CSS.escape(field.name)}`)
        ?.animate([{ backgroundColor: "var(--accent)" }, { backgroundColor: "transparent" }], {
          duration: 600,
          easing: "ease-out",
        });
    };
    focusHashField();
    window.addEventListener("hashchange", focusHashField);
    return () => window.removeEventListener("hashchange", focusHashField);
  }, [field.name]);
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      {children(
        // Render-prop consumers attach this stable callback ref to their concrete control.
        // eslint-disable-next-line react-hooks/refs
        {
          ref: mergedRef,
          disabled: Boolean(disabled) || autoSave?.status === "pending",
          "aria-invalid": !field.state.meta.isValid,
          "aria-describedby": useHintTextId(),
          onBlur: field.handleBlur,
          name: field.name,
          id: useFieldId(),
        },
        { indicator },
      )}
      <FieldStatus disabled={disabled} />
    </div>
  );
}

export interface InputFieldProps
  extends
    BaseFieldProps<HTMLInputElement>,
    Omit<InputProps, "value" | "onChange" | "onBlur" | "disabled" | "id"> {
  onChange: (value: string) => void;
  value: string;
  disabled?: boolean | string;
  trailingItems?: ReactNode;
}

export function InputField({ onChange, disabled, trailingItems, ref, ...props }: InputFieldProps) {
  return (
    <BaseField disabled={disabled} ref={ref}>
      {(fieldProps, { indicator }) => (
        <div className="relative min-w-0 flex-1">
          <Input
            {...fieldProps}
            {...props}
            className={trailingItems ? "pr-16" : props.className}
            onChange={(event) => onChange(event.target.value)}
          />
          {(trailingItems || indicator) && (
            <span className="absolute inset-y-0 right-2 flex items-center gap-1">
              {trailingItems}
              {indicator}
            </span>
          )}
        </div>
      )}
    </BaseField>
  );
}

export function NumberField(
  props: Omit<InputFieldProps, "type" | "value" | "onChange"> & {
    onChange: (value: number | null) => void;
    value: number | null;
  },
) {
  return (
    <InputField
      {...props}
      type="number"
      value={props.value === null ? "" : String(props.value)}
      onChange={(value) => props.onChange(value === "" ? null : Number(value))}
    />
  );
}

export function PasswordField(props: Omit<InputFieldProps, "type" | "trailingItems">) {
  const [visible, setVisible] = useState(false);
  const icon = (
    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 16 16">
      <path
        d={
          visible
            ? "M2 2l12 12M6.5 6.5A2.1 2.1 0 009.5 9.5M4.2 4.6C2.8 5.4 1.8 6.6 1.2 8c1.2 2.8 3.6 4.5 6.8 4.5 1.1 0 2.1-.2 3-.6M7.5 3.5H8c3.2 0 5.6 1.7 6.8 4.5-.4.9-1 1.8-1.8 2.5"
            : "M1.2 8C2.4 5.2 4.8 3.5 8 3.5s5.6 1.7 6.8 4.5c-1.2 2.8-3.6 4.5-6.8 4.5S2.4 10.8 1.2 8zM8 5.9A2.1 2.1 0 108 10.1 2.1 2.1 0 008 5.9z"
        }
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
  return (
    <InputField
      {...props}
      type={visible ? "text" : "password"}
      trailingItems={
        <Button
          aria-label={visible ? t("Hide password") : t("Show password")}
          icon={icon}
          onClick={() => setVisible((value) => !value)}
          size="xs"
          type="button"
          variant="transparent"
        />
      }
    />
  );
}

type RadioState = {
  disabled: boolean;
  name: string;
  onBlur: () => void;
  onChange: (value: string) => void;
  value: string;
};
const RadioContext = createContext<RadioState | null>(null);

function RadioGroup({
  children,
  value,
  onChange,
  disabled,
}: {
  children: ReactNode;
  disabled?: boolean | string;
  onChange: (value: string) => void;
  value: string;
}) {
  const field = useFieldContext();
  const autoSave = useAutoSaveContext();
  return (
    <div
      aria-labelledby={useLabelId()}
      className="flex flex-wrap items-center gap-2"
      role="radiogroup"
    >
      <RadioContext.Provider
        value={{
          disabled: Boolean(disabled) || autoSave?.status === "pending",
          name: field.name,
          onBlur: field.handleBlur,
          onChange: (next) => {
            onChange(next);
            if (autoSave) {
              // Auto-save radio changes return to their previous value after a failed request.
              // eslint-disable-next-line react-hooks/immutability
              autoSave.resetOnErrorRef.current = true;
              field.handleBlur();
            }
          },
          value,
        }}
      >
        {children}
      </RadioContext.Provider>
      <AutoSaveIndicator />
      <FieldStatus disabled={disabled} />
    </div>
  );
}

function RadioItem({
  children,
  value,
  description,
}: {
  children: ReactNode;
  description?: ReactNode;
  value: string;
}) {
  const context = useContext(RadioContext);
  if (!context) throw new Error("Radio.Item must be used within Radio.Group");
  const descriptionId = useId();
  return (
    <label className="flex items-start gap-2">
      <Radio
        aria-describedby={description ? descriptionId : undefined}
        checked={context.value === value}
        disabled={context.disabled}
        name={context.name}
        onBlur={context.onBlur}
        onChange={() => context.onChange(value)}
        value={value}
      />
      <span className="grid gap-1 text-sm">
        {children}
        {description && (
          <span className="text-xs text-muted-foreground" id={descriptionId}>
            {description}
          </span>
        )}
      </span>
    </label>
  );
}

export function RadioField() {
  return null;
}
RadioField.Group = RadioGroup;
RadioField.Item = RadioItem;

export function RangeField({
  onChange,
  disabled,
  value,
  ref,
  ...props
}: BaseFieldProps<HTMLInputElement> &
  Omit<SliderProps, "value" | "onChange" | "disabled" | "id"> & {
    onChange: (value: number) => void;
    value: number;
  }) {
  const autoSave = useAutoSaveContext();
  return (
    <BaseField disabled={disabled} ref={ref}>
      {(fieldProps, { indicator }) => (
        <>
          <Slider
            {...fieldProps}
            {...props}
            value={value}
            onChange={onChange}
            onChangeEnd={() => {
              if (autoSave) fieldProps.onBlur();
            }}
          />
          {indicator}
        </>
      )}
    </BaseField>
  );
}

type BaseSelectFieldProps<Value> = BaseFieldProps<HTMLInputElement> &
  DistributedOmit<
    ControlProps<SelectValue<Value>>,
    "value" | "onChange" | "disabled" | "options" | "isMulti" | "isClearable"
  > & {
    isValueEqual?: (left: Value, right: Value) => boolean;
    options: ReadonlyArray<SelectValue<Value>>;
  };
type NonArray<Value> = Value extends readonly unknown[] ? never : Value;
type SelectFieldProps<Value> =
  | (BaseSelectFieldProps<Value> & {
      clearable?: false;
      multiple?: false;
      onChange: (value: NonArray<Value>) => void;
      value: NonArray<Value> | null;
    })
  | (BaseSelectFieldProps<Value> & {
      clearable: true;
      multiple?: false;
      onChange: (value: NonArray<Value> | null) => void;
      value: NonArray<Value> | null;
    })
  | (BaseSelectFieldProps<Value> & {
      clearable?: boolean;
      multiple: true;
      onChange: (value: Value[]) => void;
      value: Value[];
    });
export function SelectField<Value>({
  onChange,
  disabled,
  multiple,
  value,
  ref,
  ...props
}: SelectFieldProps<Value>) {
  const autoSave = useAutoSaveContext();
  const menuOpenRef = useRef(false);
  const equal = props.isValueEqual ?? Object.is;
  const selectedOptions = props.options.filter((option) =>
    Array.isArray(value)
      ? value.some((item) => equal(item, option.value))
      : value !== null && equal(value as Value, option.value),
  );
  return (
    <BaseField<HTMLInputElement> disabled={disabled} ref={ref}>
      {({ id, ref: inputRef, ...fieldProps }, { indicator }) => (
        <>
          <Select
            {...fieldProps}
            {...(props as ControlProps<SelectValue<Value>>)}
            inputId={id}
            inputRef={inputRef}
            multiple={multiple === true}
            value={multiple ? selectedOptions : (selectedOptions[0] ?? null)}
            {...(autoSave && { blurInputOnSelect: false })}
            onMenuOpen={() => {
              menuOpenRef.current = true;
              props.onMenuOpen?.();
            }}
            onMenuClose={() => {
              menuOpenRef.current = false;
              props.onMenuClose?.();
              if (multiple && autoSave) fieldProps.onBlur();
            }}
            onChange={(next: SelectValue<Value> | SelectValue<Value>[] | null) => {
              const nextValue = Array.isArray(next)
                ? next.map((option) => option.value)
                : (next?.value ?? null);
              (onChange as (value: Value | Value[] | null) => void)(nextValue);
              if (autoSave && (!multiple || !menuOpenRef.current)) fieldProps.onBlur();
            }}
          />
          {indicator}
        </>
      )}
    </BaseField>
  );
}

function useDebouncedValue<Value>(value: Value, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timeout);
  }, [delay, value]);
  return debounced;
}

type SelectAsyncFieldProps<Data, Value> = DistributedOmit<
  SelectFieldProps<Value>,
  "options" | "isLoading" | "onInputChange"
> & {
  queryOptions: (
    inputValue: string,
  ) => UseQueryOptions<Data, Error, ReadonlyArray<SelectValue<Value>>, readonly unknown[]>;
};

export function SelectAsyncField<Data, Value>({
  queryOptions,
  ...props
}: SelectAsyncFieldProps<Data, Value>) {
  const [inputValue, setInputValue] = useState("");
  const debouncedInput = useDebouncedValue(inputValue, 250);
  const { data: options = [], isPending } = useQuery(queryOptions(debouncedInput));
  return (
    <SelectField
      {...props}
      isLoading={isPending || inputValue !== debouncedInput}
      onInputChange={(next, action) => {
        if (action.action === "input-change") setInputValue(next);
      }}
      options={options}
    />
  );
}

export function SwitchField({
  onChange,
  disabled,
  ref,
  ...props
}: BaseFieldProps<HTMLInputElement> &
  Omit<SwitchProps, "onChange" | "disabled"> & { onChange: (value: boolean) => void }) {
  const autoSave = useAutoSaveContext();
  return (
    <BaseField disabled={disabled} ref={ref}>
      {(fieldProps, { indicator }) => (
        <div className="flex flex-1 items-center justify-between gap-2">
          <Switch
            {...fieldProps}
            {...props}
            size="lg"
            onChange={(event) => {
              onChange(event.target.checked);
              if (autoSave) {
                autoSave.resetOnErrorRef.current = true;
                fieldProps.onBlur();
              }
            }}
          />
          {indicator}
        </div>
      )}
    </BaseField>
  );
}

export function TextAreaField({
  onChange,
  disabled,
  ref,
  ...props
}: BaseFieldProps<HTMLTextAreaElement> &
  Omit<TextAreaProps, "onChange" | "disabled"> & {
    onChange: (value: string) => void;
    value: string;
  }) {
  return (
    <BaseField disabled={disabled} ref={ref}>
      {(fieldProps, { indicator }) => (
        <div className="relative min-w-0 flex-1">
          <TextArea {...fieldProps} {...props} onChange={(event) => onChange(event.target.value)} />
          {indicator && <span className="absolute top-2 right-2">{indicator}</span>}
        </div>
      )}
    </BaseField>
  );
}

function FieldLabel({
  children,
  description,
  required,
}: {
  children: ReactNode;
  description?: ReactNode;
  required?: boolean;
}) {
  const fieldId = useFieldId();
  const labelId = useLabelId();
  const hintId = useHintTextId();
  return (
    <label
      className="inline-flex items-center gap-1 text-sm font-normal"
      htmlFor={fieldId}
      id={labelId}
    >
      {children}
      {required && (
        <span aria-label={t("Required")} className="text-danger">
          *
        </span>
      )}
      {description && (
        <span className="sr-only" id={hintId}>
          {description}
        </span>
      )}
    </label>
  );
}
function HintText({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs text-muted-foreground" id={useHintTextId()}>
      {children}
    </p>
  );
}
export function FieldMeta() {
  return null;
}
FieldMeta.Label = FieldLabel;
FieldMeta.HintText = HintText;
FieldMeta.Status = FieldStatus;

type LayoutProps = {
  children: ReactNode;
  hintText?: ReactNode;
  label: ReactNode;
  padding?: string;
  required?: boolean;
  variant?: "compact";
};
function RowLayout({ children, hintText, label, required, variant }: LayoutProps) {
  const field = useFieldContext();
  return (
    <div
      className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
      id={field.name}
    >
      <div className="grid min-w-0 flex-1 gap-1">
        <FieldLabel description={variant === "compact" ? hintText : undefined} required={required}>
          {label}
        </FieldLabel>
        {hintText && variant !== "compact" && <HintText>{hintText}</HintText>}
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
function StackLayout({ children, hintText, label, required, variant }: LayoutProps) {
  const field = useFieldContext();
  return (
    <div className="grid gap-3 p-4" id={field.name}>
      <FieldLabel description={variant === "compact" ? hintText : undefined} required={required}>
        {label}
      </FieldLabel>
      {children}
      {hintText && variant !== "compact" && <HintText>{hintText}</HintText>}
    </div>
  );
}
export function FieldLayout() {
  return null;
}
FieldLayout.Row = RowLayout;
FieldLayout.Stack = StackLayout;

export const fieldComponents = {
  Base: BaseField,
  Input: InputField,
  Number: NumberField,
  Password: PasswordField,
  Radio: RadioField,
  Range: RangeField,
  Select: SelectField,
  SelectAsync: SelectAsyncField,
  Switch: SwitchField,
  TextArea: TextAreaField,
  Meta: FieldMeta,
  Layout: FieldLayout,
} as const;
