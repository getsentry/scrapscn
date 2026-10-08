# Page frame

Open `/templates/page-frame` or select **Page frame** in the playground’s template menu. The preview supports product navigation, light/dark themes, 390px and 800px containers, sidebar collapse, and a Share URL that restores those choices.

In Storybook, open **Compositions → Page Frame**. It includes API documentation and five interactive examples: Desktop, Collapsed, Mobile, Dark, and With Panel. Run `pnpm storybook` locally; the deployed build serves the same entry at `/storybook/index.html?path=/docs/compositions-page-frame--docs`. Primary navigation updates the example’s selected product and breadcrumb, and the `active` control selects its initial product.

This is a port of Ivy Sanders Schneider’s shared frame from `getsentry/seer-automation-vision`, originally added in commit `142f5dd` and read from checkout `403f413`. The reusable source is in `src/components/page-frame/`. It preserves Ivy’s 76px primary rail, 188px sidebar, 53px aligned headers, scrollable main region, and optional right panel.

The default rail follows the [Page Frame v1 Figma specification](https://www.figma.com/design/a638AEl7pFxj29zMODCiOB/Specs--Page-Frame-v1?node-id=1635-44521): Issues, Explore, Dashboards, Insights, Monitors, Settings. Inbox and Seer are not rail destinations. Ask Seer remains an optional header action. Default secondary content is example data; supply your own sidebar links and destinations. Insights has an empty sidebar until its contents are specified.

```tsx
"use client";

import {
  Breadcrumbs,
  PageFrame,
  SidebarItem,
  SidebarNav,
} from "@/components/page-frame";

export function IssuesPage() {
  return (
    <PageFrame
      active="issues"
      title={<Breadcrumbs items={[{ label: "Issues" }, { label: "Feed" }]} />}
      sidebar={
        <SidebarNav>
          <SidebarItem href="/issues" active>Feed</SidebarItem>
          <SidebarItem href="/issues/feedback">User Feedback</SidebarItem>
        </SidebarNav>
      }
      contentClassName="p-6"
    >
      <h1>Issue feed</h1>
    </PageFrame>
  );
}
```

Use routes that exist in your prototype. `onNavigate` handles primary navigation; `navItems` changes its order and icons, while `sectionSidebars` supplies the content used for hover previews. `sidebar={null}` opts an active destination out of secondary navigation. `actions`, `organization`, `railFooter`, and `panel` are replaceable slots. `AskSeerActions` accepts `onAskSeer`, `onSearch`, and `onBroadcasts`; actions without a handler are disabled. Sidebar items without an `href` render as static text.

The sidebar keeps Ivy’s three behaviors: docked; a different section shown on hover/focus; and a temporary flyout while collapsed that can be pinned open. A persistent Expand button and focus return also support keyboard users. Use `collapsed` with `onCollapsedChange` for URL-driven state, or `defaultCollapsed` for local state.

At container widths below 992px, the port adds a Sheet navigation drawer and a 48px mobile row above Ivy’s 53px page header. This is a responsive adaptation of Ivy’s desktop implementation, not a claim that its 53px header matches the older 48px Figma variant. The original icon paths are retained; navigation colors are scoped to `.sentry-page-frame` in the existing base theme, without changing the project’s typography scale.

The existing `playground/SentryPageFrame` remains available for the component parity workbenches. This contribution adds a reusable composition and template; it does not publish a registry package or change those baselines.
