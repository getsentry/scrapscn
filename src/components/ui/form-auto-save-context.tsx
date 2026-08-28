"use client";

import { createContext, useContext, type ReactNode, type RefObject } from "react";

export type AutoSaveContextValue = {
  resetOnErrorRef: RefObject<boolean>;
  status: "pending" | "error" | "idle" | "success";
};

const AutoSaveContext = createContext<AutoSaveContextValue | null>(null);

export function useAutoSaveContext() {
  return useContext(AutoSaveContext);
}

export function AutoSaveContextProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: AutoSaveContextValue;
}) {
  return <AutoSaveContext.Provider value={value}>{children}</AutoSaveContext.Provider>;
}
