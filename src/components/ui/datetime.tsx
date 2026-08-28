"use client";

import { createContext, useContext, type ReactNode } from "react";

export interface DateTimeContextValue {
  clockDisplay: "12" | "24";
  timezone: string;
}

const defaultDateTime: DateTimeContextValue = {
  clockDisplay: "12",
  timezone: "UTC",
};

const DateTimeContext = createContext<DateTimeContextValue>(defaultDateTime);

export function DateTimeProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: DateTimeContextValue;
}) {
  return <DateTimeContext value={value}>{children}</DateTimeContext>;
}

export function useTimezone(): string {
  return useContext(DateTimeContext).timezone;
}

export function useClockDisplay(): DateTimeContextValue["clockDisplay"] {
  return useContext(DateTimeContext).clockDisplay;
}
