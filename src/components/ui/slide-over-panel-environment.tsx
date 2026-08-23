"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export const PRIMARY_HEADER_HEIGHT = 53;
export const SUPERUSER_MARQUEE_HEIGHT = 24;
export const NAVIGATION_MOBILE_CONTENT_HEIGHT = 48;
export const NAVIGATION_DESKTOP_BREAKPOINT = 992;

interface SlideOverPanelEnvironment {
  isMobile?: boolean;
  showSuperuserWarning: boolean;
}

const defaultEnvironment: SlideOverPanelEnvironment = {
  showSuperuserWarning: false,
};

const SlideOverPanelEnvironmentContext =
  createContext<SlideOverPanelEnvironment>(defaultEnvironment);

interface SlideOverPanelEnvironmentProviderProps {
  children: ReactNode;
  isMobile?: boolean;
  showSuperuserWarning?: boolean;
}

export function SlideOverPanelEnvironmentProvider({
  children,
  isMobile,
  showSuperuserWarning = false,
}: SlideOverPanelEnvironmentProviderProps) {
  const value = useMemo(
    () => ({ isMobile, showSuperuserWarning }),
    [isMobile, showSuperuserWarning]
  );

  return (
    <SlideOverPanelEnvironmentContext.Provider value={value}>
      {children}
    </SlideOverPanelEnvironmentContext.Provider>
  );
}

const desktopMediaQuery = `(min-width: ${NAVIGATION_DESKTOP_BREAKPOINT}px)`;

function subscribeToDesktopMediaQuery(onStoreChange: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }

  const mediaQuery = window.matchMedia(desktopMediaQuery);
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function getDesktopMediaQuerySnapshot() {
  return typeof window !== "undefined" &&
    typeof window.matchMedia === "function"
    ? window.matchMedia(desktopMediaQuery).matches
    : false;
}

export function useTopOffset() {
  const environment = useContext(SlideOverPanelEnvironmentContext);
  const matchesDesktop = useSyncExternalStore(
    subscribeToDesktopMediaQuery,
    getDesktopMediaQuerySnapshot,
    () => false
  );
  const isMobile = environment.isMobile ?? !matchesDesktop;
  const superuserOffset = environment.showSuperuserWarning
    ? SUPERUSER_MARQUEE_HEIGHT
    : 0;
  const headerHeight = isMobile
    ? NAVIGATION_MOBILE_CONTENT_HEIGHT
    : PRIMARY_HEADER_HEIGHT;

  return {
    barTop: `${superuserOffset}px`,
    contentTop: `${superuserOffset + headerHeight}px`,
    pageContentTop: `${headerHeight}px`,
  };
}
