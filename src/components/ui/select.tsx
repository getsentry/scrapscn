/* eslint-disable react-hooks/preserve-manual-memoization -- eslint-plugin-react-hooks 7.1.1 does not honor this component's documented React Compiler opt-out. */
"use client";

import {
  createElement,
  Fragment,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ChangeEvent,
  type ComponentProps as ReactComponentProps,
  type ComponentType,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
  type UIEvent,
} from "react";
import { createPortal } from "react-dom";

import { t } from "../../lib/scraps-locale";
import { cn } from "../../lib/utils";
import { useBodyScrollLock } from "./body-scroll-lock";
import { MenuListItem } from "./menu-list-item";
import type {
  Choice,
  CommonSlotProps,
  ControlProps,
  CSSObject,
  FormSize,
  GeneralSelectValue,
  InputAction,
  OptionSlotProps,
  ReplacementProps,
  SelectAction,
  SelectActionMeta,
  SelectComponentPropsMap,
  SelectController,
  SelectGroup,
  SelectInstanceController,
  SelectTheme,
  StylesConfig,
} from "./select-types";

export type { ControlProps, GeneralSelectValue, SelectValue, StylesConfig } from "./select-types";

const sizeClasses: Record<FormSize, string> = {
  md: "min-h-9 rounded-[8px] text-sm/4",
  sm: "min-h-8 rounded-[6px] text-sm/4",
  xs: "min-h-7 rounded-[5px] text-xs/4",
};

const valueContainerClasses: Record<FormSize, string> = {
  md: "pr-2 pl-4",
  sm: "pr-1.5 pl-3",
  xs: "pr-1 pl-2",
};

const multiValueClasses: Record<FormSize, string> = {
  md: "my-1 mr-1",
  sm: "my-0.5 mr-0.5",
  xs: "my-0.5 mr-0.5",
};

const multiValueLabelClasses: Record<FormSize, string> = {
  md: "h-5 p-1",
  sm: "h-[18px] p-0.5",
  xs: "h-4 p-0.5",
};

const indicatorContainerClasses: Record<FormSize, string> = {
  md: "mr-2",
  sm: "mr-1.5",
  xs: "mr-1",
};

const selectTheme: SelectTheme = {
  borderRadius: 4,
  colors: {
    danger: "#de350b",
    dangerLight: "#ffbdad",
    neutral0: "hsl(0, 0%, 100%)",
    neutral10: "hsl(0, 0%, 90%)",
    neutral20: "hsl(0, 0%, 80%)",
    neutral30: "hsl(0, 0%, 70%)",
    neutral40: "hsl(0, 0%, 60%)",
    neutral50: "hsl(0, 0%, 50%)",
    neutral60: "hsl(0, 0%, 40%)",
    neutral70: "hsl(0, 0%, 30%)",
    neutral80: "hsl(0, 0%, 20%)",
    neutral90: "hsl(0, 0%, 10%)",
    primary: "#2684ff",
    primary25: "#deebff",
    primary50: "#b2d4ff",
    primary75: "#4c9aff",
  },
  spacing: { baseUnit: 4, controlHeight: 38, menuGutter: 8 },
};

const formStyles: Record<
  FormSize,
  {
    borderRadius: string;
    fontSize: string;
    lineHeight: string;
    minHeight: string;
    paddingLeft: number;
  }
> = {
  md: {
    borderRadius: "8px",
    fontSize: "0.875rem",
    lineHeight: "1rem",
    minHeight: "36px",
    paddingLeft: 16,
  },
  sm: {
    borderRadius: "6px",
    fontSize: "0.875rem",
    lineHeight: "1rem",
    minHeight: "32px",
    paddingLeft: 12,
  },
  xs: {
    borderRadius: "5px",
    fontSize: "0.75rem",
    lineHeight: "1rem",
    minHeight: "28px",
    paddingLeft: 8,
  },
};

const multiValueStyles: Record<FormSize, { height: string; spacing: string }> = {
  md: { height: "20px", spacing: "4px" },
  sm: { height: "18px", spacing: "2px" },
  xs: { height: "16px", spacing: "2px" },
};

type StyleState = Record<string, unknown>;

const reactSelectStyleNames = new Set<keyof StylesConfig>([
  "clearIndicator",
  "container",
  "control",
  "dropdownIndicator",
  "group",
  "groupHeading",
  "indicatorsContainer",
  "indicatorSeparator",
  "input",
  "loadingIndicator",
  "loadingMessage",
  "menu",
  "menuList",
  "menuPortal",
  "multiValue",
  "multiValueLabel",
  "multiValueRemove",
  "noOptionsMessage",
  "option",
  "placeholder",
  "singleValue",
  "valueContainer",
]);

function asStyleState(value: unknown): StyleState {
  return typeof value === "object" && value !== null ? (value as StyleState) : {};
}

function toDOMStyle(style: CSSObject, excludedProperties: readonly string[] = []): CSSProperties {
  const result: CSSProperties = {};
  for (const [property, value] of Object.entries(style)) {
    if (
      property !== "label" &&
      !excludedProperties.includes(property) &&
      (typeof value === "number" || typeof value === "string")
    ) {
      Object.assign(result, { [property]: value });
    }
  }
  return result;
}

function consumerSlotStyle(
  name: keyof StylesConfig,
  props: Pick<CommonSlotProps<GeneralSelectValue>, "getStyles" | "selectProps">,
): CSSProperties | undefined {
  if (typeof props.selectProps.styles?.[name] !== "function") return undefined;
  return toDOMStyle(consumerSlotStyles(name, props));
}

function consumerSlotStyles(
  name: keyof StylesConfig,
  props: Pick<CommonSlotProps<GeneralSelectValue>, "getStyles" | "selectProps">,
): CSSObject {
  if (typeof props.selectProps.styles?.[name] !== "function") return {};
  return props.getStyles(name, props);
}

function styleValue(style: StyleState, property: string, unit = "") {
  const value = style[property];
  if (typeof value === "number") return `${value}${unit}`;
  return typeof value === "string" ? value : undefined;
}

function withStyleVariables(
  style: CSSProperties,
  variables: CSSProperties | Record<string, string | undefined> | undefined,
): CSSProperties {
  const result = { ...style };
  for (const [name, value] of Object.entries(variables ?? {})) {
    if (value !== undefined) Object.assign(result, { [name]: value });
  }
  return result;
}

type BeforePrefix = "input" | "placeholder" | "single-value";

const beforeVariablePrefix: Record<BeforePrefix, string> = {
  input: "--scraps-select-input-before-",
  placeholder: "--scraps-select-placeholder-before-",
  "single-value": "--scraps-select-single-value-before-",
};

function beforeStyle(style: CSSObject, prefix: BeforePrefix): CSSProperties | undefined {
  const before = asStyleState(style[":before"]);
  if (Object.keys(before).length === 0) return undefined;
  const variablePrefix = beforeVariablePrefix[prefix];
  return withStyleVariables(
    {},
    {
      [variablePrefix + "background-color"]: styleValue(before, "backgroundColor"),
      [variablePrefix + "border-radius"]: styleValue(before, "borderRadius", "px"),
      [variablePrefix + "color"]: styleValue(before, "color"),
      [variablePrefix + "font-weight"]: styleValue(before, "fontWeight"),
      [variablePrefix + "height"]: styleValue(before, "height", "px"),
      [variablePrefix + "margin-left"]: styleValue(before, "marginLeft", "px"),
      [variablePrefix + "margin-right"]: styleValue(before, "marginRight", "px"),
      [variablePrefix + "width"]: styleValue(before, "width", "px"),
    },
  );
}

function beforeContent(style: CSSObject) {
  const value = asStyleState(style[":before"]).content;
  if (typeof value !== "string" || value === "none" || value === "normal") return "";
  const quote = value[0];
  return value.length >= 2 && (quote === '"' || quote === "'") && value.at(-1) === quote
    ? value.slice(1, -1)
    : value;
}

function SelectBefore({
  children,
  prefix,
  style,
}: {
  children?: ReactNode;
  prefix: BeforePrefix;
  style?: CSSProperties;
}) {
  if (!style) return null;
  const classes = {
    input:
      "bg-[var(--scraps-select-input-before-background-color,transparent)] text-[var(--scraps-select-input-before-color,currentColor)] [block-size:var(--scraps-select-input-before-height,auto)] [border-radius:var(--scraps-select-input-before-border-radius,0px)] [font-weight:var(--scraps-select-input-before-font-weight,inherit)] [inline-size:var(--scraps-select-input-before-width,auto)] [margin-inline-end:var(--scraps-select-input-before-margin-right,0px)] [margin-inline-start:var(--scraps-select-input-before-margin-left,0px)]",
    placeholder:
      "bg-[var(--scraps-select-placeholder-before-background-color,transparent)] text-[var(--scraps-select-placeholder-before-color,currentColor)] [block-size:var(--scraps-select-placeholder-before-height,auto)] [border-radius:var(--scraps-select-placeholder-before-border-radius,0px)] [font-weight:var(--scraps-select-placeholder-before-font-weight,inherit)] [inline-size:var(--scraps-select-placeholder-before-width,auto)] [margin-inline-end:var(--scraps-select-placeholder-before-margin-right,0px)] [margin-inline-start:var(--scraps-select-placeholder-before-margin-left,0px)]",
    "single-value":
      "bg-[var(--scraps-select-single-value-before-background-color,transparent)] text-[var(--scraps-select-single-value-before-color,currentColor)] [block-size:var(--scraps-select-single-value-before-height,auto)] [border-radius:var(--scraps-select-single-value-before-border-radius,0px)] [font-weight:var(--scraps-select-single-value-before-font-weight,inherit)] [inline-size:var(--scraps-select-single-value-before-width,auto)] [margin-inline-end:var(--scraps-select-single-value-before-margin-right,0px)] [margin-inline-start:var(--scraps-select-single-value-before-margin-left,0px)]",
  } as const;
  return (
    <span aria-hidden="true" className={cn("block shrink-0", classes[prefix])} style={style}>
      {children}
    </span>
  );
}

function stateFlag(state: StyleState, name: string) {
  return state[name] === true;
}

function isTouchCapable() {
  try {
    document.createEvent("TouchEvent");
    return true;
  } catch {
    return false;
  }
}

function scrollBounds(element: HTMLElement) {
  let parent = element.parentElement;
  while (parent && parent !== document.body) {
    const { overflowY } = getComputedStyle(parent);
    if (/(auto|scroll|overlay)/.test(overflowY)) {
      const rect = parent.getBoundingClientRect();
      return { bottom: Math.min(window.innerHeight, rect.bottom), top: Math.max(0, rect.top) };
    }
    parent = parent.parentElement;
  }
  return { bottom: window.innerHeight, top: 0 };
}

function reactSelectBaseStyle(name: keyof StylesConfig, value: unknown): CSSObject {
  const state = asStyleState(value);
  const { borderRadius, colors, spacing } = selectTheme;
  const isDisabled = stateFlag(state, "isDisabled");
  const isFocused = stateFlag(state, "isFocused");
  const isSelected = stateFlag(state, "isSelected");
  let style: CSSObject;
  switch (name) {
    case "clearIndicator":
    case "dropdownIndicator":
      style = {
        label: "indicatorContainer",
        color: isFocused ? colors.neutral60 : colors.neutral20,
        display: "flex",
        padding: spacing.baseUnit * 2,
        transition: "color 150ms",
        ":hover": { color: isFocused ? colors.neutral80 : colors.neutral40 },
      };
      break;
    case "container":
      style = {
        label: "container",
        direction: stateFlag(state, "isRtl") ? "rtl" : null,
        pointerEvents: isDisabled ? "none" : null,
        position: "relative",
      };
      break;
    case "control":
      style = {
        label: "control",
        alignItems: "center",
        backgroundColor: isDisabled ? colors.neutral5 : colors.neutral0,
        borderColor: isDisabled ? colors.neutral10 : isFocused ? colors.primary : colors.neutral20,
        borderRadius,
        borderStyle: "solid",
        borderWidth: 1,
        boxShadow: isFocused ? `0 0 0 1px ${colors.primary}` : null,
        cursor: "default",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        minHeight: spacing.controlHeight,
        outline: "0 !important",
        position: "relative",
        transition: "all 100ms",
        "&:hover": { borderColor: isFocused ? colors.primary : colors.neutral30 },
      };
      break;
    case "group":
      style = { paddingBottom: spacing.baseUnit * 2, paddingTop: spacing.baseUnit * 2 };
      break;
    case "groupHeading":
      style = {
        label: "group",
        color: "#999",
        cursor: "default",
        display: "block",
        fontSize: "75%",
        fontWeight: "500",
        marginBottom: "0.25em",
        paddingLeft: spacing.baseUnit * 3,
        paddingRight: spacing.baseUnit * 3,
        textTransform: "uppercase",
      };
      break;
    case "indicatorsContainer":
      style = { alignItems: "center", alignSelf: "stretch", display: "flex", flexShrink: 0 };
      break;
    case "indicatorSeparator":
      style = {
        label: "indicatorSeparator",
        alignSelf: "stretch",
        backgroundColor: isDisabled ? colors.neutral10 : colors.neutral20,
        marginBottom: spacing.baseUnit * 2,
        marginTop: spacing.baseUnit * 2,
        width: 1,
      };
      break;
    case "input":
      style = {
        margin: spacing.baseUnit / 2,
        paddingBottom: spacing.baseUnit / 2,
        paddingTop: spacing.baseUnit / 2,
        visibility: isDisabled ? "hidden" : "visible",
        color: colors.neutral80,
      };
      break;
    case "loadingIndicator": {
      const indicatorSize = typeof state.size === "number" ? state.size : 4;
      style = {
        label: "loadingIndicator",
        color: isFocused ? colors.neutral60 : colors.neutral20,
        display: "flex",
        padding: spacing.baseUnit * 2,
        transition: "color 150ms",
        alignSelf: "center",
        fontSize: indicatorSize,
        lineHeight: 1,
        marginRight: indicatorSize,
        textAlign: "center",
        verticalAlign: "middle",
      };
      break;
    }
    case "loadingMessage":
    case "noOptionsMessage":
      style = {
        color: colors.neutral40,
        padding: `${spacing.baseUnit * 2}px ${spacing.baseUnit * 3}px`,
        textAlign: "center",
      };
      break;
    case "menu": {
      const placement = state.placement === "top" ? "top" : "bottom";
      style = {
        label: "menu",
        [placement === "top" ? "bottom" : "top"]: "100%",
        backgroundColor: colors.neutral0,
        borderRadius,
        boxShadow: "0 0 0 1px hsla(0, 0%, 0%, 0.1), 0 4px 11px hsla(0, 0%, 0%, 0.1)",
        marginBottom: spacing.menuGutter,
        marginTop: spacing.menuGutter,
        position: "absolute",
        width: "100%",
        zIndex: 1,
      };
      break;
    }
    case "menuList":
      style = {
        maxHeight: typeof state.maxHeight === "number" ? state.maxHeight : 300,
        overflowY: "auto",
        paddingBottom: spacing.baseUnit,
        paddingTop: spacing.baseUnit,
        position: "relative",
        WebkitOverflowScrolling: "touch",
      };
      break;
    case "menuPortal": {
      const rect = asStyleState(state.rect);
      style = {
        left: typeof rect.left === "number" ? rect.left : 0,
        position: state.position === "fixed" ? "fixed" : "absolute",
        top: typeof state.offset === "number" ? state.offset : 0,
        width: typeof rect.width === "number" ? rect.width : 0,
        zIndex: 1,
      };
      break;
    }
    case "multiValue":
      style = {
        label: "multiValue",
        backgroundColor: colors.neutral10,
        borderRadius: borderRadius / 2,
        display: "flex",
        margin: spacing.baseUnit / 2,
        minWidth: 0,
      };
      break;
    case "multiValueLabel":
      style = {
        borderRadius: borderRadius / 2,
        color: colors.neutral80,
        fontSize: "85%",
        overflow: "hidden",
        padding: 3,
        paddingLeft: 6,
        textOverflow: state.cropWithEllipsis === false ? null : "ellipsis",
        whiteSpace: "nowrap",
      };
      break;
    case "multiValueRemove":
      style = {
        alignItems: "center",
        borderRadius: borderRadius / 2,
        backgroundColor: isFocused && colors.dangerLight,
        display: "flex",
        paddingLeft: spacing.baseUnit,
        paddingRight: spacing.baseUnit,
        ":hover": { backgroundColor: colors.dangerLight, color: colors.danger },
      };
      break;
    case "option":
      style = {
        label: "option",
        backgroundColor: isSelected ? colors.primary : isFocused ? colors.primary25 : "transparent",
        color: isDisabled ? colors.neutral20 : isSelected ? colors.neutral0 : "inherit",
        cursor: "default",
        display: "block",
        fontSize: "inherit",
        padding: `${spacing.baseUnit * 2}px ${spacing.baseUnit * 3}px`,
        width: "100%",
        userSelect: "none",
        WebkitTapHighlightColor: "rgba(0, 0, 0, 0)",
        ":active": {
          backgroundColor: !isDisabled && (isSelected ? colors.primary : colors.primary50),
        },
      };
      break;
    case "placeholder":
      style = {
        label: "placeholder",
        color: colors.neutral50,
        marginLeft: spacing.baseUnit / 2,
        marginRight: spacing.baseUnit / 2,
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
      };
      break;
    case "singleValue":
      style = {
        label: "singleValue",
        color: isDisabled ? colors.neutral40 : colors.neutral80,
        marginLeft: spacing.baseUnit / 2,
        marginRight: spacing.baseUnit / 2,
        maxWidth: `calc(100% - ${spacing.baseUnit * 2}px)`,
        overflow: "hidden",
        position: "absolute",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        top: "50%",
        transform: "translateY(-50%)",
      };
      break;
    case "valueContainer":
      style = {
        alignItems: "center",
        display: "flex",
        flex: 1,
        flexWrap: "wrap",
        padding: `${spacing.baseUnit / 2}px ${spacing.baseUnit * 2}px`,
        WebkitOverflowScrolling: "touch",
        position: "relative",
        overflow: "hidden",
      };
      break;
  }
  return { ...style, boxSizing: "border-box" };
}

function subscribeToScrapsTheme(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, { attributeFilter: ["class"], attributes: true });
  return () => observer.disconnect();
}

function getDarkScrapsThemeSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function scrapsStyle(
  name: keyof StylesConfig,
  provided: CSSObject,
  value: unknown,
  context: {
    inFieldLabel?: string;
    isDisabled: boolean;
    isInsideModal: boolean;
    isSearchable: boolean;
    maxMenuWidth?: number | string;
    size: FormSize;
    usesDarkTheme: boolean;
  },
) {
  const state = asStyleState(value);
  const theme = context.usesDarkTheme
    ? {
        background: "#2E2936",
        border: "#141119",
        borderSecondary: "#1B1821",
        chonk: "#141119",
        content: "#E7E5EA",
        contentSecondary: "#B5B0BD",
        disabled: "#958E9F",
        graphicsAccent: "#7553FF",
        gray800: "#E7E5EA",
        inputBackground: "#00002033",
        transparentHover: "#D8A0F80F",
      }
    : {
        background: "#FFFFFF",
        border: "#DAD9DE",
        borderSecondary: "#E6E6E9",
        chonk: "#DAD9DE",
        content: "#302E36",
        contentSecondary: "#6A6772",
        disabled: "#878490",
        graphicsAccent: "#B7B2FF",
        gray800: "#3E3B45",
        inputBackground: "#10103008",
        transparentHover: "#10103008",
      };
  const form = formStyles[context.size];
  const multiValue = multiValueStyles[context.size];
  const indicator = () => ({
    ...provided,
    padding: "0 4px 0 4px",
    alignItems: "center",
    cursor: stateFlag(state, "isDisabled") ? "not-allowed" : "pointer",
    color: stateFlag(state, "isDisabled") ? theme.disabled : theme.content,
    ":hover": { color: "currentcolor" },
  });
  let style: CSSObject;
  switch (name) {
    case "clearIndicator":
    case "dropdownIndicator":
    case "loadingIndicator":
      style = indicator();
      break;
    case "control": {
      const boxShadow = `0px 1px 0px 0px ${theme.chonk} inset`;
      style = {
        display: "flex",
        color: stateFlag(state, "isDisabled") ? theme.disabled : theme.content,
        backgroundColor: theme.inputBackground,
        border: `1px solid ${theme.border}`,
        boxShadow,
        borderRadius: form.borderRadius,
        transition:
          "border 120ms cubic-bezier(0.72, 0, 0.16, 1), box-shadow 120ms cubic-bezier(0.72, 0, 0.16, 1)",
        alignItems: "center",
        ...(stateFlag(state, "isFocused")
          ? {
              outline: "none",
              boxShadow: `${boxShadow}, 0 0 0 2px #7553FF`,
            }
          : {}),
        ...(stateFlag(state, "isDisabled")
          ? {
              background: theme.background,
              color: theme.disabled,
              cursor: "not-allowed",
              opacity: "60%",
            }
          : {}),
        minHeight: form.minHeight,
        fontSize: form.fontSize,
        lineHeight: form.lineHeight,
        ...(stateFlag(state, "isMulti") ? { maxHeight: "12em", overflow: "hidden" } : {}),
      };
      break;
    }
    case "menu":
      style = {
        ...provided,
        zIndex: 1001,
        background: theme.background,
        borderRadius: "6px",
        border: `1px solid ${theme.border}`,
        boxShadow: "none",
        width: "auto",
        minWidth: "100%",
        maxWidth: context.maxMenuWidth ?? "auto",
      };
      break;
    case "noOptionsMessage":
      style = { ...provided, color: theme.disabled };
      break;
    case "menuPortal":
      style = {
        ...provided,
        maxWidth: context.maxMenuWidth ?? "24rem",
        zIndex: context.isInsideModal ? 10001 : 1001,
      };
      break;
    case "option":
      style = {
        ...provided,
        color: theme.content,
        background: "transparent",
        padding: 0,
        ":active": { background: "transparent" },
      };
      break;
    case "container":
      style = {
        ...provided,
        ...(stateFlag(state, "isDisabled") ? { pointerEvents: "unset" } : {}),
      };
      break;
    case "valueContainer":
      style = {
        ...provided,
        cursor: context.isDisabled ? "not-allowed" : context.isSearchable ? "default" : "pointer",
        alignItems: "center",
        paddingTop: 0,
        paddingBottom: 0,
        paddingLeft: form.paddingLeft,
        paddingRight: context.size === "md" ? "8px" : context.size === "sm" ? "6px" : "4px",
        ...(stateFlag(state, "isMulti")
          ? {
              maxHeight: "inherit",
              overflowY: "auto",
              scrollbarColor: `${theme.graphicsAccent} ${theme.background}`,
            }
          : {}),
      };
      break;
    case "input":
      style = { ...provided, color: theme.content, margin: 0 };
      break;
    case "singleValue":
      style = {
        ...provided,
        color: stateFlag(state, "isDisabled") ? theme.disabled : theme.content,
        display: "flex",
        alignItems: "center",
        marginLeft: 0,
        marginRight: 0,
        width: `calc(100% - ${form.paddingLeft}px - 4px)`,
      };
      break;
    case "placeholder":
      style = {
        ...provided,
        color: stateFlag(state, "isDisabled") ? theme.disabled : theme.contentSecondary,
      };
      break;
    case "multiValue":
      style = {
        ...provided,
        backgroundColor: theme.background,
        color: context.isDisabled ? theme.disabled : theme.content,
        borderRadius: "4px",
        border: `1px solid ${theme.border}`,
        boxShadow: `0px 1px 0px 0px ${theme.border}`,
        display: "flex",
        margin: 0,
        marginTop: multiValue.spacing,
        marginBottom: multiValue.spacing,
        marginRight: multiValue.spacing,
      };
      break;
    case "multiValueLabel":
      style = {
        ...provided,
        color: context.isDisabled ? theme.disabled : theme.content,
        padding: multiValue.spacing,
        paddingLeft: multiValue.spacing,
        height: multiValue.height,
        display: "flex",
        alignItems: "center",
      };
      break;
    case "multiValueRemove":
      style = {
        alignItems: "center",
        display: "flex",
        margin: "4px 4px",
        ...(context.isDisabled
          ? { pointerEvents: "none" }
          : { "&:hover": { cursor: "pointer", background: theme.transparentHover } }),
      };
      break;
    case "indicatorsContainer":
      style = {
        display: "grid",
        gridAutoFlow: "column",
        marginRight: context.size === "md" ? "8px" : context.size === "sm" ? "6px" : "4px",
      };
      break;
    case "groupHeading":
      style = {
        ...provided,
        lineHeight: "1.5",
        fontWeight: 600,
        color: theme.contentSecondary,
        marginBottom: 0,
        padding: "4px 12px",
        ":empty": { display: "none" },
      };
      break;
    case "group":
      style = {
        ...provided,
        paddingTop: 0,
        ":last-of-type": { paddingBottom: 0 },
        ":not(:last-of-type)": { position: "relative", marginBottom: "8px" },
        ":not(:last-of-type)::after": {
          content: '""',
          position: "absolute",
          left: "12px",
          right: "12px",
          bottom: 0,
          borderBottom: `solid 1px ${theme.borderSecondary}`,
        },
      };
      break;
    default:
      style = provided;
  }
  if (context.inFieldLabel && (name === "singleValue" || name === "placeholder")) {
    return {
      ...style,
      ":before": {
        content: `"${context.inFieldLabel}"`,
        color: theme.gray800,
        fontWeight: 600,
        marginRight: context.size === "md" ? "8px" : context.size === "sm" ? "6px" : "4px",
      },
    };
  }
  return style;
}

type InternalOption<Option extends GeneralSelectValue> = Option & {
  __isNew__?: boolean;
  selectionMode?: "multiple" | "single";
};

function setRef<Value>(ref: Ref<Value> | undefined, value: Value | null) {
  if (typeof ref === "function") return ref(value);
  if (ref) ref.current = value;
}

function isGroup<Option extends GeneralSelectValue>(
  value: Option | SelectGroup<Option>,
): value is SelectGroup<Option> {
  return Array.isArray((value as SelectGroup<Option>).options);
}

function flatten<Option extends GeneralSelectValue>(
  options: ReadonlyArray<Option | SelectGroup<Option>>,
) {
  return options.flatMap((option) => (isGroup(option) ? option.options : [option]));
}

function convertedChoices<Option extends GeneralSelectValue>(
  choices: ReadonlyArray<Choice> | undefined,
): Option[] | undefined {
  if (choices === undefined) return undefined;
  return choices.map((choice) => {
    if (typeof choice === "string") return { label: choice, value: choice } as Option;
    return { label: choice[1], value: choice[0] } as Option;
  });
}

function normalized(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
}

function isOptionShape(value: unknown): value is GeneralSelectValue {
  return typeof value === "object" && value !== null && "value" in value;
}

function isOptionArray<Option>(
  value: Option | ReadonlyArray<Option>,
): value is ReadonlyArray<Option> {
  return Array.isArray(value);
}

function useControllable<Value>(
  controlled: Value | undefined,
  initial: Value,
): [Value, (value: Value) => void] {
  const [uncontrolled, setUncontrolled] = useState(controlled === undefined ? initial : controlled);
  return [controlled === undefined ? uncontrolled : controlled, setUncontrolled];
}

function svgProps(size: number) {
  return {
    "aria-hidden": true,
    fill: "currentColor",
    height: size,
    viewBox: "0 0 16 16",
    width: size,
  } as const;
}

function ChevronIcon() {
  return (
    <svg {...svgProps(12)} style={{ transform: "rotate(180deg)" }}>
      <path d="M8 5C8.21 5 8.4 5.09 8.54 5.24L12.79 9.74C13.08 10.04 13.07 10.51 12.76 10.79C12.46 11.08 11.99 11.07 11.7 10.76L8 6.84L4.29 10.76C4.01 11.07 3.54 11.08 3.24 10.79C2.93 10.51 2.92 10.04 3.2 9.74L7.45 5.24C7.6 5.09 7.79 5 8 5Z" />
    </svg>
  );
}

function CloseIcon({ size = 12 }: { size?: number }) {
  return (
    <svg {...svgProps(size)}>
      <path d="M12.72 2.22C13.01 1.93 13.49 1.93 13.78 2.22C14.07 2.51 14.07 2.99 13.78 3.28L9.06 8L13.78 12.72C14.07 13.01 14.07 13.49 13.78 13.78C13.49 14.07 13.01 14.07 12.72 13.78L8 9.06L3.28 13.78C2.99 14.07 2.51 14.07 2.22 13.78C1.93 13.49 1.93 13.01 2.22 12.72L6.94 8L2.22 3.28C1.93 2.99 1.93 2.51 2.22 2.22C2.51 1.93 2.99 1.93 3.28 2.22L8 6.94L12.72 2.22Z" />
    </svg>
  );
}

function DefaultMultiValueContainer<Option extends GeneralSelectValue>({
  children,
  innerProps,
}: SelectComponentPropsMap<Option>["MultiValueContainer"]) {
  return <span {...innerProps}>{children}</span>;
}

function DefaultMultiValueLabel<Option extends GeneralSelectValue>({
  children,
  innerProps,
}: SelectComponentPropsMap<Option>["MultiValueLabel"]) {
  return <span {...innerProps}>{children}</span>;
}

function DefaultMultiValueRemove<Option extends GeneralSelectValue>({
  children,
  innerProps,
  selectProps,
}: ReactComponentProps<
  NonNullable<SelectComponentPropsMap<Option>["MultiValue"]["components"]["Remove"]>
>) {
  const { onClick, onMouseDown, onTouchEnd, ...htmlProps } = innerProps;
  return (
    <button
      {...htmlProps}
      aria-label={t("Remove item")}
      disabled={selectProps.isDisabled}
      onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
      onMouseDown={onMouseDown as React.MouseEventHandler<HTMLButtonElement>}
      onTouchEnd={onTouchEnd as React.TouchEventHandler<HTMLButtonElement>}
      type="button"
    >
      {children ?? <CloseIcon size={8} />}
    </button>
  );
}

function DefaultMultiValue<Option extends GeneralSelectValue>(
  props: SelectComponentPropsMap<Option>["MultiValue"],
) {
  const {
    children,
    components: { Container, Label, Remove },
    data,
    innerProps,
    removeProps,
    selectProps,
  } = props;
  const size = (selectProps.size ?? "md") as FormSize;
  const multiValueStyle = consumerSlotStyle("multiValue", props);
  const multiValueLabelStyle = consumerSlotStyle("multiValueLabel", props);
  const multiValueRemoveStyles = consumerSlotStyles("multiValueRemove", props);
  const multiValueRemoveHover = asStyleState(
    multiValueRemoveStyles[":hover"] ?? multiValueRemoveStyles["&:hover"],
  );
  const multiValueRemoveStyle =
    typeof selectProps.styles?.multiValueRemove === "function"
      ? withStyleVariables(toDOMStyle(multiValueRemoveStyles), {
          "--scraps-select-multi-value-remove-hover-background-color":
            styleValue(multiValueRemoveHover, "backgroundColor") ??
            styleValue(multiValueRemoveHover, "background"),
          "--scraps-select-multi-value-remove-hover-color": styleValue(
            multiValueRemoveHover,
            "color",
          ),
        })
      : undefined;
  return (
    <Container
      data={data}
      innerProps={{
        className: cn(
          props.cx(
            {
              "multi-value": true,
              "multi-value--is-disabled": selectProps.isDisabled,
            },
            props.className,
          ),
          "flex items-center rounded border border-[var(--scraps-select-border,var(--scraps-border-primary,#dad9de))] bg-[var(--scraps-select-surface,var(--scraps-background-primary,#fff))] shadow-[0_1px_0_var(--scraps-select-border,var(--scraps-border-primary,#dad9de))]",
          multiValueClasses[size],
        ),
        ...innerProps,
        style: multiValueStyle,
      }}
      selectProps={selectProps}
    >
      <Label
        data={data}
        innerProps={{
          className: cn(
            props.cx({ "multi-value__label": true }, props.className),
            "flex items-center truncate text-[85%]",
            multiValueLabelClasses[size],
          ),
          style: multiValueLabelStyle,
        }}
        selectProps={selectProps}
      >
        {children}
      </Label>
      <Remove
        data={data}
        innerProps={{
          className: cn(
            props.cx({ "multi-value__remove": true }, props.className),
            "m-1 flex items-center",
            selectProps.isDisabled
              ? "pointer-events-none"
              : "cursor-pointer hover:bg-[var(--scraps-select-multi-value-remove-hover-background-color,var(--scraps-select-transparent-hover,#10103008))] hover:text-[var(--scraps-select-multi-value-remove-hover-color,currentColor)]",
          ),
          ...removeProps,
          style: multiValueRemoveStyle,
        }}
        selectProps={selectProps}
      />
    </Container>
  );
}

function CheckIcon({ multiple }: { multiple: boolean }) {
  return (
    <svg {...svgProps(multiple ? 12 : 14)}>
      <path d="M13.72 3.22C14.01 2.93 14.49 2.93 14.78 3.22C15.07 3.51 15.07 3.99 14.78 4.28L6.53 12.53C6.24 12.82 5.76 12.82 5.47 12.53L1.22 8.28C0.93 7.99 0.93 7.51 1.22 7.22C1.51 6.93 1.99 6.93 2.28 7.22L6 10.94L13.72 3.22Z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg {...svgProps(14)}>
      <path d="M8 1C8.41 1 8.75 1.34 8.75 1.75V7.25H14.25C14.66 7.25 15 7.59 15 8C15 8.41 14.66 8.75 14.25 8.75H8.75V14.25C8.75 14.66 8.41 15 8 15C7.59 15 7.25 14.66 7.25 14.25V8.75H1.75C1.34 8.75 1 8.41 1 8C1 7.59 1.34 7.25 1.75 7.25H7.25V1.75C7.25 1.34 7.59 1 8 1Z" />
    </svg>
  );
}

export function CheckWrap({
  children,
  isMultiple,
  isSelected,
  size = "md",
}: {
  children?: ReactNode;
  isMultiple: boolean;
  isSelected: boolean;
  size?: FormSize;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center",
        isMultiple
          ? "mt-0.5 size-[1em] rounded-[2px] border border-[var(--scraps-select-border,var(--scraps-border-primary,#dad9de))] bg-[var(--scraps-select-surface,var(--scraps-background-primary,#fff))] p-px"
          : "h-[1.4em] w-[1em]",
        isMultiple &&
          isSelected &&
          "border-[var(--scraps-select-vibrant-accent,var(--scraps-border-accent,#7553ff))] bg-[var(--scraps-select-vibrant-accent,var(--scraps-background-accent-vibrant,#7553ff))]",
        !isMultiple &&
          isSelected &&
          "text-[var(--scraps-select-content-accent,var(--scraps-content-accent,#653de9))]",
        size === "xs" && "text-xs",
      )}
    >
      {children}
    </span>
  );
}

export function SelectOption<Option extends GeneralSelectValue>(props: OptionSlotProps<Option>) {
  const {
    data,
    innerProps,
    innerRef,
    isDisabled,
    isFocused,
    isMulti,
    isSelected,
    label,
    selectProps,
  } = props;
  const internalData = data as InternalOption<Option>;
  const multiple = internalData.selectionMode ? internalData.selectionMode === "multiple" : isMulti;
  const { key, onClick, onMouseDown, onMouseMove, onMouseOver, onTouchEnd, ...htmlProps } =
    innerProps as typeof innerProps & { key?: number | string };
  const itemState = { disabled: isDisabled, isFocused, isSelected };
  const optionLeadingItems =
    typeof data.leadingItems === "function" ? data.leadingItems(itemState) : data.leadingItems;
  const optionStyles = consumerSlotStyles("option", props);
  const optionSvgStyle = asStyleState(optionStyles.svg);
  const optionStyle =
    typeof selectProps.styles?.option === "function"
      ? withStyleVariables(toDOMStyle(optionStyles), {
          "--scraps-select-option-svg-color": styleValue(optionSvgStyle, "color"),
        })
      : undefined;
  return (
    <MenuListItem
      key={key}
      {...htmlProps}
      aria-checked={isSelected}
      aria-disabled={isDisabled || undefined}
      as="div"
      className={cn(
        props.cx(
          {
            option: true,
            "option--is-disabled": isDisabled,
            "option--is-focused": isFocused,
            "option--is-selected": isSelected,
          },
          props.className,
        ),
        "[&_svg]:text-[var(--scraps-select-option-svg-color,currentColor)]",
        selectProps.showDividers &&
          "border-b border-[var(--scraps-select-border,var(--scraps-border-primary,#dad9de))]",
      )}
      details={data.details}
      disabled={isDisabled}
      isFocused={isFocused}
      isSelected={isSelected}
      label={label}
      labelProps={{ as: typeof label === "string" ? "p" : "div" }}
      leadingItems={
        <>
          {internalData.__isNew__ ? (
            <PlusIcon />
          ) : (
            <CheckWrap isMultiple={multiple} isSelected={isSelected} size={selectProps.size}>
              {isSelected ? <CheckIcon multiple={multiple} /> : null}
            </CheckWrap>
          )}
          {optionLeadingItems}
        </>
      }
      onClick={onClick as unknown as React.MouseEventHandler<HTMLLIElement>}
      onMouseDown={onMouseDown as React.MouseEventHandler<HTMLLIElement>}
      onMouseMove={onMouseMove as unknown as React.MouseEventHandler<HTMLLIElement>}
      onMouseOver={onMouseOver as unknown as React.MouseEventHandler<HTMLLIElement>}
      onTouchEnd={onTouchEnd as React.TouchEventHandler<HTMLLIElement>}
      priority={data.priority}
      ref={innerRef as Ref<HTMLLIElement>}
      role={multiple ? "menuitemcheckbox" : "menuitemradio"}
      showDetailsInOverlay={data.showDetailsInOverlay}
      size={selectProps.size}
      style={optionStyle}
      tooltip={data.tooltip}
      tooltipOptions={data.tooltipOptions}
      trailingItems={data.trailingItems}
      value={String(data.value)}
    />
  );
}

function slot(
  // react-select v4 replacement components are intentionally heterogeneous.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component: ComponentType<any> | null | undefined,
  props: Record<string, unknown>,
  fallback: ReactNode,
  _styleName?: keyof StylesConfig,
) {
  void _styleName;
  if (Component === null) return null;
  if (!Component) return fallback;
  const descriptor = Component as unknown as {
    $$typeof?: symbol;
    type?: { $$typeof?: symbol };
  };
  const isForwardRef =
    descriptor.$$typeof === Symbol.for("react.forward_ref") ||
    descriptor.type?.$$typeof === Symbol.for("react.forward_ref");
  const replacementProps =
    isForwardRef && "innerRef" in props ? { ...props, ref: props.innerRef } : props;
  return createElement(Component, replacementProps);
}

function rawValue<Option extends GeneralSelectValue>(value: unknown) {
  return isOptionShape(value) ? (value.value as Option["value"]) : (value as Option["value"]);
}

function mapValue<Option extends GeneralSelectValue>(
  value: unknown,
  allOptions: Option[],
  multiple: boolean,
  compare: (a: Option["value"], b: Option["value"]) => boolean,
  hasCustomComparator: boolean,
  optionIdentity: (option: Option) => string,
) {
  const values = multiple ? (Array.isArray(value) ? value : []) : [value];
  const matches = values.map(
    (candidate) =>
      allOptions.find((option) =>
        isOptionShape(candidate)
          ? optionIdentity(option) === optionIdentity(candidate as Option)
          : compare(option.value, rawValue<Option>(candidate)),
      ) ?? (isOptionShape(candidate) ? (candidate as Option) : undefined),
  );
  if (multiple) return matches.filter((option): option is Option => option !== undefined);
  if (matches[0]) return [matches[0]];
  if (!hasCustomComparator && isOptionShape(value)) return [value as Option];
  return [];
}

function hiddenInputs<Option extends GeneralSelectValue>({
  delimiter,
  disabled,
  form,
  name,
  selected,
  valueFor,
}: {
  delimiter?: string;
  disabled: boolean;
  form?: string;
  name?: string;
  selected: Option[];
  valueFor: (option: Option) => string;
}) {
  if (!name || disabled) return null;
  if (delimiter !== undefined) {
    return (
      <input
        disabled={disabled}
        form={form}
        name={name}
        type="hidden"
        value={selected.map(valueFor).join(delimiter)}
      />
    );
  }
  if (selected.length === 0) return <input form={form} name={name} type="hidden" value="" />;
  return selected.map((option, index) => (
    <input
      form={form}
      key={`${valueFor(option)}-${index}`}
      name={name}
      type="hidden"
      value={valueFor(option)}
    />
  ));
}

function makeActionMeta<Option extends GeneralSelectValue>({
  action,
  isMulti,
  name,
  option,
  selected,
}: {
  action: SelectAction;
  isMulti: boolean;
  name?: string;
  option?: Option;
  selected: Option[];
}): SelectActionMeta<Option> {
  switch (action) {
    case "select-option":
      return { action, name, option: isMulti ? option : undefined };
    case "deselect-option":
      return { action, name, option };
    case "remove-value":
    case "pop-value":
      return { action, name, removedValue: option as Option };
    case "clear":
      return { action, name, removedValues: selected };
    case "create-option":
      return { action, name, option } as SelectActionMeta<Option>;
  }
}

export function Select<Option extends GeneralSelectValue = GeneralSelectValue>(
  selectProps: ControlProps<Option>,
) {
  "use no memo";
  const { ref: controllerRef, ...props } = selectProps;
  const generatedInstanceId = useId().replaceAll(":", "");
  const instanceId = `react-select-${String(props.instanceId || generatedInstanceId)}`;
  const inputId = props.inputId ?? `${instanceId}-input`;
  const usesDarkTheme = useSyncExternalStore(
    subscribeToScrapsTheme,
    getDarkScrapsThemeSnapshot,
    () => false,
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const controlRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectInstance = useMemo<SelectInstanceController>(
    () => ({
      blur: () => inputRef.current?.blur(),
      focus: () => inputRef.current?.focus(),
      get inputRef() {
        return inputRef.current;
      },
    }),
    [],
  );
  const controller = useMemo<SelectController>(
    () => ({
      blur: selectInstance.blur,
      focus: selectInstance.focus,
      select: selectInstance,
    }),
    [selectInstance],
  );
  const menuRef = useRef<HTMLDivElement>(null);
  const menuListRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef(new Map<number, HTMLElement>());
  const requestRef = useRef<object | null>(null);
  const defaultRequestRef = useRef<object | null>(null);
  const cacheRef = useRef<Record<string, ReadonlyArray<Option | SelectGroup<Option>>>>({});
  const cacheIdentityRef = useRef(props.cacheOptions);
  const touchRef = useRef({ moved: false, x: 0, y: 0 });
  const interactionRef = useRef<"keyboard" | "pointer">("keyboard");
  const scrollFocusedOptionRef = useRef(false);
  const skipInitialSearchLoadRef = useRef(
    props.async &&
      props.defaultOptions === true &&
      Boolean(props.inputValue ?? props.defaultInputValue),
  );
  const [internalValue, setInternalValue] = useState(
    props.value === undefined ? props.defaultValue : props.value,
  );
  const [inputValue, setInputValue] = useControllable(
    props.inputValue,
    props.defaultInputValue ?? "",
  );
  const [menuOpen, setMenuOpenState] = useControllable(
    props.menuIsOpen,
    props.defaultMenuIsOpen ?? false,
  );
  const menuOpenRef = useRef(menuOpen);
  const [focusedOption, setFocusedOption] = useState(-1);
  const [focusedValue, setFocusedValue] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [loadedOptions, setLoadedOptions] = useState<ReadonlyArray<Option | SelectGroup<Option>>>(
    [],
  );
  const [defaultAsyncOptions, setDefaultAsyncOptions] = useState<
    ReadonlyArray<Option | SelectGroup<Option>>
  >(Array.isArray(props.defaultOptions) ? props.defaultOptions : []);
  const [asyncInput, setAsyncInput] = useState("");
  const [asyncLoading, setAsyncLoading] = useState(props.async && props.defaultOptions === true);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>();
  const [calculatedMenuMaxHeight, setCalculatedMenuMaxHeight] = useState(
    props.maxMenuHeight ?? 300,
  );
  const [menuListElement, setMenuListElement] = useState<HTMLElement | null>(null);
  const [reportedMenuPlacement, setReportedMenuPlacement] = useState<"bottom" | "top" | null>(null);

  const multiple = props.multiple === true || props.isMulti === true || props.multi === true;
  const clearable = props.isClearable ?? props.clearable ?? multiple;
  const disabled = props.disabled === true || props.isDisabled === true;
  const searchable =
    props.isSearchable === undefined && props.searchable === undefined
      ? true
      : props.isSearchable === true || props.searchable === true;
  const size = props.size ?? "md";
  const isLoading = props.isLoading === true || asyncLoading;
  const asyncEnabled = props.async;
  const asyncDefaultOptions = props.defaultOptions;
  const blurInputOnSelect = props.blurInputOnSelect;
  const cacheOptions = props.cacheOptions;
  const closeMenuOnSelect = props.closeMenuOnSelect;
  const controlledValue = props.value;
  const customComparator = props.isValueEqual;
  const filterOption = props.filterOption;
  const formatCreateLabel = props.formatCreateLabel;
  const getNewOptionData = props.getNewOptionData;
  const getOptionLabel = props.getOptionLabel;
  const getOptionValue = props.getOptionValue;
  const hideSelectedOptions = props.hideSelectedOptions;
  const isOptionDisabled = props.isOptionDisabled;
  const isOptionSelected = props.isOptionSelected;
  const isValidNewOption = props.isValidNewOption;
  const loadOptions = props.loadOptions;
  const onChange = props.onChange;
  const onClear = props.onClear;
  const onCreateOption = props.onCreateOption;
  const onInputChange = props.onInputChange;
  const onMenuClose = props.onMenuClose;
  const onMenuOpen = props.onMenuOpen;
  const onMenuScrollToBottom = props.onMenuScrollToBottom;
  const onMenuScrollToTop = props.onMenuScrollToTop;
  const optionCache = props.cache;
  useBodyScrollLock(menuOpen && props.menuShouldBlockScroll === true, menuListElement, true);
  const ariaLiveMessages = props.ariaLiveMessages;

  const choiceList = convertedChoices<Option>(
    typeof props.choices === "function" ? props.choices(props) : props.choices,
  );
  const staticOptions = choiceList ?? props.options;
  const blankAsyncOptions = useMemo(
    () =>
      Array.isArray(asyncDefaultOptions)
        ? asyncDefaultOptions
        : asyncDefaultOptions === true
          ? defaultAsyncOptions
          : [],
    [asyncDefaultOptions, defaultAsyncOptions],
  );
  const displayedOptions = useMemo<ReadonlyArray<Option | SelectGroup<Option>>>(
    () =>
      asyncEnabled
        ? inputValue && asyncInput === inputValue
          ? loadedOptions
          : blankAsyncOptions
        : (staticOptions ?? []),
    [asyncEnabled, asyncInput, blankAsyncOptions, inputValue, loadedOptions, staticOptions],
  );
  const allOptions = useMemo(
    () => flatten<Option>(staticOptions ?? displayedOptions),
    [staticOptions, displayedOptions],
  );
  const compare = useCallback(
    (left: Option["value"], right: Option["value"]) =>
      customComparator ? customComparator(left, right) : left === right,
    [customComparator],
  );
  const valueFor = useCallback(
    (option: Option) => getOptionValue?.(option) ?? String(option.value),
    [getOptionValue],
  );
  const sameOption = useCallback(
    (left: Option, right: Option) =>
      customComparator ? compare(left.value, right.value) : valueFor(left) === valueFor(right),
    [compare, customComparator, valueFor],
  );
  const selected = useMemo(
    () =>
      mapValue(
        controlledValue === undefined ? internalValue : controlledValue,
        allOptions,
        multiple,
        compare,
        Boolean(customComparator),
        valueFor,
      ),
    [allOptions, compare, controlledValue, customComparator, internalValue, multiple, valueFor],
  );
  const renderedLabelFor = useCallback(
    (option: Option): ReactNode => (option.label === undefined ? valueFor(option) : option.label),
    [valueFor],
  );
  const labelFor = useCallback(
    (option: Option) => {
      if (option.textValue !== undefined) return option.textValue;
      const customLabel = getOptionLabel?.(option);
      if (typeof customLabel === "string" || typeof customLabel === "number") {
        return String(customLabel);
      }
      if (typeof option.label === "string" || typeof option.label === "number") {
        return String(option.label);
      }
      return valueFor(option);
    },
    [getOptionLabel, valueFor],
  );
  const selectedOption = useCallback(
    (option: Option) =>
      isOptionSelected?.(option, selected) ?? selected.some((item) => sameOption(item, option)),
    [isOptionSelected, sameOption, selected],
  );
  const disabledOption = useCallback(
    (option: Option) =>
      Boolean(isOptionDisabled ? isOptionDisabled(option, selected) : option.disabled),
    [isOptionDisabled, selected],
  );

  const filteredGroups = useMemo<ReadonlyArray<Option | SelectGroup<Option>>>(() => {
    const include = (option: Option) => {
      if (hideSelectedOptions && selectedOption(option)) return false;
      const candidate = { data: option, label: labelFor(option), value: valueFor(option) };
      if (filterOption === null) return true;
      if (filterOption) return filterOption(candidate, inputValue);
      const source = option.textValue ?? `${candidate.label} ${candidate.value}`;
      return normalized(source).includes(normalized(inputValue));
    };
    return displayedOptions.flatMap((entry): Array<Option | SelectGroup<Option>> => {
      if (!isGroup<Option>(entry)) return include(entry) ? [entry] : [];
      const options = entry.options.filter(include);
      return options.length ? [{ ...entry, options }] : [];
    });
  }, [
    displayedOptions,
    filterOption,
    hideSelectedOptions,
    inputValue,
    labelFor,
    selectedOption,
    valueFor,
  ]);
  const filtered = useMemo(() => flatten<Option>(filteredGroups), [filteredGroups]);

  const changeInput = useCallback(
    (next: string, action: InputAction) => {
      const returned = onInputChange?.(next, { action });
      const resolved = typeof returned === "string" ? returned : next;
      setInputValue(resolved);
      if (asyncEnabled && !resolved) {
        requestRef.current = null;
        setAsyncInput("");
        setLoadedOptions([]);
        setAsyncLoading(false);
      }
      return resolved;
    },
    [asyncEnabled, onInputChange, setAsyncInput, setAsyncLoading, setInputValue, setLoadedOptions],
  );

  const setMenuOpen = useCallback(
    (next: boolean, force = false) => {
      if (menuOpen === next && !force) return;
      setMenuOpenState(next);
      if (next) onMenuOpen?.();
      else {
        changeInput("", "menu-close");
        onMenuClose?.();
        setFocusedOption(-1);
        setReportedMenuPlacement(null);
      }
    },
    [changeInput, menuOpen, onMenuClose, onMenuOpen, setFocusedOption, setMenuOpenState],
  );

  const prepareSelection = useCallback(() => {
    changeInput("", "set-value");
    if (closeMenuOnSelect ?? !multiple) setMenuOpen(false);
    setFocusedValue(-1);
  }, [changeInput, closeMenuOnSelect, multiple, setMenuOpen]);

  const publish = useCallback(
    (next: Option[], action: SelectAction, option?: Option) => {
      setInternalValue(multiple ? next : (next[0] ?? null));
      const actionMeta = makeActionMeta({
        action,
        isMulti: multiple,
        name: props.name,
        option,
        selected,
      });
      if (action === "select-option" || action === "create-option") {
        prepareSelection();
      } else {
        setFocusedValue(-1);
      }
      if (multiple) {
        (onChange as ((options: Option[], meta: SelectActionMeta<Option>) => void) | undefined)?.(
          next,
          actionMeta,
        );
      } else {
        (
          onChange as ((option: Option | null, meta: SelectActionMeta<Option>) => void) | undefined
        )?.(next[0] ?? null, actionMeta);
      }
      if (
        (action === "select-option" || action === "create-option") &&
        (blurInputOnSelect ?? !multiple)
      ) {
        inputRef.current?.blur();
      }
      if (action === "clear") onClear?.();
      const announcedLabel = option ? labelFor(option) : "";
      const customAnnouncement = ariaLiveMessages?.onChange?.({
        ...actionMeta,
        isDisabled: option ? disabledOption(option) : undefined,
        label: announcedLabel,
        selectValue: next,
        value: multiple ? next : (next[0] ?? null),
      });
      if (customAnnouncement !== undefined) {
        setAnnouncement(customAnnouncement);
      } else if (action === "select-option") {
        setAnnouncement(t("option %s, selected.", announcedLabel));
      } else if (
        action === "deselect-option" ||
        action === "pop-value" ||
        action === "remove-value"
      ) {
        setAnnouncement(t("option %s, deselected.", announcedLabel));
      } else {
        setAnnouncement("");
      }
      return option;
    },
    [
      ariaLiveMessages,
      blurInputOnSelect,
      disabledOption,
      labelFor,
      multiple,
      onChange,
      onClear,
      prepareSelection,
      props.name,
      selected,
    ],
  );

  const choose = useCallback(
    (option: Option) => {
      if (disabledOption(option)) {
        setAnnouncement(
          ariaLiveMessages?.onChange?.({
            ...makeActionMeta({
              action: "select-option",
              isMulti: multiple,
              name: props.name,
              option,
              selected,
            }),
            isDisabled: true,
            label: labelFor(option),
            selectValue: selected,
            value: option,
          }) ?? t("option %s is disabled. Select another option.", labelFor(option)),
        );
        return;
      }
      if ((option as InternalOption<Option>).__isNew__) {
        if (onCreateOption) {
          prepareSelection();
          onCreateOption(inputValue);
          setAnnouncement(
            ariaLiveMessages?.onChange?.({
              action: "create-option",
              isDisabled: false,
              label: labelFor(option),
              name: props.name,
              selectValue: selected,
              value: option,
            }) ?? "",
          );
          if (blurInputOnSelect ?? !multiple) inputRef.current?.blur();
        } else {
          const created = (getNewOptionData?.(inputValue, inputValue) ?? {
            __isNew__: true,
            label: inputValue,
            value: inputValue,
          }) as Option;
          publish([...selected, created], "create-option", created);
        }
        return;
      }
      const exists = selectedOption(option);
      if (multiple) {
        publish(
          exists ? selected.filter((item) => !sameOption(item, option)) : [...selected, option],
          exists ? "deselect-option" : "select-option",
          option,
        );
      } else if (!exists) {
        publish([option], "select-option", option);
      } else if (closeMenuOnSelect ?? true) {
        setMenuOpen(false);
      }
    },
    [
      ariaLiveMessages,
      blurInputOnSelect,
      closeMenuOnSelect,
      disabledOption,
      getNewOptionData,
      inputValue,
      labelFor,
      multiple,
      onCreateOption,
      prepareSelection,
      props.name,
      publish,
      sameOption,
      selected,
      selectedOption,
      setAnnouncement,
      setMenuOpen,
    ],
  );

  const clear = useCallback(() => publish([], "clear"), [publish]);
  const remove = useCallback(
    (option: Option, action: "pop-value" | "remove-value" = "remove-value") => {
      publish(
        selected.filter((item) => !sameOption(item, option)),
        action,
        option,
      );
    },
    [publish, sameOption, selected],
  );

  useImperativeHandle(controllerRef, () => controller, [controller]);

  useEffect(() => {
    if (!props.autoFocus) return;
    inputRef.current?.focus();
  }, [props.autoFocus]);

  useEffect(() => {
    if (cacheIdentityRef.current === props.cacheOptions) return;
    cacheIdentityRef.current = props.cacheOptions;
    cacheRef.current = {};
  }, [props.cacheOptions]);

  useEffect(() => {
    menuOpenRef.current = menuOpen;
  }, [menuOpen]);

  const load = useCallback(
    (query: string, asDefault: boolean) => {
      if (!asyncEnabled || !loadOptions) return;
      const request = {};
      const activeRequestRef = asDefault ? defaultRequestRef : requestRef;
      activeRequestRef.current = request;
      const external = optionCache?.[query];
      const cached = Array.isArray(external)
        ? (external as ReadonlyArray<Option | SelectGroup<Option>>)
        : cacheRef.current[query];
      if (cacheOptions && cached) {
        if (asDefault) setDefaultAsyncOptions(cached);
        else {
          setLoadedOptions(cached);
          setAsyncInput(query);
        }
        if (query && menuOpenRef.current && flatten(cached).length) setFocusedOption(0);
        setAsyncLoading(asDefault ? Boolean(requestRef.current) : false);
        return;
      }
      setAsyncLoading(true);
      let completed = false;
      const complete = (options?: ReadonlyArray<Option | SelectGroup<Option>>) => {
        if (completed || activeRequestRef.current !== request) return;
        completed = true;
        const next = options ?? [];
        if (cacheOptions) cacheRef.current[query] = next;
        if (optionCache && cacheOptions) optionCache[query] = next;
        if (asDefault) setDefaultAsyncOptions(next);
        else {
          setLoadedOptions(next);
          setAsyncInput(query);
        }
        if (query && menuOpenRef.current && flatten(next).length) setFocusedOption(0);
        setAsyncLoading(asDefault ? Boolean(requestRef.current) : false);
        activeRequestRef.current = null;
      };
      const promise = loadOptions(query, complete);
      if (promise && typeof promise.then === "function")
        void promise.then(complete, () => complete());
    },
    [
      asyncEnabled,
      cacheOptions,
      loadOptions,
      optionCache,
      setAsyncInput,
      setAsyncLoading,
      setDefaultAsyncOptions,
      setLoadedOptions,
    ],
  );

  useEffect(() => {
    if (asyncEnabled && asyncDefaultOptions === true) load(inputValue, true);
    // Async v4 loads default options only on the first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!asyncEnabled) return;
    if (!inputValue) return;
    if (skipInitialSearchLoadRef.current) {
      skipInitialSearchLoadRef.current = false;
      return;
    }
    load(inputValue, false);
  }, [asyncEnabled, inputValue, load]);

  useEffect(() => {
    const outside = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (
        rootRef.current?.contains(target) ||
        controlRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      )
        return;
      const input = inputRef.current;
      if (input && document.activeElement === input) {
        input.blur();
      } else {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", outside);
    document.addEventListener("touchend", outside);
    return () => {
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("touchend", outside);
    };
  }, [setMenuOpen]);

  useEffect(() => {
    if (!menuOpen || !props.closeMenuOnScroll) return;
    const closeOnScroll = props.closeMenuOnScroll;
    const closeMenu = () => {
      setMenuOpenState(false);
      onMenuClose?.();
      setFocusedOption(-1);
    };
    const close = (event: Event) => {
      if (closeOnScroll === true) {
        if (event.target === document.body || event.target === document.documentElement)
          closeMenu();
        return;
      }
      if (closeOnScroll(event)) closeMenu();
    };
    document.addEventListener("scroll", close, true);
    return () => document.removeEventListener("scroll", close, true);
  }, [menuOpen, onMenuClose, props.closeMenuOnScroll, setMenuOpenState]);

  useEffect(() => {
    if (!menuOpen || props.menuShouldScrollIntoView === false) return;
    controlRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [menuOpen, props.menuShouldScrollIntoView]);

  useEffect(() => {
    if (focusedOption < 0) return;
    if (interactionRef.current === "pointer" && !scrollFocusedOptionRef.current) return;
    optionRefs.current.get(focusedOption)?.scrollIntoView?.({ block: "nearest" });
    scrollFocusedOptionRef.current = false;
  }, [focusedOption, menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const element = menuListElement;
    if (!element) return;
    let isBottom = false;
    let isTop = false;
    let touchStart = 0;
    const notifyTop = (event: Event) => {
      if (!isTop) onMenuScrollToTop?.(event as unknown as UIEvent<HTMLElement>);
      isTop = true;
    };
    const notifyBottom = (event: Event) => {
      if (!isBottom) onMenuScrollToBottom?.(event as unknown as UIEvent<HTMLElement>);
      isBottom = true;
    };
    const onScroll = (event: Event) => {
      const target = event.currentTarget as HTMLElement;
      if (target.scrollTop === 0) notifyTop(event);
      else isTop = false;
      if (target.scrollHeight - target.scrollTop <= target.clientHeight + 1) {
        notifyBottom(event);
      } else isBottom = false;
    };
    const captureDelta = (event: Event, delta: number) => {
      const { clientHeight, scrollHeight, scrollTop } = element;
      const availableScroll = scrollHeight - clientHeight - scrollTop;
      const positive = delta > 0;
      if (availableScroll > delta && isBottom) isBottom = false;
      if (positive && isTop) isTop = false;
      let cancel = false;
      if (positive && delta > availableScroll) {
        notifyBottom(event);
        element.scrollTop = scrollHeight;
        cancel = true;
      } else if (!positive && -delta > scrollTop) {
        notifyTop(event);
        element.scrollTop = 0;
        cancel = true;
      }
      if (cancel) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const onWheel = (event: WheelEvent) => captureDelta(event, event.deltaY);
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      if (touch) touchStart = touch.clientY;
    };
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      if (touch) captureDelta(event, touchStart - touch.clientY);
    };
    element.addEventListener("scroll", onScroll);
    const capture = props.captureMenuScroll ?? !isTouchCapable();
    if (capture) {
      element.addEventListener("wheel", onWheel, { passive: false });
      element.addEventListener("touchstart", onTouchStart, { passive: false });
      element.addEventListener("touchmove", onTouchMove, { passive: false });
    }
    return () => {
      element.removeEventListener("scroll", onScroll);
      element.removeEventListener("wheel", onWheel);
      element.removeEventListener("touchstart", onTouchStart);
      element.removeEventListener("touchmove", onTouchMove);
    };
  }, [menuListElement, menuOpen, onMenuScrollToBottom, onMenuScrollToTop, props.captureMenuScroll]);

  useEffect(() => {
    if (!menuOpen) return;
    const position = () => {
      const control = controlRef.current;
      const rect = control?.getBoundingClientRect();
      if (!control || !rect) return;
      const bounds = scrollBounds(control);
      const menuGap = 4;
      const above = Math.max(0, rect.top - bounds.top - menuGap);
      const below = Math.max(0, bounds.bottom - rect.bottom - menuGap);
      const minimum = props.minMenuHeight ?? 140;
      const placeTop = below < minimum && above > below;
      const placement = placeTop ? "top" : "bottom";
      const available = placeTop ? above : below;
      setReportedMenuPlacement(placement);
      setCalculatedMenuMaxHeight(Math.max(0, Math.min(props.maxMenuHeight ?? 300, available)));
      if (!props.menuPortalTarget && props.menuPosition !== "fixed") {
        setMenuStyle(placeTop ? { bottom: "calc(100% + 4px)" } : { top: "calc(100% + 4px)" });
        return;
      }
      const fixed = props.menuPosition === "fixed";
      const scrollX = fixed ? 0 : window.scrollX;
      const scrollY = fixed ? 0 : window.scrollY;
      setMenuStyle({
        left: rect.left + scrollX,
        position: fixed ? "fixed" : "absolute",
        top: (placeTop ? rect.top - 4 : rect.bottom + 4) + scrollY,
        transform: placeTop ? "translateY(-100%)" : undefined,
        width: rect.width,
      });
    };
    position();
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  }, [
    menuOpen,
    props.maxMenuHeight,
    props.menuPortalTarget,
    props.menuPosition,
    props.minMenuHeight,
  ]);

  const createOption = useMemo(() => {
    if (!props.creatable || (isLoading && !props.allowCreateWhileLoading)) {
      return undefined;
    }
    const selectOptions = flatten(displayedOptions);
    const isValid = isValidNewOption
      ? isValidNewOption(inputValue, selected, selectOptions, {
          getOptionLabel: labelFor,
          getOptionValue: valueFor,
        })
      : Boolean(inputValue) &&
        ![...selected, ...selectOptions].some((option) => {
          const candidate = normalized(inputValue);
          return (
            normalized(labelFor(option)) === candidate || normalized(valueFor(option)) === candidate
          );
        });
    if (!isValid) return undefined;
    const label = formatCreateLabel?.(inputValue) ?? t('Create "%s"', inputValue);
    const newOption = getNewOptionData?.(inputValue, label) ?? {
      __isNew__: true,
      label,
      value: inputValue,
    };
    return { ...newOption, __isNew__: true } as InternalOption<Option>;
  }, [
    displayedOptions,
    formatCreateLabel,
    getNewOptionData,
    inputValue,
    isLoading,
    isValidNewOption,
    labelFor,
    props.allowCreateWhileLoading,
    props.creatable,
    selected,
    valueFor,
  ]);
  const focusable = useMemo(
    () =>
      createOption
        ? props.createOptionPosition === "first"
          ? [createOption, ...filtered]
          : [...filtered, createOption]
        : filtered,
    [createOption, filtered, props.createOptionPosition],
  );

  const resolvedSelectProps = {
    ...props,
    "aria-live": props["aria-live"] ?? "polite",
    allowCreateWhileLoading: props.allowCreateWhileLoading ?? false,
    backspaceRemovesValue: props.backspaceRemovesValue ?? clearable,
    blurInputOnSelect: blurInputOnSelect ?? !multiple,
    cacheOptions: cacheOptions ?? false,
    captureMenuScroll: props.captureMenuScroll ?? !isTouchCapable(),
    closeMenuOnScroll: props.closeMenuOnScroll ?? false,
    closeMenuOnSelect: closeMenuOnSelect ?? !multiple,
    components: props.components ?? {},
    controlShouldRenderValue: props.controlShouldRenderValue ?? true,
    createOptionPosition: props.createOptionPosition ?? "last",
    defaultInputValue: props.defaultInputValue ?? "",
    defaultMenuIsOpen: props.defaultMenuIsOpen ?? false,
    defaultOptions: props.defaultOptions ?? false,
    defaultValue: props.defaultValue ?? null,
    escapeClearsValue: props.escapeClearsValue ?? false,
    formatCreateLabel: formatCreateLabel ?? ((value: string) => t('Create "%s"', value)),
    formatGroupLabel: props.formatGroupLabel ?? ((group: SelectGroup<Option>) => group.label),
    getNewOptionData:
      getNewOptionData ??
      ((value: string, label: ReactNode) => ({
        __isNew__: true,
        label,
        value,
      })),
    getOptionLabel: labelFor,
    getOptionValue: valueFor,
    hideSelectedOptions: hideSelectedOptions ?? false,
    inputValue,
    isClearable: clearable,
    isDisabled: disabled,
    isLoading,
    isMulti: multiple,
    isOptionDisabled: (option: Option, currentValue: Option[]) =>
      Boolean(isOptionDisabled ? isOptionDisabled(option, currentValue) : option.disabled),
    isOptionSelected: (option: Option, currentValue: Option[]) =>
      isOptionSelected?.(option, currentValue) ??
      currentValue.some((item) => sameOption(item, option)),
    isRtl: props.isRtl ?? false,
    isSearchable: searchable,
    isValidNewOption,
    loadingMessage: props.loadingMessage ?? (() => t("Loading…")),
    maxMenuHeight: props.maxMenuHeight ?? 300,
    menuIsOpen: menuOpen,
    menuPlacement: "auto",
    menuPosition: props.menuPosition ?? "absolute",
    menuShouldBlockScroll: props.menuShouldBlockScroll ?? false,
    menuShouldScrollIntoView: props.menuShouldScrollIntoView ?? true,
    minMenuHeight: props.minMenuHeight ?? 140,
    noOptionsMessage: props.noOptionsMessage ?? (() => t("No options")),
    onChange: (
      value: Option | ReadonlyArray<Option> | null,
      actionMeta: { action: SelectAction; option?: Option; removedValue?: Option },
    ) => {
      const next = value === null ? [] : isOptionArray(value) ? [...value] : [value];
      publish(next, actionMeta.action, actionMeta.option ?? actionMeta.removedValue);
    },
    onInputChange: (value: string, actionMeta: { action: InputAction }) =>
      changeInput(value, actionMeta.action),
    onMenuClose: () => setMenuOpen(false),
    onMenuOpen: () => setMenuOpen(true),
    openMenuOnClick: props.openMenuOnClick ?? true,
    openMenuOnFocus: props.openMenuOnFocus ?? false,
    options: displayedOptions,
    pageSize: props.pageSize ?? 5,
    placeholder: props.placeholder === undefined ? t("Select…") : props.placeholder,
    screenReaderStatus:
      props.screenReaderStatus ??
      (({ count }: { count: number }) => t("%s result%s available", count, count === 1 ? "" : "s")),
    styles: props.styles ?? {},
    tabIndex: props.tabIndex ?? "0",
    tabSelectsValue: props.tabSelectsValue ?? false,
    value: multiple ? selected : (selected[0] ?? null),
  };

  const common: CommonSlotProps<Option> = {
    clearValue: clear,
    cx: (state = {}, className, classNamePrefix = props.classNamePrefix) =>
      cn(
        className,
        classNamePrefix &&
          Object.entries(state ?? {})
            .filter(([, enabled]) => enabled)
            .map(([name]) =>
              name.startsWith("-") ? `${classNamePrefix}${name}` : `${classNamePrefix}__${name}`,
            ),
      ),
    getStyles: (name, state) => {
      if (!reactSelectStyleNames.has(name as keyof StylesConfig)) return {};
      const styleName = name as keyof StylesConfig;
      const provided = scrapsStyle(styleName, reactSelectBaseStyle(styleName, state), state, {
        inFieldLabel: props.inFieldLabel,
        isDisabled: disabled,
        isInsideModal: props.isInsideModal === true,
        isSearchable: searchable,
        maxMenuWidth: props.maxMenuWidth,
        size,
        usesDarkTheme,
      });
      const callback = props.styles?.[styleName] as
        | ((base: CSSObject, styleState: unknown) => CSSObject)
        | undefined;
      return callback ? callback(provided, state) : provided;
    },
    getValue: () => selected,
    hasValue: selected.length > 0,
    isMulti: multiple,
    isRtl: props.isRtl ?? false,
    // The pinned declaration says Option[], while v4 passes grouped props.options unchanged.
    options: displayedOptions as unknown as ReadonlyArray<Option>,
    selectOption: choose,
    selectProps: resolvedSelectProps,
    setValue: (value, action, option) => {
      const next = value === null ? [] : isOptionArray(value) ? [...value] : [value];
      publish(next, action, option);
    },
    theme: selectTheme,
  };
  /* eslint-disable react-hooks/refs -- v4 replacement props intentionally carry imperative refs and handlers during render. */
  const slotProps = <Extra extends object = Record<never, never>>(
    extra?: Extra,
  ): Omit<ReplacementProps<Option>, keyof Extra> & Extra =>
    ({
      ...common,
      innerProps: {},
      isDisabled: disabled,
      isFocused,
      isSelected: false,
      ...extra,
    }) as unknown as Omit<ReplacementProps<Option>, keyof Extra> & Extra;

  const focusOptionAt = (index: number) => {
    const option = focusable[index];
    if (!option) return;
    setFocusedOption(index);
    setAnnouncement(
      ariaLiveMessages?.onFocus?.({
        context: "menu",
        focused: option,
        isDisabled: disabledOption(option),
        isSelected: selectedOption(option),
        label: labelFor(option),
        options: focusable,
        selectValue: selected,
      }) ??
        t(
          "option %s %s, %s of %s.",
          labelFor(option),
          `${selectedOption(option) ? "selected" : "focused"}${disabledOption(option) ? " disabled" : ""}`,
          index + 1,
          focusable.length,
        ),
    );
  };

  const moveOptionFocus = (direction: 1 | -1) => {
    if (!focusable.length) return;
    const next =
      focusedOption < 0
        ? direction === 1
          ? 0
          : focusable.length - 1
        : (focusedOption + direction + focusable.length) % focusable.length;
    focusOptionAt(next);
  };

  const openMenuAtFirst = () => {
    scrollFocusedOptionRef.current = !menuOpen;
    setMenuOpen(true);
    const selectedIndex = !multiple && selected[0] ? focusable.indexOf(selected[0]) : -1;
    if (focusable.length) focusOptionAt(selectedIndex >= 0 ? selectedIndex : 0);
  };

  const keyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.target !== inputRef.current) return;
    props.onKeyDown?.(event);
    interactionRef.current = "keyboard";
    if (
      event.defaultPrevented ||
      disabled ||
      event.nativeEvent.isComposing ||
      event.keyCode === 229
    )
      return;
    const prevent = () => event.preventDefault();
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      prevent();
      if (!menuOpen) setMenuOpen(true);
      setFocusedValue(-1);
      moveOptionFocus(event.key === "ArrowDown" ? 1 : -1);
    } else if (event.key === "Home" && menuOpen) {
      prevent();
      if (focusable.length) focusOptionAt(0);
    } else if (event.key === "End" && menuOpen) {
      prevent();
      if (focusable.length) focusOptionAt(focusable.length - 1);
    } else if ((event.key === "PageDown" || event.key === "PageUp") && menuOpen) {
      prevent();
      const delta = (props.pageSize ?? 5) * (event.key === "PageDown" ? 1 : -1);
      const target = Math.max(
        0,
        Math.min((focusedOption < 0 ? 0 : focusedOption) + delta, focusable.length - 1),
      );
      focusOptionAt(target);
    } else if (event.key === "Enter") {
      if (!menuOpen || !focusable[focusedOption]) return;
      prevent();
      choose(focusable[focusedOption]);
    } else if (event.key === " " && (!searchable || !inputValue)) {
      prevent();
      if (!menuOpen) openMenuAtFirst();
      else if (focusable[focusedOption]) choose(focusable[focusedOption]);
    } else if (event.key === "Escape") {
      if (menuOpen) {
        prevent();
        setMenuOpen(false);
      } else if (props.escapeClearsValue && clearable) clear();
    } else if (event.key === "Tab") {
      if (
        event.shiftKey ||
        !menuOpen ||
        !props.tabSelectsValue ||
        !focusable[focusedOption] ||
        (props.openMenuOnFocus && selectedOption(focusable[focusedOption]))
      )
        return;
      prevent();
      choose(focusable[focusedOption]);
    } else if (
      (event.key === "ArrowLeft" || event.key === "ArrowRight") &&
      multiple &&
      !inputValue &&
      selected.length
    ) {
      prevent();
      const index =
        event.key === "ArrowLeft"
          ? focusedValue < 0
            ? selected.length - 1
            : Math.max(0, focusedValue - 1)
          : focusedValue >= 0 && focusedValue < selected.length - 1
            ? focusedValue + 1
            : -1;
      setFocusedValue(index);
      const option = selected[index];
      if (option)
        setAnnouncement(
          ariaLiveMessages?.onFocus?.({
            context: "value",
            focused: option,
            isDisabled: disabledOption(option),
            isSelected: true,
            label: labelFor(option),
            options: displayedOptions.flatMap((entry) =>
              isGroup(entry) ? entry.options : [entry],
            ),
            selectValue: selected,
          }) ?? t("value %s focused, %s of %s.", labelFor(option), index + 1, selected.length),
        );
    } else if ((event.key === "Backspace" || event.key === "Delete") && !inputValue) {
      if (focusedValue >= 0 && selected[focusedValue]) {
        prevent();
        remove(selected[focusedValue]);
      } else if ((props.backspaceRemovesValue ?? clearable) && selected.length) {
        prevent();
        if (multiple) remove(selected[selected.length - 1], "pop-value");
        else if (clearable) clear();
      }
    }
  };

  const createFirst = Boolean(createOption && props.createOptionPosition === "first");
  const optionNodes = filteredGroups.map((entry, groupIndex) => {
    const topLevelIndex = groupIndex + (createFirst ? 1 : 0);
    const renderOption = (option: Option, optionId: string) => {
      const index = focusable.indexOf(option);
      const innerRef = (node: HTMLElement | null) => {
        if (node) optionRefs.current.set(index, node);
        else optionRefs.current.delete(index);
      };
      const isSelected = selectedOption(option);
      const children =
        typeof props.formatOptionLabel === "function"
          ? props.formatOptionLabel(option, {
              context: "menu",
              inputValue,
              selectValue: selected,
            })
          : renderedLabelFor(option);
      const isDisabled = disabledOption(option);
      const onHover = isDisabled
        ? undefined
        : () => {
            interactionRef.current = "pointer";
            if (focusedOption !== index) focusOptionAt(index);
          };
      const innerProps = {
        "data-test-id": valueFor(option),
        id: `${instanceId}-option-${optionId}`,
        key: valueFor(option),
        onClick: isDisabled ? undefined : () => choose(option),
        onMouseMove: onHover,
        onMouseOver: onHover,
        onTouchEnd: isDisabled
          ? undefined
          : (event: React.TouchEvent) => {
              if (!touchRef.current.moved) {
                event.preventDefault();
                choose(option);
              }
            },
        tabIndex: -1,
      };
      const optionSlotProps = slotProps({
        children,
        data: option,
        innerProps,
        innerRef,
        isDisabled,
        isFocused: focusedOption === index,
        isSelected,
        key: valueFor(option),
        label: renderedLabelFor(option),
        type: "option" as const,
      });
      return slot(
        props.components?.Option,
        optionSlotProps,
        <SelectOption {...(optionSlotProps as OptionSlotProps<Option>)} key={valueFor(option)} />,
        "option",
      );
    };
    if (!isGroup<Option>(entry)) return renderOption(entry, String(topLevelIndex));
    const heading =
      typeof props.formatGroupLabel === "function" ? props.formatGroupLabel(entry) : entry.label;
    const groupId = `${instanceId}-group-${topLevelIndex}`;
    const headingProps = { data: entry, id: `${groupId}-heading` };
    const headingSlotProps = slotProps({ ...headingProps, children: heading });
    const headingStyles = consumerSlotStyles("groupHeading", headingSlotProps);
    const headingStyle =
      typeof props.styles?.groupHeading === "function"
        ? withStyleVariables(toDOMStyle(headingStyles, ["display"]), {
            "--scraps-select-group-heading-display": styleValue(headingStyles, "display"),
          })
        : undefined;
    const DefaultHeading = (
      headingComponentProps: SelectComponentPropsMap<Option>["GroupHeading"],
    ) => (
      <div
        className={cn(
          headingComponentProps.cx({ "group-heading": true }, headingComponentProps.className),
          "[display:var(--scraps-select-group-heading-display,block)] cursor-default px-3 py-1 text-[75%]/[1.5] font-semibold text-[var(--scraps-select-muted,var(--scraps-content-secondary,#6a6772))] uppercase empty:hidden",
        )}
        id={headingComponentProps.id}
        style={headingStyle}
      >
        {headingComponentProps.children}
      </div>
    );
    const Heading: ComponentType<SelectComponentPropsMap<Option>["GroupHeading"]> =
      props.components?.GroupHeading ?? DefaultHeading;
    const headingNode = slot(
      props.components?.GroupHeading,
      headingSlotProps,
      <DefaultHeading {...headingSlotProps} />,
      "groupHeading",
    );
    const categorizedOptions = entry.options.map((option, optionIndex) => ({
      data: option,
      index: optionIndex,
      isDisabled: disabledOption(option),
      isSelected: selectedOption(option),
      label: labelFor(option),
      type: "option" as const,
      value: valueFor(option),
    }));
    const children = (
      <>
        {entry.options.map((option, optionIndex) =>
          renderOption(option, `${topLevelIndex}-${optionIndex}`),
        )}
      </>
    );
    const groupSlotProps = slotProps({
      children,
      data: entry,
      Heading,
      headingProps,
      label: heading,
      options: categorizedOptions,
    });
    const groupStyles = consumerSlotStyles("group", groupSlotProps);
    const groupStyle =
      typeof props.styles?.group === "function"
        ? withStyleVariables(toDOMStyle(groupStyles, ["paddingBottom"]), {
            "--scraps-select-group-padding-bottom": styleValue(groupStyles, "paddingBottom", "px"),
          })
        : undefined;
    return (
      <Fragment key={groupId}>
        {slot(
          props.components?.Group,
          groupSlotProps,
          <div
            aria-labelledby={headingProps.id}
            className={cn(
              groupSlotProps.cx({ group: true }, groupSlotProps.className),
              "pt-0 pb-[var(--scraps-select-group-padding-bottom,0.5rem)] [&:last-of-type]:pb-0 [&:not(:last-of-type)]:relative [&:not(:last-of-type)]:mb-2 [&:not(:last-of-type)::after]:absolute [&:not(:last-of-type)::after]:inset-x-3 [&:not(:last-of-type)::after]:bottom-0 [&:not(:last-of-type)::after]:border-b [&:not(:last-of-type)::after]:border-[var(--scraps-select-border-secondary,var(--scraps-theme-border-secondary,#e6e6e9))] [&:not(:last-of-type)::after]:content-['']",
            )}
            role="group"
            style={groupStyle}
          >
            {headingNode}
            {children}
          </div>,
          "group",
        )}
      </Fragment>
    );
  });
  if (createOption) {
    const index = focusable.indexOf(createOption);
    const innerRef = (node: HTMLElement | null) => {
      if (node) optionRefs.current.set(index, node);
      else optionRefs.current.delete(index);
    };
    const createInnerProps = {
      "data-test-id": "create-option",
      id: `${instanceId}-option-${createFirst ? 0 : filteredGroups.length}`,
      key: "create-option",
      onClick: () => choose(createOption),
      onMouseDown: (event: React.MouseEvent) => event.preventDefault(),
      onMouseMove: () => {
        interactionRef.current = "pointer";
        if (focusedOption !== index) focusOptionAt(index);
      },
      onMouseOver: () => {
        interactionRef.current = "pointer";
        if (focusedOption !== index) focusOptionAt(index);
      },
      tabIndex: -1,
    };
    const createOptionSlotProps = slotProps({
      children: createOption.label as ReactNode,
      data: createOption,
      innerProps: createInnerProps,
      innerRef,
      isFocused: focusedOption === index,
      key: "create-option",
      label: renderedLabelFor(createOption),
      type: "option" as const,
    });
    const createNode = slot(
      props.components?.Option,
      createOptionSlotProps,
      <SelectOption {...(createOptionSlotProps as OptionSlotProps<Option>)} key="create-option" />,
      "option",
    );
    if (props.createOptionPosition === "first") optionNodes.unshift(createNode);
    else optionNodes.push(createNode);
  }

  const messageCallback = isLoading ? props.loadingMessage : props.noOptionsMessage;
  const message =
    typeof messageCallback === "function"
      ? messageCallback({ inputValue })
      : isLoading
        ? t("Loading…")
        : t("No options");
  const messageSlotProps = slotProps({ children: message, inputValue, isLoading });
  const emptyNode =
    message === null
      ? null
      : slot(
          isLoading ? props.components?.LoadingMessage : props.components?.NoOptionsMessage,
          messageSlotProps,
          <div
            className={cn(
              messageSlotProps.cx(
                isLoading
                  ? { "menu-notice": true, "menu-notice--loading": true }
                  : { "menu-notice": true, "menu-notice--no-options": true },
                messageSlotProps.className,
              ),
              "px-3 py-2 text-center text-sm",
              isLoading
                ? "text-[hsl(0_0%_60%)]"
                : "text-[var(--scraps-select-disabled,var(--scraps-content-disabled,#878490))]",
            )}
            style={consumerSlotStyle(
              isLoading ? "loadingMessage" : "noOptionsMessage",
              messageSlotProps,
            )}
          >
            {message}
          </div>,
          isLoading ? "loadingMessage" : "noOptionsMessage",
        );
  const calculatedPlacement = menuStyle?.bottom ? ("top" as const) : ("bottom" as const);
  const placement = reportedMenuPlacement ?? calculatedPlacement;
  const maxHeight = calculatedMenuMaxHeight;
  const getPortalPlacement = useCallback(
    (state: { maxHeight: number; placement: "bottom" | "top" | null }) => {
      if (state.placement) setReportedMenuPlacement(state.placement);
      setCalculatedMenuMaxHeight(state.maxHeight);
    },
    [],
  );
  const usesPortalPosition = Boolean(props.menuPortalTarget || props.menuPosition === "fixed");
  const portalPosition = props.menuPosition ?? "absolute";
  const controlRect = usesPortalPosition ? controlRef.current?.getBoundingClientRect() : undefined;
  const portalStyleState = controlRect
    ? {
        offset: controlRect[placement] + (portalPosition === "fixed" ? 0 : window.pageYOffset),
        position: portalPosition,
        rect: {
          bottom: controlRect.bottom,
          height: controlRect.height,
          left: controlRect.left,
          right: controlRect.right,
          top: controlRect.top,
          width: controlRect.width,
        },
      }
    : undefined;
  const positionedMenuStyle: CSSProperties | undefined = usesPortalPosition
    ? {
        bottom: placement === "top" ? "100%" : undefined,
        left: 0,
        position: "absolute",
        top: placement === "bottom" ? "100%" : undefined,
        width: "100%",
      }
    : menuStyle;
  const assignMenuListRef = useCallback((node: HTMLElement | null) => {
    menuListRef.current = node as HTMLDivElement | null;
    setMenuListElement(node);
  }, []);
  const menuListSlotProps = slotProps({
    children: optionNodes.length ? optionNodes : emptyNode,
    focusedOption: focusable[focusedOption],
    innerRef: assignMenuListRef,
    isLoading,
    maxHeight,
  });
  const menuList = slot(
    props.components?.MenuList,
    menuListSlotProps,
    <div
      className={cn(
        menuListSlotProps.cx(
          { "menu-list": true, "menu-list--is-multi": multiple },
          menuListSlotProps.className,
        ),
        "max-h-[var(--scraps-select-menu-max-height,300px)] overflow-y-auto py-1",
      )}
      ref={assignMenuListRef}
      role="menu"
      style={{ ...consumerSlotStyle("menuList", menuListSlotProps), maxHeight }}
    >
      {optionNodes.length ? optionNodes : emptyNode}
    </div>,
    "menuList",
  );
  const menuInnerProps = {
    onMouseDown: (event: React.MouseEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      inputRef.current?.focus();
    },
    onMouseMove: () => {},
  };
  const menuSlotProps = slotProps({
    children: menuList,
    getPortalPlacement,
    innerProps: menuInnerProps,
    innerRef: menuRef,
    isLoading,
    maxHeight,
    maxMenuHeight: maxHeight,
    menuPlacement: "auto" as const,
    menuPosition: props.menuPosition ?? "absolute",
    minMenuHeight: props.minMenuHeight ?? 140,
    menuShouldScrollIntoView: props.menuShouldScrollIntoView ?? true,
    placement,
  });
  const menu =
    menuOpen && (optionNodes.length > 0 || message !== null)
      ? slot(
          props.components?.Menu,
          menuSlotProps,
          <div
            {...menuInnerProps}
            className={cn(
              menuSlotProps.cx({ menu: true }, menuSlotProps.className),
              "z-50 my-2 min-w-full rounded-md border border-[var(--scraps-select-border,var(--scraps-border-primary,#dad9de))] bg-[var(--scraps-select-surface,var(--scraps-background-primary,#fff))]",
              usesPortalPosition ? "pointer-events-auto" : "absolute",
            )}
            ref={menuRef}
            style={{
              ...consumerSlotStyle("menu", menuSlotProps),
              ...positionedMenuStyle,
              maxWidth: props.maxMenuWidth,
              zIndex: props.isInsideModal ? 10_001 : 1_001,
            }}
          >
            {menuList}
          </div>,
          "menu",
        )
      : null;
  const portalSlotProps = slotProps({
    appendTo: props.menuPortalTarget as HTMLElement,
    children: menu,
    controlElement: controlRef.current as HTMLElement,
    menuPlacement: "auto" as const,
    menuPosition: portalPosition,
  });
  const defaultPortalStyle = portalStyleState
    ? toDOMStyle(common.getStyles("menuPortal", portalStyleState))
    : undefined;
  const defaultPortalContents =
    menu && portalStyleState ? (
      <div
        className={portalSlotProps.cx({ "menu-portal": true }, portalSlotProps.className)}
        style={defaultPortalStyle}
      >
        {menu}
      </div>
    ) : null;
  const portalContents =
    menu && usesPortalPosition
      ? props.components?.MenuPortal === undefined
        ? defaultPortalContents
        : slot(props.components.MenuPortal, portalSlotProps, defaultPortalContents)
      : menu;
  const portalMenu =
    props.menuPortalTarget && portalContents
      ? createPortal(portalContents, props.menuPortalTarget)
      : portalContents;
  const singleValueLabel = selected[0]
    ? typeof props.formatOptionLabel === "function"
      ? props.formatOptionLabel(selected[0], {
          context: "value",
          inputValue,
          selectValue: selected,
        })
      : renderedLabelFor(selected[0])
    : null;

  const renderedValues =
    props.controlShouldRenderValue === false
      ? null
      : multiple
        ? selected.map((option, index) => {
            const label =
              typeof props.formatOptionLabel === "function"
                ? props.formatOptionLabel(option, {
                    context: "value",
                    inputValue,
                    selectValue: selected,
                  })
                : renderedLabelFor(option);
            const removeProps = {
              onClick: () => {
                if (!disabled) remove(option);
              },
              onMouseDown: (event: React.MouseEvent) => {
                event.preventDefault();
                event.stopPropagation();
              },
              onTouchEnd: (event: React.TouchEvent) => {
                event.preventDefault();
                event.stopPropagation();
                if (!disabled) remove(option);
              },
            };
            const multiValueComponents = {
              Container: props.components?.MultiValueContainer ?? DefaultMultiValueContainer,
              Label: props.components?.MultiValueLabel ?? DefaultMultiValueLabel,
              Remove: (props.components?.MultiValueRemove ??
                DefaultMultiValueRemove) as NonNullable<
                SelectComponentPropsMap<Option>["MultiValue"]["components"]["Remove"]
              >,
            };
            const multiValueSlotProps = slotProps({
              children: label,
              components: multiValueComponents,
              cropWithEllipsis: true,
              data: option,
              innerProps: {},
              isFocused: focusedValue === index,
              removeProps,
            });
            return (
              <Fragment key={`${valueFor(option)}-${index}`}>
                {slot(
                  props.components?.MultiValue,
                  multiValueSlotProps,
                  <DefaultMultiValue
                    {...(multiValueSlotProps as SelectComponentPropsMap<Option>["MultiValue"])}
                  />,
                  "multiValue",
                )}
              </Fragment>
            );
          })
        : selected[0]
          ? (() => {
              const singleValueSlotProps = slotProps({
                children: singleValueLabel,
                data: selected[0],
                innerProps: {},
              });
              const singleValueStyles = consumerSlotStyles("singleValue", singleValueSlotProps);
              const singleValueBefore = beforeStyle(singleValueStyles, "single-value");
              const singleValueStyle =
                typeof props.styles?.singleValue === "function"
                  ? withStyleVariables(toDOMStyle(singleValueStyles), singleValueBefore)
                  : undefined;
              return slot(
                props.components?.SingleValue,
                singleValueSlotProps,
                <span
                  className={cn(
                    singleValueSlotProps.cx(
                      {
                        "single-value": true,
                        "single-value--is-disabled": disabled,
                      },
                      singleValueSlotProps.className,
                    ),
                    "flex min-w-0 items-center gap-2 truncate",
                  )}
                  style={singleValueStyle}
                >
                  <SelectBefore prefix="single-value" style={singleValueBefore}>
                    {beforeContent(singleValueStyles)}
                  </SelectBefore>
                  {selected[0].leadingItems as ReactNode}
                  <span className="truncate">{singleValueLabel}</span>
                </span>,
                "singleValue",
              );
            })()
          : null;

  const placeholderContent = props.placeholder === undefined ? t("Select…") : props.placeholder;
  const placeholderSlotProps = slotProps({
    children: placeholderContent,
    innerProps: { style: {} },
  });
  const placeholder =
    !selected.length && !inputValue
      ? (() => {
          const placeholderStyles = consumerSlotStyles("placeholder", placeholderSlotProps);
          const placeholderBefore = beforeStyle(placeholderStyles, "placeholder");
          const placeholderStyle =
            typeof props.styles?.placeholder === "function"
              ? withStyleVariables(toDOMStyle(placeholderStyles), placeholderBefore)
              : undefined;
          return slot(
            props.components?.Placeholder,
            placeholderSlotProps,
            <span
              className={cn(
                placeholderSlotProps.cx({ placeholder: true }, placeholderSlotProps.className),
                "pointer-events-none flex items-center",
                disabled
                  ? "text-[var(--scraps-select-disabled,var(--scraps-content-disabled,#878490))]"
                  : "text-[var(--scraps-select-muted,var(--scraps-content-secondary,#6a6772))]",
              )}
              style={placeholderStyle}
            >
              <SelectBefore prefix="placeholder" style={placeholderBefore}>
                {beforeContent(placeholderStyles)}
              </SelectBefore>
              {placeholderContent}
            </span>,
            "placeholder",
          );
        })()
      : null;
  const assignInputRef = (node: HTMLInputElement | null) => {
    inputRef.current = node;
    const cleanup = setRef(props.inputRef, node);
    if (!node || typeof cleanup !== "function") return cleanup;
    return () => {
      cleanup();
      if (inputRef.current === node) inputRef.current = null;
    };
  };
  const handleInputBlur = (event: FocusEvent<HTMLInputElement>) => {
    props.onBlur?.(event);
    setIsFocused(false);
    setFocusedValue(-1);
    changeInput("", "input-blur");
    setMenuOpen(false, true);
  };
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!searchable) return;
    changeInput(event.target.value, "input-change");
    if (!menuOpen) setMenuOpen(true);
    setFocusedOption(-1);
  };
  const handleInputFocus = (event: FocusEvent<HTMLInputElement>) => {
    props.onFocus?.(event);
    setIsFocused(true);
    if (props.openMenuOnFocus) openMenuAtFirst();
  };
  const inputElementProps = {
    "aria-autocomplete": "list" as const,
    "aria-label": props["aria-label"],
    "aria-labelledby": props["aria-labelledby"],
    autoCapitalize: "none" as const,
    autoComplete: "off",
    autoCorrect: "off" as const,
    disabled,
    form: props.form,
    id: inputId,
    onBlur: handleInputBlur,
    onChange: handleInputChange,
    onFocus: handleInputFocus,
    readOnly: !searchable,
    spellCheck: false as const,
    tabIndex: typeof props.tabIndex === "string" ? Number(props.tabIndex) : (props.tabIndex ?? 0),
    value: searchable ? inputValue : "",
  };
  const nativeInputProps = {
    ...inputElementProps,
    innerRef: assignInputRef,
    inputValue,
    isHidden: false,
  };
  const inputStyleState = slotProps({ ...nativeInputProps, children: null });
  const inputStyles = consumerSlotStyles("input", inputStyleState);
  const inputBefore = beforeStyle(inputStyles, "input");
  const inputStyle =
    typeof props.styles?.input === "function"
      ? withStyleVariables(toDOMStyle(inputStyles), inputBefore)
      : undefined;
  const input = (
    <div
      className={cn("flex min-w-0 flex-1 items-center", disabled && "invisible")}
      style={inputStyle}
    >
      <SelectBefore prefix="input" style={inputBefore}>
        {beforeContent(inputStyles)}
      </SelectBefore>
      <input
        className={cn(
          inputStyleState.cx({ input: true }, inputStyleState.className),
          "w-full min-w-0 bg-transparent p-0 text-inherit outline-hidden",
          !searchable && "caret-transparent",
        )}
        {...inputElementProps}
        ref={assignInputRef}
      />
    </div>
  );
  const inputSlotProps = slotProps({ ...nativeInputProps, children: input });
  const inputNode = slot(props.components?.Input, inputSlotProps, input, "input");
  const valueContents = (
    <>
      {renderedValues}
      {placeholder}
      {inputNode}
    </>
  );
  const valueContainerSlotProps = slotProps({
    children: valueContents,
    hasValue: selected.length > 0,
    isMulti: multiple,
  });
  const valueContainer = slot(
    props.components?.ValueContainer,
    valueContainerSlotProps,
    <div
      className={cn(
        valueContainerSlotProps.cx(
          {
            "value-container": true,
            "value-container--has-value": selected.length > 0,
            "value-container--is-multi": multiple,
          },
          valueContainerSlotProps.className,
        ),
        "flex min-w-0 flex-1 flex-wrap items-center",
        valueContainerClasses[size],
        disabled ? "cursor-not-allowed" : searchable ? "cursor-default" : "cursor-pointer",
        multiple &&
          "max-h-[12em] [scrollbar-color:var(--scraps-select-graphics-accent,#b7b2ff)_var(--scraps-select-surface,var(--scraps-background-primary,#fff))] overflow-y-auto",
      )}
      style={consumerSlotStyle("valueContainer", valueContainerSlotProps)}
    >
      {valueContents}
    </div>,
    "valueContainer",
  );
  const clearIcon = slot(props.components?.CrossIcon, slotProps(), <CloseIcon size={10} />);
  const clearAndFocusInput = () => {
    clear();
    queueMicrotask(() => inputRef.current?.focus());
  };
  const clearIndicatorInnerProps = {
    onMouseDown: (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      clearAndFocusInput();
    },
    onTouchEnd: (event: React.TouchEvent) => {
      event.preventDefault();
      event.stopPropagation();
      clearAndFocusInput();
    },
  };
  const clearIndicatorSlotProps = slotProps({
    children: clearIcon,
    innerProps: clearIndicatorInnerProps,
  });
  const clearIndicator =
    clearable && selected.length && !disabled && !isLoading
      ? slot(
          props.components?.ClearIndicator,
          clearIndicatorSlotProps,
          <span
            {...clearIndicatorInnerProps}
            className={cn(
              clearIndicatorSlotProps.cx(
                { "clear-indicator": true, indicator: true },
                clearIndicatorSlotProps.className,
              ),
              "flex cursor-pointer items-center px-1 hover:text-current",
            )}
            style={consumerSlotStyle("clearIndicator", clearIndicatorSlotProps)}
          >
            <button
              aria-label={t("Clear choices")}
              className="flex size-6 cursor-pointer items-center justify-center"
              disabled={disabled}
              onClick={(event) => {
                event.stopPropagation();
                clearAndFocusInput();
              }}
              onMouseDown={(event) => event.stopPropagation()}
              onTouchEnd={(event) => event.stopPropagation()}
              type="button"
            >
              {clearIcon}
            </button>
          </span>,
          "clearIndicator",
        )
      : null;
  const loadingIndicatorSlotProps = slotProps({
    innerProps: {},
    isFocused,
    isRtl: props.isRtl ?? false,
    size: 16,
  });
  const loadingIndicator = isLoading
    ? slot(
        props.components?.LoadingIndicator,
        loadingIndicatorSlotProps,
        <span
          className={cn(
            loadingIndicatorSlotProps.cx(
              { indicator: true, "loading-indicator": true },
              loadingIndicatorSlotProps.className,
            ),
            "flex items-center px-1 hover:text-current",
            disabled ? "cursor-not-allowed" : "cursor-pointer",
          )}
          style={consumerSlotStyle("loadingIndicator", loadingIndicatorSlotProps)}
        >
          <span
            aria-hidden
            className="my-1 size-3.5 animate-[spin_550ms_linear_infinite] rounded-full border border-[#e6e9ec] border-l-[#6c5fc7] motion-reduce:animate-none dark:bg-[#272433]"
          />
        </span>,
        "loadingIndicator",
      )
    : null;
  const downChevron = slot(props.components?.DownChevron, slotProps(), <ChevronIcon />);
  const toggleDropdown = (event: React.MouseEvent | React.TouchEvent) => {
    if ("button" in event && event.type === "mousedown" && event.button !== 0) return;
    if (disabled) return;
    interactionRef.current = "pointer";
    const opensOnFocus = !isFocused && props.openMenuOnFocus;
    inputRef.current?.focus();
    if (menuOpen) setMenuOpen(false);
    else if (!opensOnFocus) openMenuAtFirst();
    event.preventDefault();
    event.stopPropagation();
  };
  const dropdownIndicatorSlotProps = slotProps({
    children: downChevron,
    innerProps: {
      onMouseDown: toggleDropdown,
      onTouchEnd: toggleDropdown,
    },
  });
  const dropdownIndicator = slot(
    props.components?.DropdownIndicator,
    dropdownIndicatorSlotProps,
    <span
      {...dropdownIndicatorSlotProps.innerProps}
      className={cn(
        dropdownIndicatorSlotProps.cx(
          { "dropdown-indicator": true, indicator: true },
          dropdownIndicatorSlotProps.className,
        ),
        "flex items-center px-1 hover:text-current",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
      )}
      style={consumerSlotStyle("dropdownIndicator", dropdownIndicatorSlotProps)}
    >
      {downChevron}
    </span>,
    "dropdownIndicator",
  );
  const indicatorSeparatorSlotProps = slotProps({ children: null });
  const indicatorSeparator = slot(
    props.components?.IndicatorSeparator,
    indicatorSeparatorSlotProps,
    null,
  );
  const indicatorChildren = (
    <>
      {clearIndicator}
      {loadingIndicator}
      {indicatorSeparator}
      {dropdownIndicator}
    </>
  );
  const indicatorsSlotProps = slotProps({ children: indicatorChildren });
  const indicators = slot(
    props.components?.IndicatorsContainer,
    indicatorsSlotProps,
    <div
      className={cn(
        indicatorsSlotProps.cx({ indicators: true }, indicatorsSlotProps.className),
        "grid shrink-0 grid-flow-col items-center",
        indicatorContainerClasses[size],
      )}
      style={consumerSlotStyle("indicatorsContainer", indicatorsSlotProps)}
    >
      {indicatorChildren}
    </div>,
    "indicatorsContainer",
  );
  const controlChildren = (
    <>
      {valueContainer}
      {indicators}
    </>
  );
  const controlMouseDown = (event: React.MouseEvent) => {
    if (event.button !== 0 || disabled) return;
    interactionRef.current = "pointer";
    if (
      event.target instanceof HTMLButtonElement ||
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    )
      return;
    event.preventDefault();
    if (!isFocused) {
      inputRef.current?.focus();
      if ((props.openMenuOnClick ?? true) && !props.openMenuOnFocus) openMenuAtFirst();
    } else if (!menuOpen) {
      if (props.openMenuOnClick ?? true) openMenuAtFirst();
    } else {
      setMenuOpen(false);
    }
  };
  const controlTouchEnd = (event: React.TouchEvent) => {
    if (touchRef.current.moved || disabled) return;
    if (
      event.target instanceof HTMLButtonElement ||
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    )
      return;
    interactionRef.current = "pointer";
    event.preventDefault();
    const opensOnFocus = !isFocused && props.openMenuOnFocus;
    inputRef.current?.focus();
    if (props.openMenuOnClick ?? true) {
      if (menuOpen) setMenuOpen(false);
      else if (!opensOnFocus) openMenuAtFirst();
    }
  };
  const controlSlotProps = slotProps({
    children: controlChildren,
    innerRef: controlRef,
    innerProps: { onMouseDown: controlMouseDown, onTouchEnd: controlTouchEnd },
    menuIsOpen: menuOpen,
  });
  const control = slot(
    props.components?.Control,
    controlSlotProps,
    <div
      className={cn(
        controlSlotProps.cx(
          {
            control: true,
            "control--is-disabled": disabled,
            "control--is-focused": isFocused,
            "control--menu-is-open": menuOpen,
          },
          controlSlotProps.className,
        ),
        "flex w-full items-center border border-[var(--scraps-select-border,var(--scraps-border-primary,#dad9de))] bg-[var(--scraps-select-background,var(--scraps-interactive-chonky-debossed-neutral-background,#10103008))] text-[var(--scraps-select-content,var(--scraps-content-primary,#302e36))] shadow-[inset_0_1px_0_var(--scraps-select-chonk,var(--scraps-interactive-chonky-debossed-neutral-chonk,#dad9de))] transition-[border-color,box-shadow] duration-[120ms] ease-[cubic-bezier(0.72,0,0.16,1)]",
        sizeClasses[size],
        isFocused &&
          "shadow-[inset_0_1px_0_var(--scraps-select-chonk,var(--scraps-interactive-chonky-debossed-neutral-chonk,#dad9de)),0_0_0_2px_var(--scraps-select-focus,var(--scraps-focus-ring,#7553ff))]",
        disabled &&
          "cursor-not-allowed bg-[var(--scraps-select-surface,var(--scraps-background-primary,#fff))] text-[var(--scraps-select-disabled,var(--scraps-content-disabled,#878490))] opacity-60",
        multiple && "max-h-[12em] overflow-hidden",
      )}
      onMouseDown={controlMouseDown}
      onTouchEnd={controlTouchEnd}
      ref={controlRef}
      style={consumerSlotStyle("control", controlSlotProps)}
    >
      {controlChildren}
    </div>,
    "control",
  );
  const resultsMessage =
    props.screenReaderStatus?.({ count: focusable.length }) ??
    t("%s result%s available", focusable.length, focusable.length === 1 ? "" : "s");
  const filterAnnouncement =
    menuOpen && focusable.length
      ? (ariaLiveMessages?.onFilter?.({ inputValue, resultsMessage }) ??
        (inputValue
          ? t("%s for search term %s.", resultsMessage, inputValue)
          : `${resultsMessage}.`))
      : "";
  const guidanceContext = focusedValue >= 0 ? "value" : menuOpen ? "menu" : "input";
  const defaultGuidance =
    guidanceContext === "value"
      ? t(
          "Use left and right to toggle between focused values, press Backspace to remove the currently focused value",
        )
      : guidanceContext === "menu"
        ? t(
            "Use Up and Down to choose options%s, press Escape to exit the menu%s.",
            focusable[focusedOption] && disabledOption(focusable[focusedOption])
              ? ""
              : ", press Enter to select the currently focused option",
            props.tabSelectsValue ? ", press Tab to select the option and exit the menu" : "",
          )
        : t(
            "%s is focused %s, press Down to open the menu, %s",
            props["aria-label"] || "Select",
            searchable ? ",type to refine list" : "",
            multiple ? " press left to focus selected values" : "",
          );
  const guidance =
    ariaLiveMessages?.guidance?.({
      "aria-label": props["aria-label"],
      context: guidanceContext,
      isDisabled: focusable[focusedOption] ? disabledOption(focusable[focusedOption]) : undefined,
      isMulti: multiple,
      isSearchable: searchable,
      tabSelectsValue: props.tabSelectsValue,
    }) ?? defaultGuidance;
  const containerInnerProps = {
    id: props.id,
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      keyDown(event as unknown as KeyboardEvent<HTMLInputElement>);
    },
    onTouchMove: (event: React.TouchEvent<HTMLElement>) => {
      const touch = event.touches[0];
      if (!touch) return;
      touchRef.current.moved =
        Math.abs(touch.clientX - touchRef.current.x) > 5 ||
        Math.abs(touch.clientY - touchRef.current.y) > 5;
    },
    onTouchStart: (event: React.TouchEvent<HTMLElement>) => {
      const touch = event.touches[0];
      if (touch) touchRef.current = { moved: false, x: touch.clientX, y: touch.clientY };
    },
  };
  const containerChildren = (
    <>
      {hiddenInputs({
        delimiter: multiple ? props.delimiter : undefined,
        disabled,
        form: props.form,
        name: props.name,
        selected,
        valueFor,
      })}
      {control}
      <span
        aria-atomic="false"
        aria-live={props["aria-live"] ?? "polite"}
        aria-relevant="additions text"
        className="sr-only"
      >
        {isFocused ? (
          <>
            <span id="aria-selection">{announcement}</span>
            <span id="aria-context">{`${filterAnnouncement} ${guidance}`}</span>
          </>
        ) : null}
      </span>
      {portalMenu}
    </>
  );
  const containerSlotProps = slotProps({
    children: containerChildren,
    className: props.className,
    innerProps: containerInnerProps,
  });
  const container = (
    <div
      {...containerInnerProps}
      className={cn(
        containerSlotProps.cx(
          { "--is-disabled": disabled, "--is-rtl": props.isRtl ?? false },
          containerSlotProps.className,
        ),
        "relative",
      )}
      dir={props.isRtl ? "rtl" : undefined}
      id={props.id}
      ref={rootRef}
      style={consumerSlotStyle("container", containerSlotProps)}
    >
      {containerChildren}
    </div>
  );
  const replacementContainer = slot(
    props.components?.SelectContainer,
    containerSlotProps,
    container,
    "container",
  );
  /* eslint-enable react-hooks/refs */
  return <>{replacementContainer}</>;
}
