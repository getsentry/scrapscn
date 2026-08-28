import type { ComponentType, ReactNode } from "react";

type WithDefault<Props> = Props & { Default: ComponentType<Props> };

export type MarkdownComponents = Partial<{
  Blockquote: ComponentType<WithDefault<{ children: ReactNode }>>;
  CodeBlock: ComponentType<WithDefault<{ children: string; lang?: string }>>;
  Emphasis: ComponentType<WithDefault<{ children: ReactNode }>>;
  Heading: ComponentType<WithDefault<{ children: ReactNode; level: 1 | 2 | 3 | 4 | 5 | 6 }>>;
  HorizontalRule: ComponentType<WithDefault<Record<PropertyKey, unknown>>>;
  Html: ComponentType<WithDefault<{ html: string }>>;
  Image: ComponentType<{ src: string; alt?: string; title?: string | null }>;
  InlineCode: ComponentType<WithDefault<{ children: string }>>;
  LineBreak: ComponentType<WithDefault<Record<PropertyKey, unknown>>>;
  Link: ComponentType<WithDefault<{ children: ReactNode; href: string; title?: string | null }>>;
  ListItem: ComponentType<WithDefault<{ children: ReactNode; checked?: boolean }>>;
  OrderedList: ComponentType<WithDefault<{ children: ReactNode }>>;
  Paragraph: ComponentType<WithDefault<{ children: ReactNode }>>;
  Strikethrough: ComponentType<WithDefault<{ children: ReactNode }>>;
  Strong: ComponentType<WithDefault<{ children: ReactNode }>>;
  Table: ComponentType<WithDefault<{ children: ReactNode }>>;
  TableBody: ComponentType<WithDefault<{ children: ReactNode }>>;
  TableCell: ComponentType<
    WithDefault<{ children: ReactNode; align?: "left" | "right" | "center" }>
  >;
  TableHead: ComponentType<WithDefault<{ children: ReactNode }>>;
  TableHeaderCell: ComponentType<
    WithDefault<{ children: ReactNode; align?: "left" | "right" | "center" }>
  >;
  TableRow: ComponentType<WithDefault<{ children: ReactNode }>>;
  Tag: ComponentType<
    WithDefault<{
      attrs: Record<string, string>;
      data: unknown;
      level: "block" | "inline";
      name: string;
    }>
  >;
  TaskList: ComponentType<WithDefault<{ children: ReactNode }>>;
  TaskListItem: ComponentType<WithDefault<{ checked: boolean; children: ReactNode }>>;
  Text: ComponentType<WithDefault<{ children: string }>>;
  UnorderedList: ComponentType<WithDefault<{ children: ReactNode }>>;
}>;
