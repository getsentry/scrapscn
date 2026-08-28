import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import {
  AssistantActions,
  AssistantMessage,
  MessageRow,
  ThinkingBlock,
  ToolCall,
  UserMessage,
} from "./chat";

const meta = {
  component: MessageRow,
  title: "Scraps/Chat",
} satisfies Meta<typeof MessageRow>;

export default meta;
type Story = StoryObj<typeof meta>;

const feedback = fn();

export const Conversation: Story = {
  args: { children: null, from: "assistant" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "I like this response" }));
    await expect(feedback).toHaveBeenCalledWith("positive");
    await expect(canvas.getByRole("status", { name: "Running" })).toBeVisible();
    await expect(canvas.getByText("1.5min")).toBeVisible();
  },
  render: () => {
    const start = new Date("2025-01-01T00:00:00.000Z");
    const end = new Date("2025-01-01T00:01:30.000Z");
    return (
      <div className="w-full max-w-2xl bg-background text-foreground">
        <MessageRow from="user">
          <UserMessage>Which issues are getting worse?</UserMessage>
        </MessageRow>
        <MessageRow from="assistant">
          <div className="grid w-full gap-3">
            <AssistantMessage>Three checkout issues are escalating.</AssistantMessage>
            <AssistantActions
              copyText="Three checkout issues are escalating."
              onFeedback={feedback}
            />
          </div>
        </MessageRow>
        <MessageRow density="compact" from="assistant">
          <ToolCall
            notifications={["Results truncated to 100 rows"]}
            output="100 matching issues"
            reference={{ label: "Trace", value: "a3805648" }}
            status="loading"
            title="Searching issues"
          />
        </MessageRow>
        <MessageRow density="compact" from="assistant">
          <ThinkingBlock endTime={end} startTime={start} title="Analysis complete">
            Found three escalating issues.
          </ThinkingBlock>
        </MessageRow>
      </div>
    );
  },
};
