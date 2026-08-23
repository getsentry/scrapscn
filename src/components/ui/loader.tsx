"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import { useResizeObserver } from "@react-aria/utils";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { Stack } from "./layout";
import { Text } from "./text";
import styles from "./loader.module.css";

interface IndeterminateLoaderProps extends HTMLAttributes<HTMLDivElement> {
  messages?: ReactNode[];
  variant?: "vibrant" | "monochrome";
}

interface LoaderTrackStyle extends CSSProperties {
  "--loader-track-color"?: string;
}

const WIDTH = { MIN: 128, MAX: 400 };
const DURATION = { MIN: 2, MAX: 2.8 };
const DELAY = { MIN: 0.8, MAX: 1.2 };
const MESSAGE_INTERVAL_MS = 10_000;

function lerp(min: number, max: number, t: number): number {
  return min + (max - min) * Math.min(1, Math.max(0, t));
}

function useAnimationTiming() {
  const ref = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(DURATION.MAX);
  const [delay, setDelay] = useState(DELAY.MAX);

  useResizeObserver({
    ref,
    onResize() {
      const width = ref.current?.offsetWidth ?? WIDTH.MAX;
      const progress = (width - WIDTH.MIN) / (WIDTH.MAX - WIDTH.MIN);
      setDuration(lerp(DURATION.MIN, DURATION.MAX, progress));
      setDelay(lerp(DELAY.MIN, DELAY.MAX, progress));
    },
  });

  return { delay, duration, ref };
}

function useMessageCycler(messages: ReactNode[]) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (messages.length <= 1 || index >= messages.length - 1) return;
    const timer = window.setTimeout(() => setIndex((value) => value + 1), MESSAGE_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [index, messages.length]);
  return { index, message: messages.length > 0 ? messages[index] : null };
}

function Ellipsis() {
  return <span aria-hidden><span className={styles.dot}>.</span><span className={styles.dot} style={{ animationDelay: "0.2s" }}>.</span><span className={styles.dot} style={{ animationDelay: "0.4s" }}>.</span></span>;
}

/** The regular Scraps animated indeterminate squiggle progress indicator. */
export function IndeterminateLoader({
  variant = "vibrant",
  messages,
  className,
  color,
  style,
  ...props
}: IndeterminateLoaderProps) {
  const { delay, duration, ref } = useAnimationTiming();
  const { index, message } = useMessageCycler(messages ?? []);
  const reduceMotion = useReducedMotion();
  const monochrome = variant === "monochrome";
  const trackStyle: LoaderTrackStyle = {
    "--loader-track-color": color ?? (monochrome ? "currentColor" : "var(--scraps-theme-border-secondary, #e6e6e9)"),
    ...style,
  };
  const track = (
    <div
      ref={ref}
      role="progressbar"
      aria-label="Loading"
      {...props}
      className={[styles.track, monochrome ? styles.monochrome : undefined, className].filter(Boolean).join(" ")}
      color={color}
      style={trackStyle}
    >
      <span className={styles.mask}>
        <span className={[styles.bar, styles.slow].join(" ")} style={{ animationDelay: "0s", animationDuration: `${duration}s` }} />
        <span className={[styles.bar, styles.fast].join(" ")} style={{ animationDelay: `${delay}s`, animationDuration: `${duration}s` }} />
      </span>
    </div>
  );
  if (!messages?.length) return track;
  return (
    <Stack align="start" gap="xl" maxWidth="72ch" width="100%">
      {track}
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          animate={{ opacity: 1 }}
          exit={{ opacity: reduceMotion ? 1 : 0 }}
          initial={{ opacity: reduceMotion ? 1 : 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.3 }}
        >
          <Text monospace size="lg" variant="muted">{message}<Ellipsis /></Text>
        </motion.div>
      </AnimatePresence>
    </Stack>
  );
}
