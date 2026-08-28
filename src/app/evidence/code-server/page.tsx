import { CodeBlock, InlineCode } from "@/components/ui/code";

export default function CodeServerEvidence() {
  return (
    <main>
      <CodeBlock language="typescript">{"const server = true;"}</CodeBlock>
      <InlineCode>server-safe</InlineCode>
    </main>
  );
}
