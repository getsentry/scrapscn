import { cloneElement, createElement, Fragment, isValidElement, type ReactNode } from "react";
import { sprintf } from "sprintf-js";

export type ScrapsTranslationArgument = number | string | Readonly<Record<string, number | string>>;
export type ScrapsTranslationComponents = Readonly<Record<string, ReactNode>>;

export interface ScrapsLocaleAdapter {
  t(message: string, ...args: ScrapsTranslationArgument[]): string;
  tct(message: string, components: ScrapsTranslationComponents): ReactNode;
}

type TemplatePart = string | { group: string; id: string };
type ParsedTemplate = Record<string, TemplatePart[]>;

function parseTemplate(template: string) {
  const parsed: ParsedTemplate = {};
  let nextGroupId = 1;

  function parseGroup(start: number, group: string, nested: boolean) {
    const token = /\[(.*?)(:|\])|\]/g;
    const parts: TemplatePart[] = [];
    let position = start;
    let closed = false;
    token.lastIndex = start;

    for (let match = token.exec(template); match; match = token.exec(template)) {
      const text = template.substring(position, match.index);
      if (text) parts.push(text);

      const fullMatch = match[0];
      if (fullMatch === "]") {
        if (nested) {
          closed = true;
          break;
        }
        position = token.lastIndex;
        continue;
      }

      const groupName = match[1];
      const delimiter = match[2];
      if (!groupName || !delimiter) {
        position = token.lastIndex;
        continue;
      }

      const id = String(nextGroupId);
      nextGroupId += 1;
      position = token.lastIndex;
      if (delimiter === ":") {
        position = parseGroup(token.lastIndex, id, true);
        token.lastIndex = position;
      }
      parts.push({ group: groupName, id });
    }

    const end = closed ? token.lastIndex : template.length;
    if (!closed) {
      const rest = template.substring(position);
      if (rest) parts.push(rest);
    }
    parsed[group] = parts;
    return end;
  }

  parseGroup(0, "root", false);
  return parsed;
}

function renderTemplate(template: ParsedTemplate, components: ScrapsTranslationComponents) {
  let key = 0;

  function renderGroup(name: string, id: string): ReactNode {
    const children = (template[id] ?? []).map((part) =>
      typeof part === "string"
        ? createElement(Fragment, { key: key++ }, part)
        : renderGroup(part.group, part.id),
    );
    const component = components[name];
    const element = isValidElement(component)
      ? component
      : createElement(Fragment, null, component);

    return children.length === 0
      ? cloneElement(element, { key: key++ })
      : cloneElement(element, { key: key++ }, children);
  }

  return createElement(Fragment, null, renderGroup("root", "root"));
}

const englishAdapter: ScrapsLocaleAdapter = {
  t: (message, ...args) => sprintf(message, ...args),
  tct: (message, components) => renderTemplate(parseTemplate(message), components),
};

let configuredAdapter: ScrapsLocaleAdapter | undefined;

/** Installs one application-wide adapter during bootstrap, never per render or request. */
export function configureScrapsLocale(adapter: ScrapsLocaleAdapter) {
  if (configuredAdapter) {
    throw new Error("Scraps locale is already configured");
  }
  configuredAdapter = adapter;

  return () => {
    if (configuredAdapter === adapter) configuredAdapter = undefined;
  };
}

export function t(message: string, ...args: ScrapsTranslationArgument[]) {
  return (configuredAdapter ?? englishAdapter).t(message, ...args);
}

export function tct(message: string, components: ScrapsTranslationComponents = {}) {
  return (configuredAdapter ?? englishAdapter).tct(message, components);
}
