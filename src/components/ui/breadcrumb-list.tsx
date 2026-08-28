"use client";

import type { LocationDescriptor } from "history";
import {
  Fragment,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

import { t } from "../../lib/scraps-locale";
import { Button, LinkButton, type ButtonProps, type LinkButtonProps } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { InfoText } from "./info";
import { Container, Flex, useHasContainerQuery } from "./layout";
import { Link } from "./link";
import { MenuListItem, type MenuListItemProps } from "./menu-list-item";
import { Text } from "./text";
import { Tooltip } from "./tooltip";

type BreadcrumbLinkItem = {
  type: "link";
  label: string;
  to: LocationDescriptor;
  leadingGraphic?: ReactNode;
};

type SelectKey = string | number;
type SelectOption<Value extends SelectKey = string> = MenuListItemProps & {
  value: Value;
  textValue?: string;
  hideCheck?: boolean;
};
type BreadcrumbSelectProjectsItem<Value extends SelectKey = string> = {
  type: "select-projects";
  value: Value;
  options: Array<SelectOption<Value>>;
  onChange: (value: SelectOption<Value>) => void;
};

type BreadcrumbItem = BreadcrumbLinkItem | BreadcrumbSelectProjectsItem;

type BreadcrumbPaginationItem = {
  ariaLabel: string;
  disabled?: boolean;
  onClick?: () => void;
  to?: LocationDescriptor;
  tooltip?: ReactNode;
};

type BreadcrumbTitleAction =
  | {
      type: "copy";
      label: string;
      text: string;
      icon?: ReactNode;
      onCopy?: (copiedText: string) => void;
      tooltip?: ReactNode;
    }
  | { type: "menu"; items: BreadcrumbMenuItem[]; triggerLabel: string; triggerIcon?: ReactNode }
  | { type: "button"; element: ReactElement<ButtonProps | LinkButtonProps> };

type BreadcrumbMenuItem = MenuListItemProps & {
  key: string;
  className?: string;
  closeOnSelect?: boolean;
  to?: LocationDescriptor;
  externalHref?: string;
  hidden?: boolean;
  onAction?: () => void;
  children?: BreadcrumbMenuItem[];
  submenu?: boolean | { position?: OverlayPosition; title?: string };
  textValue?: string;
};

type OverlayPosition =
  | "auto"
  | "auto-start"
  | "auto-end"
  | "top"
  | "top-start"
  | "top-end"
  | "right"
  | "right-start"
  | "right-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "left-start"
  | "left-end";

type PageTitleItem = {
  type: "page-title";
  label: string;
  labelTooltip?: ReactNode;
  leadingGraphic?: ReactNode;
  pagination?: { previous: BreadcrumbPaginationItem; next: BreadcrumbPaginationItem };
  trailingActions?: BreadcrumbTitleAction | Array<BreadcrumbTitleAction | null>;
};

type EditableTitleItem = {
  type: "editable-title";
  "aria-label": string;
  onChange: (value: string) => void;
  value: string;
  allowEmpty?: boolean;
  autoSelect?: boolean;
  errorMessage?: ReactNode;
  isDisabled?: boolean;
  leadingGraphic?: ReactNode;
  maxLength?: number;
  placeholder?: string;
};

export type BreadcrumbTitleItem = PageTitleItem | EditableTitleItem;

interface BreadcrumbListProps {
  items: BreadcrumbItem[];
}

const itemClassName = "inline-flex h-8 min-w-8 items-center gap-2";

const iconPaths = {
  checkmark:
    "M13.72 3.22C14.01 2.93 14.49 2.93 14.78 3.22C15.07 3.51 15.07 3.99 14.78 4.28L6.53 12.53C6.24 12.82 5.76 12.82 5.47 12.53L1.22 8.28C0.93 7.99 0.93 7.51 1.22 7.22C1.51 6.93 1.99 6.93 2.28 7.22L6 10.94L13.72 3.22Z",
  chevron:
    "M8 5C8.21 5 8.4 5.09 8.54 5.24L12.79 9.74C13.08 10.04 13.07 10.51 12.76 10.79C12.46 11.08 11.99 11.07 11.7 10.76L8 6.84L4.29 10.76C4.01 11.07 3.54 11.08 3.24 10.79C2.93 10.51 2.92 10.04 3.2 9.74L7.45 5.24C7.6 5.09 7.79 5 8 5Z",
  copy: "M1 4.75C1 3.78 1.78 3 2.75 3L4 3L4 1.75C4 0.78 4.78 0 5.75 0L14.25 0C15.22 0 16 0.78 16 1.75L16 10.25C16 11.22 15.22 12 14.25 12L13 12L13 13.25C13 14.22 12.22 15 11.25 15L2.75 15C1.78 15 1 14.22 1 13.25L1 4.75ZM5.5 10.25C5.5 10.39 5.61 10.5 5.75 10.5L14.25 10.5C14.39 10.5 14.5 10.39 14.5 10.25L14.5 1.75C14.5 1.61 14.39 1.5 14.25 1.5L5.75 1.5C5.61 1.5 5.5 1.61 5.5 1.75L5.5 10.25ZM2.5 13.25C2.5 13.39 2.61 13.5 2.75 13.5L11.25 13.5C11.39 13.5 11.5 13.39 11.5 13.25L11.5 12L5.75 12C4.78 12 4 11.22 4 10.25L4 4.5L2.75 4.5C2.61 4.5 2.5 4.61 2.5 4.75L2.5 13.25Z",
  edit: "M11.26 0.68C11.95 -0.01 13.05 -0.01 13.74 0.68L15.32 2.26C16.01 2.95 16.01 4.05 15.32 4.74L7.56 12.5C7.47 12.59 7.37 12.66 7.25 12.71L2.05 14.94C1.76 15.06 1.44 15 1.22 14.78C1 14.56 0.94 14.24 1.06 13.95L3.29 8.75L3.33 8.66C3.38 8.58 3.44 8.5 3.5 8.44L11.26 0.68ZM4.63 9.43L3.18 12.82L6.57 11.37L11.44 6.5L9.5 4.56L4.63 9.43ZM12.68 1.74C12.58 1.64 12.42 1.64 12.32 1.74L10.56 3.5L12.5 5.44L14.26 3.68C14.36 3.58 14.36 3.42 14.26 3.32L12.68 1.74Z",
  ellipsis:
    "M2.5 6.5C3.33 6.5 4 7.17 4 8C4 8.83 3.33 9.5 2.5 9.5C1.67 9.5 1 8.83 1 8C1 7.17 1.67 6.5 2.5 6.5ZM8 6.5C8.83 6.5 9.5 7.17 9.5 8C9.5 8.83 8.83 9.5 8 9.5C7.17 9.5 6.5 8.83 6.5 8C6.5 7.17 7.17 6.5 8 6.5ZM13.5 6.5C14.33 6.5 15 7.17 15 8C15 8.83 14.33 9.5 13.5 9.5C12.67 9.5 12 8.83 12 8C12 7.17 12.67 6.5 13.5 6.5Z",
  slash: "M9.544 1.496a.751.751 0 0 1 1.412.508l-4.5 12.5a.75.75 0 0 1-1.412-.508z",
} as const;

function BreadcrumbIcon({
  path,
  rotation,
  size = "size-4",
}: {
  path: keyof typeof iconPaths;
  rotation?: number;
  size?: "size-3" | "size-3.5" | "size-4";
}) {
  return (
    <svg
      aria-hidden="true"
      className={`${size} shrink-0 fill-current`}
      style={rotation === undefined ? undefined : { transform: `rotate(${rotation}deg)` }}
      viewBox="0 0 16 16"
    >
      <path d={iconPaths[path]} />
    </svg>
  );
}

function LeadingGraphic({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden="true" className="inline-flex size-4 shrink-0 items-center justify-center">
      {children}
    </span>
  );
}

function BreadcrumbLink({ item }: { item: BreadcrumbLinkItem }) {
  return (
    <span className={itemClassName}>
      {item.leadingGraphic ? <LeadingGraphic>{item.leadingGraphic}</LeadingGraphic> : null}
      <Link className="min-w-0" data-test-id="breadcrumb-link" to={item.to}>
        <Text ellipsis variant="muted">
          {item.label}
        </Text>
      </Link>
    </span>
  );
}

function ProjectSelect({ item }: { item: BreadcrumbSelectProjectsItem }) {
  const selected = item.options.find((option) => option.value === item.value);
  const label = typeof selected?.label === "string" ? selected.label : String(item.value);
  return (
    <span className="inline-flex shrink-0 items-center">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              aria-label={t("Selected Project: %s", label)}
              className="max-w-48 truncate"
              size="sm"
              variant="transparent"
            />
          }
        >
          {selected?.label ?? label}
        </DropdownMenuTrigger>
        <DropdownMenuContent role="listbox">
          {item.options.map((option) => (
            <ProjectOption
              isSelected={option.value === item.value}
              key={String(option.value)}
              onSelect={() => item.onChange(option)}
              option={option}
            />
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  );
}

function ProjectOption({
  isSelected,
  onSelect,
  option,
}: {
  isSelected: boolean;
  onSelect: () => void;
  option: SelectOption;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const state = { disabled: option.disabled ?? false, isFocused, isSelected };
  const leadingItems = resolveMenuContent(option.leadingItems, state);
  const optionLabel =
    option.textValue ?? (typeof option.label === "string" ? option.label : undefined);
  return (
    <DropdownMenuItem
      aria-label={optionLabel}
      aria-selected={isSelected}
      className="p-0 focus:bg-transparent"
      disabled={option.disabled}
      onClick={onSelect}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      role="option"
    >
      <MenuListItem
        as="div"
        className="w-full px-0"
        details={option.details}
        disabled={option.disabled}
        isFocused={isFocused}
        isSelected={isSelected}
        label={option.label}
        leadingItems={
          <>
            {!option.hideCheck ? (
              <span
                aria-hidden="true"
                className="inline-flex size-3.5 shrink-0 items-center justify-center"
              >
                {isSelected ? <BreadcrumbIcon path="checkmark" size="size-3.5" /> : null}
              </span>
            ) : null}
            {leadingItems ? (
              <span aria-hidden="true" className="inline-flex shrink-0">
                {leadingItems}
              </span>
            ) : null}
          </>
        }
        priority={option.priority ?? (isSelected ? "primary" : "default")}
        showDetailsInOverlay={option.showDetailsInOverlay}
        size="sm"
        tooltip={option.tooltip}
        tooltipOptions={option.tooltipOptions}
        trailingItems={option.trailingItems}
      />
    </DropdownMenuItem>
  );
}

function OverflowMenu({ items }: { items: BreadcrumbLinkItem[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label={t("More breadcrumbs")}
            icon={<BreadcrumbIcon path="ellipsis" size="size-3" />}
            size="zero"
            variant="transparent"
          />
        }
      />
      <DropdownMenuContent>
        {items.map((item, index) => (
          <DropdownMenuItem key={`${index}-${item.label}`} render={<Link to={item.to} />}>
            {item.leadingGraphic ? <LeadingGraphic>{item.leadingGraphic}</LeadingGraphic> : null}
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DividerItem({
  children,
  display,
}: {
  children: ReactNode;
  display?: { zero: "flex" | "none"; sm: "flex" | "none" };
}) {
  return (
    <Container as="li" display={display ?? "flex"} flexShrink={999}>
      <Flex align="center" gap="xs">
        {children}
        <span
          aria-hidden="true"
          className="inline-flex shrink-0 text-[var(--scraps-content-secondary,#6a6772)]"
        >
          <BreadcrumbIcon path="slash" />
        </span>
      </Flex>
    </Container>
  );
}

function BreadcrumbActionMenu({
  action,
}: {
  action: Extract<BreadcrumbTitleAction, { type: "menu" }>;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label={action.triggerLabel}
            icon={action.triggerIcon ?? <BreadcrumbIcon path="ellipsis" size="size-3" />}
            size="zero"
            variant="transparent"
          />
        }
      />
      <DropdownMenuContent>
        {action.items.map((item) => (
          <MenuActionItem item={item} key={item.key} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function resolveMenuContent(
  value:
    | MenuListItemProps["leadingItems"]
    | MenuListItemProps["details"]
    | MenuListItemProps["trailingItems"],
  state: { disabled: boolean; isFocused: boolean; isSelected: boolean },
) {
  return typeof value === "function" ? value(state) : value;
}

type SubmenuSide = "bottom" | "left" | "right" | "top";

function getAutomaticSubmenuSide(trigger: HTMLElement | null): SubmenuSide {
  if (!trigger || typeof window === "undefined") return "right";
  const rect = trigger.getBoundingClientRect();
  const available: Record<SubmenuSide, number> = {
    bottom: window.innerHeight - rect.bottom,
    left: rect.left,
    right: window.innerWidth - rect.right,
    top: rect.top,
  };
  return (Object.keys(available) as SubmenuSide[]).reduce((best, side) =>
    available[side] > available[best] ? side : best,
  );
}

function resolveSubmenuPosition(
  position?: OverlayPosition,
  automaticSide: SubmenuSide = "right",
): {
  align: "center" | "end" | "start";
  side: SubmenuSide;
} {
  const [requestedSide = "right", requestedAlign = "start"] = position?.split("-") ?? [];
  const side: SubmenuSide =
    requestedSide === "top" ||
    requestedSide === "bottom" ||
    requestedSide === "left" ||
    requestedSide === "right"
      ? requestedSide
      : automaticSide;
  const align = requestedAlign === "start" || requestedAlign === "end" ? requestedAlign : "center";
  return { align, side };
}

function MenuActionItem({ item }: { item: BreadcrumbMenuItem }) {
  const [isFocused, setIsFocused] = useState(false);
  const [automaticSide, setAutomaticSide] = useState<SubmenuSide>("right");
  const submenuTrigger = useRef<HTMLDivElement>(null);
  if (item.hidden) return null;
  if (item.children && !item.submenu) {
    return (
      <DropdownMenuGroup>
        {item.label ? <DropdownMenuLabel>{item.label}</DropdownMenuLabel> : null}
        {item.children.map((child) => (
          <MenuActionItem item={child} key={child.key} />
        ))}
      </DropdownMenuGroup>
    );
  }
  const contents = (
    <MenuListItem
      as="div"
      className="w-full px-0"
      details={item.details}
      disabled={item.disabled}
      isFocused={isFocused}
      label={item.label}
      leadingItems={item.leadingItems}
      priority={item.priority}
      showDetailsInOverlay={item.showDetailsInOverlay}
      size={item.size}
      tooltip={item.tooltip}
      tooltipOptions={item.tooltipOptions}
      trailingItems={item.trailingItems}
    />
  );
  if (item.children && item.submenu) {
    const placement = typeof item.submenu === "object" ? item.submenu.position : undefined;
    const { align, side } = resolveSubmenuPosition(placement, automaticSide);
    const submenuItems = item.children.map((child) => (
      <MenuActionItem item={child} key={child.key} />
    ));
    const submenuTitle = typeof item.submenu === "object" ? item.submenu.title : undefined;
    const updateAutomaticSide = () => {
      if (placement?.startsWith("auto")) {
        setAutomaticSide(getAutomaticSubmenuSide(submenuTrigger.current));
      }
    };
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger
          aria-label={item.textValue}
          className={`p-0 focus:bg-transparent ${item.className ?? ""}`}
          disabled={item.disabled}
          ref={submenuTrigger}
          onFocus={() => {
            setIsFocused(true);
            updateAutomaticSide();
          }}
          onBlur={() => setIsFocused(false)}
          onPointerEnter={updateAutomaticSide}
        >
          {contents}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent
          align={align}
          data-requested-align={align}
          data-requested-side={side}
          side={side}
        >
          {submenuTitle ? (
            <DropdownMenuGroup>
              <DropdownMenuLabel>{submenuTitle}</DropdownMenuLabel>
              {submenuItems}
            </DropdownMenuGroup>
          ) : (
            submenuItems
          )}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  }
  const sharedProps = {
    "aria-label": item.textValue,
    className: `p-0 focus:bg-transparent ${item.className ?? ""}`,
    closeOnClick: item.closeOnSelect,
    disabled: item.disabled,
    onBlur: () => setIsFocused(false),
    onFocus: () => setIsFocused(true),
  };
  let menuItem: ReactElement;
  if (item.to) {
    menuItem = (
      <DropdownMenuItem {...sharedProps} onClick={item.onAction} render={<Link to={item.to} />}>
        {contents}
      </DropdownMenuItem>
    );
  } else if (item.externalHref) {
    menuItem = (
      <DropdownMenuItem
        {...sharedProps}
        onClick={item.onAction}
        render={<a href={item.externalHref} rel="noreferrer noopener" target="_blank" />}
      >
        {contents}
      </DropdownMenuItem>
    );
  } else {
    menuItem = (
      <DropdownMenuItem {...sharedProps} onClick={item.onAction}>
        {contents}
      </DropdownMenuItem>
    );
  }
  return menuItem;
}

function CopyAction({ action }: { action: Extract<BreadcrumbTitleAction, { type: "copy" }> }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(action.text);
      action.onCopy?.(action.text);
    } catch {}
  }
  return (
    <Button
      aria-label={action.label}
      icon={
        action.icon ?? (
          <span className="text-[var(--scraps-content-secondary,#6a6772)]">
            <BreadcrumbIcon path="copy" />
          </span>
        )
      }
      size="zero"
      tooltipProps={{ title: action.tooltip }}
      variant="transparent"
      onClick={copy}
    />
  );
}

function NavigationAction({
  item,
  direction,
}: {
  item: BreadcrumbPaginationItem;
  direction: "left" | "right";
}) {
  const icon = (
    <BreadcrumbIcon path="chevron" rotation={direction === "left" ? 270 : 90} size="size-3" />
  );
  const control = item.to ? (
    <LinkButton
      aria-label={item.ariaLabel}
      disabled={item.disabled}
      icon={icon}
      size="zero"
      to={item.to}
      variant="transparent"
      onClick={item.onClick}
    />
  ) : (
    <Button aria-label={item.ariaLabel} disabled icon={icon} size="zero" variant="transparent" />
  );
  return (
    <Tooltip disabled={!item.tooltip} isHoverable title={item.tooltip}>
      {control}
    </Tooltip>
  );
}

function PageTitle({ item }: { item: PageTitleItem }) {
  const actions = (
    Array.isArray(item.trailingActions) ? item.trailingActions : [item.trailingActions]
  ).filter((action): action is BreadcrumbTitleAction => action !== null && action !== undefined);
  const title = (
    <InfoText bold className="min-w-0" ellipsis title={item.labelTooltip} variant="inherit">
      {item.label}
    </InfoText>
  );
  return (
    <span className={itemClassName}>
      {item.pagination ? (
        <span className="inline-flex shrink-0">
          <NavigationAction direction="left" item={item.pagination.previous} />
          <NavigationAction direction="right" item={item.pagination.next} />
        </span>
      ) : null}
      {item.leadingGraphic ? <LeadingGraphic>{item.leadingGraphic}</LeadingGraphic> : null}
      {title}
      {actions.length ? (
        <span className="inline-flex shrink-0 items-center gap-1">
          {actions.map((action, index) =>
            action.type === "copy" ? (
              <CopyAction action={action} key={index} />
            ) : action.type === "menu" ? (
              <BreadcrumbActionMenu action={action} key={index} />
            ) : (
              <Fragment key={index}>{action.element}</Fragment>
            ),
          )}
        </span>
      ) : null}
    </span>
  );
}

function EditableTitle({ item }: { item: EditableTitleItem }) {
  const [editing, setEditing] = useState(false);
  const [optimisticValue, setOptimisticValue] = useState<string | null>(null);
  const [draft, setDraft] = useState(item.value);
  const [showError, setShowError] = useState(false);
  const previousValue = useRef(item.value);
  const previousDisabled = useRef(item.isDisabled);
  const input = useRef<HTMLInputElement>(null);
  const errorId = useId();
  const currentValue = optimisticValue ?? item.value;

  useEffect(() => {
    if (previousValue.current === item.value) return;
    previousValue.current = item.value;
    setOptimisticValue(null);
    setDraft(item.value);
    setShowError(false);
    setEditing(false);
  }, [item.value]);

  useEffect(() => {
    const becameDisabled = !previousDisabled.current && item.isDisabled;
    previousDisabled.current = item.isDisabled;
    if (!becameDisabled) return;
    setDraft(currentValue);
    setShowError(false);
    setEditing(false);
  }, [currentValue, item.isDisabled]);

  useEffect(() => {
    if (!editing) return;
    input.current?.focus();
    if (item.autoSelect) input.current?.select();
  }, [editing, item.autoSelect]);

  function cancel() {
    setDraft(currentValue);
    setShowError(false);
    setEditing(false);
  }

  function commit(cancelEmpty: boolean) {
    if (!draft.trim()) {
      if (cancelEmpty && item.allowEmpty) cancel();
      else setShowError(Boolean(item.errorMessage));
      return;
    }
    setShowError(false);
    setEditing(false);
    if (draft === currentValue) return;
    setOptimisticValue(draft);
    item.onChange(draft);
  }

  return (
    <span className={itemClassName}>
      {item.leadingGraphic ? <LeadingGraphic>{item.leadingGraphic}</LeadingGraphic> : null}
      <Text as="span" bold>
        {editing ? (
          <span className="relative -mx-2 -my-1 inline-block max-w-[calc(100%+16px)] rounded-[6px] border-t border-transparent bg-[var(--scraps-theme-surface400,#f8f8f9)] px-2 py-1">
            <input
              aria-errormessage={showError ? errorId : undefined}
              aria-invalid={showError || undefined}
              aria-label={item["aria-label"]}
              className="min-w-0 border-0 bg-transparent p-0 font-[inherit] text-[inherit]/[1.2] outline-hidden"
              data-slot="breadcrumb-editable-input"
              disabled={item.isDisabled}
              maxLength={item.maxLength}
              placeholder={item.placeholder}
              ref={input}
              value={draft}
              onBlur={() => commit(true)}
              onChange={(event) => {
                setDraft(event.target.value);
                if (event.target.value.trim()) setShowError(false);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commit(false);
                } else if (event.key === "Escape") {
                  event.preventDefault();
                  cancel();
                }
              }}
            />
            <span aria-hidden="true" className="block h-0 px-2 whitespace-pre opacity-0">
              {draft}
            </span>
            {showError ? (
              <span
                className="absolute top-[calc(100%+4px)] left-0 z-50 rounded-md border border-destructive/30 bg-popover px-2 py-1 text-xs font-normal whitespace-nowrap text-destructive shadow-sm"
                id={errorId}
                role="alert"
              >
                {item.errorMessage}
              </span>
            ) : null}
          </span>
        ) : (
          <span
            className={`grid min-w-0 grid-flow-col items-center gap-2 ${item.isDisabled ? "cursor-default" : "cursor-pointer"}`}
            data-slot="breadcrumb-editable-label"
            onClick={() => {
              if (item.isDisabled) return;
              setDraft(currentValue);
              setShowError(false);
              setEditing(true);
            }}
          >
            <span className="truncate border-t border-transparent [line-height:1.2]">
              {currentValue || item.placeholder}
            </span>
            {!item.isDisabled ? <BreadcrumbIcon path="edit" /> : null}
          </span>
        )}
      </Text>
    </span>
  );
}

function Title({ item }: { item: BreadcrumbTitleItem }) {
  return item.type === "page-title" ? <PageTitle item={item} /> : <EditableTitle item={item} />;
}

export function BreadcrumbList({ items }: BreadcrumbListProps) {
  const hasParentQueryContainer = useHasContainerQuery();
  if (items.length === 0) return null;
  const links = items.filter((item): item is BreadcrumbLinkItem => item.type === "link");
  const visibleWhenWide = { zero: "none", sm: "flex" } as const;
  const visibleWhenNarrow = { zero: "flex", sm: "none" } as const;
  return (
    <Container width="100%">
      <Container containerType={hasParentQueryContainer ? "normal" : "inline-size"} width="100%">
        <Flex as="ol" align="center" gap="xs" margin="0" padding="0" wrap="nowrap">
          {items.map((item, index) => (
            <DividerItem display={visibleWhenWide} key={index}>
              {item.type === "link" ? (
                <BreadcrumbLink item={item} />
              ) : (
                <ProjectSelect item={item} />
              )}
            </DividerItem>
          ))}
          {links.length ? (
            <DividerItem display={visibleWhenNarrow}>
              <OverflowMenu items={links} />
            </DividerItem>
          ) : null}
        </Flex>
      </Container>
    </Container>
  );
}

BreadcrumbList.Title = Title;
