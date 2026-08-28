// url=https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B/%F0%9F%90%A6-Components?node-id=6943-13522
// source=src/components/ui/alert.tsx
// component=Alert

import figma from "figma";

const instance = figma.selectedInstance;
const variant = instance.getEnum("variant", {
  danger: "danger",
  info: "info",
  muted: "muted",
  success: "success",
  warning: "warning",
});
const system = instance.getEnum("system", {
  False: false,
  True: true,
});
const showIcon = instance.getBoolean("showIcon");
const hasExpandedContent = instance.getBoolean("expand");
const hasTrailingItems = instance.getBoolean("trailingItems");
const information = instance.getSlot("information");
const additional = instance.findText("Additional")?.textContent;
const trailingSlot = instance.getSlot("trailingSlot");

const alertCodeConnect = {
  id: "Alert",
  imports: ['import { Alert } from "@/components/ui/alert"'],
  example: figma.code`<Alert variant="${variant}"${figma.helpers.react.renderProp(
    "system",
    system,
  )}${figma.helpers.react.renderProp("showIcon", showIcon)}${
    hasExpandedContent ? figma.code` defaultExpanded expand="${additional}"` : ""
  }${hasTrailingItems ? figma.code` trailingItems={${trailingSlot}}` : ""}>${information}</Alert>`,
  metadata: { nestable: true },
};

export default alertCodeConnect;
