import { CodeBlock, InlineCode, inlineCodeStyles } from "@/components/ui/code";

const serializedInlineCode = inlineCodeStyles({
  font: { family: { mono: "monospace" } },
  radius: { "2xs": "3px" },
  tokens: {
    background: {
      transparent: {
        neutral: { muted: "transparent" },
        promotion: { muted: "transparent" },
      },
    },
    content: { primary: "black", promotion: "purple" },
  },
});

export default function CodeServerEvidence() {
  return (
    <main data-inline-code-style={serializedInlineCode.name}>
      <CodeBlock language="typescript">{"const server = true;"}</CodeBlock>
      <InlineCode>server-safe</InlineCode>
    </main>
  );
}
