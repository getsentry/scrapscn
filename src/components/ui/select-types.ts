import type {
  ComponentType,
  FocusEventHandler,
  HTMLAttributes,
  KeyboardEventHandler,
  ReactElement,
  ReactNode,
  Ref,
} from "react";

import type { MenuListItemProps } from "./menu-list-item";

type FormSize = "xs" | "sm" | "md";
type SelectPrimitive = string | number;

export type SelectValue<Value = unknown> = MenuListItemProps & {
  value: Value;
  textValue?: string;
};

// The canonical wrapper uses any here so callers can supply an extended option shape.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GeneralSelectValue = SelectValue<any>;

export type SelectGroup<Option extends GeneralSelectValue> = {
  label?: ReactNode;
  options: ReadonlyArray<Option>;
  [key: string]: unknown;
};

type CSSPrimitive = boolean | null | number | string | undefined;

type ComponentSelector = { __emotion_styles: unknown };
type Keyframes = string & {
  anim: number;
  name: string;
  styles: string;
  toString: () => string;
};
type SerializedStyles = {
  map?: string;
  name: string;
  next?: SerializedStyles;
  styles: string;
};
type CSSInterpolation =
  | CSSPrimitive
  | ComponentSelector
  | CSSObject
  | Keyframes
  | ReadonlyArray<CSSInterpolation>
  | SerializedStyles;

export type CSSObject = {
  [propertyOrSelector: string]: CSSInterpolation;
};

export type SelectTheme = {
  borderRadius: number;
  colors: Record<string, string>;
  spacing: {
    baseUnit: number;
    controlHeight: number;
    menuGutter: number;
  };
};

type StyleCallback<State> = (provided: CSSObject, state: State) => CSSObject;

/**
 * The callback-only 22-slot react-select v4 style contract. Scraps preserves
 * its style-object behavior for replacement components. Flat string and
 * number declarations also apply to matching default DOM slots. Default
 * slots also support the pinned callers' svg, :before, and &:hover patterns
 * through fixed Tailwind selectors and CSS custom properties.
 */
export type StylesConfig = Partial<{
  clearIndicator: StyleCallback<SelectComponentPropsMap<GeneralSelectValue>["ClearIndicator"]>;
  container: StyleCallback<SelectComponentPropsMap<GeneralSelectValue>["SelectContainer"]>;
  control: StyleCallback<SelectComponentPropsMap<GeneralSelectValue>["Control"]>;
  dropdownIndicator: StyleCallback<
    SelectComponentPropsMap<GeneralSelectValue>["DropdownIndicator"]
  >;
  group: StyleCallback<SelectComponentPropsMap<GeneralSelectValue>["Group"]>;
  groupHeading: StyleCallback<SelectComponentPropsMap<GeneralSelectValue>["GroupHeading"]>;
  indicatorsContainer: StyleCallback<
    SelectComponentPropsMap<GeneralSelectValue>["IndicatorsContainer"]
  >;
  indicatorSeparator: StyleCallback<
    SelectComponentPropsMap<GeneralSelectValue>["IndicatorSeparator"]
  >;
  input: StyleCallback<SelectComponentPropsMap<GeneralSelectValue>["Input"]>;
  loadingIndicator: StyleCallback<SelectComponentPropsMap<GeneralSelectValue>["LoadingIndicator"]>;
  loadingMessage: StyleCallback<SelectComponentPropsMap<GeneralSelectValue>["LoadingMessage"]>;
  menu: StyleCallback<SelectComponentPropsMap<GeneralSelectValue>["Menu"]>;
  menuList: StyleCallback<SelectComponentPropsMap<GeneralSelectValue>["MenuList"]>;
  menuPortal: StyleCallback<SelectComponentPropsMap<GeneralSelectValue>["MenuPortal"]>;
  multiValue: StyleCallback<SelectComponentPropsMap<GeneralSelectValue>["MultiValue"]>;
  multiValueLabel: StyleCallback<SelectComponentPropsMap<GeneralSelectValue>["MultiValue"]>;
  multiValueRemove: StyleCallback<SelectComponentPropsMap<GeneralSelectValue>["MultiValueRemove"]>;
  noOptionsMessage: StyleCallback<SelectComponentPropsMap<GeneralSelectValue>["NoOptionsMessage"]>;
  option: StyleCallback<SelectComponentPropsMap<GeneralSelectValue>["Option"]>;
  placeholder: StyleCallback<SelectComponentPropsMap<GeneralSelectValue>["Placeholder"]>;
  singleValue: StyleCallback<SelectComponentPropsMap<GeneralSelectValue>["SingleValue"]>;
  valueContainer: StyleCallback<SelectComponentPropsMap<GeneralSelectValue>["ValueContainer"]>;
}>;

export type SelectAction =
  | "clear"
  | "create-option"
  | "deselect-option"
  | "pop-value"
  | "remove-value"
  | "select-option";

export type SelectActionMeta<Option extends GeneralSelectValue> =
  | { action: "select-option"; name?: string; option: Option | undefined }
  | { action: "deselect-option"; name?: string; option: Option | undefined }
  | { action: "remove-value"; name?: string; removedValue: Option }
  | { action: "pop-value"; name?: string; removedValue: Option }
  | { action: "clear"; name?: string; removedValues: Option[] }
  | { action: "create-option"; name?: string };

export type InputAction = "input-blur" | "input-change" | "menu-close" | "set-value";
export type InputActionMeta = { action: InputAction };

export type AriaLiveMessages<Option extends GeneralSelectValue> = {
  guidance?: (props: {
    "aria-label"?: string;
    context: "input" | "menu" | "value";
    isDisabled?: boolean;
    isMulti?: boolean;
    isSearchable?: boolean;
    tabSelectsValue?: boolean;
  }) => string;
  onChange?: (
    props: SelectActionMeta<Option> & {
      isDisabled?: boolean;
      label?: string;
      selectValue?: ReadonlyArray<Option>;
      value?: Option | ReadonlyArray<Option> | null;
    },
  ) => string;
  onFilter?: (props: { inputValue: string; resultsMessage: string }) => string;
  onFocus?: (props: {
    context: "menu" | "value";
    focused: Option;
    isDisabled?: boolean;
    isSelected?: boolean;
    label?: string;
    options?: ReadonlyArray<Option>;
    selectValue?: ReadonlyArray<Option>;
  }) => string;
};
export type SelectInstanceController = {
  blur: () => void;
  focus: () => void;
  inputRef: HTMLInputElement | null;
};
export type SelectController = {
  blur: () => void;
  focus: () => void;
  select: SelectInstanceController;
};
export type Choice = string | readonly [SelectPrimitive, ReactNode];
export type InnerProps = HTMLAttributes<HTMLElement> & {
  "data-test-id"?: string;
};

type ClassNameState = Record<string, boolean>;

type V4SelectProps<Option extends GeneralSelectValue, IsMulti extends boolean> = {
  // The pinned v4 declaration exposes an open component-prop index.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  isMulti?: IsMulti;
  options?: ReadonlyArray<Option | SelectGroup<Option>>;
};

type V4Value<Option extends GeneralSelectValue, IsMulti extends boolean> = IsMulti extends true
  ? ReadonlyArray<Option>
  : Option | null;

export type CommonSlotProps<
  Option extends GeneralSelectValue,
  IsMulti extends boolean = boolean,
> = {
  clearValue: () => void;
  className?: string;
  cx: (state: ClassNameState | undefined, className: string | undefined) => string;
  getStyles: (name: string, props: unknown) => CSSObject;
  getValue: () => ReadonlyArray<Option>;
  hasValue: boolean;
  isMulti: boolean;
  isRtl: boolean;
  options: ReadonlyArray<Option>;
  selectOption: (option: Option) => void;
  selectProps: V4SelectProps<Option, IsMulti>;
  setValue: (
    value: V4Value<Option, IsMulti>,
    action: "deselect-option" | "select-option",
    option?: Option,
  ) => void;
  theme: SelectTheme;
};

type ReplacementProps<Option extends GeneralSelectValue> = CommonSlotProps<Option> & {
  children?: ReactNode;
  className?: string;
  controlElement?: HTMLElement;
  data?: Option;
  form?: string;
  headingProps?: Record<string, unknown>;
  innerProps: InnerProps;
  innerRef?: Ref<HTMLElement>;
  inputValue?: string;
  isDisabled: boolean;
  isFocused: boolean;
  isHidden?: boolean;
  isLoading?: boolean;
  isSelected: boolean;
  label?: ReactNode;
  maxHeight?: number;
  menuPlacement?: "bottom" | "top";
  menuPosition?: "absolute" | "fixed";
  options?: ReadonlyArray<Option>;
  placement?: "bottom" | "top";
  appendTo?: HTMLElement;
  removeProps?: InnerProps;
  selectValue?: Option[];
  type?: "option";
  value?: string;
};

type IndicatorSlotProps<Option extends GeneralSelectValue> = CommonSlotProps<Option> & {
  children: ReactElement;
  innerProps: InnerProps;
  isDisabled: boolean;
  isFocused: boolean;
  isRtl: boolean;
};
type ControlSlotProps<Option extends GeneralSelectValue> = CommonSlotProps<Option> & {
  children: ReactNode;
  innerProps: InnerProps & {
    onMouseDown: (event: React.MouseEvent<HTMLElement>) => void;
  };
  innerRef: Ref<HTMLElement>;
  isDisabled: boolean;
  isFocused: boolean;
  menuIsOpen: boolean;
};
type MessageSlotProps<Option extends GeneralSelectValue> = CommonSlotProps<Option> & {
  children: ReactNode;
  innerProps: InnerProps;
};
type OptionInnerProps = {
  id: string;
  key: string;
  onClick: React.MouseEventHandler<HTMLDivElement>;
  onMouseMove: React.MouseEventHandler<HTMLDivElement>;
  onMouseDown?: React.MouseEventHandler<HTMLElement>;
  onMouseOver: React.MouseEventHandler<HTMLDivElement>;
  onTouchEnd?: React.TouchEventHandler<HTMLElement>;
  tabIndex: number;
};
type OptionSlotProps<Option extends GeneralSelectValue> = CommonSlotProps<Option> & {
  children: ReactNode;
  data: Option;
  innerProps: OptionInnerProps;
  innerRef: Ref<HTMLElement>;
  isDisabled: boolean;
  isFocused: boolean;
  isSelected: boolean;
  label: string;
  type: "option";
};
type SingleValueSlotProps<Option extends GeneralSelectValue> = CommonSlotProps<Option, false> & {
  children: ReactNode;
  data: Option;
  innerProps: InnerProps;
  isDisabled: boolean;
};

type MultiValueGenericProps<Option extends GeneralSelectValue> = {
  children: ReactNode;
  data: Option;
  innerProps: { className?: string; style?: React.CSSProperties };
  selectProps: V4SelectProps<Option, true>;
};

type MultiValueRemoveHandlers = {
  className?: string;
  onClick: (event: unknown) => void;
  onMouseDown: (event: unknown) => void;
  onTouchEnd: (event: unknown) => void;
};

type MultiValueRemoveSlotProps<Option extends GeneralSelectValue> = CommonSlotProps<
  Option,
  true
> & {
  children: ReactNode;
  data: Option;
  innerProps: MultiValueRemoveHandlers & { className: string; style?: React.CSSProperties };
  removeProps: MultiValueRemoveHandlers;
};

type ResolvedMultiValueRemoveProps<Option extends GeneralSelectValue> = {
  children?: ReactNode;
  data: Option;
  innerProps: MultiValueRemoveHandlers & { className: string; style?: React.CSSProperties };
  selectProps: V4SelectProps<Option, true>;
};

type MultiValueComponents<Option extends GeneralSelectValue> = {
  Container: ComponentType<MultiValueGenericProps<Option>>;
  Label: ComponentType<MultiValueGenericProps<Option>>;
  Remove: ComponentType<ResolvedMultiValueRemoveProps<Option>>;
};

type InputSlotProps = {
  autoComplete?: string;
  className?: string;
  cx: (
    className: string | null,
    state: Record<string, boolean> | undefined,
    prefix: string,
  ) => string | void;
  getStyles: (name: string, props: unknown) => CSSObject;
  innerRef: (element: Ref<unknown>) => void;
  isDisabled?: boolean;
  isHidden: boolean;
  theme: SelectTheme;
};

export type CategorizedSelectOption<Option extends GeneralSelectValue> = {
  data: Option;
  index: number;
  isDisabled: boolean;
  isSelected: boolean;
  label: string;
  type: "option";
  value: string;
};

export type SelectComponentPropsMap<Option extends GeneralSelectValue> = {
  ClearIndicator: IndicatorSlotProps<Option>;
  Control: ControlSlotProps<Option>;
  CrossIcon: Record<string, unknown>;
  DownChevron: Record<string, unknown>;
  DropdownIndicator: IndicatorSlotProps<Option>;
  Group: CommonSlotProps<Option> & {
    children: ReactNode;
    Heading: ComponentType<CommonSlotProps<Option> & { children: ReactNode }>;
    headingProps: Record<string, unknown>;
    label: ReactNode;
  };
  GroupHeading: CommonSlotProps<Option> & {
    children: ReactNode;
    data: SelectGroup<Option>;
    id?: string;
  };
  IndicatorSeparator: IndicatorSlotProps<Option>;
  IndicatorsContainer: CommonSlotProps<Option> & {
    children: ReactNode;
    isDisabled: boolean;
    isRtl: boolean;
  };
  Input: InputSlotProps;
  LoadingIndicator: CommonSlotProps<Option> & {
    innerProps: InnerProps;
    isFocused: boolean;
    isRtl: boolean;
    size: number;
  };
  LoadingMessage: MessageSlotProps<Option>;
  Menu: CommonSlotProps<Option> & {
    children: ReactElement;
    getPortalPlacement: (state: { maxHeight: number; placement: "bottom" | "top" | null }) => void;
    innerProps: InnerProps;
    innerRef: Ref<HTMLElement>;
    isLoading?: boolean;
    maxHeight?: number;
    maxMenuHeight: number;
    menuPlacement: "auto" | "bottom" | "top";
    menuPosition: "absolute" | "fixed";
    minMenuHeight: number;
    menuShouldScrollIntoView: boolean;
    placement?: "bottom" | "top";
  };
  MenuList: CommonSlotProps<Option> & {
    children: ReactNode;
    focusedOption?: Option;
    innerRef: Ref<HTMLElement>;
    isLoading?: boolean;
    isMulti: boolean;
    maxHeight: number;
  };
  MenuPortal: CommonSlotProps<Option> & {
    appendTo: HTMLElement;
    children: ReactNode;
    controlElement: HTMLElement;
    menuPlacement: "auto" | "bottom" | "top";
    menuPosition: "absolute" | "fixed";
  };
  MultiValue: CommonSlotProps<Option, true> & {
    children: ReactNode;
    components: MultiValueComponents<Option>;
    cropWithEllipsis: boolean;
    data: Option;
    innerProps: InnerProps;
    isDisabled: boolean;
    isFocused: boolean;
    removeProps: MultiValueRemoveHandlers;
  };
  MultiValueContainer: MultiValueGenericProps<Option>;
  MultiValueLabel: MultiValueGenericProps<Option>;
  MultiValueRemove: MultiValueRemoveSlotProps<Option>;
  NoOptionsMessage: MessageSlotProps<Option>;
  Option: OptionSlotProps<Option>;
  Placeholder: CommonSlotProps<Option> & {
    children: ReactNode;
    innerProps: { style: React.CSSProperties };
    isDisabled: boolean;
    isFocused: boolean;
  };
  SelectContainer: CommonSlotProps<Option> & {
    children: ReactNode;
    innerProps: InnerProps & {
      id?: string;
      onKeyDown: KeyboardEventHandler<HTMLElement>;
    };
    isDisabled: boolean;
    isRtl: boolean;
  };
  SingleValue: SingleValueSlotProps<Option>;
  ValueContainer: CommonSlotProps<Option> & {
    children: ReactNode;
    hasValue: boolean;
    isMulti: boolean;
  };
};

export type SlotProps<Option extends GeneralSelectValue> =
  SelectComponentPropsMap<Option>[keyof SelectComponentPropsMap<Option>];
export type SelectComponents<Option extends GeneralSelectValue> = Partial<{
  [Name in keyof SelectComponentPropsMap<Option>]: ComponentType<
    SelectComponentPropsMap<Option>[Name]
  > | null;
}>;

type CommonProps<Option extends GeneralSelectValue> = {
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-live"?: "assertive" | "off" | "polite";
  ariaLiveMessages?: AriaLiveMessages<Option>;
  allowCreateWhileLoading?: boolean;
  async?: boolean;
  autoFocus?: boolean;
  backspaceRemovesValue?: boolean;
  blurInputOnSelect?: boolean;
  cache?: Record<string, unknown>;
  cacheOptions?: unknown;
  captureMenuScroll?: boolean;
  choices?: ReadonlyArray<Choice> | ((props: ControlProps<Option>) => ReadonlyArray<Choice>);
  className?: string;
  classNamePrefix?: string | null;
  closeMenuOnScroll?: boolean | ((event: Event) => boolean);
  closeMenuOnSelect?: boolean;
  components?: SelectComponents<Option>;
  controlShouldRenderValue?: boolean;
  creatable?: boolean;
  createOptionPosition?: "first" | "last";
  defaultInputValue?: string;
  defaultMenuIsOpen?: boolean;
  defaultOptions?: boolean | ReadonlyArray<Option | SelectGroup<Option>>;
  defaultValue?: unknown;
  delimiter?: string;
  disabled?: boolean;
  escapeClearsValue?: boolean;
  filterOption?:
    | ((option: { data: Option; label: string; value: string }, inputValue: string) => boolean)
    | null;
  form?: string;
  formatCreateLabel?: (inputValue: string) => ReactNode;
  formatGroupLabel?: (group: SelectGroup<Option>) => ReactNode;
  formatOptionLabel?: (
    option: Option,
    meta: {
      context: "menu" | "value";
      inputValue: string;
      selectValue: Option[];
    },
  ) => ReactNode;
  getNewOptionData?: (inputValue: string, optionLabel: ReactNode) => Option;
  getOptionLabel?: (option: Option) => string;
  getOptionValue?: (option: Option) => string;
  hideSelectedOptions?: boolean;
  id?: string;
  inFieldLabel?: string;
  inputId?: string;
  inputRef?: Ref<HTMLInputElement>;
  inputValue?: string;
  instanceId?: number | string;
  isClearable?: boolean;
  isDisabled?: boolean;
  isInsideModal?: boolean;
  isLoading?: boolean;
  isMulti?: boolean;
  multi?: boolean;
  isOptionDisabled?: (option: Option, selected: Option[]) => boolean;
  isOptionSelected?: (option: Option, selected: Option[]) => boolean;
  isRtl?: boolean;
  isSearchable?: boolean;
  isValidNewOption?: (
    inputValue: string,
    selectValue: Option[],
    selectOptions: ReadonlyArray<Option>,
    accessors: {
      getOptionLabel: (option: Option) => string;
      getOptionValue: (option: Option) => string;
    },
  ) => boolean;
  isValueEqual?: (a: Option["value"], b: Option["value"]) => boolean;
  loadOptions?: (
    inputValue: string,
    callback: (options?: ReadonlyArray<Option | SelectGroup<Option>>) => void,
  ) => Promise<ReadonlyArray<Option | SelectGroup<Option>> | undefined> | void;
  loadingMessage?: (state: { inputValue: string }) => ReactNode;
  maxMenuHeight?: number;
  maxMenuWidth?: number | string;
  menuIsOpen?: boolean;
  menuPortalTarget?: HTMLElement | null;
  menuPosition?: "absolute" | "fixed";
  menuShouldBlockScroll?: boolean;
  menuShouldScrollIntoView?: boolean;
  minMenuHeight?: number;
  name?: string;
  noOptionsMessage?: (state: { inputValue: string }) => ReactNode;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  onClear?: () => void;
  onCreateOption?: (inputValue: string) => void;
  onFocus?: FocusEventHandler<HTMLInputElement>;
  onInputChange?: (inputValue: string, actionMeta: InputActionMeta) => string | void;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
  onMenuClose?: () => void;
  onMenuOpen?: () => void;
  onMenuScrollToBottom?: (event: React.UIEvent<HTMLElement>) => void;
  onMenuScrollToTop?: (event: React.UIEvent<HTMLElement>) => void;
  openMenuOnClick?: boolean;
  openMenuOnFocus?: boolean;
  options?: ReadonlyArray<Option | SelectGroup<Option>>;
  pageSize?: number;
  placeholder?: ReactNode;
  ref?: Ref<SelectController | Pick<SelectController, "blur" | "focus">>;
  screenReaderStatus?: (state: { count: number }) => string;
  searchable?: boolean;
  showDividers?: boolean;
  size?: FormSize;
  styles?: StylesConfig;
  tabIndex?: number | string;
  tabSelectsValue?: boolean;
  value?: unknown;
};

type MultipleProps<Option extends GeneralSelectValue> = CommonProps<Option> & {
  clearable?: boolean;
  multiple: true;
  onChange?: (option: Option[], actionMeta: SelectActionMeta<Option>) => void;
};
type SingleProps<Option extends GeneralSelectValue> = CommonProps<Option> & {
  clearable?: false;
  multiple?: false;
  onChange?: (option: Option, actionMeta: SelectActionMeta<Option>) => void;
};
type SingleClearableProps<Option extends GeneralSelectValue> = CommonProps<Option> & {
  clearable: true;
  multiple?: false;
  onChange?: (option: Option | null, actionMeta: SelectActionMeta<Option>) => void;
};

export type ControlProps<Option extends GeneralSelectValue = GeneralSelectValue> =
  | MultipleProps<Option>
  | SingleProps<Option>
  | SingleClearableProps<Option>;

export type { FormSize, OptionSlotProps, ReplacementProps };
