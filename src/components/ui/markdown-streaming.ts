"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

import "./markdown.css";

const STAGGER_MS = 8;
const FADE_LEAD_MS = 120;
const MAX_DURATION_MS = 1_280;
const CYCLE_DURATION_MS = 160;
const DECODE_ATTRIBUTE = "data-scraps-decode";
const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
const dummyWrapper = typeof document === "undefined" ? null : document.createElement("span");

export function countMarkdownGraphemes(value: string): number {
  return [...segmenter.segment(value)].length;
}

type Animation = {
  destroy: () => void;
  settle: () => void;
};

const noopAnimation: Animation = { destroy() {}, settle() {} };

type TextRun = {
  active: boolean[];
  collapseCursor: number;
  decoratedAncestors: Element[];
  globalOffset: number;
  graphemes: string[];
  original: string;
  revealed: boolean;
  spans: HTMLSpanElement[];
  wrapper: HTMLSpanElement;
};

export function useStreamingAnimation(
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): void {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const container = containerRef.current;
    if (!enabled || !container || prefersReducedMotion) return;

    let activeAnimations: Animation[] = [];
    const observer = new MutationObserver((mutations) => {
      activeAnimations.forEach((animation) => animation.settle());
      activeAnimations = [];
      const newElements: HTMLElement[] = [];
      for (const mutation of mutations) {
        for (const addedNode of mutation.addedNodes) {
          if (addedNode instanceof HTMLElement) newElements.push(addedNode);
        }
      }

      let characterOffset = 0;
      for (const element of newElements) {
        const skippedCharacters = Number.parseInt(element.dataset.skip ?? "0", 10);
        const totalCharacters = countMarkdownGraphemes(element.textContent ?? "");
        activeAnimations.push(animateElement(element, characterOffset));
        characterOffset += Math.max(0, totalCharacters - skippedCharacters);
      }
    });

    observer.observe(container, { childList: true });
    return () => {
      observer.disconnect();
      activeAnimations.forEach((animation) => animation.destroy());
      activeAnimations = [];
    };
  }, [containerRef, enabled, prefersReducedMotion]);
}

export function useTextDecodeAnimation(ref: RefObject<HTMLElement | null>, key: unknown): void {
  const prefersReducedMotion = useReducedMotion();
  const isInitial = useRef(true);

  useLayoutEffect(() => {
    if (isInitial.current) {
      isInitial.current = false;
      return;
    }
    if (prefersReducedMotion || !ref.current) return;
    const animation = animateElement(ref.current);
    return () => animation.destroy();
  }, [key, prefersReducedMotion, ref]);
}

function isSimpleCharacter(grapheme: string): boolean {
  return grapheme.length === 1 && !/\s/.test(grapheme);
}

const decodeAnimations = [
  "scraps-markdown-decode-accent",
  "scraps-markdown-decode-success",
  "scraps-markdown-decode-promotion",
] as const;

export const streamingAnimationStyles = `
@keyframes scraps-markdown-decode-accent { 0% { content: "#"; } 14% { content: "7"; } 28% { content: "5"; } 42% { content: "5"; } 56% { content: "3"; } 70% { content: "F"; } 84% { content: "F"; } }
@keyframes scraps-markdown-decode-success { 0% { content: "#"; } 14% { content: "0"; } 28% { content: "0"; } 42% { content: "F"; } 56% { content: "2"; } 70% { content: "6"; } 84% { content: "1"; } }
@keyframes scraps-markdown-decode-promotion { 0% { content: "#"; } 14% { content: "F"; } 28% { content: "C"; } 42% { content: "5"; } 56% { content: "C"; } 70% { content: "B"; } 84% { content: "4"; } }
[data-scraps-decode] { position: relative; color: transparent; contain: style paint; opacity: 0; transition: opacity 200ms ease-out; }
[data-scraps-decode].scraps-markdown-decode-visible { opacity: var(--scraps-markdown-decode-opacity, 1); }
[data-streaming-hidden] { opacity: 0; }
[data-scraps-decode]::after { content: "1"; position: absolute; left: 50%; color: var(--scraps-markdown-glyph-color, CanvasText); font: inherit; pointer-events: none; transform: translateX(-50%); animation: var(--scraps-markdown-decode-animation) 160ms steps(1) infinite; animation-delay: var(--scraps-markdown-decode-delay, 0ms); }
`;

function prepareTextNode(
  textNode: Text,
  globalOffset: number,
  skipCharacters: number,
  root: Element,
): TextRun | null {
  const original = textNode.nodeValue ?? "";
  const parent = textNode.parentNode;
  if (!original.trim() || !parent || !dummyWrapper) return null;

  const decoratedAncestors: Element[] = [];
  let ancestor = parent instanceof Element ? parent : null;
  while (ancestor && ancestor !== root) {
    decoratedAncestors.push(ancestor);
    ancestor = ancestor.parentElement;
  }
  const graphemes = Array.from(segmenter.segment(original), ({ segment }) => segment);

  if (globalOffset + graphemes.length <= skipCharacters) {
    return {
      original,
      wrapper: dummyWrapper,
      spans: [],
      graphemes,
      active: [],
      globalOffset,
      collapseCursor: 0,
      decoratedAncestors,
      revealed: true,
    };
  }

  const wrapper = document.createElement("span");
  wrapper.style.setProperty(
    "--scraps-markdown-glyph-color",
    getComputedStyle(parent as Element).color,
  );
  const spans: HTMLSpanElement[] = [];
  const active: boolean[] = [];

  graphemes.forEach((grapheme, index) => {
    const span = document.createElement("span");
    span.textContent = grapheme;
    if (isSimpleCharacter(grapheme) && globalOffset + index >= skipCharacters) {
      span.setAttribute(DECODE_ATTRIBUTE, "");
      span.style.setProperty(
        "--scraps-markdown-decode-delay",
        `${-Math.random() * CYCLE_DURATION_MS}ms`,
      );
      span.style.setProperty(
        "--scraps-markdown-decode-animation",
        decodeAnimations[index % decodeAnimations.length] ?? decodeAnimations[0],
      );
      span.style.setProperty("--scraps-markdown-decode-opacity", String(0.4 + Math.random() * 0.6));
      active.push(true);
    } else {
      active.push(false);
    }
    spans.push(span);
    wrapper.append(span);
  });

  textNode.replaceWith(wrapper);
  return {
    original,
    wrapper,
    spans,
    graphemes,
    active,
    globalOffset,
    collapseCursor: 0,
    decoratedAncestors,
    revealed: !active.includes(true),
  };
}

function collapseSettledPrefix(run: TextRun) {
  let collapseEnd = run.collapseCursor;
  for (let index = run.collapseCursor; index < run.spans.length; index++) {
    if (run.active[index]) break;
    const grapheme = run.graphemes[index];
    if (grapheme && /\s/.test(grapheme)) collapseEnd = index + 1;
  }
  if (collapseEnd <= run.collapseCursor) return;

  const text = run.graphemes.slice(run.collapseCursor, collapseEnd).join("");
  const firstSpan = run.spans[run.collapseCursor];
  if (firstSpan) firstSpan.replaceWith(document.createTextNode(text));
  for (let index = run.collapseCursor + 1; index < collapseEnd; index++) {
    run.spans[index]?.remove();
  }
  run.collapseCursor = collapseEnd;
}

function restoreRuns(runs: TextRun[]) {
  for (const run of runs) {
    if (run.wrapper.isConnected) run.wrapper.replaceWith(document.createTextNode(run.original));
  }
}

function fadeOutRuns(runs: TextRun[]) {
  for (const run of runs) {
    for (let index = run.collapseCursor; index < run.spans.length; index++) {
      const span = run.spans[index];
      if (!span) continue;
      span.removeAttribute(DECODE_ATTRIBUTE);
      span.classList.add("scraps-markdown-decode-visible");
    }
  }
  return window.setTimeout(() => restoreRuns(runs), 200);
}

const scheduleIdle = (callback: () => void) =>
  typeof window.requestIdleCallback === "function"
    ? window.requestIdleCallback(callback)
    : window.setTimeout(callback, 0);

const cancelIdle = (id: number) => {
  if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(id);
  else window.clearTimeout(id);
};

function animateElement(element: HTMLElement, characterOffset = 0): Animation {
  const skipCharacters = Number.parseInt(element.dataset.skip ?? "0", 10);
  delete element.dataset.skip;
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let node = walker.nextNode();
  while (node) {
    if (node.textContent?.trim()) textNodes.push(node as Text);
    node = walker.nextNode();
  }
  if (textNodes.length === 0) return noopAnimation;

  const runs: TextRun[] = [];
  let globalIndex = 0;
  for (const textNode of textNodes) {
    const run = prepareTextNode(textNode, globalIndex, skipCharacters, element);
    if (!run) continue;
    runs.push(run);
    globalIndex += run.graphemes.length;
  }
  if (runs.length === 0) return noopAnimation;

  const sharedAncestors = new Set<Element>();
  runs
    .filter((run) => run.revealed)
    .forEach((run) => {
      run.decoratedAncestors.forEach((ancestor) => sharedAncestors.add(ancestor));
    });
  runs
    .filter((run) => !run.revealed)
    .forEach((run) => {
      run.decoratedAncestors.forEach((ancestor) => {
        if (!sharedAncestors.has(ancestor)) ancestor.setAttribute("data-streaming-hidden", "");
      });
    });

  let settled = false;
  const startTime = performance.now();
  let pendingIdle: number | null = null;
  let fadeTimeout: number | null = null;

  function revealAll() {
    runs.forEach((run) => {
      run.decoratedAncestors.forEach((ancestor) =>
        ancestor.removeAttribute("data-streaming-hidden"),
      );
    });
  }

  function scheduleCollapse() {
    if (pendingIdle !== null) return;
    pendingIdle = scheduleIdle(() => {
      pendingIdle = null;
      if (!settled) runs.forEach(collapseSettledPrefix);
    });
  }

  function settle() {
    if (settled) return;
    settled = true;
    revealAll();
    if (pendingIdle !== null) cancelIdle(pendingIdle);
    pendingIdle = null;
    runs.forEach(collapseSettledPrefix);
    fadeTimeout = fadeOutRuns(runs);
  }

  function destroy() {
    settled = true;
    if (pendingIdle !== null) cancelIdle(pendingIdle);
    if (fadeTimeout !== null) window.clearTimeout(fadeTimeout);
    revealAll();
    restoreRuns(runs);
  }

  function tick(now: number) {
    if (settled) return;
    const elapsed = now - startTime;
    let allSettled = true;
    for (const run of runs) {
      for (let index = run.collapseCursor; index < run.spans.length; index++) {
        if (!run.active[index]) continue;
        const span = run.spans[index];
        if (!span) continue;
        const animatedIndex = run.globalOffset + index - skipCharacters;
        const settleAt = (animatedIndex + characterOffset) * STAGGER_MS;
        if (elapsed >= Math.max(0, settleAt - FADE_LEAD_MS)) {
          span.classList.add("scraps-markdown-decode-visible");
          if (!run.revealed) {
            run.revealed = true;
            run.decoratedAncestors.forEach((ancestor) =>
              ancestor.removeAttribute("data-streaming-hidden"),
            );
          }
        }
        if (elapsed >= settleAt) {
          span.removeAttribute(DECODE_ATTRIBUTE);
          run.active[index] = false;
        } else {
          allSettled = false;
        }
      }
    }
    scheduleCollapse();
    if (allSettled || elapsed >= MAX_DURATION_MS + characterOffset * STAGGER_MS) settle();
    else requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
  return { destroy, settle };
}
