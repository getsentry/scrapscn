"use client";

import { mergeRefs } from "@react-aria/utils";
import {
  type Ref,
  type RefCallback,
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

const interactiveSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "summary",
  '[role="button"]',
  '[role="link"]',
  '[role="menuitem"]',
  '[role="menuitemcheckbox"]',
  '[role="menuitemradio"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
  "[tabindex]:not([tabindex='-1'])",
  "[role='option'][tabindex='-1']",
  "[role='row'][tabindex='-1']",
  "[role='tab'][tabindex='-1']",
  "[role='treeitem'][tabindex='-1']",
].join(",");

export function useIsInsideInteractiveElement<T extends HTMLElement>(ref: Ref<T> | undefined) {
  const [interactiveElement, setInteractiveElement] = useState<Element | null>(null);
  const interactiveElementRef = useCallback<RefCallback<T>>((element) => {
    setInteractiveElement(element?.parentElement?.closest(interactiveSelector) ?? null);
  }, []);
  const mergedRef = useMemo(
    () => mergeRefs(ref, interactiveElementRef),
    [interactiveElementRef, ref],
  );
  const isInteractiveElementFocusVisible = useSyncExternalStore(
    useCallback(
      (notify) => {
        if (!interactiveElement) return () => {};
        const controller = new AbortController();
        interactiveElement.addEventListener("focus", notify, { signal: controller.signal });
        interactiveElement.addEventListener("blur", notify, { signal: controller.signal });
        return () => controller.abort();
      },
      [interactiveElement],
    ),
    () => interactiveElement?.matches(":focus-visible") ?? false,
    () => false,
  );

  return {
    isInsideInteractiveElement: interactiveElement !== null,
    isInteractiveElementFocusVisible,
    ref: mergedRef,
  };
}
