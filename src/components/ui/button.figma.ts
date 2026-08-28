// url=https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B/%F0%9F%90%A6-Components?node-id=384-2119
// source=src/components/ui/button.tsx
// component=Button

import figma from "figma";

const instance = figma.selectedInstance;
const variant = instance.getEnum("priority", {
  default: "secondary",
  primary: "primary",
  danger: "danger",
  warning: "warning",
  transparent: "transparent",
  link: "link",
});
const size = instance.getEnum("size", {
  zero: "zero",
  xs: "xs",
  sm: "sm",
  md: "md",
});
const disabled = instance.getEnum("state", {
  Default: false,
  Hover: false,
  Active: false,
  disabled: true,
  Focused: false,
});
const children = instance.findText("Children")?.textContent;

const buttonCodeConnect = {
  id: "Button",
  imports: ['import { Button } from "@/components/ui/button"'],
  example: figma.code`<Button variant="${variant}" size="${size}"${disabled ? " disabled" : ""}>${children}</Button>`,
  metadata: { nestable: true },
};

export default buttonCodeConnect;
