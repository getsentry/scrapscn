"use client";

import { useGridList, useGridListItem } from "@react-aria/gridlist";
import type { AriaGridListOptions } from "@react-aria/gridlist";
import {
  getInteractionModality,
  useFocus,
  useFocusWithin,
  useHover,
  usePress,
} from "@react-aria/interactions";
import { useListBox, useListBoxSection, useOption } from "@react-aria/listbox";
import type { AriaListBoxOptions } from "@react-aria/listbox";
import { useSeparator } from "@react-aria/separator";
import { mergeProps, mergeRefs } from "@react-aria/utils";
import { VisuallyHidden } from "@react-aria/visually-hidden";
import type { ListState } from "@react-stately/list";
import type { CollectionChildren, Key, Node, Selection } from "@react-types/shared";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Fragment,
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";

import { t } from "../../lib/scraps-locale";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Flex, type FlexProps } from "./layout";
import { MenuListItem, type MenuListItemProps } from "./menu-list-item";
import { Text } from "./text";

export type SelectKey = string | number;
export type CompactSelectSize = "xs" | "sm" | "md";

export interface SelectOption<Value extends SelectKey> extends MenuListItemProps {
  value: Value;
  textValue?: string;
  /** @deprecated Supply another visible selection indicator when this is true. */
  hideCheck?: boolean;
}

export interface SelectSection<Value extends SelectKey> {
  options: Array<SelectOption<Value>>;
  disabled?: boolean;
  key?: SelectKey;
  label?: ReactNode;
  showToggleAllButton?: boolean;
}

export type SelectOptionOrSection<Value extends SelectKey> =
  | SelectOption<Value>
  | SelectSection<Value>;

export interface SearchMatchResult {
  score: number;
}

export interface SelectOptionWithKey<Value extends SelectKey> extends SelectOption<Value> {
  key: SelectKey;
}

export interface SelectSectionWithKey<Value extends SelectKey> extends SelectSection<Value> {
  key: SelectKey;
  options: Array<SelectOptionWithKey<Value>>;
}

export type SelectOptionOrSectionWithKey<Value extends SelectKey> =
  | SelectOptionWithKey<Value>
  | SelectSectionWithKey<Value>;

export type ListItemBase = object & { showToggleAllButton?: boolean };

export interface SearchConfig<Value extends SelectKey> {
  filter?: ((option: SelectOptionWithKey<Value>, search: string) => SearchMatchResult) | false;
  highlight?: boolean;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export interface CompactSelectOverlayState {
  isOpen: boolean;
  close: () => void;
  open: () => void;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

interface ControlContextValue {
  overlayIsOpen: boolean;
  search: string;
  searchable: boolean;
  disabled?: boolean;
  highlightSearch?: boolean;
  overlayState?: CompactSelectOverlayState;
  searchMatcher?: (option: SelectOptionWithKey<SelectKey>, search: string) => SearchMatchResult;
  size?: CompactSelectSize;
}

export const ControlContext = createContext<ControlContextValue>({
  overlayIsOpen: false,
  search: "",
  searchable: false,
});

export const SelectFilterContext = createContext(new Set<SelectKey>());

type PolymorphicProps<Element extends ElementType> = {
  as?: Element;
} & Omit<ComponentPropsWithRef<Element>, "as">;

function polymorphicClasses(defaultElement: ElementType, baseClasses: string) {
  return function Polymorphic<Element extends ElementType = typeof defaultElement>({
    as,
    className,
    ...props
  }: PolymorphicProps<Element>) {
    const Component: ElementType = as ?? defaultElement;
    return <Component className={cn(baseClasses, className)} {...props} />;
  };
}

export const ListWrap = polymorphicClasses(
  "ul",
  "m-0 min-h-0 overflow-auto py-1 outline-hidden empty:p-0",
);
export const ListLabel = polymorphicClasses(
  "p",
  "mx-3 my-1 inline-block whitespace-nowrap pr-2 text-xs font-medium uppercase text-[var(--scraps-content-secondary,#6a6772)]",
);
export const ListSeparator = polymorphicClasses(
  "div",
  "mx-3 my-1 border-t border-[var(--scraps-border-secondary,#dad9de)] first:hidden",
);
export const SectionWrap = polymorphicClasses("li", "list-none");
export const SectionHeader = polymorphicClasses(
  "div",
  "flex h-[1.5em] content-box items-center justify-between px-3 py-0.5",
);
export const SectionTitle = polymorphicClasses(
  "p",
  "m-0 inline-block whitespace-nowrap pr-8 text-xs font-medium uppercase text-[var(--scraps-content-secondary,#6a6772)]",
);
export const SectionSeparator = polymorphicClasses(
  "li",
  "mx-3 my-1 list-none border-t border-[var(--scraps-border-secondary,#dad9de)] first-of-type:hidden",
);
export const SectionGroup = polymorphicClasses("ul", "m-0 p-0");
export const SizeLimitMessage = polymorphicClasses(
  "li",
  "mx-3 mt-1 mb-1 list-none whitespace-nowrap border-t border-[var(--scraps-border-secondary,#dad9de)] px-2 pt-2 text-center text-sm text-[var(--scraps-content-secondary,#6a6772)]",
);

export function LeadWrap(props: FlexProps) {
  return (
    <Flex
      align="center"
      height="1.4em"
      justify="center"
      minWidth="1em"
      pointerEvents="none"
      {...props}
    />
  );
}

export function TriggerLabel({ className, ...props }: ComponentPropsWithRef<"span">) {
  return (
    <span
      className={cn(
        "block w-full overflow-hidden text-left text-ellipsis whitespace-nowrap",
        className,
      )}
      {...props}
    />
  );
}

export function HighlightText({ query, text }: { query: string; text: string }) {
  const trimmedQuery = query.trim();
  if (!trimmedQuery || !text) return text;
  const matchIndex = text.toLowerCase().indexOf(trimmedQuery.toLowerCase());
  if (matchIndex === -1) return text;

  return (
    <Text as="span" aria-label={text}>
      <Text as="span" aria-hidden="true">
        {text.slice(0, matchIndex)}
        <Text
          as="span"
          className="rounded-[2px] bg-[var(--scraps-background-warning-muted,#fff2b3)] px-px"
          data-test-id="sqb-highlighted-match"
          variant="warning"
        >
          {text.slice(matchIndex, matchIndex + trimmedQuery.length)}
        </Text>
        {text.slice(matchIndex + trimmedQuery.length)}
      </Text>
    </Text>
  );
}

const simpleCssIdentifier = /^-?(?!\d)\w[-\w]*$/;

function escapeCssIdentifier(value: string) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  let result = "";
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code === 0) {
      result += "\uFFFD";
    } else if (
      (index === 0 && code >= 48 && code <= 57) ||
      (index === 1 && code >= 48 && code <= 57 && value.charCodeAt(0) === 45)
    ) {
      result += `\\${code.toString(16)} `;
    } else if (
      code >= 128 ||
      code === 45 ||
      code === 95 ||
      (code >= 48 && code <= 57) ||
      (code >= 65 && code <= 90) ||
      (code >= 97 && code <= 122)
    ) {
      result += value[index];
    } else {
      result += `\\${value[index]}`;
    }
  }
  return result;
}

export function getEscapedKey(value: SelectKey) {
  const stringValue = String(value);
  return simpleCssIdentifier.test(stringValue) ? stringValue : escapeCssIdentifier(stringValue);
}

export function getItemsWithKeys<Value extends SelectKey>(
  options: Array<SelectOption<Value>>,
): Array<SelectOptionWithKey<Value>>;
export function getItemsWithKeys<Value extends SelectKey>(
  options: Array<SelectOptionOrSection<Value>>,
): Array<SelectOptionOrSectionWithKey<Value>>;
export function getItemsWithKeys<Value extends SelectKey>(
  options: Array<SelectOptionOrSection<Value>>,
): Array<SelectOptionOrSectionWithKey<Value>> {
  return options.map((item, index) => {
    if ("options" in item) {
      return {
        ...item,
        key: item.key ?? `options-${index}`,
        options: getItemsWithKeys(item.options),
      };
    }
    const runtimeKey = "key" in item ? item.key : undefined;
    const existingKey = typeof runtimeKey === "string" ? runtimeKey : undefined;
    return { ...item, key: existingKey ?? getEscapedKey(item.value) };
  });
}

export function itemIsSectionWithKey<Value extends SelectKey>(
  item: SelectOptionOrSectionWithKey<Value>,
): item is SelectSectionWithKey<Value> {
  return "options" in item;
}

export function getDisabledOptions<Value extends SelectKey>(
  items: Array<SelectOptionOrSectionWithKey<Value>>,
  isOptionDisabled?: (option: SelectOptionWithKey<Value>) => boolean,
): SelectKey[] {
  return items.reduce<SelectKey[]>((disabledKeys, item) => {
    if (itemIsSectionWithKey(item)) {
      if (item.disabled) return disabledKeys.concat(item.options.map((option) => option.key));
      return disabledKeys.concat(getDisabledOptions(item.options, isOptionDisabled));
    }
    if (isOptionDisabled?.(item) ?? item.disabled) disabledKeys.push(item.key);
    return disabledKeys;
  }, []);
}

const fzfScoreMatch = 16;
const fzfScoreGapStart = -3;
const fzfScoreGapExtension = -1;
const fzfBonusBoundary = fzfScoreMatch / 2;
const fzfBonusNonWord = fzfScoreMatch / 2;
const fzfBonusCamelNumber = fzfBonusBoundary + fzfScoreGapExtension;
const fzfBonusConsecutive = -(fzfScoreGapStart + fzfScoreGapExtension);

const enum FzfCharType {
  Lower,
  Upper,
  Number,
  NonWord,
}

function getFzfCharType(code: number) {
  if (code >= 97 && code <= 122) return FzfCharType.Lower;
  if (code >= 65 && code <= 90) return FzfCharType.Upper;
  if (code >= 48 && code <= 57) return FzfCharType.Number;
  return FzfCharType.NonWord;
}

function getFzfBonus(previous: FzfCharType, current: FzfCharType) {
  if (previous === FzfCharType.NonWord && current !== FzfCharType.NonWord) {
    return fzfBonusBoundary;
  }
  if (
    (previous === FzfCharType.Lower && current === FzfCharType.Upper) ||
    (previous !== FzfCharType.Number && current === FzfCharType.Number)
  ) {
    return fzfBonusCamelNumber;
  }
  return current === FzfCharType.NonWord ? fzfBonusNonWord : 0;
}

function lowercaseAscii(character: string) {
  const code = character.charCodeAt(0);
  return code >= 65 && code <= 90 ? String.fromCharCode(code + 32) : character;
}

function calculateFzfScore(text: string, pattern: string, start: number, end: number) {
  let patternIndex = 0;
  let score = 0;
  let inGap = false;
  let firstBonus = 0;
  let consecutive = 0;
  let previousType = start > 0 ? getFzfCharType(text.charCodeAt(start - 1)) : FzfCharType.NonWord;

  for (let index = start; index < end; index += 1) {
    const sourceCharacter = text[index] ?? "";
    const character = lowercaseAscii(sourceCharacter);
    const currentType = getFzfCharType(sourceCharacter.charCodeAt(0));
    if (character === pattern[patternIndex]) {
      score += fzfScoreMatch;
      let bonus = getFzfBonus(previousType, currentType);
      if (consecutive === 0) firstBonus = bonus;
      else {
        if (bonus === fzfBonusBoundary) firstBonus = bonus;
        bonus = Math.max(bonus, firstBonus, fzfBonusConsecutive);
      }
      score += patternIndex === 0 ? bonus * 2 : bonus;
      inGap = false;
      consecutive += 1;
      patternIndex += 1;
    } else {
      score += inGap ? fzfScoreGapExtension : fzfScoreGapStart;
      inGap = true;
      consecutive = 0;
      firstBonus = 0;
    }
    previousType = currentType;
  }
  return score;
}

function getFzfScore(text: string, pattern: string) {
  if (!pattern) return { end: 0, score: 0 };
  let patternIndex = 0;
  let start = -1;
  let end = -1;
  for (let index = 0; index < text.length; index += 1) {
    if (lowercaseAscii(text[index] ?? "") !== pattern[patternIndex]) continue;
    patternIndex += 1;
    if (start < 0) start = index;
    if (patternIndex === pattern.length) {
      end = index + 1;
      break;
    }
  }
  if (end === -1) return { end: -1, score: 0 };
  patternIndex -= 1;
  for (let index = end - 1; index >= start; index -= 1) {
    if (lowercaseAscii(text[index] ?? "") !== pattern[patternIndex]) continue;
    patternIndex -= 1;
    if (patternIndex < 0) {
      start = index;
      break;
    }
  }
  let score = calculateFzfScore(text, pattern, start, end);
  if (start === 0 && end === text.length && text.length === pattern.length) {
    score += fzfScoreMatch;
  }
  return { end, score };
}

function defaultSearchMatcher<Value extends SelectKey>(
  option: SelectOptionWithKey<Value>,
  search: string,
): SearchMatchResult {
  const text = option.textValue ?? (typeof option.label === "string" ? option.label : "");
  if (!text) return { score: 0 };
  const result = getFzfScore(text, search.toLowerCase());
  return result.end === -1 ? { score: 0 } : { score: Math.max(1, result.score) };
}

export function getSortedItems<Value extends SelectKey>(
  items: Array<SelectOptionOrSectionWithKey<Value>>,
  scores: Map<SelectKey, number>,
): Array<SelectOptionOrSectionWithKey<Value>> {
  const sortOptions = (options: Array<SelectOptionWithKey<Value>>) =>
    options.toSorted((a, b) => (scores.get(b.key) ?? 0) - (scores.get(a.key) ?? 0));
  if (items.some(itemIsSectionWithKey)) {
    return items.map((item) =>
      itemIsSectionWithKey(item) ? { ...item, options: sortOptions(item.options) } : item,
    );
  }
  const options: Array<SelectOptionWithKey<Value>> = [];
  for (const item of items) {
    if (!itemIsSectionWithKey(item)) options.push(item);
  }
  return sortOptions(options);
}

export function getHiddenOptions<Value extends SelectKey>(
  items: Array<SelectOptionOrSectionWithKey<Value>>,
  search: string,
  limit = Infinity,
  searchMatcher?: (option: SelectOptionWithKey<Value>, search: string) => SearchMatchResult,
) {
  const scores = new Map<SelectKey, number>();
  const hidden = new Set<SelectKey>();
  const matcher = searchMatcher ?? defaultSearchMatcher;
  const matchingItems = items.flatMap<SelectOptionOrSectionWithKey<Value>>((item) => {
    const options = itemIsSectionWithKey(item) ? item.options : [item];
    const matchingOptions = options.filter((option) => {
      if (!search) return true;
      const result = matcher(option, search);
      if (result.score > 0) {
        scores.set(option.key, result.score);
        return true;
      }
      hidden.add(option.key);
      return false;
    });
    if (itemIsSectionWithKey(item)) {
      return matchingOptions.length ? [{ ...item, options: matchingOptions }] : [];
    }
    return matchingOptions;
  });
  const sortedItems = scores.size ? getSortedItems(matchingItems, scores) : matchingItems;
  let visibleCount = 0;
  for (const item of sortedItems) {
    const options = itemIsSectionWithKey(item) ? item.options : [item];
    for (const option of options) {
      if (visibleCount < limit) visibleCount += 1;
      else hidden.add(option.key);
    }
  }
  return { hidden, scores };
}

export function getSelectedOptions<Value extends SelectKey>(
  items: Array<SelectOptionOrSectionWithKey<Value>>,
  selection: Selection,
): Array<SelectOption<Value>> {
  return items.reduce<Array<SelectOption<Value>>>((selected, item) => {
    if (itemIsSectionWithKey(item)) {
      return selected.concat(getSelectedOptions(item.options, selection));
    }
    if (selection === "all" || selection.has(item.key)) {
      const { key, ...option } = item;
      void key;
      selected.push(option);
    }
    return selected;
  }, []);
}

export function getSearchConfig<Value extends SelectKey>(
  search: boolean | SearchConfig<Value> | undefined,
) {
  if (!search) return undefined;
  return search === true ? {} : search;
}

const heightEstimations = {
  xs: { regular: 25, large: 42 },
  sm: { regular: 32, large: 49 },
  md: { regular: 36, large: 53 },
} satisfies Record<CompactSelectSize, { large: number; regular: number }>;

function useVirtualizedItemsWithPadding<T extends object>({
  listItems,
  virtualized = false,
  size,
  listPadding,
}: {
  listPadding: number;
  listItems: Array<Node<T>>;
  size: CompactSelectSize;
  virtualized: boolean | undefined;
}) {
  "use no memo";
  const scrollElementRef = useRef<HTMLDivElement>(null);
  // TanStack Virtual owns mutable measurement state and cannot be compiler-memoized.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: listItems.length,
    enabled: virtualized,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: (index) => {
      const item = listItems[index];
      return item?.value && "details" in item.value
        ? heightEstimations[size].large
        : heightEstimations[size].regular;
    },
  });
  if (virtualized) {
    const items = virtualizer.getVirtualItems();
    return {
      items,
      scrollElementRef,
      itemProps: (index: number) => ({
        ref: virtualizer.measureElement,
        "data-index": index,
      }),
      wrapperProps: {
        "data-is-virtualized": true,
        style: {
          height: virtualizer.getTotalSize() + listPadding * 2,
          position: "relative" as const,
          width: "100%",
        },
      },
      scrollToIndex: virtualizer.scrollToIndex,
      listWrapStyle: {
        left: 0,
        position: "absolute" as const,
        top: 0,
        transform: `translateY(${items[0]?.start ?? 0}px)`,
        width: "100%",
      },
    };
  }
  return {
    items: listItems.map((_, index) => ({ index, start: 0 })),
    scrollElementRef: undefined,
    itemProps: () => ({ ref: undefined, "data-index": undefined }),
    wrapperProps: { "data-is-virtualized": false },
    listWrapStyle: {},
    scrollToIndex: () => undefined,
  };
}

export function useVirtualizedItems<T extends object>(props: {
  listItems: Array<Node<T>>;
  size: CompactSelectSize;
  virtualized: boolean | undefined;
}) {
  return useVirtualizedItemsWithPadding({ ...props, listPadding: 4 });
}

function getVirtualItemIndex<T extends object>(items: Array<Node<T>>, focusedKey: Key) {
  return items.findIndex(
    (item) =>
      item.key === focusedKey ||
      (item.type === "section" && [...item.childNodes].some((child) => child.key === focusedKey)),
  );
}

function CheckmarkIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={cn("size-3.5 fill-current", className)} viewBox="0 0 16 16">
      <path d="M13.72 3.22C14.01 2.93 14.49 2.93 14.78 3.22C15.07 3.51 15.07 3.99 14.78 4.28L6.53 12.53C6.24 12.82 5.76 12.82 5.47 12.53L1.22 8.28C0.93 7.99 0.93 7.51 1.22 7.22C1.51 6.93 1.99 6.93 2.28 7.22L6 10.94L13.72 3.22Z" />
    </svg>
  );
}

function SelectionCheckbox({
  checked,
  disabled,
  size,
}: {
  checked: boolean;
  disabled: boolean;
  size: "xs" | "sm";
}) {
  return (
    <span
      data-slot="compact-select-selection-checkbox"
      className={cn(
        "flex shrink-0 items-center justify-center border border-[var(--checkbox-border)] text-white",
        size === "xs" ? "size-3 rounded-[2px]" : "size-4 rounded-[4px]",
        checked && "border-[var(--checkbox-checked)] bg-[var(--checkbox-checked)]",
        disabled && "opacity-60",
      )}
    >
      {checked ? <CheckmarkIcon className={size === "xs" ? "size-2.5" : "size-3"} /> : null}
    </span>
  );
}

function optionLeadingItems<T extends ListItemBase>({
  item,
  isDisabled,
  isFocused,
  isSelected,
  multiple,
  size,
}: {
  item: Node<T>;
  isDisabled: boolean;
  isFocused: boolean;
  isSelected: boolean;
  multiple: boolean;
  size: CompactSelectSize;
}) {
  const props = item.props as SelectOption<SelectKey>;
  const leading =
    typeof props.leadingItems === "function"
      ? props.leadingItems({ disabled: isDisabled, isFocused, isSelected })
      : props.leadingItems;
  if (props.hideCheck) return leading;
  return (
    <Fragment>
      <LeadWrap aria-hidden="true">
        {multiple ? (
          <SelectionCheckbox
            checked={isSelected}
            disabled={isDisabled}
            size={size === "xs" ? "xs" : "sm"}
          />
        ) : isSelected ? (
          <CheckmarkIcon className={size === "xs" ? "size-3" : undefined} />
        ) : null}
      </LeadWrap>
      {leading ? <LeadWrap aria-hidden="true">{leading}</LeadWrap> : null}
    </Fragment>
  );
}

function ListBoxOption<T extends ListItemBase>({
  item,
  listState,
  size,
  showDetails = true,
  itemRef,
  dataIndex,
  virtualized,
}: {
  item: Node<T>;
  listState: ListState<T>;
  size: CompactSelectSize;
  showDetails?: boolean;
  itemRef?: Ref<HTMLLIElement>;
  dataIndex?: number;
  virtualized?: boolean;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const { optionProps, labelProps, isSelected, isFocused, isDisabled, isPressed } = useOption(
    {
      "aria-label": item["aria-label"],
      isVirtualized: virtualized,
      key: item.key,
    },
    listState,
    ref,
  );
  const context = useContext(ControlContext);
  const option = item.props as SelectOption<SelectKey>;
  const label =
    context.highlightSearch && context.search && typeof option.label === "string" ? (
      <HighlightText query={context.search} text={option.label} />
    ) : (
      option.label
    );
  const multiple = listState.selectionManager.selectionMode === "multiple";
  return (
    <MenuListItem
      {...optionProps}
      data-index={dataIndex}
      data-test-id={String(item.key)}
      details={showDetails ? option.details : null}
      disabled={isDisabled}
      isFocused={listState.selectionManager.isFocused && isFocused}
      isPressed={isPressed}
      isSelected={isSelected}
      label={label}
      labelProps={{
        ...labelProps,
        as: typeof option.label === "string" ? "p" : "div",
      }}
      leadingItems={optionLeadingItems({
        item,
        isDisabled,
        isFocused,
        isSelected,
        multiple,
        size,
      })}
      priority={option.priority ?? (isSelected && !multiple ? "primary" : "default")}
      ref={mergeRefs(ref, itemRef)}
      showDetailsInOverlay={option.showDetailsInOverlay}
      size={size}
      tooltip={option.tooltip}
      tooltipOptions={option.tooltipOptions}
      trailingItems={option.trailingItems}
    />
  );
}

function toggleSection<T extends ListItemBase>(item: Node<T>, listState: ListState<T>) {
  const keys = Array.from(item.childNodes, (node) => node.key).filter(
    (key) => !listState.selectionManager.isDisabled(key),
  );
  const selected = new Set(listState.selectionManager.selectedKeys);
  const allSelected = keys.every((key) => listState.selectionManager.isSelected(key));
  for (const key of keys) {
    if (allSelected) selected.delete(key);
    else selected.add(key);
  }
  listState.selectionManager.setSelectedKeys(selected);
}

interface SectionToggleProps<T extends ListItemBase> {
  item: Node<T>;
  listState: ListState<T>;
  listId?: string;
}

export function SectionToggle<T extends ListItemBase>({ item, listState }: SectionToggleProps<T>) {
  const allSelected = [...item.childNodes]
    .filter((node) => !listState.selectionManager.isDisabled(node.key))
    .every((node) => listState.selectionManager.isSelected(node.key));
  const visible =
    listState.selectionManager.isFocused &&
    [...item.childNodes].some((node) => listState.selectionManager.focusedKey === node.key);
  return (
    <Button
      aria-hidden="true"
      className={cn(
        "-mr-1 ml-4 px-1 text-sm font-normal text-[var(--scraps-content-secondary,#6a6772)] opacity-0 transition-opacity duration-100 group-hover/compact-section:pointer-events-auto group-hover/compact-section:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100",
        visible && "pointer-events-auto opacity-100",
      )}
      data-key={String(item.key)}
      onClick={() => toggleSection(item, listState)}
      size="zero"
      tabIndex={-1}
      variant="transparent"
    >
      {allSelected ? t("Unselect All") : t("Select All")}
    </Button>
  );
}

function HiddenSectionToggle<T extends ListItemBase>({
  item,
  listState,
  listId = "",
}: SectionToggleProps<T>) {
  const { focusProps } = useFocus({
    onFocus: () =>
      document
        .getElementById(listId)
        ?.querySelector(`button[aria-hidden][data-key="${String(item.key)}"]`)
        ?.classList.add("focus-visible"),
    onBlur: () =>
      document
        .getElementById(listId)
        ?.querySelector(`button[aria-hidden][data-key="${String(item.key)}"]`)
        ?.classList.remove("focus-visible"),
  });
  const allSelected = [...item.childNodes]
    .filter((node) => !listState.selectionManager.isDisabled(node.key))
    .every((node) => listState.selectionManager.isSelected(node.key));
  const { pressProps } = usePress({
    onPress: () => toggleSection(item, listState),
  });
  return (
    <VisuallyHidden role="presentation">
      <button
        {...mergeProps(focusProps, pressProps)}
        aria-controls={listId}
        id={`${listId}-section-toggle-${String(item.key)}`}
      >
        {allSelected ? t("Unselect All in ") : t("Select All in ")}
        {item.textValue || item.rendered}
      </button>
    </VisuallyHidden>
  );
}

function ListBoxSection<T extends ListItemBase>({
  item,
  listState,
  hiddenOptions,
  size,
  showSectionHeaders,
  showDetails,
  itemRef,
  dataIndex,
  virtualized,
  showSeparator,
}: {
  item: Node<T>;
  listState: ListState<T>;
  hiddenOptions: Set<SelectKey>;
  size: CompactSelectSize;
  showSectionHeaders: boolean;
  showDetails: boolean;
  itemRef?: Ref<HTMLLIElement>;
  dataIndex?: number;
  virtualized?: boolean;
  showSeparator: boolean;
}) {
  const { itemProps, headingProps, groupProps } = useListBoxSection({
    heading: item.rendered,
    "aria-label": item["aria-label"],
  });
  const { separatorProps } = useSeparator({ elementType: "div" });
  const showToggle =
    listState.selectionManager.selectionMode === "multiple" && item.value?.showToggleAllButton;
  const children = [...item.childNodes].filter((child) => !hiddenOptions.has(child.key));
  return (
    <SectionWrap {...itemProps} data-index={dataIndex} ref={itemRef}>
      {showSectionHeaders ? (
        <SectionSeparator
          {...separatorProps}
          as="div"
          className={showSeparator ? "first-of-type:block" : "hidden"}
        />
      ) : null}
      {(item.rendered || showToggle) && showSectionHeaders ? (
        <SectionHeader className="group/compact-section">
          {item.rendered ? <SectionTitle {...headingProps}>{item.rendered}</SectionTitle> : null}
          {showToggle ? <SectionToggle item={item} listState={listState} /> : null}
        </SectionHeader>
      ) : null}
      <SectionGroup {...groupProps}>
        {children.map((child) => (
          <ListBoxOption
            item={child}
            key={child.key}
            listState={listState}
            showDetails={showDetails}
            size={size}
            virtualized={virtualized}
          />
        ))}
      </SectionGroup>
    </SectionWrap>
  );
}

interface ListBoxProps<T extends ListItemBase>
  extends
    Omit<HTMLAttributes<HTMLUListElement>, "autoFocus" | "children" | "onBlur" | "onFocus">,
    Omit<
      AriaListBoxOptions<T>,
      | "children"
      | "items"
      | "disabledKeys"
      | "selectedKeys"
      | "defaultSelectedKeys"
      | "onSelectionChange"
      | "isVirtualized"
    > {
  listState: ListState<T>;
  children?: CollectionChildren<T>;
  disallowTypeAhead?: AriaGridListOptions<T>["disallowTypeAhead"];
  hasSearch?: boolean;
  hiddenOptions?: Set<SelectKey>;
  keyDownHandler?: (event: React.KeyboardEvent<HTMLUListElement>) => boolean;
  label?: ReactNode;
  overlayIsOpen?: boolean;
  ref?: Ref<HTMLUListElement>;
  scrollContainerRef?: Ref<HTMLDivElement>;
  searchable?: boolean;
  showDetails?: boolean;
  showSectionHeaders?: boolean;
  size?: CompactSelectSize;
  sizeLimitMessage?: string;
  virtualized?: boolean;
  virtualizedListPadding?: number;
  UNSTABLE_focusOnEntry?: AriaGridListOptions<T>["UNSTABLE_focusOnEntry"];
}

export function ListBox<T extends ListItemBase>({
  ref,
  listState,
  autoFocus,
  size = "md",
  shouldFocusWrap = true,
  shouldFocusOnHover = true,
  shouldUseVirtualFocus,
  disallowTypeAhead,
  sizeLimitMessage,
  keyDownHandler = () => true,
  label,
  hiddenOptions = new Set<SelectKey>(),
  hasSearch,
  searchable,
  overlayIsOpen,
  showSectionHeaders = true,
  showDetails = true,
  onAction,
  escapeKeyBehavior,
  keyboardDelegate,
  layoutDelegate,
  linkBehavior,
  onBlur,
  onFocus,
  onFocusChange,
  orientation,
  selectionBehavior,
  shouldSelectOnPressUp,
  selectionMode,
  disallowEmptySelection,
  virtualized,
  virtualizedListPadding = 4,
  scrollContainerRef,
  className,
  UNSTABLE_focusOnEntry,
  ...props
}: ListBoxProps<T>) {
  const listRef = useRef<HTMLUListElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasEverOverflowed, setHasEverOverflowed] = useState(false);
  const listBoxOptions: AriaListBoxOptions<T> & {
    disallowTypeAhead?: boolean;
    scrollRef: typeof scrollRef;
    UNSTABLE_focusOnEntry?: "first" | "last";
  } = {
    ...props,
    autoFocus,
    disallowEmptySelection,
    disallowTypeAhead,
    escapeKeyBehavior,
    keyboardDelegate,
    label,
    layoutDelegate,
    linkBehavior,
    onAction,
    onBlur,
    onFocus,
    onFocusChange,
    orientation,
    isVirtualized: virtualized,
    selectionBehavior,
    scrollRef,
    selectionMode,
    shouldFocusOnHover,
    shouldFocusWrap,
    shouldSelectOnPressUp: shouldSelectOnPressUp ?? true,
    shouldUseVirtualFocus,
    UNSTABLE_focusOnEntry,
  };
  const { listBoxProps, labelProps } = useListBox(listBoxOptions, listState, listRef);
  const listItems = [...listState.collection].filter((node) =>
    node.type === "section"
      ? ![...node.childNodes].every((child) => hiddenOptions.has(child.key))
      : !hiddenOptions.has(node.key),
  );
  const virtualizer = useVirtualizedItemsWithPadding({
    listItems,
    listPadding: virtualizedListPadding,
    virtualized,
    size,
  });
  useEffect(() => {
    if (
      !virtualized ||
      listState.selectionManager.focusedKey === null ||
      getInteractionModality() === "pointer"
    ) {
      return;
    }
    const focusedIndex = getVirtualItemIndex(listItems, listState.selectionManager.focusedKey);
    if (focusedIndex !== -1) virtualizer.scrollToIndex(focusedIndex);
  }, [listItems, listState.selectionManager.focusedKey, virtualized, virtualizer]);
  const mergedProps = mergeProps(listBoxProps, props);
  return (
    <Fragment>
      {listItems.length ? <ListSeparator role="separator" /> : null}
      {listItems.length && label ? <ListLabel {...labelProps}>{label}</ListLabel> : null}
      <div
        className={cn("h-full overflow-y-auto", className)}
        ref={mergeRefs(
          (element: HTMLDivElement | null) => {
            if (
              element &&
              !hasEverOverflowed &&
              listItems.length > 0 &&
              element.scrollHeight > element.clientHeight
            ) {
              setHasEverOverflowed(true);
            }
          },
          virtualizer.scrollElementRef,
          scrollRef,
          scrollContainerRef,
        )}
        style={hasEverOverflowed ? { scrollbarGutter: "stable" } : undefined}
      >
        <div {...virtualizer.wrapperProps}>
          <ListWrap
            {...mergedProps}
            onKeyDown={(event: React.KeyboardEvent<HTMLUListElement>) => {
              if (keyDownHandler(event) && event.key !== "Escape") listBoxProps.onKeyDown?.(event);
            }}
            onMouseLeave={(event: React.MouseEvent<HTMLUListElement>) => {
              mergedProps.onMouseLeave?.(event);
              listState.selectionManager.setFocusedKey(null);
            }}
            ref={mergeRefs(listRef, ref)}
            style={{ ...mergedProps.style, ...virtualizer.listWrapStyle }}
          >
            {overlayIsOpen
              ? virtualizer.items.map((row) => {
                  const item = listItems[row.index];
                  if (!item) return null;
                  const itemProps = virtualizer.itemProps(row.index);
                  return item.type === "section" ? (
                    <ListBoxSection
                      dataIndex={itemProps["data-index"]}
                      hiddenOptions={hiddenOptions}
                      item={item}
                      itemRef={itemProps.ref}
                      key={item.key}
                      listState={listState}
                      showDetails={showDetails}
                      showSectionHeaders={showSectionHeaders}
                      showSeparator={listItems
                        .slice(0, row.index)
                        .some((candidate) => candidate.type === "section")}
                      size={size}
                      virtualized={virtualized}
                    />
                  ) : (
                    <ListBoxOption
                      dataIndex={itemProps["data-index"]}
                      item={item}
                      itemRef={itemProps.ref}
                      key={item.key}
                      listState={listState}
                      showDetails={showDetails}
                      size={size}
                      virtualized={virtualized}
                    />
                  );
                })
              : null}
            {!searchable && !hasSearch && hiddenOptions.size ? (
              <SizeLimitMessage>
                {sizeLimitMessage ?? t("Use search to find more options…")}
              </SizeLimitMessage>
            ) : null}
          </ListWrap>
        </div>
      </div>
    </Fragment>
  );
}

function GridListOption<T extends ListItemBase>({
  item,
  listState,
  size,
  itemRef,
  dataIndex,
  shouldSelectOnPressUp,
  virtualized,
  ariaRowIndex,
}: {
  item: Node<T>;
  listState: ListState<T>;
  size: CompactSelectSize;
  itemRef?: Ref<HTMLLIElement>;
  dataIndex?: number;
  shouldSelectOnPressUp?: boolean;
  virtualized?: boolean;
  ariaRowIndex?: number;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const { rowProps, gridCellProps, isSelected, isDisabled, isPressed, isFocused } = useGridListItem(
    {
      isVirtualized: virtualized,
      node: item,
      shouldSelectOnPressUp: shouldSelectOnPressUp ?? true,
    },
    listState,
    ref,
  );
  const { search, highlightSearch } = useContext(ControlContext);
  const option = item.props as SelectOption<SelectKey>;
  const label =
    highlightSearch && search && typeof option.label === "string" ? (
      <HighlightText query={search} text={option.label} />
    ) : (
      option.label
    );
  const { hoverProps } = useHover({
    onHoverStart: () => ref.current?.focus({ preventScroll: true }),
  });
  const [focusWithin, setFocusWithin] = useState(false);
  const { focusWithinProps } = useFocusWithin({
    onFocusWithinChange: setFocusWithin,
  });
  const multiple = listState.selectionManager.selectionMode === "multiple";
  return (
    <MenuListItem
      {...mergeProps(rowProps, hoverProps, focusWithinProps)}
      aria-rowindex={virtualized ? ariaRowIndex : undefined}
      as="div"
      data-index={dataIndex}
      data-test-id={String(item.key)}
      details={option.details}
      disabled={isDisabled}
      innerWrapProps={gridCellProps}
      isFocused={focusWithin}
      isPressed={isPressed}
      isSelected={isSelected}
      label={label}
      labelProps={{ as: typeof option.label === "string" ? "p" : "div" }}
      leadingItems={optionLeadingItems({
        item,
        isDisabled,
        isFocused,
        isSelected,
        multiple,
        size,
      })}
      priority={option.priority ?? (isSelected && !multiple ? "primary" : "default")}
      ref={mergeRefs(ref, itemRef)}
      size={size}
      tooltip={option.tooltip}
      tooltipOptions={option.tooltipOptions}
      trailingItems={option.trailingItems}
    />
  );
}

function GridListSection<T extends ListItemBase>({
  item,
  listState,
  size,
  itemRef,
  dataIndex,
  shouldSelectOnPressUp,
  virtualized,
  showSeparator,
  rowIndexByKey,
}: {
  item: Node<T>;
  listState: ListState<T>;
  size: CompactSelectSize;
  itemRef?: Ref<HTMLDivElement>;
  dataIndex?: number;
  shouldSelectOnPressUp?: boolean;
  virtualized?: boolean;
  showSeparator: boolean;
  rowIndexByKey: Map<Key, number>;
}) {
  const titleId = useId();
  const hiddenOptions = useContext(SelectFilterContext);
  const { separatorProps } = useSeparator({ elementType: "div" });
  const showToggle =
    listState.selectionManager.selectionMode === "multiple" && item.value?.showToggleAllButton;
  return (
    <SectionWrap
      as="div"
      aria-label={item["aria-label"]}
      aria-labelledby={item["aria-label"] ? undefined : titleId}
      data-index={dataIndex}
      ref={itemRef}
      role="rowgroup"
    >
      <SectionSeparator
        {...separatorProps}
        as="div"
        className={showSeparator ? "first-of-type:block" : "hidden"}
      />
      {item.rendered || showToggle ? (
        <SectionHeader className="group/compact-section">
          {item.rendered ? (
            <SectionTitle aria-hidden="true" id={titleId}>
              {item.rendered}
            </SectionTitle>
          ) : null}
          {showToggle ? <SectionToggle item={item} listState={listState} /> : null}
        </SectionHeader>
      ) : null}
      <SectionGroup as="div" role="presentation">
        {[...item.childNodes]
          .filter((child) => !hiddenOptions.has(child.key))
          .map((child) => (
            <GridListOption
              ariaRowIndex={rowIndexByKey.get(child.key)}
              item={child}
              key={child.key}
              listState={listState}
              shouldSelectOnPressUp={shouldSelectOnPressUp}
              size={size}
              virtualized={virtualized}
            />
          ))}
      </SectionGroup>
    </SectionWrap>
  );
}

/* eslint-disable react-hooks/refs -- TanStack Virtual returns measured render data and a callback ref in one object. */
export function GridList<T extends ListItemBase>({
  listState,
  size = "md",
  label,
  sizeLimitMessage,
  keyDownHandler,
  virtualized,
  isVirtualized,
  items,
  selectionMode,
  disallowEmptySelection,
  disabledBehavior,
  autoFocus,
  onAction,
  shouldFocusWrap,
  disallowTypeAhead,
  escapeKeyBehavior,
  keyboardDelegate,
  keyboardNavigationBehavior,
  layoutDelegate,
  linkBehavior,
  shouldSelectOnPressUp,
  onBlur,
  onFocus,
  onFocusChange,
  UNSTABLE_focusOnEntry,
  ...props
}: Omit<HTMLAttributes<HTMLDivElement>, "children"> &
  Omit<
    AriaGridListOptions<T>,
    "disabledKeys" | "selectedKeys" | "defaultSelectedKeys" | "onSelectionChange"
  > & {
    keyDownHandler: (event: React.KeyboardEvent<HTMLElement>) => boolean;
    listState: ListState<T>;
    label?: ReactNode;
    size?: CompactSelectSize;
    sizeLimitMessage?: string;
    virtualized?: boolean;
    onFocusChange?: (isFocused: boolean) => void;
  }) {
  "use no memo";
  const ref = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const resolvedVirtualized = isVirtualized ?? virtualized;
  const { focusWithinProps } = useFocusWithin({
    onBlurWithin: (event) => onBlur?.(event as React.FocusEvent<HTMLDivElement>),
    onFocusWithin: (event) => onFocus?.(event as React.FocusEvent<HTMLDivElement>),
    onFocusWithinChange: onFocusChange,
  });
  const { gridProps } = useGridList(
    {
      ...props,
      "aria-labelledby": label ? labelId : props["aria-labelledby"],
      autoFocus,
      disabledBehavior,
      disallowEmptySelection,
      disallowTypeAhead,
      escapeKeyBehavior,
      keyboardDelegate,
      keyboardNavigationBehavior,
      layoutDelegate,
      linkBehavior,
      isVirtualized: resolvedVirtualized,
      items,
      selectionMode,
      onAction,
      shouldFocusWrap,
      shouldSelectOnPressUp,
      UNSTABLE_focusOnEntry,
    },
    listState,
    ref,
  );
  const { searchable } = useContext(ControlContext);
  const hiddenOptions = useContext(SelectFilterContext);
  const listItems = [...listState.collection].filter((node) =>
    node.type === "section"
      ? ![...node.childNodes].every((child) => hiddenOptions.has(child.key))
      : !hiddenOptions.has(node.key),
  );
  const virtualizer = useVirtualizedItemsWithPadding({
    listItems,
    listPadding: 4,
    size,
    virtualized: resolvedVirtualized,
  });
  const rowIndexByKey = new Map<Key, number>();
  for (const item of listItems) {
    if (item.type === "section") {
      for (const child of item.childNodes) {
        if (!hiddenOptions.has(child.key)) {
          rowIndexByKey.set(child.key, rowIndexByKey.size + 1);
        }
      }
    } else {
      rowIndexByKey.set(item.key, rowIndexByKey.size + 1);
    }
  }
  useEffect(() => {
    if (
      !resolvedVirtualized ||
      listState.selectionManager.focusedKey === null ||
      getInteractionModality() === "pointer"
    ) {
      return;
    }
    const focusedIndex = getVirtualItemIndex(listItems, listState.selectionManager.focusedKey);
    if (focusedIndex !== -1) virtualizer.scrollToIndex(focusedIndex);
  }, [listItems, listState.selectionManager.focusedKey, resolvedVirtualized, virtualizer]);
  const mergedProps = mergeProps(gridProps, focusWithinProps, props);
  return (
    <Fragment>
      {listItems.length ? <ListSeparator role="separator" /> : null}
      {listItems.length && label ? <ListLabel id={labelId}>{label}</ListLabel> : null}
      <div className="h-full overflow-y-auto" ref={virtualizer.scrollElementRef}>
        <div {...virtualizer.wrapperProps}>
          <ListWrap
            as="div"
            {...mergedProps}
            aria-rowcount={resolvedVirtualized ? rowIndexByKey.size : mergedProps["aria-rowcount"]}
            onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
              if (keyDownHandler(event) && event.key !== "Escape") gridProps.onKeyDown?.(event);
            }}
            ref={ref}
            style={{ ...mergedProps.style, ...virtualizer.listWrapStyle }}
          >
            {virtualizer.items.map((row) => {
              const item = listItems[row.index];
              if (!item) return null;
              const itemProps = virtualizer.itemProps(row.index);
              return item.type === "section" ? (
                <GridListSection
                  dataIndex={itemProps["data-index"]}
                  item={item}
                  itemRef={itemProps.ref}
                  key={item.key}
                  listState={listState}
                  rowIndexByKey={rowIndexByKey}
                  shouldSelectOnPressUp={shouldSelectOnPressUp}
                  showSeparator={listItems
                    .slice(0, row.index)
                    .some((candidate) => candidate.type === "section")}
                  size={size}
                  virtualized={resolvedVirtualized}
                />
              ) : (
                <GridListOption
                  ariaRowIndex={rowIndexByKey.get(item.key)}
                  dataIndex={itemProps["data-index"]}
                  item={item}
                  itemRef={itemProps.ref}
                  key={item.key}
                  listState={listState}
                  shouldSelectOnPressUp={shouldSelectOnPressUp}
                  size={size}
                  virtualized={resolvedVirtualized}
                />
              );
            })}
            {!searchable && hiddenOptions.size ? (
              <SizeLimitMessage as="div">
                {sizeLimitMessage ?? t("Use search to find more options…")}
              </SizeLimitMessage>
            ) : null}
          </ListWrap>
        </div>
      </div>
    </Fragment>
  );
}
/* eslint-enable react-hooks/refs */

export function SectionToggles<T extends ListItemBase>({
  listState,
  listId,
}: {
  listState: ListState<T>;
  listId: string;
}) {
  return [...listState.collection].map((item) =>
    item.type === "section" && item.value?.showToggleAllButton ? (
      <HiddenSectionToggle item={item} key={item.key} listId={listId} listState={listState} />
    ) : null,
  );
}
