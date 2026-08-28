// url=https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B/%F0%9F%90%A6-Components?node-id=3537-20061
// source=src/components/ui/textarea.tsx
// component=TextArea

import figma from "figma";

const instance = figma.selectedInstance;
const size = instance.getEnum("size", {
  sm: "sm",
  md: "md",
});
const disabled = instance.getEnum("state", {
  default: false,
  disabled: true,
});

const textAreaCodeConnect = {
  id: "TextArea",
  imports: ['import { TextArea } from "@/components/ui/textarea"'],
  example: figma.code`<TextArea${figma.helpers.react.renderProp("size", size)}${figma.helpers.react.renderProp("disabled", disabled)} />`,
  metadata: { nestable: true },
};

export default textAreaCodeConnect;
