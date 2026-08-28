import DOMPurify from "isomorphic-dompurify";
import {
  Lexer as MarkedLexer,
  marked,
  type MarkedToken,
  type Token,
  type TokenizerExtension,
  type Tokens,
} from "marked";

export interface TagToken {
  attrs: Record<string, string>;
  data: unknown;
  level: "block" | "inline";
  name: string;
  raw: string;
  type: "tag";
}

export type MarkdownToken = MarkedToken | TagToken;

const TAG_START_RE = /\{%\s+[\w-]/;
const SELF_CLOSING_RE = /^\{%\s+([\w-]+)((?:\s+[\w-]+="[^"]*")*)\s+\/%\}/;
const BLOCK_RE = /^\{%\s+([\w-]+)((?:\s+[\w-]+="[^"]*")*)\s+%\}([\s\S]*?)\{%\s+\/\1\s+%\}/;
const ATTR_RE = /([\w-]+)="([^"]*)"/g;

function parseAttrs(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const match of raw.matchAll(ATTR_RE)) {
    const [, key, value] = match;
    if (key !== undefined && value !== undefined) attrs[key] = value;
  }
  return attrs;
}

function parseBody(body: string): unknown {
  if (!body) return undefined;
  try {
    return JSON.parse(body);
  } catch {
    return undefined;
  }
}

function findTagStart(source: string): number | undefined {
  let offset = 0;
  while (offset < source.length) {
    const index = source.slice(offset).search(TAG_START_RE);
    if (index === -1) return undefined;
    const absoluteIndex = offset + index;
    const rest = source.slice(absoluteIndex);
    if (BLOCK_RE.test(rest) || SELF_CLOSING_RE.test(rest)) return absoluteIndex;
    offset = absoluteIndex + 2;
  }
  return undefined;
}

function tokenizeTag(source: string, level: TagToken["level"]): Tokens.Generic | undefined {
  let match = BLOCK_RE.exec(source);
  if (match) {
    const [raw, name, attrSource = "", body = ""] = match;
    if (!name) return undefined;
    return {
      type: "tag",
      raw,
      level,
      name,
      attrs: parseAttrs(attrSource),
      data: parseBody(body),
    };
  }
  match = SELF_CLOSING_RE.exec(source);
  if (!match) return undefined;
  const [raw, name, attrSource = ""] = match;
  if (!name) return undefined;
  return {
    type: "tag",
    raw,
    level,
    name,
    attrs: parseAttrs(attrSource),
    data: undefined,
  };
}

const blockTagExtension: TokenizerExtension = {
  name: "tag",
  level: "block",
  start(source) {
    const index = findTagStart(source);
    if (index === undefined) return undefined;
    const lineStart = source.lastIndexOf("\n", index) + 1;
    return /\S/.test(source.slice(lineStart, index)) ? undefined : index;
  },
  tokenizer(source) {
    return tokenizeTag(source, "block");
  },
};

const inlineTagExtension: TokenizerExtension = {
  name: "tag",
  level: "inline",
  start: findTagStart,
  tokenizer(source) {
    return tokenizeTag(source, "inline");
  },
};

marked.use({ extensions: [blockTagExtension, inlineTagExtension] });

const SAFE_LINK_PATTERN = /^(https?:|mailto:)/i;
const INTERNAL_PATH_PATTERN = /^\/[^/]/;

export function isSafeHref(href: string): boolean {
  try {
    return SAFE_LINK_PATTERN.test(decodeURIComponent(unescape(href)));
  } catch {
    return false;
  }
}

export function isInternalHref(href: string): boolean {
  try {
    return INTERNAL_PATH_PATTERN.test(decodeURIComponent(unescape(href)));
  } catch {
    return false;
  }
}

const ALLOWED_TAGS = [
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "pre",
  "ul",
  "ol",
  "li",
  "hr",
  "br",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "a",
  "code",
  "em",
  "strong",
  "del",
  "span",
  "b",
  "i",
  "sub",
  "sup",
];

const ALLOWED_ATTR = ["href", "title", "alt", "class", "id", "align"];

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR });
}

export function lexMarkdown(raw: string): MarkdownToken[] {
  return MarkedLexer.lex(raw) as MarkdownToken[];
}

export function isTagToken(token: Token | TagToken): token is TagToken {
  return token.type === "tag" && "attrs" in token && "level" in token;
}
