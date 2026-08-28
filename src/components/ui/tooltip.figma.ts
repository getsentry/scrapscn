// url=https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B/%F0%9F%90%A6-Components?node-id=6775-627&m=draw&t=ITviPfKTjIMGFJOi-11
// source=src/components/ui/tooltip.tsx
// component=Tooltip

import figma from "figma";

const instance = figma.selectedInstance;
const title = instance.findText("Text")?.textContent;
const position = instance.getEnum("position", {
  top: "top",
  bottom: "bottom",
  left: "left",
  right: "right",
});

const tooltipCodeConnect = {
  id: "Tooltip",
  imports: ['import { Tooltip } from "@/components/ui/tooltip"'],
  example: figma.code`<Tooltip title="${title}" position="${position}">Trigger</Tooltip>`,
  metadata: { nestable: true },
};

export default tooltipCodeConnect;
