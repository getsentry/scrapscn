import type { ComponentType } from "react"

export interface TemplateMetadata {
  description: string
  slug: string
  tags: string[]
  title: string
}

export interface TemplateProps {
  templates: TemplateMetadata[]
}

export interface TemplateDefinition {
  component: ComponentType<TemplateProps>
  metadata: TemplateMetadata
}
