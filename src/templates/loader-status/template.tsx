import { Playground } from "@/components/playground/playground";

import type { TemplateProps } from "../types";

export default function LoaderStatusTemplate({ templates }: TemplateProps) {
  return <Playground templates={templates} />;
}
