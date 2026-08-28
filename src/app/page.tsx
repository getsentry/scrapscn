import { Suspense } from "react";

import { Playground } from "@/components/playground/playground";
import { templates } from "@/templates/template-manifest.generated";

export default function PlaygroundPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-muted" />}>
      <Playground templates={templates.map(({ metadata }) => metadata)} />
    </Suspense>
  );
}
