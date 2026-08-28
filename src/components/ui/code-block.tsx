"use client";

import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";

import "./roboto-mono.css";
import { Button } from "./button";
import { useCodeMessages, type CodeMessages } from "./code-messages";
import { getPrismLanguage, loadPrismLanguage, loadPrismLineHighlight, Prism } from "./prism";

function classNames(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(" ");
}

interface CodeBlockProps {
  children: string;
  alwaysShowCopyButton?: boolean;
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
  wrapMode?: "scroll" | "wrap";
}

type CopyState = "copy" | "copied" | "error";

const copyMessageKeys: Record<
  CopyState,
  keyof Pick<CodeMessages, "copiedTooltip" | "copyErrorTooltip" | "copyTooltip">
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

const wrapperClasses = [
  "group/code relative h-full min-w-0 rounded-[6px] bg-[var(--prism-block-background)] data-[rounded=false]:rounded-none",
  "[&_pre]:m-0 [&_pre]:h-full [&_pre]:w-max [&_pre]:min-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-[6px] [&_pre]:bg-[var(--prism-block-background)] [&_pre]:px-4 [&_pre]:py-2 [&_pre]:text-left [&_pre]:font-[425] [&_pre]:text-[0.75rem] [&_pre]:text-[var(--prism-base)] [&_pre]:shadow-none [&_pre]:[direction:ltr] [&_pre]:[font-family:var(--font-roboto-mono,'Roboto_Mono_Variable'),'Roboto_Mono',monospace] [&_pre]:[hyphens:none] [&_pre]:[tab-size:4] [&_pre]:[text-shadow:none] [&_pre]:[white-space:pre] [&_pre]:[word-break:normal] [&_pre]:[word-spacing:normal]",
  "data-[render-inline=true]:[&_pre]:p-0 [&_pre[data-line]]:relative",
  "[&_code]:relative [&_code]:z-[1] [&_code]:text-[var(--prism-base)] [&_code]:[background:none] [&_code]:[font:inherit] [&_code]:[text-shadow:none] [&_code]:[user-select:auto] [&_code[data-disable-user-selection=true]]:[user-select:none]",
  "[&_.namespace]:opacity-70",
  "[&_.token]:[--prism-token-comment:initial] [&_.token]:[--prism-token-function:initial] [&_.token]:[--prism-token-keyword:initial] [&_.token]:[--prism-token-operator:initial] [&_.token]:[--prism-token-property:initial] [&_.token]:[--prism-token-punctuation:initial] [&_.token]:[--prism-token-selector:initial] [&_.token]:[--prism-token-variable:initial] [&_.token]:[color:var(--prism-token-variable,var(--prism-token-function,var(--prism-token-keyword,var(--prism-token-operator,var(--prism-token-selector,var(--prism-token-property,var(--prism-token-punctuation,var(--prism-token-comment,var(--prism-base)))))))))]",
  "[&_.token.comment]:[--prism-token-comment:var(--prism-comment)] [&_.token.prolog]:[--prism-token-comment:var(--prism-comment)] [&_.token.doctype]:[--prism-token-comment:var(--prism-comment)] [&_.token.cdata]:[--prism-token-comment:var(--prism-comment)]",
  "[&_.token.punctuation]:[--prism-token-punctuation:var(--prism-punctuation)]",
  "[&_.token.property]:[--prism-token-property:var(--prism-property)] [&_.token.tag]:[--prism-token-property:var(--prism-property)] [&_.token.boolean]:[--prism-token-property:var(--prism-property)] [&_.token.number]:[--prism-token-property:var(--prism-property)] [&_.token.constant]:[--prism-token-property:var(--prism-property)] [&_.token.symbol]:[--prism-token-property:var(--prism-property)] [&_.token.deleted]:[--prism-token-property:var(--prism-property)]",
  "[&_.token.selector]:[--prism-token-selector:var(--prism-selector)] [&_.token.attr-name]:[--prism-token-selector:var(--prism-selector)] [&_.token.string]:[--prism-token-selector:var(--prism-selector)] [&_.token.char]:[--prism-token-selector:var(--prism-selector)] [&_.token.builtin]:[--prism-token-selector:var(--prism-selector)] [&_.token.inserted]:[--prism-token-selector:var(--prism-selector)]",
  "[&_.token.operator]:[--prism-token-operator:var(--prism-operator)] [&_.token.operator]:[background:none] [&_.token.entity]:[--prism-token-operator:var(--prism-operator)] [&_.token.entity]:[background:none] [&_.token.url]:[--prism-token-operator:var(--prism-operator)] [&_.token.url]:[background:none] [&_.language-css_.token.string]:[--prism-token-operator:var(--prism-operator)] [&_.language-css_.token.string]:[background:none] [&_.style_.token.string]:[--prism-token-operator:var(--prism-operator)] [&_.style_.token.string]:[background:none]",
  "[&_.token.atrule]:[--prism-token-keyword:var(--prism-keyword)] [&_.token.attr-value]:[--prism-token-keyword:var(--prism-keyword)] [&_.token.keyword]:[--prism-token-keyword:var(--prism-keyword)]",
  "[&_.token.function]:[--prism-token-function:var(--prism-function)]",
  "[&_.token.regex]:[--prism-token-variable:var(--prism-variable)] [&_.token.important]:[--prism-token-variable:var(--prism-variable)] [&_.token.variable]:[--prism-token-variable:var(--prism-variable)]",
  "[&_.token.important]:font-medium [&_.token.bold]:font-medium [&_.token.italic]:italic [&_.token.entity]:cursor-help",
  "[&_.line-highlight]:pointer-events-none [&_.line-highlight]:absolute [&_.line-highlight]:right-0 [&_.line-highlight]:left-[-16px] [&_.line-highlight]:z-0 [&_.line-highlight]:bg-[var(--prism-highlight-background)] [&_.line-highlight]:shadow-[inset_5px_0_0_var(--prism-highlight-accent)] [&_.line-highlight]:[line-height:inherit] [&_.line-highlight]:[white-space:pre]",
].join(" ");

const darkThemeClasses =
  "[--scraps-theme-border-primary:#141119] [--scraps-code-button-active:#d0b8f821] [--scraps-code-button-hover:#c0a8f81a] [--scraps-code-focus:#7553ff] [--scraps-code-focus-mask:#2e2936] [--scraps-code-tooltip-background:#393442] [--scraps-code-tooltip-arrow-background:#2e2936] [--scraps-code-tooltip-content:#e7e5ea] [--prism-base:#e7e5ea] [--prism-block-background:#24202b] [--prism-comment:#b5b0bd] [--prism-function:#aba8f8] [--prism-highlight-accent:#c0b0f02e] [--prism-highlight-background:#c0a8f81a] [--prism-keyword:#f6938c] [--prism-operator:#aba8f8] [--prism-property:#aba8f8] [--prism-punctuation:#e7e5ea] [--prism-selector:#5ece73] [--prism-variable:#e7e5ea]";

const headerClasses =
  "z-[2] flex items-center text-[0.75rem] font-medium text-[var(--prism-base)] [font-family:var(--font-roboto-mono,'Roboto_Mono_Variable'),'Roboto_Mono',monospace]";

const regularHeaderClasses =
  "gap-1.5 [border-bottom:1px_solid_var(--scraps-theme-border-primary)] [padding:4px_4px_0_8px]";

const floatingHeaderClasses =
  "absolute top-0 right-0 h-max max-h-full w-max justify-end gap-0.5 [border-bottom:0] p-1";

const tabClasses = "m-0 box-border block touch-manipulation [background:none]";

const unselectedTabClasses = "p-2 text-[var(--prism-comment)] [border:0]";

const selectedTabClasses =
  "text-[var(--prism-base)] [border-color:var(--scraps-code-accent)] [border-style:solid] [border-width:0_0_3px_0] [padding:8px_8px_5px]";

const copyButtonClasses =
  "touch-manipulation opacity-0 text-[var(--prism-comment)] transition-opacity duration-100 ease-out [--background:var(--scraps-code-focus-mask)] [--ring:var(--scraps-code-focus)] [--scraps-button-transparent-active:var(--scraps-code-button-active)] [--scraps-button-transparent-content:var(--prism-comment)] [--scraps-button-transparent-hover:var(--scraps-code-button-hover)] group-hover/code:opacity-100 hover:text-[var(--prism-base)] focus-visible:opacity-100 data-[always-visible=true]:opacity-100 motion-reduce:transition-none [@media(hover:none)]:min-h-11 [@media(hover:none)]:min-w-11 [@media(hover:none)]:opacity-100 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11 [@media(pointer:coarse)]:opacity-100";

type CodeTooltipStyle = CSSProperties & Record<`--${string}`, string>;

function codeTooltipStyle(dark?: boolean): CodeTooltipStyle {
  return dark
    ? {
        "--background": "#2e2936",
        "--popover": "#393442",
        "--popover-foreground": "#e7e5ea",
        "--scraps-theme-border-primary": "#141119",
      }
    : {
        "--background": "var(--scraps-code-tooltip-arrow-background)",
        "--popover": "var(--scraps-code-tooltip-background)",
        "--popover-foreground": "var(--scraps-code-tooltip-content)",
      };
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
  const [copyState, setCopyState] = useState<CopyState>("copy");

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

  return (
    <Button
      aria-label={messages.copyButtonLabel}
      className={copyButtonClasses}
      data-always-visible={isAlwaysVisible}
      icon={<CopyIcon />}
      size="xs"
      tooltipProps={{
        overlayStyle: codeTooltipStyle(dark),
        position: "left",
        title: messages[copyMessageKeys[copyState]],
      }}
      variant="transparent"
      onClick={handleCopy}
      onMouseLeave={() => setCopyState("copy")}
    />
  );
}

export function CodeBlock({
  alwaysShowCopyButton,
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
  wrapMode = "scroll",
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
        if (mounted && codeRef.current) onAfterHighlightRef.current?.(codeRef.current);
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
      className={classNames(
        wrapperClasses,
        wrapMode === "wrap" &&
          "[&_pre]:w-full [&_pre]:whitespace-pre-wrap [&_pre]:[overflow-wrap:anywhere] [&_code]:whitespace-pre-wrap [&_code]:[overflow-wrap:anywhere]",
        alwaysShowCopyButton &&
          hasFloatingHeader &&
          wrapMode === "wrap" &&
          "[&_pre]:before:float-right [&_pre]:before:h-4 [&_pre]:before:w-3 [&_pre]:before:content-['']",
        dark && darkThemeClasses,
        className,
      )}
      data-code-block=""
      data-render-inline={renderInline}
      data-rounded={isRounded}
    >
      <div
        className={classNames(
          headerClasses,
          hasFloatingHeader ? floatingHeaderClasses : regularHeaderClasses,
        )}
        data-floating={hasFloatingHeader}
      >
        {hasTabs ? (
          <Fragment>
            <div className="flex overflow-x-auto p-0">
              {tabs?.map(({ label, value }) => (
                <button
                  aria-pressed={selectedTab === value}
                  className={classNames(
                    tabClasses,
                    selectedTab === value ? selectedTabClasses : unselectedTabClasses,
                  )}
                  key={value}
                  type="button"
                  onClick={() => onTabClick?.(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className="grow" />
          </Fragment>
        ) : null}
        {icon}
        {filename ? (
          <span className="block w-auto overflow-hidden text-ellipsis whitespace-nowrap">
            {filename}
          </span>
        ) : null}
        {!hasTabs ? <span className="grow" /> : null}
        {!hideCopyButton ? (
          <CodeCopyButton
            codeRef={codeRef}
            copiedCode={children}
            dark={dark}
            isAlwaysVisible={alwaysShowCopyButton || !hasFloatingHeader || Boolean(icon)}
            onCopy={onCopy}
          />
        ) : null}
      </div>
      <div
        className={classNames(
          "h-full",
          wrapMode === "scroll" ? "overflow-x-auto" : "overflow-x-hidden",
          alwaysShowCopyButton && hasFloatingHeader && wrapMode === "scroll" && "mr-8",
        )}
      >
        <pre className={`language-${renderedLanguage}`} data-line={lineHighlightRange}>
          <code
            className={`language-${renderedLanguage}`}
            data-disable-user-selection={disableUserSelection}
            data-wrap-mode={wrapMode}
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
