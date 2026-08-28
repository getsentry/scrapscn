import { createRef } from "react";
import type { GroupTypeBase as V4Group, StylesConfig as V4StylesConfig } from "react-select";
import type { SelectComponentsConfig as V4Components } from "react-select/src/components";

import type { MenuListItemProps } from "../../src/components/ui/menu-list-item";
import {
  Select,
  type ControlProps,
  type GeneralSelectValue,
  type SelectValue,
  type StylesConfig,
} from "../../src/components/ui/select";
import type { CSSObject, SelectComponents } from "../../src/components/ui/select-types";

type ProjectOption = SelectValue<string> & { slug: string };
const options: ProjectOption[] = [{ label: "Web", slug: "web", value: "1" }];
const emotionLike = { name: "tooltip", styles: "color: red", next: undefined };

<Select options={options} onChange={(option) => option.slug} />;
<Select
  name="project"
  options={options}
  onChange={(option, actionMeta) => {
    if (actionMeta.action === "clear") return actionMeta.removedValues.length;
    if (actionMeta.action === "remove-value") return actionMeta.removedValue.slug;
    if (actionMeta.action === "select-option") return actionMeta.option?.slug;
    return `${option.slug}:${actionMeta.action}:${actionMeta.name}`;
  }}
/>;
<Select clearable options={options} onChange={(option) => option?.slug} />;
<Select
  multiple
  options={options}
  onChange={(selected) => selected.map((option) => option.slug)}
/>;
<Select<ProjectOption>
  async
  creatable
  loadOptions={async () => options}
  multiple
  onChange={(selected) => selected}
/>;
<Select choices={["One", [2, "Two"]]} />;
<Select options={[{ label: "Projects", options }]} value="1" />;

const controller = createRef<{ blur: () => void; focus: () => void }>();
const stateManagerController = createRef<{
  blur: () => void;
  focus: () => void;
  select: {
    blur: () => void;
    focus: () => void;
    inputRef: HTMLInputElement | null;
  };
}>();
const input = createRef<HTMLInputElement>();
<Select inputRef={input} options={options} ref={controller} />;
<Select options={options} ref={stateManagerController} />;
stateManagerController.current?.select.focus();
stateManagerController.current?.select.inputRef?.select();

const styles = {
  control: (provided, state) => ({
    ...provided,
    ":hover": { color: state.isFocused ? "red" : "blue" },
    color: "red",
  }),
  menu: (provided, state) => ({
    ...provided,
    top: state.menuPosition === "fixed" ? 0 : 1,
  }),
  menuPortal: (provided, state) => ({
    ...provided,
    left: state.controlElement.getBoundingClientRect().left,
    zIndex: 10,
  }),
} satisfies StylesConfig;
<Select options={options} styles={styles} />;
<Select
  ariaLiveMessages={{
    onChange: ({ name, selectValue }) => `${name}:${selectValue?.length}`,
  }}
  name="project"
  options={options}
/>;

declare const pinnedComponents: V4Components<ProjectOption, boolean, V4Group<ProjectOption>>;
const localComponents: SelectComponents<ProjectOption> = pinnedComponents;
void localComponents;

declare const pinnedStyles: V4StylesConfig<GeneralSelectValue, boolean>;
const localV4Styles: StylesConfig = pinnedStyles;
void localV4Styles;
const validInterpolation: CSSObject = {
  "&:hover": { color: null, display: false },
};
void validInterpolation;

const readonlyOptions = options as readonly ProjectOption[];
const readonlyGroups = [{ label: "Projects", options: readonlyOptions }] as const;
<Select
  allowCreateWhileLoading
  choices={["One", [2, "Two"]] as const}
  createOptionPosition="first"
  formatCreateLabel={(value) => `Add ${value}`}
  getNewOptionData={(value, label) => ({ label, slug: value, value })}
  isValidNewOption={(value, selected, available, accessors) =>
    Boolean(
      value && selected.length + available.length + accessors.getOptionValue(options[0]).length,
    )
  }
  options={readonlyGroups}
/>;

const broad: ControlProps<ProjectOption> = {
  "aria-label": "Project",
  cacheOptions: true,
  clearable: true,
  components: { Option: (props) => <div>{props.label}</div> },
  filterOption: ({ data }, query) => data.slug.includes(query),
  formatOptionLabel: (option, meta) => `${meta.context}: ${option.slug}`,
  isSearchable: true,
  onChange: (option) => option?.slug,
  options,
};
void broad;

const serializedSelectValue: SelectValue<string> = {
  label: "Web",
  // @ts-expect-error SelectValue inherits MenuListItem's portable Tooltip overlayStyle boundary.
  tooltipOptions: { overlayStyle: emotionLike },
  value: "1",
};
const serializedMenuItem: MenuListItemProps = {
  // @ts-expect-error MenuListItem keeps the same inherited boundary directly.
  tooltipOptions: { overlayStyle: emotionLike },
};
void serializedSelectValue;
void serializedMenuItem;

declare const general: GeneralSelectValue;
void general.value;

<Select
  options={options}
  onChange={(option) => {
    // @ts-expect-error Unclearable single Select never emits null.
    const impossible: null = option;
    return impossible;
  }}
/>;
// @ts-expect-error Clearable single Select must handle null.
<Select clearable options={options} onChange={(option: ProjectOption) => option} />;
// @ts-expect-error Multiple Select emits an array.
<Select multiple options={options} onChange={(option: ProjectOption) => option} />;
// @ts-expect-error Multiple mode must be the literal discriminant.
<Select multiple={Math.random() > 0.5} options={options} />;
// @ts-expect-error inputRef requires an input element ref, not the controller ref.
<Select inputRef={controller} options={options} />;
// @ts-expect-error StylesConfig has exactly the react-select v4 structural slots.
const invalidStyles: StylesConfig = { tooltip: {} };
void invalidStyles;
// @ts-expect-error StylesConfig slots accept callbacks, not raw CSS objects.
const rawStyles: StylesConfig = { menuPortal: { zIndex: 10 } };
void rawStyles;
// @ts-expect-error The wrapper owns automatic menu placement.
<Select menuPlacement="bottom" options={options} />;
