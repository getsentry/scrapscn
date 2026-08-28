"use client";

import { useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import {
  AssistantActions,
  AssistantMessage,
  MessageRow,
  ThinkingBlock,
  ToolCall,
  ToolCallIndicator,
  UserMessage,
  type ToolCallStatus,
} from "@/components/ui/chat";

const statuses: ToolCallStatus[] = ["loading", "pending", "success", "failure", "mixed", "content"];
type ChatWorkbenchState = {
  density: "default" | "compact";
  feedbackDisabled: boolean;
  message: string;
  status: ToolCallStatus;
  thinking: boolean;
};

const defaultState = {
  density: "default",
  feedbackDisabled: false,
  message: "Which issues are getting worse?",
  status: "loading",
  thinking: true,
} satisfies ChatWorkbenchState;

function createDefaultState(): ChatWorkbenchState {
  return { ...defaultState };
}

function parse(params: URLSearchParams): ChatWorkbenchState {
  return {
    density: params.get("chatDensity") === "compact" ? "compact" : "default",
    feedbackDisabled: params.get("chatFeedbackDisabled") === "true",
    message: params.get("chatMessage") ?? defaultState.message,
    status: statuses.find((status) => status === params.get("chatStatus")) ?? defaultState.status,
    thinking: params.get("chatThinking") !== "false",
  };
}

function serialize(state: ChatWorkbenchState) {
  return new URLSearchParams({
    chatDensity: state.density,
    chatFeedbackDisabled: String(state.feedbackDisabled),
    chatMessage: state.message,
    chatStatus: state.status,
    chatThinking: String(state.thinking),
  });
}

const fieldClassName =
  "h-11 rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm";

export function ChatWorkbench({ children, onSearchChange, sourceSearch }: WorkbenchProps) {
  const [state, setState] = useState(() => parse(new URLSearchParams(sourceSearch)));
  const [startTime] = useState(() => new Date(Date.now() - 5_300));
  const [feedback, setFeedback] = useState("none");
  const [copies, setCopies] = useState(0);
  const [bubbles, setBubbles] = useState(0);

  function update(next: ChatWorkbenchState) {
    setState(next);
    onSearchChange(serialize(next));
  }

  const controls = (
    <div className="grid gap-4">
      <div>
        <h2 className="text-sm font-semibold">Chat setup</h2>
        <p className="text-xs text-muted-foreground">
          Configure the regular Scraps conversation primitives and share the state.
        </p>
      </div>
      <label className="grid gap-1 text-sm">
        User message
        <input
          aria-label="Chat user message"
          className={fieldClassName}
          value={state.message}
          onChange={(event) => update({ ...state, message: event.target.value })}
        />
      </label>
      <label className="grid gap-1 text-sm">
        Row density
        <select
          aria-label="Chat row density"
          className={fieldClassName}
          value={state.density}
          onChange={(event) =>
            update({
              ...state,
              density: event.target.value === "compact" ? "compact" : "default",
            })
          }
        >
          <option value="default">default</option>
          <option value="compact">compact</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Tool status
        <select
          aria-label="Chat tool status"
          className={fieldClassName}
          value={state.status}
          onChange={(event) =>
            update({
              ...state,
              status: statuses.find((status) => status === event.target.value) ?? "loading",
            })
          }
        >
          {statuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          aria-label="Disable chat feedback"
          checked={state.feedbackDisabled}
          className="size-5 touch-manipulation"
          type="checkbox"
          onChange={(event) => update({ ...state, feedbackDisabled: event.target.checked })}
        />
        Disable feedback
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          aria-label="Chat thinking active"
          checked={state.thinking}
          className="size-5 touch-manipulation"
          type="checkbox"
          onChange={(event) => update({ ...state, thinking: event.target.checked })}
        />
        Thinking is active
      </label>
    </div>
  );

  const preview = (
    <div
      className="w-full max-w-2xl overflow-hidden rounded-[8px] border border-[var(--scraps-theme-border-primary)] bg-background"
      data-testid="chat-preview"
      onClick={() => setBubbles((count) => count + 1)}
    >
      <MessageRow density={state.density} from="user">
        <UserMessage data-testid="chat-user-message">{state.message || " "}</UserMessage>
      </MessageRow>
      <MessageRow density={state.density} from="assistant">
        <div className="grid w-full gap-3">
          <AssistantMessage>
            Three checkout issues have increased during the last 24 hours.
          </AssistantMessage>
          <AssistantActions
            copyText="Three checkout issues have increased during the last 24 hours."
            feedbackDisabled={state.feedbackDisabled}
            onCopy={() => setCopies((count) => count + 1)}
            onFeedback={setFeedback}
          />
          <div className="flex items-center gap-2 text-sm">
            <ToolCallIndicator status={state.status} />
            <span>Issue search status</span>
          </div>
          <ToolCall
            durationMs={9_400}
            failureLabel="502"
            input={<span>project:checkout is:unresolved</span>}
            output={<span>3 issues</span>}
            status={state.status}
            title="Search issues"
          >
            Results are sorted by event volume.
          </ToolCall>
          <ThinkingBlock
            endTime={state.thinking ? undefined : new Date(startTime.getTime() + 90_000)}
            startTime={startTime}
            title={state.thinking ? "Analyzing issues..." : "Analysis complete"}
          >
            Found three escalating checkout issues.
          </ThinkingBlock>
        </div>
      </MessageRow>
      <div className="border-t border-[var(--scraps-theme-border-secondary)] px-4 py-2 text-xs text-muted-foreground">
        Feedback: {feedback}; Copies: {copies}; Bubbled clicks: {bubbles}
      </div>
    </div>
  );

  return children({
    breadcrumbs: ["Components", "Chat"],
    controls,
    description:
      "Test regular Scraps message layout, feedback, copy, tool status, and thinking behavior.",
    preview,
    reset: () => {
      const next = createDefaultState();
      setState(next);
      setFeedback("none");
      setCopies(0);
      setBubbles(0);
      return serialize(next);
    },
    serialize: () => serialize(state),
    title: "Chat",
  });
}
