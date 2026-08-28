import type { ComponentProps } from "react";

import {
  AssistantActions,
  AssistantMessage,
  MessageRow,
  Spinner,
  ThinkingBlock,
  ToolCall,
  ToolCallIndicator,
  type ToolCallReference,
  UserMessage,
  type ToolCallStatus,
} from "@/components/ui/chat";

const statuses: ToolCallStatus[] = ["loading", "pending", "success", "failure", "mixed", "content"];
void statuses;

<AssistantMessage data-testid="assistant">Answer</AssistantMessage>;
<UserMessage maxWidth="60%" width="100%">
  Question
</UserMessage>;
<MessageRow density="compact" from="assistant">
  Answer
</MessageRow>;
<AssistantActions
  align="end"
  copyText="Answer"
  feedbackDisabled
  orientation="vertical"
  onCopy={(text) => text.toUpperCase()}
  onFeedback={(feedback) => feedback.toUpperCase()}
/>;
<Spinner aria-label="Loading" role="status" size="lg" />;
<ToolCallIndicator aria-label="Custom" status="success" />;
const toolReference: ToolCallReference = {
  label: "Trace",
  to: { pathname: "/traces/1" },
  value: "1",
};
<ToolCall
  durationMs={9_400}
  failureLabel="502"
  input={<span>GET /spans</span>}
  output={<span>Gateway timeout</span>}
  reference={toolReference}
  status="failure"
  title="Query spans"
>
  Details
</ToolCall>;
<ThinkingBlock startTime={new Date()} title="Thinking">
  Details
</ThinkingBlock>;

type IndicatorProps = ComponentProps<typeof ToolCallIndicator>;
const indicator: IndicatorProps = { status: "pending" };
void indicator;

// @ts-expect-error MessageRow requires the canonical sender.
<MessageRow>Message</MessageRow>;
// @ts-expect-error Density is a finite canonical union.
<MessageRow density="dense" from="user">
  Message
</MessageRow>;
// @ts-expect-error Spinner uses the canonical icon size scale.
<Spinner size="xl" />;
// @ts-expect-error Tool call status is a finite canonical union.
<ToolCallIndicator status="cancelled" />;
// @ts-expect-error ThinkingBlock requires startTime.
<ThinkingBlock title="Thinking" />;
// @ts-expect-error ToolCall requires a canonical status.
<ToolCall title="Query" />;
