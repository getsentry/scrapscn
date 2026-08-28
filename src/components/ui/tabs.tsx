"use client";

import {
  useTab,
  useTabList,
  useTabPanel,
  type AriaTabListOptions,
  type AriaTabPanelProps,
} from "@react-aria/tabs";
import { Item, useCollection } from "@react-stately/collections";
import { ListCollection } from "@react-stately/list";
import { useTabListState, type TabListState, type TabListStateOptions } from "@react-stately/tabs";
import type { ItemProps, Node, Orientation } from "@react-types/shared";
import type { LocationDescriptor } from "history";
import { Ellipsis } from "lucide-react";
import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import { t } from "../../lib/scraps-locale";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { CompactSelect, type SelectOption } from "./compact-select";
import { Link } from "./link";
import { Tooltip, type TooltipProps } from "./tooltip";

type TabSize = "md" | "sm" | "xs";
type TabVariant = "flat" | "floating";

type TabsProps<Key> = Omit<
  AriaTabListOptions<unknown>,
  "defaultSelectedKey" | "isDisabled" | "onSelectionChange" | "selectedKey"
> &
  Omit<
    TabListStateOptions<unknown>,
    "children" | "defaultSelectedKey" | "isDisabled" | "onSelectionChange" | "selectedKey"
  > & {
    children?: ReactNode;
    className?: string;
    defaultValue?: Key;
    disableOverflow?: boolean;
    disabled?: boolean;
    onChange?: (key: Key) => void;
    size?: TabSize;
    value?: Key;
  };

type TabsContextValue = {
  rootProps: Omit<TabsProps<string | number>, "children" | "className" | "orientation" | "size"> & {
    orientation: Orientation;
    size: TabSize;
  };
  setTabListState: (state: TabListState<TabListItemProps>) => void;
  tabListState?: TabListState<TabListItemProps>;
};

const TabsContext = createContext<TabsContextValue>({
  rootProps: { orientation: "horizontal", size: "md" },
  setTabListState: () => {},
});

export function TabStateProvider<Key extends string | number>({
  children,
  ...props
}: Omit<TabsProps<Key>, "className">) {
  const [tabListState, setTabListState] = useState<TabListState<TabListItemProps>>();
  return (
    <TabsContext.Provider
      value={{
        rootProps: {
          orientation: "horizontal",
          size: "md",
          ...props,
        } as TabsContextValue["rootProps"],
        setTabListState,
        tabListState,
      }}
    >
      {children}
    </TabsContext.Provider>
  );
}

export function Tabs<Key extends string | number>({
  children,
  className,
  orientation = "horizontal",
  size = "md",
  ...props
}: TabsProps<Key>) {
  return (
    <TabStateProvider {...props} orientation={orientation} size={size}>
      <div
        className={cn(
          "flex grow",
          orientation === "horizontal" ? "flex-col" : "h-full flex-row items-stretch",
          className,
        )}
        data-orientation={orientation}
      >
        {children}
      </div>
    </TabStateProvider>
  );
}

export interface TabListItemProps extends ItemProps<unknown> {
  key: string | number;
  disabled?: boolean;
  hidden?: boolean;
  to?: LocationDescriptor;
  tooltip?: TooltipProps;
}

const TabListItem = Item as (props: TabListItemProps) => React.JSX.Element;
const TabPanelItem = Item as (props: ItemProps<unknown>) => React.JSX.Element;
const collectionFactory = (nodes: Iterable<Node<TabListItemProps>>) => new ListCollection(nodes);
const RESERVED_OVERFLOW_TRIGGER_WIDTH = 48;

type TabListProps = {
  children: TabListStateOptions<TabListItemProps>["children"];
  outerWrapStyles?: CSSProperties;
  variant?: TabVariant;
};

export function TabList({ outerWrapStyles, variant = "flat", ...props }: TabListProps) {
  const collection = useCollection(props, collectionFactory);
  const items = useMemo(
    () => Array.from(collection, (item) => ({ key: item.key, ...item.props }) as TabListItemProps),
    [collection],
  );
  const disabledKeys = useMemo(
    () => items.filter((item) => item.disabled).map((item) => item.key),
    [items],
  );
  const { rootProps, setTabListState } = useContext(TabsContext);
  const {
    value,
    defaultValue,
    onChange,
    disabled,
    disableOverflow,
    orientation,
    size,
    keyboardActivation = "manual",
    ...ariaRootProps
  } = rootProps;
  const linkRefs = useRef<Record<string | number, HTMLAnchorElement | null>>({});
  const pointerSelectionKeyRef = useRef<string | number | null>(null);
  const state = useTabListState({
    ...ariaRootProps,
    ...props,
    collection,
    defaultSelectedKey: defaultValue,
    disabledKeys,
    isDisabled: disabled,
    onSelectionChange: (key) => {
      onChange?.(key as string | number);
      if (pointerSelectionKeyRef.current !== key) {
        linkRefs.current[key]?.click();
      }
      pointerSelectionKeyRef.current = null;
    },
    selectedKey: value,
  } as TabListStateOptions<TabListItemProps>);
  const listRef = useRef<HTMLUListElement>(null);
  const outerWrapRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string | number, HTMLLIElement | null>>({});
  const { tabListProps } = useTabList(
    { ...ariaRootProps, ...props, keyboardActivation, orientation },
    state,
    listRef,
  );
  useEffect(() => {
    setTabListState(state);
    // The state object changes on every render. Its observable fields are the synchronization contract.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.children, setTabListState, state.disabledKeys, state.selectedItem, state.selectedKey]);

  const overflowKeys = useOverflowTabs({
    disabled: disableOverflow || orientation !== "horizontal",
    items,
    itemRefs,
    listRef,
    outerWrapRef,
  });
  const overflowEnabled = orientation === "horizontal" && !disableOverflow;
  const visibleOverflowKeys = useMemo(
    () => (overflowEnabled ? overflowKeys : []),
    [overflowEnabled, overflowKeys],
  );
  const overflowOptions = useMemo(() => {
    const keys = Array.from(state.collection, (item) => item.key);
    return visibleOverflowKeys
      .toSorted((left, right) => keys.indexOf(left) - keys.indexOf(right))
      .flatMap((key) => {
        const item = state.collection.getItem(key);
        if (!item) return [];
        return [
          {
            value: key,
            label: item.props.children,
            disabled: item.props.disabled,
            textValue: item.textValue,
            tooltip: item.props.tooltip?.title,
            tooltipOptions: item.props.tooltip,
          } satisfies SelectOption<string | number>,
        ];
      });
  }, [state.collection, visibleOverflowKeys]);

  return (
    <div className="relative min-w-0" ref={outerWrapRef} style={outerWrapStyles}>
      <ul
        {...tabListProps}
        className={cn(
          "relative m-0 grid shrink-0 list-none gap-1 p-0",
          orientation === "horizontal"
            ? "grid-flow-col justify-start"
            : "h-full content-start pr-1",
        )}
        data-variant={variant}
        ref={listRef}
      >
        {Array.from(state.collection, (item) => (
          <Tab
            key={item.key}
            item={item}
            linkRef={(element) => {
              linkRefs.current[item.key] = element;
            }}
            onLinkClick={() => {
              queueMicrotask(() => {
                pointerSelectionKeyRef.current = null;
              });
            }}
            onLinkPointerDown={() => {
              pointerSelectionKeyRef.current = item.key;
            }}
            orientation={orientation}
            overflowing={visibleOverflowKeys.includes(item.key)}
            ref={(element) => {
              itemRefs.current[item.key] = element;
            }}
            size={size}
            state={state}
            tooltip={item.props.tooltip}
            variant={variant}
          />
        ))}
      </ul>
      {overflowEnabled && overflowOptions.length > 0 ? (
        <div className="absolute top-1/2 right-0 z-[1001] -translate-y-1/2">
          <CompactSelect<string | number>
            clearable={false}
            disabled={disabled}
            multiple={false}
            offset={4}
            onChange={(option) => state.setSelectedKey(option.value)}
            options={overflowOptions}
            position="bottom-end"
            size="sm"
            trigger={({ children, ...triggerProps }) => {
              void children;
              return (
                <Button
                  {...triggerProps}
                  aria-label={t("More tabs")}
                  className="px-2 text-[var(--scraps-content-secondary,#6a6772)]"
                  icon={<Ellipsis aria-hidden="true" />}
                  size="sm"
                  variant="transparent"
                />
              );
            }}
            value={state.selectedKey ?? undefined}
          />
        </div>
      ) : null}
    </div>
  );
}

TabList.Item = TabListItem;

function stopModifiedLinkSelection(
  event: ReactMouseEvent<HTMLAnchorElement> | ReactPointerEvent<HTMLAnchorElement>,
) {
  if (event.metaKey || event.ctrlKey || event.shiftKey) event.stopPropagation();
}

function handleLinkPointerDown(
  event: ReactMouseEvent<HTMLAnchorElement> | ReactPointerEvent<HTMLAnchorElement>,
  onUnmodifiedPointerDown: () => void,
) {
  stopModifiedLinkSelection(event);
  if (!event.metaKey && !event.ctrlKey && !event.shiftKey) {
    onUnmodifiedPointerDown();
  }
}

function Tab({
  item,
  linkRef,
  onLinkClick,
  onLinkPointerDown,
  orientation,
  overflowing,
  ref,
  size,
  state,
  tooltip,
  variant,
}: {
  item: Node<TabListItemProps>;
  linkRef: (element: HTMLAnchorElement | null) => void;
  onLinkClick: () => void;
  onLinkPointerDown: () => void;
  orientation: Orientation;
  overflowing: boolean;
  ref: (element: HTMLLIElement | null) => void;
  size: TabSize;
  state: TabListState<TabListItemProps>;
  tooltip?: TooltipProps;
  variant: TabVariant;
}) {
  const objectRef = useRef<HTMLLIElement>(null);
  const setRef = useCallback(
    (element: HTMLLIElement | null) => {
      objectRef.current = element;
      ref(element);
    },
    [ref],
  );
  const { isDisabled, isSelected, tabProps } = useTab(
    { key: item.key, isDisabled: item.props.hidden },
    state,
    objectRef,
  );
  const itemProps = item.props;
  const sizeClasses =
    size === "md" ? "min-h-9 text-sm/4" : size === "sm" ? "min-h-8 text-sm/4" : "min-h-7 text-xs/4";
  const padding =
    orientation === "horizontal"
      ? size === "md"
        ? "px-4 py-2.5"
        : size === "sm"
          ? "px-3 py-2"
          : "px-2 py-1.5"
      : size === "md"
        ? "px-2 py-2.5"
        : size === "sm"
          ? "px-1.5 py-2"
          : "px-1 py-1.5";
  const interactionClasses = isDisabled
    ? undefined
    : isSelected
      ? variant === "floating"
        ? "bg-[var(--scraps-tabs-accent-selected-rest)] hover:bg-[var(--scraps-tabs-accent-selected-hover)] hover:text-[var(--scraps-tabs-accent-hover)] active:bg-[var(--scraps-tabs-accent-selected-active)] active:text-[var(--scraps-tabs-accent-active)]"
        : "hover:bg-[var(--scraps-tabs-accent-selected-rest)] hover:text-[var(--scraps-tabs-accent-hover)] active:bg-[var(--scraps-tabs-accent-selected-hover)] active:text-[var(--scraps-tabs-accent-active)]"
      : "hover:bg-[var(--scraps-tabs-neutral-hover-background)] hover:text-[var(--scraps-tabs-neutral-hover)] active:bg-[var(--scraps-tabs-neutral-active-background)] active:text-[var(--scraps-tabs-neutral-active)]";
  const content =
    itemProps.to && !isDisabled ? (
      <Link
        className="flex size-full items-center text-inherit hover:text-inherit"
        onClick={onLinkClick}
        onMouseDown={(event) => handleLinkPointerDown(event, onLinkPointerDown)}
        onPointerDown={(event) => handleLinkPointerDown(event, onLinkPointerDown)}
        ref={linkRef}
        tabIndex={-1}
        to={itemProps.to}
      >
        {item.rendered}
      </Link>
    ) : (
      item.rendered
    );
  return (
    <Tooltip disabled={!tooltip} skipWrapper {...tooltip} title={tooltip?.title}>
      <li
        {...tabProps}
        aria-disabled={isDisabled || undefined}
        className={cn(
          "relative cursor-pointer whitespace-nowrap text-[var(--scraps-content-secondary,#6a6772)] outline-none aria-disabled:cursor-default aria-disabled:opacity-60 focus-visible:[&>div]:shadow-[inset_0_0_0_2px_var(--scraps-tabs-focus,#7553ff)]",
          isSelected && "text-[var(--scraps-content-accent,#653de9)]",
          overflowing && "pointer-events-none hidden",
        )}
        hidden={itemProps.hidden}
        ref={setRef}
        role="tab"
      >
        <div
          className={cn(
            "relative flex translate-y-px items-center rounded-md",
            sizeClasses,
            padding,
            orientation === "horizontal" ? "gap-2" : "gap-1.5",
            interactionClasses,
            orientation === "horizontal" && variant === "flat" && "mb-1",
            orientation === "vertical" && variant === "flat" && "ml-1.5",
          )}
        >
          {content}
          {variant === "flat" && (
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute rounded-[1px] bg-transparent",
                orientation === "horizontal"
                  ? "inset-x-0 -bottom-1 h-0.5"
                  : "inset-y-1/4 -left-1.5 w-0.5",
                isSelected && "bg-[var(--scraps-tabs-indicator,#7553ff)]",
              )}
            />
          )}
        </div>
      </li>
    </Tooltip>
  );
}

function useOverflowTabs({
  disabled,
  items,
  itemRefs,
  listRef,
  outerWrapRef,
}: {
  disabled: boolean | undefined;
  items: TabListItemProps[];
  itemRefs: React.RefObject<Record<string | number, HTMLLIElement | null>>;
  listRef: React.RefObject<HTMLUListElement | null>;
  outerWrapRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [overflowKeys, setOverflowKeys] = useState<Array<string | number>>([]);
  const widthsRef = useRef(new Map<string | number, number>());
  const signature = items
    .map((item) => `${item.key}:${item.hidden ? "hidden" : "visible"}`)
    .join("|");

  const recompute = useCallback(() => {
    if (disabled) {
      setOverflowKeys((previous) => (previous.length === 0 ? previous : []));
      return;
    }
    const outerWrap = outerWrapRef.current;
    const list = listRef.current;
    if (!outerWrap || !list) return;

    const visibleKeys = items.filter((item) => !item.hidden).map((item) => item.key);
    const gap = Number.parseFloat(getComputedStyle(list).columnGap) || 0;
    for (const key of visibleKeys) {
      const measuredWidth = itemRefs.current[key]?.getBoundingClientRect().width ?? 0;
      if (measuredWidth > 0) widthsRef.current.set(key, measuredWidth);
    }
    const fullWidth = visibleKeys.reduce<number>(
      (total, key, index) => total + (widthsRef.current.get(key) ?? 0) + (index === 0 ? 0 : gap),
      0,
    );
    const next: Array<string | number> = [];
    if (fullWidth > outerWrap.clientWidth) {
      const budget = outerWrap.clientWidth - RESERVED_OVERFLOW_TRIGGER_WIDTH;
      let used = 0;
      let overflowing = false;
      for (const [index, key] of visibleKeys.entries()) {
        const nextUsed = used + (widthsRef.current.get(key) ?? 0) + (index === 0 ? 0 : gap);
        if (overflowing || (index > 0 && nextUsed > budget)) {
          overflowing = true;
          next.push(key);
        } else {
          used = nextUsed;
        }
      }
    }
    setOverflowKeys((previous) =>
      previous.length === next.length && previous.every((key, index) => key === next[index])
        ? previous
        : next,
    );
  }, [disabled, itemRefs, items, listRef, outerWrapRef]);

  useLayoutEffect(() => {
    const frame = requestAnimationFrame(recompute);
    return () => cancelAnimationFrame(frame);
  }, [recompute, signature]);

  useEffect(() => {
    if (disabled || typeof ResizeObserver === "undefined") return;
    const outerWrap = outerWrapRef.current;
    const list = listRef.current;
    if (!outerWrap || !list) return;
    let frame: number | undefined;
    const observer = new ResizeObserver(() => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(recompute);
    });
    observer.observe(outerWrap);
    observer.observe(list);
    return () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [disabled, listRef, outerWrapRef, recompute]);

  return overflowKeys;
}

type TabPanelsProps = {
  children: TabListStateOptions<unknown>["children"];
  className?: string;
};

export function TabPanels(props: TabPanelsProps) {
  const {
    rootProps: { orientation, items },
    tabListState,
  } = useContext(TabsContext);
  const collection = useCollection(
    { items, ...props },
    (nodes: Iterable<Node<unknown>>) => new ListCollection(nodes),
    { suppressTextValueWarning: true },
  );
  if (!tabListState) return null;
  const selected = tabListState.selectedKey ? collection.getItem(tabListState.selectedKey) : null;
  return (
    <TabPanel
      {...props}
      key={tabListState.selectedKey}
      orientation={orientation}
      state={tabListState}
    >
      {selected?.props.children}
    </TabPanel>
  );
}

TabPanels.Item = TabPanelItem;

function TabPanel({
  children,
  className,
  orientation = "horizontal",
  state,
  ...props
}: {
  children?: ReactNode;
  className?: string;
  orientation?: Orientation;
  state: TabListState<TabListItemProps>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { tabPanelProps } = useTabPanel(props, state, ref);
  return (
    <div
      {...tabPanelProps}
      className={cn(
        "rounded-md focus-visible:z-[1] focus-visible:[box-shadow:inset_0_0_0_1px_var(--scraps-tabs-focus,#7553ff),0_0_0_1px_var(--scraps-tabs-focus,#7553ff)] focus-visible:outline-none",
        orientation === "horizontal" ? "h-full pt-2" : "w-full pl-2",
        className,
      )}
      ref={ref}
    >
      {children}
    </div>
  );
}
