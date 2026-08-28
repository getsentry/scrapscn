import { Fragment, type ReactNode } from "react";

import { Checkbox } from "./checkbox";
import { CodeBlock, InlineCode } from "./code";
import { Heading } from "./heading";
import { Container, Flex, Stack } from "./layout";
import { ExternalLink, Link } from "./link";
import { isInternalHref, isSafeHref } from "./markdown-parser";
import { Quote } from "./quote";
import { Separator } from "./separator";
import { Text } from "./text";

export function DefaultParagraph({ children }: { children: ReactNode }) {
  return (
    <Text as="p" size="md" density="comfortable">
      {children}
    </Text>
  );
}

const DEFAULT_HEADING_SIZE = ["2xl", "xl", "lg", "md", "sm", "xs"] as const;

export function DefaultHeading({
  children,
  level,
}: {
  children: ReactNode;
  level: 1 | 2 | 3 | 4 | 5 | 6;
}) {
  return (
    <Heading as={`h${level}`} size={DEFAULT_HEADING_SIZE[level - 1] ?? "lg"}>
      {children}
    </Heading>
  );
}

export function DefaultBlockquote({ children }: { children: ReactNode }) {
  return <Quote>{children}</Quote>;
}

export function DefaultInlineCode({ children }: { children: string }) {
  return <InlineCode variant="neutral">{children}</InlineCode>;
}

export function DefaultLink({
  children,
  href,
  title,
}: {
  children: ReactNode;
  href: string;
  title?: string | null;
}) {
  if (isInternalHref(href)) {
    return (
      <Link to={href} title={title ?? undefined}>
        {children}
      </Link>
    );
  }
  if (!isSafeHref(href)) return <span>{children}</span>;
  return (
    <ExternalLink href={href} title={title ?? undefined}>
      {children}
    </ExternalLink>
  );
}

export function DefaultCodeBlock({ children, lang }: { children: string; lang?: string }) {
  return <CodeBlock language={lang}>{children}</CodeBlock>;
}

export function DefaultHtmlBlock({ html }: { html: string }) {
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export function DefaultStrong({ children }: { children: ReactNode }) {
  return <strong>{children}</strong>;
}

export function DefaultEmphasis({ children }: { children: ReactNode }) {
  return <em>{children}</em>;
}

export function DefaultStrikethrough({ children }: { children: ReactNode }) {
  return <Text strikethrough>{children}</Text>;
}

export function DefaultUnorderedList({ children }: { children: ReactNode }) {
  return (
    <Stack as="ul" gap="sm" margin="0" role="list" className="list-disc">
      {children}
    </Stack>
  );
}

export function DefaultOrderedList({ children }: { children: ReactNode }) {
  return (
    <Stack as="ol" gap="sm" margin="0" role="list" className="list-decimal">
      {children}
    </Stack>
  );
}

export function DefaultListItem({ children }: { children: ReactNode; checked?: boolean }) {
  return <Container as="li">{children}</Container>;
}

export function DefaultTaskList({ children }: { children: ReactNode }) {
  return (
    <Stack as="ul" gap="sm" margin="0" padding="0" role="list" className="list-none">
      {children}
    </Stack>
  );
}

export function DefaultTaskListItem({
  checked,
  children,
}: {
  checked: boolean;
  children: ReactNode;
}) {
  return (
    <Flex as="li" gap="sm" align="center" className={checked ? "line-through" : undefined}>
      {children}
    </Flex>
  );
}

export function DefaultHorizontalRule() {
  return <Separator orientation="horizontal" />;
}

export function DefaultText({ children }: { children: string }) {
  return <Fragment>{children}</Fragment>;
}

export function DefaultLineBreak() {
  return <br />;
}

export function DefaultTable({ children }: { children: ReactNode }) {
  return (
    <Container border="primary" radius="md" overflowX="auto">
      <table className="w-full min-w-full border-collapse">{children}</table>
    </Container>
  );
}

export function DefaultTableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b-4 border-[var(--scraps-theme-border-primary)] bg-[var(--scraps-theme-surface300)] whitespace-nowrap">
      {children}
    </thead>
  );
}

export function DefaultTableBody({ children }: { children: ReactNode }) {
  return <tbody className="rounded-b-[6px] bg-background">{children}</tbody>;
}

export function DefaultTableRow({ children }: { children: ReactNode }) {
  return (
    <tr className="border-b border-[var(--scraps-theme-border-secondary)] align-baseline last:rounded-b-[6px] last:border-b-0">
      {children}
    </tr>
  );
}

type Align = "left" | "center" | "right";

const alignClasses: Record<Align, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export function DefaultTableHeaderCell({
  align = "left",
  children,
}: {
  align?: Align;
  children: ReactNode;
}) {
  return (
    <th
      className={`px-4 py-1.5 first:rounded-tl-[6px] last:rounded-tr-[6px] ${alignClasses[align]}`}
    >
      {children}
    </th>
  );
}

export function DefaultTableCell({
  align = "left",
  children,
}: {
  align?: Align;
  children: ReactNode;
}) {
  return <td className={`px-4 py-3 ${alignClasses[align]}`}>{children}</td>;
}

export function DefaultTag() {
  return null;
}

export { Checkbox };
