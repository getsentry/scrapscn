// url=https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B/%F0%9F%90%A6-Components?node-id=3482-4251&m=draw&t=ITviPfKTjIMGFJOi-11
// source=src/components/ui/radio.tsx
// component=Radio

import figma from "figma";

const instance = figma.selectedInstance;
const size = instance.getEnum("size", {
  md: "md",
  sm: "sm",
});
const checked = instance.getEnum("checked", {
  False: false,
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

const radioCodeConnect = {
  id: "Radio",
  imports: ['import { Radio } from "@/components/ui/radio"'],
  example: figma.code`<Radio${figma.helpers.react.renderProp(
    "size",
    size,
  )}${figma.helpers.react.renderProp(
    "checked",
    checked,
  )}${figma.helpers.react.renderProp("disabled", disabled)} />`,
  metadata: { nestable: true },
};

export default radioCodeConnect;
