import type { Token as MarkedToken } from "marked";
import type { ReactNode } from "react";

import {
  DefaultBlockquote,
  DefaultCodeBlock,
  DefaultEmphasis,
  DefaultHeading,
  DefaultHorizontalRule,
  DefaultHtmlBlock,
  DefaultInlineCode,
  DefaultLineBreak,
  DefaultLink,
  DefaultListItem,
  DefaultOrderedList,
  DefaultParagraph,
  DefaultStrikethrough,
  DefaultStrong,
  DefaultTable,
  DefaultTableBody,
  DefaultTableCell,
  DefaultTableHead,
  DefaultTableHeaderCell,
  DefaultTableRow,
  DefaultTag,
  DefaultTaskList,
  DefaultTaskListItem,
  DefaultText,
  DefaultUnorderedList,
  Checkbox,
} from "./markdown-default-components";
import {
  isInternalHref,
  isSafeHref,
  isTagToken,
  sanitizeHtml,
  type MarkdownToken,
} from "./markdown-parser";
import type { MarkdownComponents } from "./markdown-types";

const TAG_START_RE = /\{%\s+[\w-]/;

function isHeadingLevel(value: number): value is 1 | 2 | 3 | 4 | 5 | 6 {
  return Number.isInteger(value) && value >= 1 && value <= 6;
}

function stripPartialTag(text: string): string {
  const index = text.lastIndexOf("{%");
  if (index === -1 || !TAG_START_RE.test(text.slice(index))) return text;
  return text.slice(0, index);
}

function hasInlineHtml(tokens: MarkedToken[]): boolean {
  return tokens.some((token) => token.type === "html");
}

function renderInline(
  tokens: MarkedToken[] | undefined,
  components: MarkdownComponents,
  taskLabel?: string,
): ReactNode {
  if (!tokens) return null;
  if (hasInlineHtml(tokens)) {
    const raw = tokens.map((token) => token.raw).join("");
    return <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(raw) }} />;
  }
  return tokens.map((token, index) => (
    <MarkdownTokenView
      key={index}
      token={token as MarkdownToken}
      components={components}
      taskLabel={taskLabel}
    />
  ));
}

export function MarkdownTokenView({
  components,
  token,
  taskLabel,
}: {
  components: MarkdownComponents;
  token: MarkdownToken;
  taskLabel?: string;
}): ReactNode {
  if (isTagToken(token)) {
    const Tag = components.Tag ?? DefaultTag;
    return (
      <Tag
        Default={DefaultTag}
        attrs={token.attrs}
        data={token.data}
        level={token.level}
        name={token.name}
      />
    );
  }

  switch (token.type) {
    case "space":
      return null;
    case "paragraph": {
      const Paragraph = components.Paragraph ?? DefaultParagraph;
      return (
        <Paragraph Default={DefaultParagraph}>{renderInline(token.tokens, components)}</Paragraph>
      );
    }
    case "heading": {
      const Heading = components.Heading ?? DefaultHeading;
      const level = isHeadingLevel(token.depth) ? token.depth : 1;
      return (
        <Heading Default={DefaultHeading} level={level}>
          {renderInline(token.tokens, components)}
        </Heading>
      );
    }
    case "code": {
      const CodeBlock = components.CodeBlock ?? DefaultCodeBlock;
      return (
        <CodeBlock Default={DefaultCodeBlock} lang={token.lang ?? undefined}>
          {token.text}
        </CodeBlock>
      );
    }
    case "codespan": {
      const InlineCode = components.InlineCode ?? DefaultInlineCode;
      return <InlineCode Default={DefaultInlineCode}>{token.text}</InlineCode>;
    }
    case "blockquote": {
      const Blockquote = components.Blockquote ?? DefaultBlockquote;
      return (
        <Blockquote Default={DefaultBlockquote}>
          {renderInline(token.tokens, components)}
        </Blockquote>
      );
    }
    case "list": {
      const isTaskList = token.items.some((item) => item.task);
      const List = isTaskList
        ? (components.TaskList ?? DefaultTaskList)
        : token.ordered
          ? (components.OrderedList ?? DefaultOrderedList)
          : (components.UnorderedList ?? DefaultUnorderedList);
      const Default = isTaskList
        ? DefaultTaskList
        : token.ordered
          ? DefaultOrderedList
          : DefaultUnorderedList;
      return (
        <List Default={Default}>
          {token.items.map((item, index) => (
            <MarkdownTokenView key={index} token={item} components={components} />
          ))}
        </List>
      );
    }
    case "list_item": {
      if (token.task) {
        const TaskListItem = components.TaskListItem ?? DefaultTaskListItem;
        return (
          <TaskListItem Default={DefaultTaskListItem} checked={token.checked ?? false}>
            {renderInline(token.tokens, components, token.text)}
          </TaskListItem>
        );
      }
      const ListItem = components.ListItem ?? DefaultListItem;
      return (
        <ListItem Default={DefaultListItem}>{renderInline(token.tokens, components)}</ListItem>
      );
    }
    case "checkbox":
      return <Checkbox aria-label={taskLabel} checked={token.checked} readOnly />;
    case "table": {
      const Table = components.Table ?? DefaultTable;
      const TableHead = components.TableHead ?? DefaultTableHead;
      const TableBody = components.TableBody ?? DefaultTableBody;
      const TableRow = components.TableRow ?? DefaultTableRow;
      const TableHeaderCell = components.TableHeaderCell ?? DefaultTableHeaderCell;
      const TableCell = components.TableCell ?? DefaultTableCell;
      return (
        <Table Default={DefaultTable}>
          <TableHead Default={DefaultTableHead}>
            <TableRow Default={DefaultTableRow}>
              {token.header.map((cell, index) => (
                <TableHeaderCell
                  key={index}
                  Default={DefaultTableHeaderCell}
                  align={token.align[index] ?? undefined}
                >
                  {renderInline(cell.tokens, components)}
                </TableHeaderCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody Default={DefaultTableBody}>
            {token.rows.map((row, rowIndex) => (
              <TableRow key={rowIndex} Default={DefaultTableRow}>
                {row.map((cell, cellIndex) => (
                  <TableCell
                    key={cellIndex}
                    Default={DefaultTableCell}
                    align={token.align[cellIndex] ?? undefined}
                  >
                    {renderInline(cell.tokens, components)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }
    case "hr": {
      const HorizontalRule = components.HorizontalRule ?? DefaultHorizontalRule;
      return <HorizontalRule Default={DefaultHorizontalRule} />;
    }
    case "html": {
      const Html = components.Html ?? DefaultHtmlBlock;
      return <Html Default={DefaultHtmlBlock} html={sanitizeHtml(token.text)} />;
    }
    case "strong": {
      const Strong = components.Strong ?? DefaultStrong;
      return <Strong Default={DefaultStrong}>{renderInline(token.tokens, components)}</Strong>;
    }
    case "em": {
      const Emphasis = components.Emphasis ?? DefaultEmphasis;
      return (
        <Emphasis Default={DefaultEmphasis}>{renderInline(token.tokens, components)}</Emphasis>
      );
    }
    case "del": {
      const Strikethrough = components.Strikethrough ?? DefaultStrikethrough;
      return (
        <Strikethrough Default={DefaultStrikethrough}>
          {renderInline(token.tokens, components)}
        </Strikethrough>
      );
    }
    case "link": {
      if (!isSafeHref(token.href) && !isInternalHref(token.href)) {
        return <span>{renderInline(token.tokens, components)}</span>;
      }
      const Link = components.Link ?? DefaultLink;
      return (
        <Link Default={DefaultLink} href={token.href} title={token.title}>
          {renderInline(token.tokens, components)}
        </Link>
      );
    }
    case "image": {
      const Image = components.Image;
      // An explicit renderer is required so Markdown cannot start network requests.
      return Image ? <Image src={token.href} alt={token.text} title={token.title} /> : null;
    }
    case "text": {
      if (token.tokens) return renderInline(token.tokens, components);
      const text = stripPartialTag(token.text);
      const Text = components.Text;
      return Text ? <Text Default={DefaultText}>{text}</Text> : text;
    }
    case "escape":
      return token.text;
    case "br": {
      const LineBreak = components.LineBreak ?? DefaultLineBreak;
      return <LineBreak Default={DefaultLineBreak} />;
    }
    case "def":
      return null;
    default:
      return null;
  }
}
