"use client";

import { createContext, useContext, type ReactNode } from "react";

import { t, tct, type ScrapsTranslationArgument } from "../../lib/scraps-locale";

export type TranslationContextValue = {
  t: (message: string, ...args: Array<ReactNode | Record<string, ReactNode>>) => string;
  tct: (template: string, components: Record<string, ReactNode>) => ReactNode;
};

const TranslationContext = createContext<TranslationContextValue>({
  t: (message, ...args) => t(message, ...(args as ScrapsTranslationArgument[])),
  tct,
});

export const TranslationContextProvider = TranslationContext.Provider;

export function useTranslation() {
  return useContext(TranslationContext);
}
