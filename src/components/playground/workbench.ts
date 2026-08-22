import type { ReactNode } from "react";

export type WorkbenchTheme = "dark" | "light";
export type WorkbenchViewport = "desktop" | "mobile";

export type WorkbenchSession = {
  breadcrumbs: string[];
  controls: ReactNode;
  description: string;
  preview: ReactNode;
  reset: () => URLSearchParams;
  serialize: () => URLSearchParams;
  title: string;
};

export type WorkbenchProps = {
  children: (session: WorkbenchSession) => ReactNode;
  onCollapseSetup: () => void;
  onSearchChange: (params: URLSearchParams) => void;
  sourceSearch: string;
};

export function parseWorkbenchTheme(value: string | null): WorkbenchTheme | null {
  return value === "dark" || value === "light" ? value : null;
}

export function parseWorkbenchViewport(value: string | null): WorkbenchViewport {
  return value === "mobile" ? "mobile" : "desktop";
}
