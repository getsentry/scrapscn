"use client";

import { createContext } from "react";

export type ContainerQueryBreakpoint =
  | "zero"
  | "3xs"
  | "2xs"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "5xl";

/** Shares the nearest layout query-container breakpoint with logical descendants. */
export const ContainerQueryContext =
  createContext<ContainerQueryBreakpoint | null>(null);
