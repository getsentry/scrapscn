// url=https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B/%F0%9F%90%A6-Components?node-id=3574-5396
// source=src/components/ui/badge.tsx
// component=Tag

import figma from "figma";

const instance = figma.selectedInstance;
const variant = instance.getEnum("variant", {
  info: "info",
  danger: "danger",
  warning: "warning",
  success: "success",
  muted: "muted",
  promotion: "promotion",
});
const label = instance.findText("Label")?.textContent;

export default {
  id: "Tag",
  imports: ['import { Tag } from "@/components/ui/badge"'],
  example: figma.code`<Tag variant="${variant}">${label}</Tag>`,
  metadata: { nestable: true },
};
