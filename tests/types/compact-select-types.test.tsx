import { useState } from "react";

import {
  CompactSelect,
  CompositeSelect,
  ControlContext,
  HighlightText,
  LeadWrap,
  ListBox,
  ListLabel,
  ListSeparator,
  ListWrap,
  MenuComponents,
  SectionGroup,
  SectionHeader,
  SectionSeparator,
  SectionTitle,
  SectionToggle,
  SectionWrap,
  SelectFilterContext,
  SizeLimitMessage,
  TriggerLabel,
  getDisabledOptions,
  getEscapedKey,
  getHiddenOptions,
  getItemsWithKeys,
  itemIsSectionWithKey,
  useVirtualizedItems,
  type MultipleSelectProps,
  type SearchMatchResult,
  type SelectKey,
  type SelectOption,
  type SelectOptionOrSection,
  type SelectOptionOrSectionWithKey,
  type SelectOptionWithKey,
  type SelectProps,
  type SelectSection,
  type SelectSectionWithKey,
  type SingleSelectProps,
} from "@/components/ui/compact-select";

const options: Array<SelectOption<"one" | "two">> = [
  { value: "one", label: "One" },
  { value: "two", label: "Two", details: "Second" },
];
const keyboardDelegate = {
  getKeyBelow: () => "two" as const,
  getKeyForSearch: () => "one" as const,
};
const layoutDelegate = {
  getContentSize: () => ({ height: 64, width: 200 }),
  getItemRect: () => ({ height: 32, width: 200, x: 0, y: 0 }),
  getVisibleRect: () => ({ height: 64, width: 200, x: 0, y: 0 }),
};

function SingleExample() {
  const [value, setValue] = useState<"one" | "two">();
  return (
    <CompactSelect<"one" | "two">
      closeOnSelect={(option) => {
        const valueFromOption: "one" | "two" = option.value;
        return valueFromOption === "two";
      }}
      options={options}
      onChange={(option) => setValue(option.value)}
      value={value}
    />
  );
}

function ClearableExample() {
  const [value, setValue] = useState<"one" | "two">();
  return (
    <CompactSelect
      clearable
      closeOnSelect={(option) => option === undefined}
      options={options}
      onChange={(option) => setValue(option?.value)}
      value={value}
    />
  );
}

function MultipleExample() {
  const [value, setValue] = useState<Array<"one" | "two">>([]);
  return (
    <CompactSelect<"one" | "two">
      multiple
      closeOnSelect={(selected) => selected.length > 2}
      options={options}
      onChange={(selected) => setValue(selected.map((option) => option.value))}
      value={value}
    />
  );
}

void SingleExample;
void ClearableExample;
void MultipleExample;

const inferredSingleValue: "one" | "two" = "one";
<CompactSelect
  value={inferredSingleValue}
  onChange={(option) => {
    const exact: SelectOption<"one" | "two"> = option;
    void exact;
  }}
  options={[
    { value: "one", label: "One" },
    { value: "two", label: "Two" },
  ]}
/>;
const inferredMultipleValue: Array<"one" | "two"> = ["one"];
<CompactSelect
  multiple
  value={inferredMultipleValue}
  onChange={(selected) => {
    const exact: Array<SelectOption<"one" | "two">> = selected;
    void exact;
  }}
  options={[
    { value: "one", label: "One" },
    { value: "two", label: "Two" },
  ]}
/>;

<CompactSelect
  allowDuplicateSelectionEvents
  aria-describedby="compact-help"
  aria-details="compact-details"
  aria-label="Project"
  defaultSelectedKeys={["one"]}
  disabledBehavior="selection"
  disabledKeys={["two"]}
  disallowTypeAhead
  escapeKeyBehavior="none"
  filter={(nodes) => nodes}
  keyboardDelegate={keyboardDelegate}
  keyboardNavigationBehavior="tab"
  layoutDelegate={layoutDelegate}
  linkBehavior="action"
  mode="grid"
  menuBody={({ closeOverlay }) => <button onClick={closeOverlay}>Close</button>}
  menuFooter={({ closeOverlay, resetSearch }) => (
    <button
      onClick={() => {
        resetSearch();
        closeOverlay();
      }}
    >
      Reset
    </button>
  )}
  menuHeaderTrailingItems={({ closeOverlay }) => (
    <MenuComponents.HeaderButton onClick={closeOverlay}>Close</MenuComponents.HeaderButton>
  )}
  options={options}
  onAction={(key) => {
    const actionKey: SelectKey = key;
    void actionKey;
  }}
  onBlur={(event) => void event.relatedTarget}
  onChange={() => {}}
  onFocus={(event) => void event.currentTarget}
  onFocusChange={(focused) => void focused}
  orientation="vertical"
  flipOptions={{ fallbackPlacements: ["top-end"], flipVariations: false }}
  position="bottom-end"
  preventOverflowOptions={{ boundary: "clippingParents", padding: 16 }}
  search={{
    filter: (option, search): SearchMatchResult => ({
      score: option.textValue?.includes(search) ? 1 : 0,
    }),
    highlight: true,
    onChange: () => {},
    placeholder: "Find…",
  }}
  selectionBehavior="replace"
  shouldFocusOnHover={false}
  shouldFocusWrap
  shouldSelectOnPressUp
  strategy="fixed"
  suppressTextValueWarning
  triggerId="typed-trigger"
  trigger={(props, open) => <button {...props}>{open ? "Open" : "Closed"}</button>}
  value="one"
/>;

<CompositeSelect trigger={(props) => <button {...props}>Filters</button>}>
  <CompositeSelect.Region
    aria-label="Single region"
    disabledBehavior="all"
    filter={(nodes) => nodes}
    keyboardDelegate={keyboardDelegate}
    layoutDelegate={layoutDelegate}
    linkBehavior="selection"
    onAction={(key) => void key}
    onFocusChange={(focused) => void focused}
    options={options}
    onChange={(option) => void option.value}
    value={undefined}
    shouldFocusOnHover={false}
    shouldFocusWrap={false}
    selectionBehavior="toggle"
  />
  <CompositeSelect.Region
    disallowTypeAhead={false}
    keyboardNavigationBehavior="arrow"
    multiple
    options={options}
    onChange={(selected) => void selected.map((option) => option.value)}
    value={new Array<"one" | "two">("two")}
  />
</CompositeSelect>;

const singleProps: SingleSelectProps<"one" | "two"> = {
  onChange: () => {},
  options,
  value: "one",
};
const multipleProps: MultipleSelectProps<"one" | "two"> = {
  multiple: true,
  onChange: () => {},
  options,
  value: ["one"],
};
const selectProps: SelectProps<"one" | "two"> = multipleProps;
void singleProps;
void selectProps;

const key: SelectKey = "one";
const option: SelectOption<"one"> = { label: "One", value: "one" };
const canonicalSerializedStyles = { name: "compact-select", styles: "color:red;" };
const optionWithCanonicalStyle: SelectOption<"one"> = {
  label: "One",
  value: "one",
  tooltipOptions: {
    // @ts-expect-error Emotion SerializedStyles is an excluded portable input.
    overlayStyle: canonicalSerializedStyles,
  },
};
const section: SelectSection<"one"> = { label: "Section", options: [option] };
const optionOrSection: SelectOptionOrSection<"one"> = section;
const keyedOption: SelectOptionWithKey<"one"> = { ...option, key: "one" };
const keyedSection: SelectSectionWithKey<"one"> = {
  ...section,
  key: "section",
  options: [keyedOption],
};
const keyedUnion: SelectOptionOrSectionWithKey<"one"> = keyedSection;
void [key, optionOrSection, optionWithCanonicalStyle, keyedUnion];

void ControlContext;
void SelectFilterContext;
void HighlightText;
void LeadWrap;
void ListBox;
void ListLabel;
void ListSeparator;
void ListWrap;
void SectionGroup;
void SectionHeader;
void SectionSeparator;
void SectionTitle;
void SectionToggle;
void SectionWrap;
void SizeLimitMessage;
void TriggerLabel;
void getDisabledOptions;
void getEscapedKey;
void getHiddenOptions;
void getItemsWithKeys;
void itemIsSectionWithKey;
void useVirtualizedItems;

// @ts-expect-error Multiple selection values must be arrays.
<CompactSelect multiple options={options} onChange={() => {}} value="one" />;
// @ts-expect-error Single selection callbacks receive one option, not an array.
<CompactSelect
  options={options}
  onChange={(selected: SelectOption<"one" | "two">[]) => void selected}
  value="one"
/>;
// @ts-expect-error Values are limited to strings and numbers.
const invalidOption: SelectOption<{ id: string }> = { value: { id: "one" }, label: "One" };
void invalidOption;
