"use client";

import { useResizeObserver } from "@react-aria/utils";
import { useRef, useState, type CSSProperties, type HTMLAttributes } from "react";

import "./loader.css";

interface IndeterminateLoaderProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "vibrant" | "monochrome";
}

interface LoaderTrackStyle extends CSSProperties {
  "--loader-squiggle"?: string;
  "--loader-track-color"?: string;
}

const WIDTH = { MIN: 128, MAX: 400 };
const DURATION = { MIN: 2, MAX: 2.8 };
const DELAY = { MIN: 0.8, MAX: 1.2 };
const SQUIGGLE_TILE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='1 0 16 8'%3E%3Cpath stroke='%23fff' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M17 6c-4 0-4-4-8-4S5 6 1 6'/%3E%3C/svg%3E\")";

const MASK_CLASS_NAMES =
  "[mask-image:var(--loader-squiggle)] [mask-repeat:repeat-x] [mask-size:16px_8px] " +
  "[-webkit-mask-image:var(--loader-squiggle)] [-webkit-mask-repeat:repeat-x] " +
  "[-webkit-mask-size:16px_8px]";

const TRACK_CLASS_NAMES =
  "scraps-loader-track-width relative h-2 overflow-hidden " +
  "before:absolute before:inset-0 before:content-[''] " +
  "before:bg-[var(--loader-track-color)] before:[mask-image:var(--loader-squiggle)] " +
  "before:[mask-repeat:repeat-x] before:[mask-size:16px_8px] " +
  "before:[-webkit-mask-image:var(--loader-squiggle)] " +
  "before:[-webkit-mask-repeat:repeat-x] before:[-webkit-mask-size:16px_8px]";

const BAR_CLASS_NAMES =
  "absolute inset-y-0 right-0 left-0 " +
  "[animation-timing-function:cubic-bezier(0.4,0,0.2,1)] " +
  "[animation-iteration-count:infinite] [animation-fill-mode:backwards] " +
  "motion-reduce:animate-none";

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

/** The regular Scraps animated indeterminate squiggle progress indicator. */
export function IndeterminateLoader({
  variant = "vibrant",
  className,
  color,
  style,
  ...props
}: IndeterminateLoaderProps) {
  const { delay, duration, ref } = useAnimationTiming();
  const monochrome = variant === "monochrome";
  const trackStyle: LoaderTrackStyle = {
    "--loader-squiggle": SQUIGGLE_TILE,
    "--loader-track-color":
      color ?? (monochrome ? "currentColor" : "var(--scraps-theme-border-secondary, #e6e6e9)"),
    ...style,
  };
  const barColorClassName = monochrome
    ? "bg-current"
    : "bg-[var(--scraps-theme-border-accent,#7553ff)]";
  return (
    <div
      ref={ref}
      role="progressbar"
      aria-label="Loading"
      {...props}
      className={[TRACK_CLASS_NAMES, monochrome ? "before:opacity-20" : undefined, className]
        .filter(Boolean)
        .join(" ")}
      color={color}
      style={trackStyle}
    >
      <span className={`absolute inset-0 ${MASK_CLASS_NAMES}`}>
        <span
          className={`${BAR_CLASS_NAMES} ${barColorClassName} [animation-name:loader-indeterminate-slow]`}
          style={{ animationDelay: "0s", animationDuration: `${duration}s` }}
        />
        <span
          className={`${BAR_CLASS_NAMES} ${barColorClassName} [animation-name:loader-indeterminate-fast]`}
          style={{
            animationDelay: `${delay}s`,
            animationDuration: `${duration}s`,
          }}
        />
      </span>
    </div>
  );
}
