// url=https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B/%F0%9F%90%A6-Components?node-id=3277-4566
// source=src/components/ui/switch.tsx
// component=Switch

import figma from "figma";

const instance = figma.selectedInstance;
const size = instance.getEnum("size", { lg: "lg", sm: "sm" });
const checked = instance.getBoolean("checked");

const switchCodeConnect = {
  id: "Switch",
  imports: ['import { Switch } from "@/components/ui/switch"'],
  example: figma.code`<Switch${figma.helpers.react.renderProp(
    "size",
    size,
  )}${figma.helpers.react.renderProp("checked", checked)} />`,
  metadata: { nestable: true },
};

export default switchCodeConnect;
