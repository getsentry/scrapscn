import { Suspense } from "react"

import { CheckboxPlayground } from "@/components/playground/checkbox-playground"
import { templates } from "@/templates/template-manifest.generated"

export default function PlaygroundPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-muted" />}>
      <CheckboxPlayground templates={templates.map(({ metadata }) => metadata)} />
    </Suspense>
  )
}
