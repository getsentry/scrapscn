"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

export const MIN_WIDTH_PERCENT = 20;
export const MAX_WIDTH_PERCENT = 85;
export const DEFAULT_WIDTH_PERCENT = 50;

const SMALL_SCREEN_QUERY = "(max-width: 800px)";

type WidthChannel = {
  subscribers: Set<() => void>;
  value?: number;
};

const widthChannels = new Map<string, WidthChannel>();

function getDrawerWidthKey(drawerKey: string) {
  return `drawer-width:${drawerKey}`;
}

function clampWidth(value: number) {
  return Math.min(MAX_WIDTH_PERCENT, Math.max(MIN_WIDTH_PERCENT, value));
}

function parseSavedWidth(value: string | null) {
  if (value === null) return undefined;
  try {
    const parsedValue: unknown = JSON.parse(value);
    return typeof parsedValue === "number" && Number.isFinite(parsedValue)
      ? clampWidth(parsedValue)
      : undefined;
  } catch {
    return undefined;
  }
}

function readSavedWidth(drawerKey: string | undefined) {
  if (!drawerKey) return undefined;
  try {
    return parseSavedWidth(window.localStorage.getItem(getDrawerWidthKey(drawerKey)));
  } catch {
    return undefined;
  }
}

function subscribeToWidth(drawerKey: string, subscriber: () => void) {
  const channel = widthChannels.get(drawerKey) ?? {
    subscribers: new Set(),
  };
  channel.subscribers.add(subscriber);
  widthChannels.set(drawerKey, channel);

  return () => {
    channel.subscribers.delete(subscriber);
    if (channel.subscribers.size === 0) widthChannels.delete(drawerKey);
  };
}

function getSyncedWidth(drawerKey: string | undefined) {
  return drawerKey ? widthChannels.get(drawerKey)?.value : undefined;
}

function persistWidth(drawerKey: string, value: number) {
  try {
    window.localStorage.setItem(getDrawerWidthKey(drawerKey), String(value));
  } catch {}

  const channel = widthChannels.get(drawerKey) ?? {
    subscribers: new Set(),
  };
  channel.value = value;
  widthChannels.set(drawerKey, channel);
  for (const subscriber of channel.subscribers) {
    subscriber();
  }
}

function getServerWidth() {
  return undefined;
}

function widthToPercent(drawerWidth: string | undefined) {
  if (!drawerWidth) return undefined;
  const normalizedWidth = drawerWidth.trim();
  const value = Number.parseFloat(normalizedWidth);
  if (!Number.isFinite(value)) return undefined;
  if (normalizedWidth.endsWith("%")) return clampWidth(value);
  if (window.innerWidth <= 0) return undefined;
  return clampWidth((value / window.innerWidth) * 100);
}

function getInitialWidth(drawerKey?: string, drawerWidth?: string) {
  return readSavedWidth(drawerKey) ?? widthToPercent(drawerWidth) ?? DEFAULT_WIDTH_PERCENT;
}

function isValidFixedWidth(drawerWidth: string) {
  const normalizedWidth = drawerWidth.trim();
  if (!normalizedWidth) return false;
  if (typeof CSS !== "undefined" && typeof CSS.supports === "function") {
    return CSS.supports("width", normalizedWidth);
  }
  return /^-?(?:\d+|\d*\.\d+)(?:%|px|rem|em|vw|vh|vmin|vmax)$/.test(normalizedWidth);
}

function isSmallScreen() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(SMALL_SCREEN_QUERY).matches
    : typeof window !== "undefined" && window.innerWidth <= 800;
}

function useSmallScreen() {
  const [smallScreen, setSmallScreen] = useState(isSmallScreen);

  useEffect(() => {
    const update = () => setSmallScreen(isSmallScreen());
    const media = window.matchMedia?.(SMALL_SCREEN_QUERY);
    media?.addEventListener?.("change", update);
    window.addEventListener("resize", update);
    update();
    return () => {
      media?.removeEventListener?.("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return smallScreen;
}

type DrawerResizingOptions = {
  drawerKey?: string;
  drawerMaxWidth?: string;
  drawerWidth?: string;
  enabled?: boolean;
};

export function useDrawerResizing({
  drawerKey,
  drawerMaxWidth,
  drawerWidth,
  enabled = true,
}: DrawerResizingOptions) {
  const panelRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const stopDraggingRef = useRef<() => void>(() => undefined);
  const pendingWidthRef = useRef<number | null>(null);
  const widthIdentity = `${drawerKey ?? ""}\u0000${drawerMaxWidth ?? ""}\u0000${drawerWidth ?? ""}`;
  const subscribeWidth = useCallback(
    (subscriber: () => void) =>
      drawerKey ? subscribeToWidth(drawerKey, subscriber) : () => undefined,
    [drawerKey],
  );
  const getWidthSnapshot = useCallback(() => getSyncedWidth(drawerKey), [drawerKey]);
  const syncedWidth = useSyncExternalStore(subscribeWidth, getWidthSnapshot, getServerWidth);
  const persistedWidthPercent =
    syncedWidth ??
    (typeof window === "undefined"
      ? DEFAULT_WIDTH_PERCENT
      : getInitialWidth(drawerKey, drawerWidth));
  const smallScreen = useSmallScreen();
  const canResize = Boolean(enabled && drawerKey && !smallScreen);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    if (smallScreen) {
      panel.style.setProperty("--drawer-width", "100%");
      panel.style.setProperty("--drawer-min-width", "100%");
      panel.style.setProperty("--drawer-max-width", "100%");
      return;
    }

    if (!enabled && drawerWidth && isValidFixedWidth(drawerWidth)) {
      panel.style.setProperty("--drawer-width", drawerWidth);
      panel.style.setProperty("--drawer-min-width", drawerWidth);
      panel.style.setProperty("--drawer-max-width", drawerWidth);
      return;
    }

    panel.style.setProperty("--drawer-width", `${persistedWidthPercent}%`);
    panel.style.setProperty("--drawer-min-width", `${MIN_WIDTH_PERCENT}%`);
    panel.style.setProperty(
      "--drawer-max-width",
      drawerMaxWidth ? `min(${MAX_WIDTH_PERCENT}%, ${drawerMaxWidth})` : `${MAX_WIDTH_PERCENT}%`,
    );
  }, [drawerMaxWidth, drawerWidth, enabled, persistedWidthPercent, smallScreen]);

  const handleResizeStart = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!canResize) return;
      event.preventDefault();

      const panel = panelRef.current;
      const handle = resizeHandleRef.current;
      if (!panel || !handle) return;

      stopDraggingRef.current();
      panel.dataset.resizing = "";
      handle.dataset.resizing = "";
      pendingWidthRef.current = persistedWidthPercent;
      const viewportWidth = window.innerWidth;

      const applyPendingWidth = () => {
        animationFrameRef.current = null;
        if (pendingWidthRef.current === null) return;
        const nextWidth = pendingWidthRef.current;
        panel.style.setProperty("--drawer-width", `${nextWidth}%`);
        handle.dataset.atMinWidth = String(nextWidth <= MIN_WIDTH_PERCENT);
        handle.dataset.atMaxWidth = String(Math.abs(nextWidth - MAX_WIDTH_PERCENT) < 1);
      };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        moveEvent.preventDefault();
        pendingWidthRef.current = ((viewportWidth - moveEvent.clientX) / viewportWidth) * 100;
        if (animationFrameRef.current !== null) {
          window.cancelAnimationFrame(animationFrameRef.current);
        }
        animationFrameRef.current = window.requestAnimationFrame(applyPendingWidth);
      };

      const clearDragState = () => {
        if (animationFrameRef.current !== null) {
          window.cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        delete panel.dataset.resizing;
        delete handle.dataset.resizing;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", finishDragging);
        stopDraggingRef.current = () => undefined;
      };

      const finishDragging = () => {
        if (animationFrameRef.current !== null) {
          window.cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
          applyPendingWidth();
        }

        const nextWidth = clampWidth(pendingWidthRef.current ?? persistedWidthPercent);
        pendingWidthRef.current = null;
        panel.style.setProperty("--drawer-width", `${nextWidth}%`);
        try {
          if (drawerKey) persistWidth(drawerKey, nextWidth);
        } finally {
          clearDragState();
        }
      };

      stopDraggingRef.current = () => {
        pendingWidthRef.current = null;
        clearDragState();
      };
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", finishDragging);
    },
    [canResize, drawerKey, persistedWidthPercent],
  );

  useLayoutEffect(
    () => () => {
      stopDraggingRef.current();
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    },
    [canResize, widthIdentity],
  );

  return {
    panelRef,
    resizeHandleRef,
    handleResizeStart,
    persistedWidthPercent,
    enabled: canResize,
  };
}
