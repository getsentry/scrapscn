"use client";

import { useReducedMotion } from "framer-motion";
import type { LocationDescriptor } from "history";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type SVGAttributes,
  type MouseEvent,
} from "react";

import { t } from "../../lib/scraps-locale";
import { cn } from "../../lib/utils";
import { Button, ButtonBar, type ButtonBarProps } from "./button";
import { LinkButton } from "./button";
import { Disclosure } from "./disclosure";
import { useTextDecodeAnimation } from "./markdown-streaming";
import { Text } from "./text";

import "./chat.css";

interface AssistantMessageProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function AssistantMessage({ children, className, ...props }: AssistantMessageProps) {
  return (
    <div className={cn("w-full min-w-0", className)} {...props}>
      {children}
    </div>
  );
}

interface UserMessageProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  maxWidth?: CSSProperties["maxWidth"];
  width?: CSSProperties["width"];
}

export function UserMessage({
  children,
  className,
  maxWidth = "80%",
  style,
  width,
  ...props
}: UserMessageProps) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-[6px] border border-[var(--scraps-theme-border-primary)] bg-[var(--scraps-theme-surface400)] px-2 py-1 wrap-anywhere whitespace-pre-wrap text-[var(--scraps-content-primary)]",
        className,
      )}
      style={{ maxWidth, width, ...style }}
      {...props}
    >
      {children}
    </div>
  );
}

type MessageRowDensity = "default" | "compact";

interface MessageRowProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  density?: MessageRowDensity;
  from: "user" | "assistant";
}

export function MessageRow({
  children,
  className,
  density = "default",
  from,
  ...props
}: MessageRowProps) {
  return (
    <div
      className={cn(
        "flex w-full items-start",
        from === "user" ? "justify-end" : "justify-start",
        density === "default" ? "p-4" : "px-4 py-2",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

type AssistantFeedback = "positive" | "negative";

interface AssistantActionsProps extends Omit<ButtonBarProps, "children" | "onCopy"> {
  copyText?: string;
  feedbackDisabled?: boolean;
  onCopy?: (copiedText: string) => void;
  onFeedback?: (feedback: AssistantFeedback) => void;
}

export function AssistantActions({
  copyText,
  feedbackDisabled,
  onCopy,
  onFeedback,
  size = "xs",
  ...props
}: AssistantActionsProps) {
  return (
    <ButtonBar size={size} {...props}>
      <FeedbackButton disabled={feedbackDisabled} feedback="positive" onFeedback={onFeedback} />
      <FeedbackButton disabled={feedbackDisabled} feedback="negative" onFeedback={onFeedback} />
      {copyText ? (
        <Button
          aria-label={t("Copy to clipboard")}
          icon={<CopyIcon />}
          tooltipProps={{ title: t("Copy to clipboard") }}
          onClick={(event) => {
            event.stopPropagation();
            void navigator.clipboard.writeText(copyText).then(
              () => onCopy?.(copyText),
              () => undefined,
            );
          }}
        />
      ) : null}
    </ButtonBar>
  );
}

function FeedbackButton({
  disabled,
  feedback,
  onFeedback,
}: {
  disabled?: boolean;
  feedback: AssistantFeedback;
  onFeedback?: (feedback: AssistantFeedback) => void;
}) {
  const isPositive = feedback === "positive";
  const label = disabled
    ? t("Feedback submitted")
    : isPositive
      ? t("I like this response")
      : t("I don't like this response");

  return (
    <Button
      aria-label={label}
      disabled={disabled}
      icon={<ThumbIcon direction={isPositive ? "up" : "down"} />}
      tooltipProps={{ title: label }}
      onClick={(event) => {
        event.stopPropagation();
        onFeedback?.(feedback);
      }}
    />
  );
}

type SpinnerSize = "xs" | "sm" | "md" | "lg";

const spinnerSizeClasses: Record<SpinnerSize, string> = {
  xs: "size-3",
  sm: "size-3.5",
  md: "size-4",
  lg: "size-6",
};

interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: SpinnerSize;
}

export function Spinner({ className, size = "xs", ...props }: SpinnerProps) {
  return (
    <span
      aria-hidden={!props["aria-label"] && !props.role ? true : undefined}
      className={cn(
        "box-border inline-block shrink-0 animate-[scraps-chat-spin_0.6s_linear_infinite] rounded-full border-[1.5px] border-[var(--scraps-theme-border-primary)] border-l-[var(--scraps-theme-border-accent)] motion-reduce:animate-[scraps-chat-spin_2.4s_linear_infinite]",
        spinnerSizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}

export type ToolCallStatus = "loading" | "pending" | "success" | "failure" | "mixed" | "content";

interface ToolCallIndicatorProps {
  "aria-label"?: string;
  status: ToolCallStatus;
}

export function ToolCallIndicator({ "aria-label": ariaLabel, status }: ToolCallIndicatorProps) {
  if (status === "content") return null;

  const label = ariaLabel ?? getToolCallLabel(status);
  switch (status) {
    case "loading":
    case "pending":
      return <Spinner aria-label={label} role="status" />;
    case "failure":
      return <StatusIcon aria-label={label} status="failure" />;
    case "mixed":
      return <StatusIcon aria-label={label} status="mixed" />;
    case "success":
      return <StatusIcon aria-label={label} status="success" />;
  }
}

export interface ToolCallReference {
  value: string;
  icon?: ReactNode;
  label?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  to?: LocationDescriptor;
}

interface ToolCallProps {
  status: ToolCallStatus;
  title: string;
  children?: ReactNode;
  durationMs?: number;
  failureLabel?: string;
  input?: ReactNode;
  notifications?: string[];
  output?: ReactNode;
  reference?: ToolCallReference;
}

function ToolCallChipContent({ label, value }: Pick<ToolCallReference, "label" | "value">) {
  return label ? (
    <Text size="sm">
      {`${label}: `}
      <Text bold size="sm">
        {value}
      </Text>
    </Text>
  ) : (
    <Text bold size="sm">
      {value}
    </Text>
  );
}

function SpanIcon() {
  return (
    <ChatIcon viewBox="0 0 16 16">
      <path d="M5.5 1A2.5 2.5 0 0 0 3 3.5v3A2.5 2.5 0 0 0 5.5 9h1V7.5h-1a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1V9h1A2.5 2.5 0 0 0 13 6.5v-3A2.5 2.5 0 0 0 10.5 1h-5ZM7 7h2v8H7z" />
    </ChatIcon>
  );
}

function ToolCallReferenceChip({ reference }: { reference: ToolCallReference }) {
  const content = <ToolCallChipContent label={reference.label} value={reference.value} />;
  const icon = reference.icon ?? <SpanIcon />;

  if (reference.to) {
    return (
      <LinkButton icon={icon} size="xs" to={reference.to} onClick={reference.onClick}>
        {content}
      </LinkButton>
    );
  }

  return (
    <Button disabled={!reference.onClick} icon={icon} size="xs" onClick={reference.onClick}>
      {content}
    </Button>
  );
}

function ToolCallFailureChip({ label }: { label: ReactNode }) {
  return (
    <div className="rounded-[5px] border border-[var(--scraps-theme-border-danger)] bg-background px-1.5">
      <Text bold size="sm" variant="danger">
        {label}
      </Text>
    </div>
  );
}

function ToolCallInput({ input }: { input: ReactNode }) {
  return (
    <div className="w-full rounded-[6px] border border-[var(--scraps-theme-border-primary)] bg-card p-2">
      <div className="flex flex-wrap items-center gap-2">
        <Text bold monospace size="sm" variant="secondary">
          {t("Input:")}
        </Text>
        {input}
      </div>
    </div>
  );
}

function ToolCallOutput({ output }: { output: ReactNode }) {
  return (
    <div className="w-full rounded-[6px] bg-card p-2">
      <div className="flex flex-wrap items-center gap-2">
        <Text bold monospace size="sm" variant="secondary">
          {t("Output:")}
        </Text>
        {output}
      </div>
    </div>
  );
}

function getToolCallStatusLabel(status: ToolCallStatus) {
  switch (status) {
    case "loading":
      return t("Running");
    case "pending":
      return t("Waiting");
    case "success":
      return t("Succeeded");
    case "failure":
      return t("Failed");
    case "mixed":
      return t("Partially succeeded");
    case "content":
      return undefined;
  }
}

export function ToolCall({
  children,
  durationMs,
  failureLabel,
  input,
  notifications,
  output,
  reference,
  status,
  title,
}: ToolCallProps) {
  const isFailure = status === "failure";
  const hasTrailing = reference !== undefined || isFailure;
  const hasDetail =
    input !== undefined ||
    output !== undefined ||
    Boolean(notifications?.length) ||
    children !== undefined;

  return (
    <div className="grid w-full min-w-0 flex-1 gap-1">
      <div className="flex w-full items-center gap-3">
        <div className="flex w-4 shrink-0 justify-center">
          <ToolCallIndicator aria-label={getToolCallStatusLabel(status)} status={status} />
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <Text monospace size="sm" variant="secondary">
            {title}
          </Text>
          {hasTrailing ? (
            <div className="flex shrink-0 items-center gap-2">
              {reference ? <ToolCallReferenceChip reference={reference} /> : null}
              {isFailure ? <ToolCallFailureChip label={failureLabel ?? t("Failed")} /> : null}
            </div>
          ) : null}
        </div>
        {durationMs === undefined ? null : (
          <Text align="right" monospace size="sm" variant="secondary">
            {formatElapsed(durationMs)}
          </Text>
        )}
      </div>
      {hasDetail ? (
        <div className="flex w-full items-start gap-3">
          <div aria-hidden="true" className="w-4 shrink-0" />
          <div className="grid min-w-0 flex-1 gap-1">
            {input === undefined ? null : <ToolCallInput input={input} />}
            {output === undefined ? null : <ToolCallOutput output={output} />}
            {notifications?.map((note, index) => (
              <Text key={index} size="sm" variant="muted">
                {note}
              </Text>
            ))}
            {children}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getToolCallLabel(status: Exclude<ToolCallStatus, "content">) {
  switch (status) {
    case "loading":
      return t("Running...");
    case "pending":
      return t("Waiting for approval");
    case "failure":
      return t("All tool calls failed");
    case "mixed":
      return t("Some tool calls succeeded and some failed");
    case "success":
      return t("All tool calls succeeded");
  }
}

interface ThinkingBlockProps {
  startTime: Date;
  title: string;
  children?: ReactNode;
  endTime?: Date;
}

export function ThinkingBlock({ children, endTime, startTime, title }: ThinkingBlockProps) {
  const elapsed = useElapsedTime(startTime, endTime);
  const isActive = endTime === undefined;
  const [userExpanded, setUserExpanded] = useState(false);
  const titleRef = useRef<HTMLSpanElement>(null);
  const baseTitle = title.replace(/[.…\s]+$/u, "");
  useTextDecodeAnimation(titleRef, baseTitle);

  return (
    <Disclosure
      expanded={isActive || userExpanded}
      flex={1}
      minWidth={0}
      size="sm"
      variant="outline"
      onExpandedChange={setUserExpanded}
    >
      <Disclosure.Title
        leadingItems={<SeerIcon active={isActive} />}
        trailingItems={
          <Text align="right" monospace size="sm" variant="secondary">
            {formatElapsed(elapsed)}
          </Text>
        }
      >
        <Text monospace size="sm" variant="muted">
          <span key={baseTitle} ref={titleRef}>
            {baseTitle}
          </span>
          {isActive ? <AnimatedEllipsis /> : null}
        </Text>
      </Disclosure.Title>
      {children ? <Disclosure.Content>{children}</Disclosure.Content> : null}
    </Disclosure>
  );
}

function useElapsedTime(startTime: Date, endTime: Date | undefined, intervalMs = 100) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (endTime) return;
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [endTime, intervalMs]);

  return (endTime ?? now).getTime() - startTime.getTime();
}

function formatElapsed(milliseconds: number) {
  const units: ReadonlyArray<readonly [number, string]> = [
    [31_536_000_000, "yr"],
    [2_629_800_000, "mo"],
    [604_800_000, "wk"],
    [86_400_000, "d"],
    [3_600_000, "hr"],
    [60_000, "min"],
  ];
  const absolute = Math.abs(milliseconds);
  const [unit, label] = units.find(([candidate]) => absolute >= candidate) ?? [1_000, "s"];
  return `${(milliseconds / unit).toFixed(1)}${t(label)}`;
}

function AnimatedEllipsis({ intervalMs = 400 }: { intervalMs?: number }) {
  const [count, setCount] = useState(1);

  useEffect(() => {
    const id = window.setInterval(() => setCount((current) => (current % 3) + 1), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return (
    <span aria-hidden="true" className="relative inline-block h-[1em] w-[1.5ch]">
      {Array.from({ length: count }, (_, index) => (
        <span className="absolute top-0" key={index} style={{ left: `${(index * 100) / 3}%` }}>
          .
        </span>
      ))}
    </span>
  );
}

interface ChatIconProps extends SVGAttributes<SVGSVGElement> {
  label?: string;
}

function ChatIcon({ children, className, label, ...props }: ChatIconProps) {
  return (
    <svg
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
      className={cn("size-3 shrink-0 fill-current", className)}
      role={label ? "img" : undefined}
      viewBox="0 0 16 16"
      {...props}
    >
      {children}
    </svg>
  );
}

function ThumbIcon({ direction }: { direction: "up" | "down" }) {
  return (
    <ChatIcon
      className={cn(
        "transition-transform duration-[120ms] ease-in-out motion-reduce:transition-none",
        direction === "down" && "rotate-180",
      )}
    >
      <path d="M8.38 0C9.55 0 10.49 0.95 10.49 2.11V5H12C13.92 5 15.28 6.61 14.95 8.54L14.95 8.54L14.4 12.46C14.4 12.47 14.4 12.49 14.4 12.5C14.12 14.02 12.82 15 11.36 15H1.75C1.34 15 1 14.66 1 14.25V5.75C1 5.34 1.34 5 1.75 5H4.77L6.45 1.25C6.8 0.49 7.55 0 8.38 0ZM2.5 13.5H4.5V6.5H2.5V13.5ZM8.38 1.5C8.14 1.5 7.92 1.64 7.82 1.86L6 5.91V13.5H11.36C12.14 13.5 12.77 13 12.92 12.23L13.47 8.33L13.47 8.3C13.66 7.27 12.99 6.5 12 6.5H9.74C9.33 6.5 8.99 6.16 8.99 5.75V2.11C8.99 1.77 8.72 1.5 8.38 1.5Z" />
    </ChatIcon>
  );
}

function CopyIcon() {
  return (
    <ChatIcon className="text-[var(--scraps-content-secondary)]">
      <path d="M1 4.75C1 3.78 1.78 3 2.75 3L4 3L4 1.75C4 0.78 4.78 0 5.75 0L14.25 0C15.22 0 16 0.78 16 1.75L16 10.25C16 11.22 15.22 12 14.25 12L13 12L13 13.25C13 14.22 12.22 15 11.25 15L2.75 15C1.78 15 1 14.22 1 13.25L1 4.75ZM5.5 10.25C5.5 10.39 5.61 10.5 5.75 10.5L14.25 10.5C14.39 10.5 14.5 10.39 14.5 10.25L14.5 1.75C14.5 1.61 14.39 1.5 14.25 1.5L5.75 1.5C5.61 1.5 5.5 1.61 5.5 1.75L5.5 10.25ZM2.5 13.25C2.5 13.39 2.61 13.5 2.75 13.5L11.25 13.5C11.39 13.5 11.5 13.39 11.5 13.25L11.5 12L5.75 12C4.78 12 4 11.22 4 10.25L4 4.5L2.75 4.5C2.61 4.5 2.5 4.61 2.5 4.75L2.5 13.25Z" />
    </ChatIcon>
  );
}

function StatusIcon({
  "aria-label": ariaLabel,
  status,
}: {
  "aria-label": string;
  status: "failure" | "mixed" | "success";
}) {
  const paths = {
    failure:
      "M12.72 2.22C13.01 1.93 13.49 1.93 13.78 2.22C14.07 2.51 14.07 2.99 13.78 3.28L9.06 8L13.78 12.72C14.07 13.01 14.07 13.49 13.78 13.78C13.49 14.07 13.01 14.07 12.72 13.78L8 9.06L3.28 13.78C2.99 14.07 2.51 14.07 2.22 13.78C1.93 13.49 1.93 13.01 2.22 12.72L6.94 8L2.22 3.28C1.93 2.99 1.93 2.51 2.22 2.22C2.51 1.93 2.99 1.93 3.28 2.22L8 6.94L12.72 2.22Z",
    mixed:
      "M6.81 0.65C7.26 -0.16 8.38 -0.21 8.91 0.5L9.01 0.65L15.66 12.86C16.12 13.69 15.52 14.71 14.57 14.71H1.25C0.3 14.71 -0.3 13.69 0.15 12.86L6.81 0.65ZM1.67 13.21H14.15L7.91 1.77L1.67 13.21ZM7.91 9.71C8.46 9.71 8.91 10.15 8.91 10.71C8.91 11.26 8.46 11.71 7.91 11.71C7.36 11.71 6.91 11.26 6.91 10.71C6.91 10.15 7.36 9.71 7.91 9.71ZM7.91 4.71C8.32 4.71 8.66 5.04 8.66 5.46V7.96C8.66 8.37 8.32 8.71 7.91 8.71C7.5 8.71 7.16 8.37 7.16 7.96V5.46C7.16 5.04 7.5 4.71 7.91 4.71Z",
    success:
      "M13.72 3.22C14.01 2.93 14.49 2.93 14.78 3.22C15.07 3.51 15.07 3.99 14.78 4.28L6.53 12.53C6.24 12.82 5.76 12.82 5.47 12.53L1.22 8.28C0.93 7.99 0.93 7.51 1.22 7.22C1.51 6.93 1.99 6.93 2.28 7.22L6 10.94L13.72 3.22Z",
  } as const;
  const color = {
    failure: "text-[var(--scraps-content-danger)]",
    mixed: "text-[var(--scraps-info-graphics-warning-vibrant)]",
    success: "text-[var(--scraps-content-success)]",
  } as const;
  return (
    <ChatIcon className={color[status]} label={ariaLabel}>
      <path d={paths[status]} />
    </ChatIcon>
  );
}

function SeerIcon({ active }: { active: boolean }) {
  const prefersReducedMotion = useReducedMotion();
  const commonPath =
    "M8.01759 0.25C8.23262 0.249787 8.43757 0.341936 8.58009 0.50293C9.70729 1.77804 11.2269 3.70119 12.626 5.82324C13.9841 7.8832 15.2561 10.1746 15.9317 12.2656C15.9736 12.3357 16.005 12.4135 16.0225 12.4971C16.0949 12.8447 15.9134 13.1959 15.5879 13.3379C13.4024 14.2912 11.151 15 8.01857 15C4.88669 15 2.63318 14.2943 0.451185 13.3457C0.17589 13.226 -0.00176762 12.9535 0.0000133514 12.6533C0.00080069 12.526 0.0359022 12.4049 0.0947399 12.2979C0.767604 10.203 2.04619 7.9014 3.41115 5.83105C4.81012 3.70913 6.32944 1.78347 7.45607 0.503906L7.51173 0.447266C7.64909 0.321318 7.82933 0.250248 8.01759 0.25ZM13.666 10.6562C12.0686 11.1903 10.117 11.5 8.01857 11.5C5.92124 11.5 3.96583 11.1911 2.37111 10.6572C2.11538 11.1963 1.88727 11.7258 1.69923 12.2402C3.54489 12.9877 5.45222 13.5 8.01857 13.5C10.5835 13.5 12.4883 12.9863 14.336 12.2354C14.1485 11.7218 13.9206 11.1939 13.666 10.6562ZM8.01857 5.5C5.93882 5.50013 4.03972 6.99814 3.14259 9.3291C4.50943 9.74712 6.18916 9.99997 8.01857 10C9.84849 9.99998 11.5258 9.74671 12.8955 9.32812C11.9966 6.998 10.098 5.50012 8.01857 5.5ZM8.01954 2.15234C7.51245 2.75664 6.94957 3.46183 6.37013 4.23438C6.89523 4.08216 7.44681 4.00003 8.01857 4C8.59213 4.00002 9.14526 4.08221 9.67189 4.23535C9.09134 3.46176 8.52751 2.756 8.01954 2.15234Z";
  if (active && !prefersReducedMotion) {
    return (
      <ChatIcon>
        <path d={commonPath} />
        <circle
          className="animate-[scraps-chat-seer-wait_4s_ease-out_infinite]"
          cx="8"
          cy="9"
          r="2"
        />
      </ChatIcon>
    );
  }

  return (
    <ChatIcon>
      <path d="M8 0.25C8.21 0.25 8.42 0.34 8.56 0.5C9.69 1.78 11.21 3.7 12.61 5.82C13.97 7.88 15.24 10.17 15.91 12.27C15.96 12.34 15.99 12.41 16 12.5C16.08 12.84 15.89 13.2 15.57 13.34C13.38 14.29 11.13 15 8 15C4.87 15 2.61 14.29 0.43 13.35C0.16 13.23 -0.02 12.95 -0.02 12.65C-0.02 12.53 0.02 12.4 0.08 12.3C0.75 10.2 2.03 7.9 3.39 5.83C4.79 3.71 6.31 1.78 7.44 0.5L7.49 0.45C7.63 0.32 7.81 0.25 8 0.25ZM13.65 10.66C12.05 11.19 10.1 11.5 8 11.5C5.9 11.5 3.95 11.19 2.35 10.66C2.1 11.2 1.87 11.73 1.68 12.24C3.53 12.99 5.43 13.5 8 13.5C10.56 13.5 12.47 12.99 14.32 12.24C14.13 11.72 13.9 11.19 13.65 10.66ZM8 5.5C5.92 5.5 4.02 7 3.12 9.33C4.03 9.61 5.08 9.81 6.22 9.92C6.08 9.64 6 9.33 6 9C6 7.9 6.9 7 8 7C9.1 7 10 7.9 10 9C10 9.33 9.92 9.64 9.78 9.92C10.92 9.81 11.96 9.61 12.88 9.33C11.98 7 10.08 5.5 8 5.5ZM8 2.15C7.49 2.76 6.93 3.46 6.35 4.23C6.88 4.08 7.43 4 8 4C8.57 4 9.13 4.08 9.65 4.24C9.07 3.46 8.51 2.76 8 2.15Z" />
    </ChatIcon>
  );
}
