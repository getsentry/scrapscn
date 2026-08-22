"use client";

import { createContext, useContext, type ReactNode } from "react";

type SizeVariant = "xs" | "sm" | "md";

/** Holds the inherited regular Scraps component size. */
export const SizeContext = createContext<SizeVariant | undefined>(undefined);

/** Provides an inherited xs, sm, or md regular Scraps component size. */
export function SizeProvider({
  size,
  children,
}: {
  children: ReactNode;
  size: SizeVariant;
}) {
  return <SizeContext value={size}>{children}</SizeContext>;
}

/** Reads the inherited regular Scraps component size. */
export function useSizeContext(): SizeVariant | undefined {
  return useContext(SizeContext);
}
