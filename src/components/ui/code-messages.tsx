"use client";

import { createContext, useContext, type ReactNode } from "react";

export interface CodeMessages {
  readonly copiedTooltip: string;
  readonly copyButtonLabel: string;
  readonly copyErrorTooltip: string;
  readonly copyTooltip: string;
}

export const defaultCodeMessages: CodeMessages = {
  copiedTooltip: "Copied",
  copyButtonLabel: "Copy snippet",
  copyErrorTooltip: "Unable to copy",
  copyTooltip: "Copy",
};

const CodeMessagesContext = createContext(defaultCodeMessages);

export function CodeMessagesProvider({
  children,
  messages,
}: {
  children: ReactNode;
  messages: CodeMessages;
}) {
  return <CodeMessagesContext.Provider value={messages}>{children}</CodeMessagesContext.Provider>;
}

export function useCodeMessages() {
  return useContext(CodeMessagesContext);
}
