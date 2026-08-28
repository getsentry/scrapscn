// url=https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B/%F0%9F%90%A6-Components?node-id=3574-5698
// source=src/components/ui/badge.tsx
// component=FeatureBadge

import figma from "figma";

const type = figma.selectedInstance.getEnum("type", {
  alpha: "alpha",
  beta: "beta",
  new: "new",
  experimental: "experimental",
  debug: "debug",
});

export default {
  id: "FeatureBadge",
  imports: ['import { FeatureBadge } from "@/components/ui/badge"'],
  example: figma.code`<FeatureBadge type="${type}" />`,
  metadata: { nestable: true },
};
