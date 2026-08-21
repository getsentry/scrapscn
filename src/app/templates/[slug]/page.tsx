import { Suspense } from "react"
import { notFound } from "next/navigation"

import { templates } from "@/templates/template-manifest.generated"

export function generateStaticParams() {
  return templates.map(({ metadata }) => ({ slug: metadata.slug }))
}

export const dynamicParams = false

export default async function TemplatePage({ params }: PageProps<"/templates/[slug]">) {
  const { slug } = await params
  const template = templates.find(({ metadata }) => metadata.slug === slug)
  if (!template) notFound()

  const Template = template.component
  const templateMetadata = templates.map(({ metadata }) => metadata)

  return (
    <Suspense fallback={<div className="min-h-dvh bg-muted" />}>
      <Template templates={templateMetadata} />
    </Suspense>
  )
}
