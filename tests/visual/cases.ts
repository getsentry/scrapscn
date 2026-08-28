import type { Page } from "playwright/test";

import type { WorkbenchId } from "@/components/playground/workbenches";

interface VisualCase {
  prepare?: (page: Page) => Promise<void>;
  searchParams?: Record<string, string>;
}

const visualCases = {
  chat: {
    searchParams: {
      chatStatus: "success",
      chatThinking: "false",
    },
  },
  "compact-select": {
    prepare: async (page) => {
      await page
        .getByTestId("compact-select-preview")
        .getByRole("button", { name: /Frontend/ })
        .click();
    },
  },
  drawer: {
    prepare: async (page) => {
      await page.getByTestId("drawer-preview").getByRole("button", { name: "Open drawer" }).click();
    },
  },
  modal: {
    prepare: async (page) => {
      await page.getByTestId("modal-preview").getByRole("button", { name: "Open modal" }).click();
    },
  },
  "reveal-on-hover": {
    searchParams: { revealVisible: "true" },
  },
  select: {
    prepare: async (page) => {
      await page.getByTestId("select-preview").getByLabel("Project selector").press("ArrowDown");
    },
  },
  "slide-over-panel": {
    searchParams: { slideOpen: "true" },
  },
  tooltip: {
    searchParams: { tooltipVisible: "true" },
  },
} satisfies Partial<Record<WorkbenchId, VisualCase>>;

export function getVisualCase(component: string): VisualCase | undefined {
  return visualCases[component as keyof typeof visualCases];
}
