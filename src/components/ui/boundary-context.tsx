"use client";

import { createContext, useContext } from "react";

const BoundaryContext = createContext<string | null>(null);

export const BoundaryContextProvider = BoundaryContext.Provider;

export function useBoundaryContext() {
  return useContext(BoundaryContext);
}
