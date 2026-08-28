import { createRef } from "react";

import { CodeBlock, InlineCode } from "@/components/ui/code";
import {
  CodeMessagesProvider,
  defaultCodeMessages,
  type CodeMessages,
} from "@/components/ui/code-messages";

const spanishCodeMessages: CodeMessages = {
  copiedTooltip: "Copiado",
  copyButtonLabel: "Copiar fragmento",
  copyErrorTooltip: "No se pudo copiar",
  copyTooltip: "Copiar",
};

<CodeMessagesProvider messages={spanishCodeMessages}>
  <CodeBlock>{'const idioma = "es";'}</CodeBlock>
</CodeMessagesProvider>;
void defaultCodeMessages;

<InlineCode ref={createRef<HTMLElement>()} variant="accent">
  code
</InlineCode>;
<InlineCode variant="neutral">code</InlineCode>;
// @ts-expect-error InlineCode exposes only canonical variants.
<InlineCode variant="promotion">code</InlineCode>;

<CodeBlock
  alwaysShowCopyButton
  dark
  data-render-inline
  disableUserSelection
  filename="example.ts"
  hideCopyButton
  icon={<span>TypeScript</span>}
  isRounded={false}
  language="typescript"
  linesToHighlight={[1, 3]}
  selectedTab="react"
  tabs={[{ label: "React", value: "react" }]}
  wrapMode="wrap"
  onAfterHighlight={(element) => element.focus()}
  onCopy={(code) => code.toUpperCase()}
  onSelectAndCopy={() => undefined}
  onTabClick={(tab) => tab.toUpperCase()}
>
  const value = 1
</CodeBlock>;
// @ts-expect-error CodeBlock children must be a string.
<CodeBlock>
  <span>code</span>
</CodeBlock>;

export {};
