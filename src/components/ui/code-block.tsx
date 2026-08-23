"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type ReactNode,
  type RefObject,
} from "react";

import "./roboto-mono.css";
import styles from "./code.module.css";
import { useCodeMessages, type CodeMessages } from "./code-messages";
import {
  getPrismLanguage,
  loadPrismLanguage,
  loadPrismLineHighlight,
  Prism,
} from "./prism";

function classNames(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(" ");
}

const tooltipGroupListeners = new Map<
  symbol,
  (origin: symbol) => void
>();
const openTooltipGroupMembers = new Set<symbol>();
let tooltipGroupCoolDown: ReturnType<typeof setTimeout> | undefined;
let tooltipGroupIsWarm = false;
const tooltipOpenDelay = 400;
const tooltipCloseDelay = 150;
const tooltipGroupTimeout = 600;

function openTooltipGroup(member: symbol) {
  if (tooltipGroupCoolDown) clearTimeout(tooltipGroupCoolDown);
  tooltipGroupCoolDown = undefined;
  openTooltipGroupMembers.add(member);
  tooltipGroupIsWarm = true;
  for (const listener of tooltipGroupListeners.values()) {
    listener(member);
  }
}

function closeTooltipGroup(member: symbol) {
  const removedOpenMember = openTooltipGroupMembers.delete(member);
  if (!removedOpenMember) return;
  if (openTooltipGroupMembers.size > 0) return;
  if (tooltipGroupCoolDown) clearTimeout(tooltipGroupCoolDown);
  tooltipGroupCoolDown = setTimeout(() => {
    tooltipGroupIsWarm = false;
    tooltipGroupCoolDown = undefined;
  }, tooltipGroupTimeout);
}

type PreventableFocusEvent = FocusEvent<HTMLButtonElement> & {
  preventBaseUIHandler?: () => void;
};

function clearTooltipTimer(
  timer: RefObject<ReturnType<typeof setTimeout> | undefined>
) {
  if (timer.current === undefined) return;
  clearTimeout(timer.current);
  timer.current = undefined;
}

function clearTooltipTimers(
  openTimer: RefObject<ReturnType<typeof setTimeout> | undefined>,
  closeTimer: RefObject<ReturnType<typeof setTimeout> | undefined>
) {
  clearTooltipTimer(openTimer);
  clearTooltipTimer(closeTimer);
}

interface CodeBlockProps {
  children: string;
  className?: string;
  dark?: boolean;
  "data-render-inline"?: boolean;
  disableUserSelection?: boolean;
  filename?: string;
  hideCopyButton?: boolean;
  icon?: ReactNode;
  isRounded?: boolean;
  language?: string;
  linesToHighlight?: number[];
  onAfterHighlight?: (element: HTMLElement) => void;
  onCopy?: (copiedCode: string) => void;
  onSelectAndCopy?: () => void;
  onTabClick?: (tab: string) => void;
  selectedTab?: string;
  tabs?: Array<{ label: string; value: string }>;
}

type CopyState = "copy" | "copied" | "error";

const copyMessageKeys: Record<
  CopyState,
  keyof Pick<
    CodeMessages,
    "copiedTooltip" | "copyErrorTooltip" | "copyTooltip"
  >
> = {
  copy: "copyTooltip",
  copied: "copiedTooltip",
  error: "copyErrorTooltip",
};

function CopyIcon() {
  return (
    <svg aria-hidden height="12" viewBox="0 0 16 16" width="12">
      <path
        d="M1 4.75C1 3.78 1.78 3 2.75 3L4 3L4 1.75C4 0.78 4.78 -0 5.75 -0L14.25 -0C15.22 -0 16 0.78 16 1.75L16 10.25C16 11.22 15.22 12 14.25 12L13 12L13 13.25C13 14.22 12.22 15 11.25 15L2.75 15C1.78 15 1 14.22 1 13.25L1 4.75ZM5.5 10.25C5.5 10.39 5.61 10.5 5.75 10.5L14.25 10.5C14.39 10.5 14.5 10.39 14.5 10.25L14.5 1.75C14.5 1.61 14.39 1.5 14.25 1.5L5.75 1.5C5.61 1.5 5.5 1.61 5.5 1.75L5.5 10.25ZM2.5 13.25C2.5 13.39 2.61 13.5 2.75 13.5L11.25 13.5C11.39 13.5 11.5 13.39 11.5 13.25L11.5 12L5.75 12C4.78 12 4 11.22 4 10.25L4 4.5L2.75 4.5C2.61 4.5 2.5 4.61 2.5 4.75L2.5 13.25Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CopyTooltipArrow() {
  return (
    <TooltipPrimitive.Arrow
      className={styles.copyTooltipArrow}
      render={
        <svg aria-hidden viewBox="0 0 16 8">
          <polygon
            className={styles.copyTooltipArrowSideBorder}
            points="-2,0 16,0 8,5.8 6,5.8"
          />
          <polygon
            className={styles.copyTooltipArrowBorder}
            points="0,0 16,0 8,5.8"
          />
          <polygon
            className={styles.copyTooltipArrowFill}
            points="1.5,0 14.5,0 8,4.8"
          />
        </svg>
      }
    />
  );
}

function CodeCopyButton({
  codeRef,
  copiedCode,
  dark,
  isAlwaysVisible,
  onCopy,
}: {
  codeRef: RefObject<HTMLElement | null>;
  copiedCode: string;
  dark?: boolean;
  isAlwaysVisible: boolean;
  onCopy?: (copiedCode: string) => void;
}) {
  const messages = useCodeMessages();
  const tooltipGroupMember = useRef(Symbol("codeTooltip"));
  const mayBeAnimatingOut = useRef(false);
  const tooltipOpenRef = useRef(false);
  const tooltipOpenTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const tooltipCloseTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [copyState, setCopyState] = useState<CopyState>("copy");
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [tooltipSnapClosed, setTooltipSnapClosed] = useState(false);

  function clearTimers() {
    clearTooltipTimers(tooltipOpenTimer, tooltipCloseTimer);
  }

  function openTooltip() {
    clearTimers();
    tooltipOpenRef.current = true;
    mayBeAnimatingOut.current = true;
    setTooltipSnapClosed(false);
    setTooltipOpen(true);
    openTooltipGroup(tooltipGroupMember.current);
  }

  function closeTooltip({ snap = false }: { snap?: boolean } = {}) {
    clearTimers();
    tooltipOpenRef.current = false;
    setTooltipOpen(false);
    setTooltipSnapClosed(snap);
    setCopyState("copy");
    closeTooltipGroup(tooltipGroupMember.current);
    if (snap) mayBeAnimatingOut.current = false;
  }

  function scheduleFocusOpen(event: PreventableFocusEvent) {
    event.preventBaseUIHandler?.();
    clearTimers();
    if (tooltipOpenRef.current || tooltipGroupIsWarm) {
      openTooltip();
      return;
    }
    tooltipOpenTimer.current = setTimeout(openTooltip, tooltipOpenDelay);
  }

  function scheduleFocusClose(event: PreventableFocusEvent) {
    event.preventBaseUIHandler?.();
    clearTimers();
    if (!tooltipOpenRef.current) return;
    tooltipCloseTimer.current = setTimeout(closeTooltip, tooltipCloseDelay);
  }

  function handleCopy() {
    try {
      const clipboard = navigator.clipboard;
      if (clipboard) {
        void clipboard
          .writeText(codeRef.current?.textContent ?? "")
          .then(() => setCopyState("copied"))
          .catch(() => setCopyState("error"));
      } else {
        setCopyState("error");
      }
    } catch {
      setCopyState("error");
    }
    onCopy?.(copiedCode);
  }

  useEffect(() => {
    const member = tooltipGroupMember.current;
    tooltipGroupListeners.set(member, (origin) => {
      if (origin === member || !mayBeAnimatingOut.current) return;
      clearTooltipTimers(tooltipOpenTimer, tooltipCloseTimer);
      tooltipOpenRef.current = false;
      mayBeAnimatingOut.current = false;
      closeTooltipGroup(member);
      setTooltipOpen(false);
      setTooltipSnapClosed(true);
      setCopyState("copy");
    });
    return () => {
      clearTooltipTimers(tooltipOpenTimer, tooltipCloseTimer);
      tooltipGroupListeners.delete(member);
      closeTooltipGroup(member);
    };
  }, []);

  return (
    <TooltipPrimitive.Provider
      closeDelay={tooltipCloseDelay}
      delay={tooltipOpenDelay}
      timeout={tooltipGroupTimeout}
    >
      <TooltipPrimitive.Root
        open={tooltipOpen}
        onOpenChange={(open) => {
          if (open) openTooltip();
          else closeTooltip();
        }}
        onOpenChangeComplete={(open) => {
          if (!open) mayBeAnimatingOut.current = false;
        }}
      >
        <TooltipPrimitive.Trigger
          closeOnClick={false}
          closeDelay={tooltipCloseDelay}
          delay={tooltipOpenDelay}
          render={
            <button
              aria-label={messages.copyButtonLabel}
              className={styles.copyButton}
              data-always-visible={isAlwaysVisible}
              type="button"
              onBlur={scheduleFocusClose}
              onClick={handleCopy}
              onFocus={scheduleFocusOpen}
              onMouseEnter={() => {
                clearTooltipTimer(tooltipCloseTimer);
                if (!tooltipGroupIsWarm || tooltipOpenRef.current) return;
                openTooltip();
              }}
              onMouseLeave={() => setCopyState("copy")}
            >
              <CopyIcon />
            </button>
          }
        />
        {tooltipSnapClosed ? null : (
          <TooltipPrimitive.Portal>
            <TooltipPrimitive.Positioner
              arrowPadding={4}
              className={styles.copyTooltipPositioner}
              collisionAvoidance={{ fallbackAxisSide: "none" }}
              collisionPadding={12}
              side="left"
              sideOffset={8}
              onClick={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <TooltipPrimitive.Popup
                className={classNames(
                  styles.copyTooltip,
                  dark && styles.darkTheme
                )}
                role="tooltip"
              >
                {messages[copyMessageKeys[copyState]]}
                <CopyTooltipArrow />
              </TooltipPrimitive.Popup>
            </TooltipPrimitive.Positioner>
          </TooltipPrimitive.Portal>
        )}
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

export function CodeBlock({
  children,
  className,
  dark,
  "data-render-inline": renderInline,
  disableUserSelection,
  filename,
  hideCopyButton,
  language,
  linesToHighlight,
  icon,
  isRounded = true,
  onAfterHighlight,
  onCopy,
  onSelectAndCopy,
  onTabClick,
  selectedTab,
  tabs,
}: CodeBlockProps) {
  const codeRef = useRef<HTMLElement>(null);
  const onAfterHighlightRef = useRef(onAfterHighlight);
  const [lineHighlightLoaded, setLineHighlightLoaded] = useState(false);
  const lineHighlightRange = linesToHighlight?.join(",");
  const prismLanguage = language ? getPrismLanguage(language) : undefined;
  const renderedLanguage = prismLanguage ?? String(language);

  useEffect(() => {
    onAfterHighlightRef.current = onAfterHighlight;
  }, [onAfterHighlight]);

  useEffect(() => {
    if (!lineHighlightRange) return;
    let mounted = true;
    loadPrismLineHighlight().then((loaded) => {
      if (mounted && loaded) setLineHighlightLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, [lineHighlightRange]);

  useEffect(() => {
    const element = codeRef.current;
    if (!element) return;
    element.parentElement
      ?.querySelectorAll(".line-highlight")
      .forEach((highlight) => highlight.remove());
    element.textContent = children;
    if (!prismLanguage) return;
    const languageToHighlight = prismLanguage;
    let mounted = true;

    async function highlight() {
      const loaded = await loadPrismLanguage(languageToHighlight);
      if (!loaded || !mounted || !codeRef.current) return;
      Prism.highlightElement(codeRef.current, false, () => {
        if (mounted && codeRef.current)
          onAfterHighlightRef.current?.(codeRef.current);
      });
    }

    void highlight();
    return () => {
      mounted = false;
    };
  }, [children, lineHighlightLoaded, lineHighlightRange, prismLanguage]);

  const hasTabs = Boolean(tabs?.length);
  const hasFloatingHeader = !(filename || hasTabs);

  return (
    <div
      className={classNames(styles.wrapper, dark && styles.darkTheme, className)}
      data-render-inline={renderInline}
      data-rounded={isRounded}
    >
      <div className={styles.header} data-floating={hasFloatingHeader}>
        {hasTabs ? (
          <Fragment>
            <div className={styles.tabs}>
              {tabs?.map(({ label, value }) => (
                <button
                  aria-pressed={selectedTab === value}
                  className={classNames(
                    styles.tab,
                    selectedTab === value && styles.selectedTab
                  )}
                  key={value}
                  type="button"
                  onClick={() => onTabClick?.(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className={styles.headerSpacer} />
          </Fragment>
        ) : null}
        {icon}
        {filename ? <span className={styles.filename}>{filename}</span> : null}
        {!hasTabs ? <span className={styles.headerSpacer} /> : null}
        {!hideCopyButton ? (
          <CodeCopyButton
            codeRef={codeRef}
            copiedCode={children}
            dark={dark}
            isAlwaysVisible={!hasFloatingHeader || Boolean(icon)}
            onCopy={onCopy}
          />
        ) : null}
      </div>
      <div className={styles.scrollWrapper}>
        <pre
          className={`language-${renderedLanguage}`}
          data-line={lineHighlightRange}
        >
          <code
            className={`language-${renderedLanguage}`}
            data-disable-user-selection={disableUserSelection}
            ref={codeRef}
            onCopy={onSelectAndCopy}
          >
            {children}
          </code>
        </pre>
      </div>
    </div>
  );
}
