import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import { Container, useContainerBreakpoint, useHasContainerQuery } from "./layout";
import { SizeProvider, useSizeContext } from "./size-context";
import { slot } from "./slot";

const PageSlot = slot(["header"] as const);

const meta = {
  title: "Components/Slot",
  component: PageSlot,
} satisfies Meta<typeof PageSlot>;

export default meta;
type Story = StoryObj<typeof meta>;

function BridgedSlotContent() {
  const size = useSizeContext();
  const breakpoint = useContainerBreakpoint();
  const hasContainerQuery = useHasContainerQuery();
  return (
    <span data-testid="slot-content">
      Custom header · {size} · {hasContainerQuery ? breakpoint : "no-container"}
    </span>
  );
}

/** Shows consumer content portaled to an outlet with size and layout contexts intact. */
export const PortalWithContextBridge: Story = {
  render: () => (
    <PageSlot.Provider>
      <SizeProvider size="sm">
        <Container containerType="inline-size" padding="md" border="primary">
          <PageSlot.Outlet name="header">
            {(props, hasConsumers) => (
              <header {...props} data-testid="slot-outlet">
                <PageSlot.Fallback>
                  <span data-testid="slot-fallback">Default header</span>
                </PageSlot.Fallback>
                <output data-testid="slot-consumer-state">
                  {hasConsumers ? "consumer" : "fallback"}
                </output>
              </header>
            )}
          </PageSlot.Outlet>
        </Container>
      </SizeProvider>
      <PageSlot name="header">
        <BridgedSlotContent />
      </PageSlot>
    </PageSlot.Provider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("slot-outlet")).toContainElement(
      canvas.getByTestId("slot-content"),
    );
    await expect(canvas.queryByTestId("slot-fallback")).not.toBeInTheDocument();
    await expect(canvas.getByTestId("slot-consumer-state")).toHaveTextContent("consumer");
    await expect(canvas.getByTestId("slot-content")).toHaveTextContent(
      /Custom header · sm · (zero|3xs|2xs|xs|sm|md|lg|xl|2xl|3xl|4xl|5xl)/,
    );
  },
};
