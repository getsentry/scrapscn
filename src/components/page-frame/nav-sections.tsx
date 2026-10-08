import * as React from "react";

import { FeatureBadge, ProjectsBadge, Tag } from "../ui/badge";
import { IconAllProjects, IconMyProjects, IconDashboard } from "./icons";
import type { NavKey } from "./nav-rail";
import { SidebarNav, SidebarItem, SidebarSeparator } from "./sidebar";
import { SidebarAccordion } from "./sidebar-accordion";

/**
 * The secondary-nav content for every primary section, keyed by {@link NavKey}
 * and ported from the Figma nav spec. This is the single source the app shell
 * reads from for both the docked panel and the hover-peek flyout — hovering a
 * rail item shows that section's content. Each section's selected (active) item
 * matches the Figma. Standard rows are text-only with indicators trailing;
 * saved-list rows carry a leading identity icon plus a trailing count.
 */
export const NAV_SECTIONS: Record<NavKey, { title: string; content: React.ReactNode }> = {
  issues: {
    title: "Issues",
    content: (
      <>
        <SidebarNav>
          <SidebarItem active>Feed</SidebarItem>
          <SidebarItem>Supergroups</SidebarItem>
        </SidebarNav>
        <SidebarSeparator />
        <SidebarNav>
          <SidebarItem>Errors &amp; Outages</SidebarItem>
          <SidebarItem>Breached Metrics</SidebarItem>
          <SidebarItem>Warnings</SidebarItem>
          <SidebarItem>User Feedback</SidebarItem>
        </SidebarNav>
        <SidebarSeparator />
        <SidebarNav>
          <SidebarItem>All Views</SidebarItem>
        </SidebarNav>
        <SidebarSeparator />
        <SidebarAccordion title="Views">
          <SidebarItem icon={IconAllProjects} badge={<Tag variant="muted">99+</Tag>}>
            Easy Fixes
          </SidebarItem>
          <SidebarItem icon={IconMyProjects} badge={<Tag variant="muted">55</Tag>}>
            Assigned
          </SidebarItem>
          <SidebarItem
            leading={<ProjectsBadge projectPlatforms={["python", "javascript"]} />}
            badge={<Tag variant="muted">0</Tag>}
          >
            High Volume
          </SidebarItem>
          <SidebarItem badge={<Tag variant="muted">1</Tag>}>New Issues</SidebarItem>
          <SidebarItem badge={<Tag variant="muted">5</Tag>}>Assigned to Members</SidebarItem>
          <SidebarItem badge={<Tag variant="muted">46</Tag>}>
            Issue Detection - For Triage
          </SidebarItem>
          <SidebarItem badge={<Tag variant="muted">12</Tag>}>Emerge Unresolved</SidebarItem>
          <SidebarItem badge={<Tag variant="muted">60</Tag>}>Seer Explorer</SidebarItem>
          <SidebarItem badge={<Tag variant="muted">99+</Tag>}>Ecosystem SLOs</SidebarItem>
        </SidebarAccordion>
      </>
    ),
  },

  explore: {
    title: "Explore",
    content: (
      <>
        <SidebarNav>
          <SidebarItem active>Traces</SidebarItem>
          <SidebarItem>Logs</SidebarItem>
          <SidebarItem badge={<FeatureBadge type="beta" />}>Metrics</SidebarItem>
          <SidebarItem>Discover</SidebarItem>
          <SidebarItem>Profiles</SidebarItem>
          <SidebarItem>Replays</SidebarItem>
          <SidebarItem>Releases</SidebarItem>
          <SidebarItem badge={<FeatureBadge type="alpha" />}>Agents</SidebarItem>
        </SidebarNav>
        <SidebarSeparator />
        <SidebarNav>
          <SidebarItem>All Queries</SidebarItem>
        </SidebarNav>
        <SidebarSeparator />
        <SidebarAccordion title="Starred Queries">
          <SidebarItem leading={<ProjectsBadge projectPlatforms={["javascript"]} />}>
            Issue Stream Performance
          </SidebarItem>
          <SidebarItem leading={<ProjectsBadge projectPlatforms={["go", "python"]} />}>
            Top Server Calls potential
          </SidebarItem>
        </SidebarAccordion>
      </>
    ),
  },

  dashboards: {
    title: "Dashboards",
    content: (
      <>
        <SidebarNav>
          <SidebarItem active>All Dashboards</SidebarItem>
          <SidebarItem>Sentry Built</SidebarItem>
        </SidebarNav>
        <SidebarSeparator />
        <SidebarAccordion title="Starred Dashboards">
          <SidebarItem icon={IconDashboard}>AI Agents Overview</SidebarItem>
          <SidebarItem icon={IconDashboard}>Backend Overview</SidebarItem>
          <SidebarItem icon={IconDashboard}>MCP Overview</SidebarItem>
          <SidebarItem icon={IconDashboard}>Mobile Vitals</SidebarItem>
          <SidebarItem icon={IconDashboard}>Outbound API Requests</SidebarItem>
          <SidebarItem leading={<ProjectsBadge projectPlatforms={["javascript"]} />}>
            Project Details
          </SidebarItem>
          <SidebarItem icon={IconDashboard}>Web Vitals</SidebarItem>
        </SidebarAccordion>
      </>
    ),
  },

  monitors: {
    title: "Monitors",
    content: (
      <>
        <SidebarNav>
          <SidebarItem active>All Monitors</SidebarItem>
          <SidebarItem>My Monitors</SidebarItem>
        </SidebarNav>
        <SidebarSeparator />
        <SidebarAccordion title="By Data Type">
          <SidebarItem>Errors</SidebarItem>
          <SidebarItem>Metrics</SidebarItem>
          <SidebarItem>Crons</SidebarItem>
          <SidebarItem>Uptime</SidebarItem>
          <SidebarItem>Mobile Builds</SidebarItem>
        </SidebarAccordion>
        <SidebarSeparator />
        <SidebarNav>
          <SidebarItem>Alerts</SidebarItem>
        </SidebarNav>
      </>
    ),
  },

  insights: { title: "Insights", content: <></> },

  settings: {
    title: "Settings",
    content: (
      <>
        <SidebarAccordion title="Account">
          <SidebarItem active>Account Details</SidebarItem>
          <SidebarItem>Security</SidebarItem>
          <SidebarItem>Notifications</SidebarItem>
          <SidebarItem>Email Addresses</SidebarItem>
          <SidebarItem>Subscriptions</SidebarItem>
          <SidebarItem>Authorized Applications</SidebarItem>
          <SidebarItem>Identities</SidebarItem>
          <SidebarItem>Close Account</SidebarItem>
        </SidebarAccordion>
        <SidebarAccordion title="Organization" defaultOpen={false}>
          <SidebarItem>General Settings</SidebarItem>
          <SidebarItem>Projects</SidebarItem>
          <SidebarItem>Teams</SidebarItem>
          <SidebarItem>Members</SidebarItem>
          <SidebarItem>Security &amp; Privacy</SidebarItem>
          <SidebarItem>Auth</SidebarItem>
          <SidebarItem>Audit Log</SidebarItem>
          <SidebarItem>Repositories</SidebarItem>
          <SidebarItem badge={<FeatureBadge type="experimental" />}>Dynamic Sampling</SidebarItem>
          <SidebarItem>Feature Flags</SidebarItem>
          <SidebarItem>Seer</SidebarItem>
        </SidebarAccordion>
      </>
    ),
  },
};
