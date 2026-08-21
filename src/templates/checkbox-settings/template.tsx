import { CheckboxPlayground } from "@/components/playground/checkbox-playground"

import type { TemplateProps } from "../types"

export default function CheckboxSettingsTemplate({ templates }: TemplateProps) {
  return <CheckboxPlayground templates={templates} />
}
