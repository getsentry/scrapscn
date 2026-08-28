"use client";

import { useLayoutEffect, useMemo, useRef } from "react";

import { Stack } from "./layout";
import { lexMarkdown } from "./markdown-parser";
import {
  countMarkdownGraphemes,
  streamingAnimationStyles,
  useStreamingAnimation,
  useTextDecodeAnimation,
} from "./markdown-streaming";
import { MarkdownTokenView } from "./markdown-token";
import type { MarkdownComponents } from "./markdown-types";

export interface MarkdownProps {
  raw: string;
  components?: MarkdownComponents;
  variant?: "static" | "streaming";
}

export function Markdown({ raw, components = {}, variant = "static" }: MarkdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousTextLengths = useRef(new Map<number, number>());
  const isStreaming = variant === "streaming";
  const tokens = useMemo(() => lexMarkdown(raw), [raw]);
  const elements = useMemo(
    () =>
      tokens.map((token, index) => (
        <MarkdownTokenView
          key={isStreaming ? `${index}:${token.raw.length}` : index}
          token={token}
          components={components}
        />
      )),
    [components, isStreaming, tokens],
  );

  useStreamingAnimation(containerRef, isStreaming);

  useLayoutEffect(() => {
    if (!isStreaming || !containerRef.current) return;
    const nextTextLengths = new Map<number, number>();
    let changed = false;
    Array.from(containerRef.current.children).forEach((child, index) => {
      if (!(child instanceof HTMLElement)) return;
      const length = countMarkdownGraphemes(child.textContent ?? "");
      const previousLength = previousTextLengths.current.get(index) ?? 0;
      if (previousLength > 0) child.dataset.skip = String(previousLength);
      if (length !== previousLength) changed = true;
      nextTextLengths.set(index, length);
    });
    if (changed) previousTextLengths.current = nextTextLengths;
  }, [elements, isStreaming]);

  return (
    <Stack
      ref={containerRef}
      data-streaming={isStreaming || undefined}
      flex={1}
      gap="lg"
      className="break-words"
    >
      {elements}
    </Stack>
  );
}

export { useTextDecodeAnimation };
export { streamingAnimationStyles };
