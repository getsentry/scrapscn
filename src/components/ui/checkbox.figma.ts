// url=https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B/%F0%9F%90%A6-Components?node-id=3481-4211&m=draw&t=ITviPfKTjIMGFJOi-11
// source=src/components/ui/checkbox.tsx
// component=Checkbox

import figma from "figma";

const instance = figma.selectedInstance;
const size = instance.getEnum("size", {
  xs: "xs",
  sm: "sm",
  md: "md",
});
const checked = instance.getEnum("checked", {
  False: false,
  indeterminate: "indeterminate",
  True: true,
});
// Hover, active, and focus are runtime interaction states rather than public props.
const disabled = instance.getEnum("state", {
  Default: false,
  Hover: false,
  Active: false,
  disabled: true,
  Focused: false,
});

const checkboxCodeConnect = {
  id: "Checkbox",
  imports: ['import { Checkbox } from "@/components/ui/checkbox"'],
  example: figma.code`<Checkbox${figma.helpers.react.renderProp(
    "size",
    size,
  )}${figma.helpers.react.renderProp(
    "checked",
    checked,
  )}${figma.helpers.react.renderProp("disabled", disabled)} />`,
  metadata: { nestable: true },
};

export default checkboxCodeConnect;
