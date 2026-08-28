"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export { PictureInPicturePortal } from "./picture-in-picture-portal";

interface RequestPipWindowOptions {
  height?: number;
  preferInitialWindowPlacement?: boolean;
  width?: number;
}

interface PictureInPictureContextValue {
  closePipWindow: () => void;
  isSupported: boolean;
  pipWindow: Window | null;
  requestPipWindow: (options?: RequestPipWindowOptions) => Promise<void>;
}

const PictureInPictureContext = createContext<PictureInPictureContextValue | null>(null);
const NON_RELATIVE_URL = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;

function resolveCssUrls(cssText: string, baseHref: string) {
  return cssText.replace(
    /url\((['"]?)([^'")]*)\1\)/g,
    (match: string, quote: string, url: string) => {
      if (!url || NON_RELATIVE_URL.test(url)) return match;
      try {
        return `url(${quote}${new URL(url, baseHref).href}${quote})`;
      } catch {
        return match;
      }
    },
  );
}

function copyStyles(source: Document, target: Window) {
  for (const sheet of Array.from(source.styleSheets)) {
    const owner = sheet.ownerNode;
    try {
      const cssText = Array.from(sheet.cssRules)
        .map((rule) => rule.cssText)
        .join("");
      const style = target.document.createElement("style");
      style.textContent = resolveCssUrls(cssText, sheet.href ?? source.baseURI);
      target.document.head.appendChild(style);
    } catch {
      if (owner) target.document.head.appendChild(owner.cloneNode(true));
    }
  }
}

function syncThemeClasses(source: Document, target: Window) {
  target.document.documentElement.className = source.documentElement.className;
  target.document.body.className = source.body.className;
}

export function PictureInPictureProvider({ children }: { children: ReactNode }) {
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const documentPictureInPicture =
    typeof window === "undefined" ? null : (window.documentPictureInPicture ?? null);
  const mountedRef = useRef(true);
  const requestInFlightRef = useRef(false);
  const pipWindowRef = useRef<{
    handlePageHide: () => void;
    pipWindow: Window;
  } | null>(null);

  const requestPipWindow = useCallback(
    async ({ width, height, preferInitialWindowPlacement }: RequestPipWindowOptions = {}) => {
      if (!documentPictureInPicture) return;
      if (requestInFlightRef.current) return;

      const trackedWindow = pipWindowRef.current;
      if (trackedWindow && !trackedWindow.pipWindow.closed) return;
      if (trackedWindow) {
        trackedWindow.pipWindow.removeEventListener("pagehide", trackedWindow.handlePageHide);
        pipWindowRef.current = null;
        setPipWindow(null);
      }

      requestInFlightRef.current = true;
      try {
        const pip = await documentPictureInPicture.requestWindow({
          width,
          height,
          preferInitialWindowPlacement,
        });

        if (!mountedRef.current) {
          pip.close();
          return;
        }

        let handlePageHide: (() => void) | null = null;
        try {
          copyStyles(document, pip);
          syncThemeClasses(document, pip);
          handlePageHide = () => {
            if (pipWindowRef.current?.pipWindow !== pip) return;
            pipWindowRef.current = null;
            setPipWindow(null);
          };
          pip.addEventListener("pagehide", handlePageHide, { once: true });
          pipWindowRef.current = { handlePageHide, pipWindow: pip };
          setPipWindow(pip);
        } catch (error) {
          if (handlePageHide) {
            pip.removeEventListener("pagehide", handlePageHide);
          }
          if (pipWindowRef.current?.pipWindow === pip) {
            pipWindowRef.current = null;
          }
          pip.close();
          throw error;
        }
      } finally {
        requestInFlightRef.current = false;
      }
    },
    [documentPictureInPicture],
  );

  const closePipWindow = useCallback(() => {
    const trackedWindow = pipWindowRef.current;
    if (trackedWindow && !trackedWindow.pipWindow.closed) {
      trackedWindow.pipWindow.close();
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const trackedWindow = pipWindowRef.current;
      pipWindowRef.current = null;
      if (trackedWindow) {
        trackedWindow.pipWindow.removeEventListener("pagehide", trackedWindow.handlePageHide);
        if (!trackedWindow.pipWindow.closed) {
          trackedWindow.pipWindow.close();
        }
      }
    };
  }, []);

  const value = useMemo<PictureInPictureContextValue>(
    () => ({
      closePipWindow,
      isSupported: Boolean(documentPictureInPicture),
      pipWindow,
      requestPipWindow,
    }),
    [closePipWindow, documentPictureInPicture, pipWindow, requestPipWindow],
  );

  return (
    <PictureInPictureContext.Provider value={value}>{children}</PictureInPictureContext.Provider>
  );
}

export function usePictureInPicture(): PictureInPictureContextValue {
  const context = useContext(PictureInPictureContext);
  if (!context) {
    throw new Error("usePictureInPicture must be used within a PictureInPictureProvider");
  }
  return context;
}
