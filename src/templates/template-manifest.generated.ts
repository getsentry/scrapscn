import Template0 from "./checkbox-settings/template"
import Template1 from "./loader-status/template"
import Template2 from "./page-frame/template"

import type { TemplateDefinition } from "./types"

export const templates = [
  { component: Template0, metadata: {"slug":"checkbox-settings","title":"Checkbox settings","description":"Compose and review native Checkbox controls in a Sentry project settings page.","tags":["checkbox","form","settings"]} },
  { component: Template1, metadata: {"slug":"loader-status","title":"Loader status","description":"Share an indeterminate loading state in a Sentry status panel.","tags":["loader","status","progress"]} },
  { component: Template2, metadata: {"slug":"page-frame","title":"Page frame","description":"Reusable Sentry navigation, breadcrumbs, and responsive page chrome.","tags":["navigation","layout","page-frame"]} },
] satisfies TemplateDefinition[]
