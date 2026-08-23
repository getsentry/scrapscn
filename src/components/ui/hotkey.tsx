"use client";

import { isMac } from "@react-aria/utils";
import * as Sentry from "@sentry/react";
import {
  useEffect,
  useRef,
  useSyncExternalStore,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import "./roboto-mono.css";
import styles from "./hotkey.module.css";

type Variant = "embossed" | "debossed";

interface KbdProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  variant?: Variant;
}

interface HotkeyProps {
  value: string | string[];
  variant?: Variant;
}

type HotkeyRegistration = {
  callback: (event: KeyboardEvent) => void;
  match: string | string[];
  enabled?: boolean;
  includeInputs?: boolean;
  skipPreventDefault?: boolean;
};

type KeyGlyph = { icon: ReactNode; label: string } | { label: string };

const aliases: Record<string, string> = {
  cmd: "command",
  meta: "command",
  "⌘": "command",
  ctrl: "control",
  "⌃": "control",
  option: "alt",
  "⌥": "alt",
  "⇧": "shift",
  return: "enter",
  esc: "escape",
  del: "delete",
  ins: "insert",
  "⇪": "capslock",
};

const namedKeyMap: Record<string, string> = {
  backspace: "Backspace",
  tab: "Tab",
  clear: "Clear",
  enter: "Enter",
  escape: "Escape",
  space: " ",
  left: "ArrowLeft",
  up: "ArrowUp",
  right: "ArrowRight",
  down: "ArrowDown",
  delete: "Delete",
  insert: "Insert",
  home: "Home",
  end: "End",
  pageup: "PageUp",
  pagedown: "PageDown",
  capslock: "CapsLock",
};

const punctuationCodeMap: Record<string, string> = {
  ",": "Comma",
  ".": "Period",
  "/": "Slash",
  "`": "Backquote",
  "-": "Minus",
  "=": "Equal",
  ";": "Semicolon",
  "'": "Quote",
  "[": "BracketLeft",
  "]": "BracketRight",
  "\\": "Backslash",
};

const modifierPredicates: Record<
  string,
  (event: KeyboardEvent) => boolean
> = {
  command: (event) => event.metaKey,
  shift: (event) => event.shiftKey,
  control: (event) => event.ctrlKey,
  alt: (event) => event.altKey,
};

const modifierKeys = ["command", "shift", "control", "alt"] as const;

function canonicalizeForPlatform(keyName: string, mac: boolean): string {
  const lower = keyName.toLowerCase();
  if (lower === "mod") return mac ? "command" : "control";
  return aliases[lower] ?? lower;
}

function canonicalize(keyName: string): string {
  return canonicalizeForPlatform(keyName, isMac());
}

const subscribeToPlatform = () => () => {};

function useIsMacPlatform(): boolean {
  return useSyncExternalStore(subscribeToPlatform, isMac, () => false);
}

function codeForChar(character: string): string | undefined {
  if (character >= "a" && character <= "z") {
    return `Key${character.toUpperCase()}`;
  }
  if (character >= "0" && character <= "9") {
    return `Digit${character}`;
  }
  return punctuationCodeMap[character];
}

function matchesKey(name: string, event: KeyboardEvent): boolean {
  const key = canonicalize(name);
  const modifier = modifierPredicates[key];
  if (modifier) return modifier(event);

  const namedKey = namedKeyMap[key];
  if (namedKey) return event.key === namedKey;

  if (key.length === 1) {
    if (event.key?.toLowerCase() === key) return true;

    const code = codeForChar(key);
    if (code && event.code === code) {
      const eventKey = event.key;
      if (eventKey?.length !== 1 || eventKey.charCodeAt(0) > 0x7f) return true;
      if (event.shiftKey) return true;
    }
  }

  return false;
}

function KeyIcon({
  direction,
  path,
}: {
  direction?: "down" | "left" | "right" | "up";
  path: string;
}) {
  const transform =
    direction === "down"
      ? "scale(1, -1)"
      : direction
        ? `rotate(${({ up: 0, right: 90, left: 270 } as const)[direction]}deg)`
        : undefined;

  return (
    <svg
      fill="currentColor"
      height="12"
      role="img"
      style={transform ? { transform } : undefined}
      viewBox="0 0 16 16"
      width="12"
    >
      <path d={path} />
    </svg>
  );
}

const commandPath =
  "M12 1.25a2.75 2.75 0 1 1 0 5.5h-1.25v2.5H12A2.75 2.75 0 1 1 9.25 12v-1.25h-2.5V12A2.75 2.75 0 1 1 4 9.25h1.25v-2.5H4A2.75 2.75 0 1 1 6.75 4v1.25h2.5V4A2.75 2.75 0 0 1 12 1.25m-8 9.5A1.25 1.25 0 1 0 5.25 12v-1.25zM10.75 12A1.25 1.25 0 1 0 12 10.75h-1.25zm-4-2.75h2.5v-2.5h-2.5zM4 2.75a1.25 1.25 0 1 0 0 2.5h1.25V4c0-.69-.56-1.25-1.25-1.25m8 0c-.69 0-1.25.56-1.25 1.25v1.25H12a1.25 1.25 0 1 0 0-2.5";
const controlPath =
  "M8 2a.75.75 0 0 1 .545.235l4.25 4.5a.75.75 0 1 1-1.09 1.03L8 3.84 4.295 7.765a.75.75 0 0 1-1.09-1.03l4.25-4.5A.75.75 0 0 1 8 2";
const optionPath =
  "M5.632 2c.746 0 1.41.474 1.654 1.18l3.328 9.651c.035.1.13.169.237.169h3.399a.75.75 0 0 1 0 1.5h-3.4a1.75 1.75 0 0 1-1.654-1.18L5.868 3.67a.25.25 0 0 0-.236-.169H1.75a.75.75 0 0 1 0-1.5zm8.618 0a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5z";
const returnPath =
  "M13.25 4a.75.75 0 0 1 .75.75v3.249a1.75 1.75 0 0 1-1.75 1.75H4.635l2.005 1.893a.75.75 0 1 1-1.03 1.09L2.235 9.543l-.007-.009a1 1 0 0 1-.096-.112l-.01-.017a1 1 0 0 1-.06-.11l-.01-.023a.75.75 0 0 1-.017-.5l.024-.066.004-.01a1 1 0 0 1 .055-.1l.018-.027a1 1 0 0 1 .092-.108l.007-.008L5.61 5.267a.75.75 0 1 1 1.03 1.09L4.635 8.248h7.615a.25.25 0 0 0 .25-.25V4.75a.75.75 0 0 1 .75-.75";
const shiftPath =
  "M7.47 1.22a.75.75 0 0 1 1.06 0l6.25 6.25a.75.75 0 0 1-.53 1.28h-2.5v4c0 1.008-.798 1.75-1.75 1.75H6c-.936 0-1.75-.813-1.75-1.75v-4h-2.5a.751.751 0 0 1-.53-1.28zM3.561 7.25H5a.75.75 0 0 1 .75.75v4.75c0 .033.018.1.084.166A.26.26 0 0 0 6 13h4c.082 0 .144-.03.182-.067a.25.25 0 0 0 .067-.183V8a.75.75 0 0 1 .75-.75h1.44L8 2.81z";
const arrowPath =
  "M12.79 6.74C13.08 7.04 13.07 7.51 12.76 7.79C12.46 8.08 11.99 8.07 11.71 7.76L8.75 4.64L8.75 13.25C8.75 13.66 8.41 14 8 14C7.59 14 7.25 13.66 7.25 13.25L7.25 4.63L4.29 7.76C4.01 8.07 3.54 8.08 3.24 7.79C2.93 7.51 2.92 7.04 3.21 6.74L7.46 2.24C7.46 2.23 7.46 2.23 7.46 2.23C7.47 2.22 7.48 2.21 7.48 2.21C7.51 2.18 7.54 2.16 7.57 2.13C7.58 2.13 7.59 2.12 7.6 2.12C7.63 2.1 7.67 2.08 7.7 2.06C7.71 2.06 7.72 2.06 7.73 2.05C7.81 2.02 7.9 2 8 2C8.1 2 8.19 2.02 8.28 2.05C8.29 2.06 8.29 2.06 8.3 2.06C8.34 2.08 8.37 2.1 8.4 2.12C8.41 2.12 8.42 2.13 8.43 2.14C8.46 2.16 8.48 2.18 8.51 2.2C8.52 2.21 8.53 2.22 8.54 2.23C8.54 2.23 8.54 2.23 8.54 2.24L12.79 6.74Z";

const macGlyphs: Record<string, KeyGlyph> = {
  command: { icon: <KeyIcon path={commandPath} />, label: "⌘" },
  control: { icon: <KeyIcon path={controlPath} />, label: "⌃" },
  alt: { icon: <KeyIcon path={optionPath} />, label: "⌥" },
};

const otherGlyphs: Record<string, KeyGlyph> = {
  command: { label: "Ctrl" },
  control: { label: "Ctrl" },
  alt: { label: "Alt" },
};

const universalGlyphs: Record<string, KeyGlyph> = {
  shift: { icon: <KeyIcon path={shiftPath} />, label: "⇧" },
  enter: { icon: <KeyIcon path={returnPath} />, label: "↵" },
  left: { icon: <KeyIcon direction="left" path={arrowPath} />, label: "←" },
  right: { icon: <KeyIcon direction="right" path={arrowPath} />, label: "→" },
  up: { icon: <KeyIcon direction="up" path={arrowPath} />, label: "↑" },
  down: { icon: <KeyIcon direction="down" path={arrowPath} />, label: "↓" },
  backspace: { label: "⌫" },
  delete: { label: "Del" },
  tab: { label: "Tab" },
  escape: { label: "Esc" },
  space: { label: "Space" },
  home: { label: "Home" },
  end: { label: "End" },
  pageup: { label: "PageUp" },
  pagedown: { label: "PageDown" },
  insert: { label: "Insert" },
  clear: { label: "Clear" },
  capslock: { label: "CapsLock" },
};

function toTitleCase(value: string): string {
  return value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.substring(1));
}

function resolveKeyGlyph(keyName: string, mac: boolean): KeyGlyph {
  const key = canonicalizeForPlatform(keyName, mac);
  const platformGlyphs = mac ? macGlyphs : otherGlyphs;
  const glyph = platformGlyphs[key] ?? universalGlyphs[key];
  if (glyph) return glyph;

  if (key.length > 1) {
    if (process.env.NODE_ENV !== "production") {
      throw new Error(`Missing key glyph mapping for "${keyName}"`);
    }
    Sentry.logger.warn("Missing key glyph mapping", { keyName });
  }

  return { label: toTitleCase(keyName) };
}

/** Renders the regular Scraps key-cap primitive. */
export function Kbd({ className, variant, ...props }: KbdProps) {
  return (
    <kbd
      {...props}
      className={[styles.kbd, variant === "debossed" ? styles.debossed : "", className]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

/** Renders the first keyboard shortcut combination with platform-aware glyphs. */
export function Hotkey({ value, variant }: HotkeyProps) {
  const mac = useIsMacPlatform();
  const keySets = (Array.isArray(value) ? value : [value]).map((keySet) =>
    keySet.trim().split("+")
  );
  const resolvedKeySets = keySets.map((keys) =>
    keys.map((key) => resolveKeyGlyph(key, mac))
  );
  const finalKeys = resolvedKeySets[0];
  if (!finalKeys || finalKeys.length === 0) {
    return null;
  }

  return (
    <Kbd className={styles.hotkey} variant={variant}>
      {finalKeys.map((glyph, index) =>
        "icon" in glyph ? (
          <kbd aria-label={glyph.label} className={styles.key} key={index}>
            {glyph.icon}
          </kbd>
        ) : (
          <kbd className={styles.key} key={index}>
            {glyph.label}
          </kbd>
        )
      )}
    </Kbd>
  );
}

/** Registers document keyboard shortcuts and invokes only the first match. */
export function useHotkeys(hotkeys: HotkeyRegistration[]): void {
  const hotkeysRef = useRef(hotkeys);

  useEffect(() => {
    hotkeysRef.current = hotkeys;
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing) return;

      for (const hotkey of hotkeysRef.current) {
        if (hotkey.enabled === false) continue;

        const keysets = (Array.isArray(hotkey.match) ? hotkey.match : [hotkey.match]).map(
          (keys) => keys.toLowerCase()
        );

        for (const keyset of keysets) {
          const keys = keyset.split("+").map(canonicalize);
          const unusedModifiers = modifierKeys.filter(
            (modifier) => !keys.includes(modifier)
          );
          const allKeysPressed =
            keys.every((key) => matchesKey(key, event)) &&
            unusedModifiers.every((modifier) => !matchesKey(modifier, event));
          const inputHasFocus =
            !hotkey.includeInputs && event.target instanceof HTMLElement
              ? ["textarea", "input"].includes(event.target.tagName.toLowerCase())
              : false;

          if (allKeysPressed && !inputHasFocus) {
            if (!hotkey.skipPreventDefault) event.preventDefault();
            hotkey.callback(event);
            return;
          }
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);
}
