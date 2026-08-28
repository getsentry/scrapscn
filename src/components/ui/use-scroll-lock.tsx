"use client";

import { useEffect, useId, useMemo } from "react";

class Lock {
  private acquiredBy = new Set<string>();
  private container: HTMLElement;
  private initialBodyStyles: {
    left: string;
    paddingRight: string;
    position: string;
    right: string;
    top: string;
    width: string;
  } | null = null;
  private initialOverflow: string | null = null;
  private scroll = { x: 0, y: 0 };

  constructor(container: HTMLElement) {
    this.container = container;
  }

  acquire(id: string) {
    if (this.acquiredBy.size === 0) {
      if (this.container === document.body) {
        this.scroll = { x: window.scrollX, y: window.scrollY };
        this.initialBodyStyles = {
          left: document.body.style.left,
          paddingRight: document.body.style.paddingRight,
          position: document.body.style.position,
          right: document.body.style.right,
          top: document.body.style.top,
          width: document.body.style.width,
        };
        const scrollbarWidth = window.innerWidth - document.body.clientWidth;
        const existingPaddingRight =
          Number.parseFloat(getComputedStyle(document.body).paddingRight) || 0;
        document.body.style.position = "fixed";
        document.body.style.top = `-${this.scroll.y}px`;
        document.body.style.left = "0";
        document.body.style.right = "0";
        document.body.style.width = "100%";
        document.documentElement.style.setProperty("--scrollbar-size", `${scrollbarWidth}px`);
        document.body.style.paddingRight = `${existingPaddingRight + scrollbarWidth}px`;
      } else {
        this.initialOverflow = this.container.style.overflow;
        this.container.style.overflow = "hidden";
      }
    }
    this.acquiredBy.add(id);
  }

  release(id: string) {
    this.acquiredBy.delete(id);
    if (this.acquiredBy.size > 0) return;

    if (this.initialBodyStyles) {
      Object.assign(document.body.style, this.initialBodyStyles);
      document.documentElement.style.removeProperty("--scrollbar-size");
      const { x, y } = this.scroll;
      requestAnimationFrame(() => {
        if (this.acquiredBy.size === 0) window.scrollTo(x, y);
      });
      this.initialBodyStyles = null;
    }
    if (this.initialOverflow !== null) {
      this.container.style.overflow = this.initialOverflow;
      this.initialOverflow = null;
    }
  }

  held() {
    return this.acquiredBy.size > 0;
  }
}

const locks = new Map<HTMLElement, Lock>();

export function useScrollLock(container: HTMLElement) {
  const id = useId();
  const lock = useMemo(() => {
    const existing = locks.get(container);
    if (existing) return existing;
    const created = new Lock(container);
    locks.set(container, created);
    return created;
  }, [container]);

  useEffect(
    () => () => {
      lock.release(id);
      if (!lock.held()) locks.delete(container);
    },
    [container, id, lock],
  );

  return useMemo(
    () => ({
      acquire: () => lock.acquire(id),
      held: () => lock.held(),
      release: () => lock.release(id),
    }),
    [id, lock],
  );
}
