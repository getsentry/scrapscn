import { createRef, type ComponentProps, type ComponentPropsWithRef } from "react";

import {
  InnerWrap,
  LeadingItems,
  MenuListItem,
  type MenuListItemProps,
} from "@/components/ui/menu-list-item";

const props = {
  details: ({ isFocused }) => String(isFocused),
  label: "Item",
  leadingItems: ({ isSelected }) => String(isSelected),
  priority: "primary",
  size: "sm",
  tooltipOptions: { delay: 500 },
} satisfies ComponentProps<typeof MenuListItem>;
void props;
const publicProps: MenuListItemProps = { label: "Item", priority: "danger" };
void publicProps;
const styledPublicProps: MenuListItemProps = {
  label: "Styled tooltip",
  tooltipOptions: { overlayStyle: { padding: 4 } },
};
void styledPublicProps;
const emotionLikeSerializedStyles = {
  name: "menu-item-tooltip",
  styles: "padding:4px;",
};
const invalidTooltipOptions: MenuListItemProps = {
  label: "Item",
  tooltipOptions: {
    // @ts-expect-error SerializedStyles objects require the excluded Emotion runtime.
    overlayStyle: emotionLikeSerializedStyles,
  },
};
void invalidTooltipOptions;
<MenuListItem
  as="div"
  detailsProps={{ disabled: false, priority: "primary" }}
  innerWrapProps={{ size: "xs" }}
  label="Item"
  labelProps={{ title: "label" }}
  ref={createRef<HTMLLIElement>()}
/>;
<InnerWrap
  disabled={false}
  isFocused={false}
  priority="default"
  ref={createRef<HTMLDivElement>()}
/>;
<LeadingItems disabled size="sm" ref={createRef<HTMLDivElement>()} />;
function CustomMenuItem(props: ComponentPropsWithRef<"article">) {
  return <article {...props} />;
}
function CustomInner({ tone, ...props }: ComponentPropsWithRef<"section"> & { tone: "quiet" }) {
  return <section data-tone={tone} {...props} />;
}
<MenuListItem
  as={CustomMenuItem}
  details="Details"
  detailsProps={{ as: "small" }}
  innerWrapProps={{ as: "section" }}
  label="Item"
  labelProps={{ as: "p" }}
/>;
<InnerWrap as={CustomInner} disabled={false} isFocused={false} priority="default" tone="quiet" />;
<LeadingItems as="aside" disabled={false} />;
// @ts-expect-error The canonical exported InnerWrap requires its state props.
<InnerWrap />;
// @ts-expect-error The canonical exported LeadingItems requires disabled state.
<LeadingItems />;
// @ts-expect-error The public MenuListItemProps export excludes internal polymorphic props.
const polymorphicPublicProps: MenuListItemProps = { as: "div" };
void polymorphicPublicProps;
// @ts-expect-error The regular component has no large form size.
<MenuListItem label="Item" size="lg" />;
// @ts-expect-error Priority has only primary, danger, and default values.
<MenuListItem label="Item" priority="warning" />;
