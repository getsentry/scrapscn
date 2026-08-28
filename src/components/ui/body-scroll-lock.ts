"use client";

import { useEffect, useId } from "react";

type BodyStyles = Pick<
  CSSStyleDeclaration,
  | "boxSizing"
  | "height"
  | "left"
  | "overflow"
  | "paddingRight"
  | "position"
  | "right"
  | "top"
  | "width"
>;

const listenerOptions = { passive: false } as const;

type ScrollLock = {
  preventTouchMove: boolean;
  touchScrollTarget: HTMLElement | null;
};

class BodyScrollLock {
  private acquiredBy = new Map<string, ScrollLock>();
  private initialBodyStyles: BodyStyles | null = null;
  private initialScrollbarSize: { priority: string; value: string } | null = null;
  private listeningForTouchMove = false;
  private scroll = { x: 0, y: 0 };

  private preventTouchMove = (event: TouchEvent) => {
    const target = event.target;
    if (
      target instanceof Node &&
      [...this.acquiredBy.values()].some(
        ({ preventTouchMove, touchScrollTarget }) =>
          preventTouchMove && touchScrollTarget?.contains(target),
      )
    ) {
      return;
    }
    event.preventDefault();
  };

  private syncTouchMoveListener() {
    const shouldListen = [...this.acquiredBy.values()].some(
      ({ preventTouchMove }) => preventTouchMove,
    );
    if (shouldListen === this.listeningForTouchMove) return;
    this.listeningForTouchMove = shouldListen;
    if (shouldListen) {
      document.body.addEventListener("touchmove", this.preventTouchMove, listenerOptions);
    } else {
      document.body.removeEventListener("touchmove", this.preventTouchMove, false);
    }
  }

  acquire(id: string, touchScrollTarget: HTMLElement | null = null, preventTouchMove = false) {
    if (this.acquiredBy.has(id)) return;
    if (this.acquiredBy.size === 0) {
      this.scroll = { x: window.scrollX, y: window.scrollY };
      this.initialBodyStyles = {
        boxSizing: document.body.style.boxSizing,
        height: document.body.style.height,
        left: document.body.style.left,
        overflow: document.body.style.overflow,
        paddingRight: document.body.style.paddingRight,
        position: document.body.style.position,
        right: document.body.style.right,
        top: document.body.style.top,
        width: document.body.style.width,
      };
      this.initialScrollbarSize = {
        priority: document.documentElement.style.getPropertyPriority("--scrollbar-size"),
        value: document.documentElement.style.getPropertyValue("--scrollbar-size"),
      };
      const scrollbarWidth = window.innerWidth - document.body.clientWidth;
      const paddingRight = Number.parseFloat(getComputedStyle(document.body).paddingRight) || 0;
      Object.assign(document.body.style, {
        boxSizing: "border-box",
        height: "100%",
        left: "0",
        overflow: "hidden",
        paddingRight: `${paddingRight + scrollbarWidth}px`,
        position: "fixed",
        right: "0",
        top: `-${this.scroll.y}px`,
        width: "100%",
      });
      document.documentElement.style.setProperty("--scrollbar-size", `${scrollbarWidth}px`);
    }
    this.acquiredBy.set(id, { preventTouchMove, touchScrollTarget });
    this.syncTouchMoveListener();
  }

  updateTouchScrollTarget(id: string, touchScrollTarget: HTMLElement | null) {
    const lock = this.acquiredBy.get(id);
    if (lock) this.acquiredBy.set(id, { ...lock, touchScrollTarget });
  }

  release(id: string) {
    if (!this.acquiredBy.delete(id)) return;
    this.syncTouchMoveListener();
    if (this.acquiredBy.size > 0 || !this.initialBodyStyles || !this.initialScrollbarSize) return;
    Object.assign(document.body.style, this.initialBodyStyles);
    if (this.initialScrollbarSize.value)
      document.documentElement.style.setProperty(
        "--scrollbar-size",
        this.initialScrollbarSize.value,
        this.initialScrollbarSize.priority,
      );
    else document.documentElement.style.removeProperty("--scrollbar-size");
    const scroll = this.scroll;
    requestAnimationFrame(() => {
      if (this.acquiredBy.size === 0) window.scrollTo(scroll.x, scroll.y);
    });
    this.initialBodyStyles = null;
    this.initialScrollbarSize = null;
  }
}

export const bodyScrollLock = new BodyScrollLock();

/** Acquires the shared document-body lock while `active` is true. */
export function useBodyScrollLock(
  active: boolean,
  touchScrollTarget: HTMLElement | null = null,
  preventTouchMove = false,
) {
  const id = useId();
  useEffect(() => {
    if (!active) return;
    bodyScrollLock.acquire(id, null, preventTouchMove);
    return () => bodyScrollLock.release(id);
  }, [active, id, preventTouchMove]);
  useEffect(() => {
    if (active) bodyScrollLock.updateTouchScrollTarget(id, touchScrollTarget);
  }, [active, id, touchScrollTarget]);
}
