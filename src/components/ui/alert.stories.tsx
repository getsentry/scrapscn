import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, userEvent, within } from "storybook/test"

import { Button } from "./button"
import { Alert, AlertDescription, AlertLink, AlertTitle } from "./alert"

const meta = {
  title: "Components/Alert",
  component: Alert,
  argTypes: {
    variant: {
      control: "select",
      options: ["info", "warning", "danger", "success", "muted"],
    },
  },
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-3 w-full max-w-2xl">
      <Alert variant="info">
        <AlertTitle>SDK update available</AlertTitle>
        <AlertDescription>Upgrade to @sentry/nextjs 8.x for smaller bundles.</AlertDescription>
      </Alert>
      <Alert variant="danger">
        <AlertTitle>Spike detected</AlertTitle>
        <AlertDescription>TypeError reported 2,847 times in the last hour.</AlertDescription>
      </Alert>
      <Alert variant="warning">
        <AlertTitle>Quota warning</AlertTitle>
        <AlertDescription>You've used 87% of your monthly error quota.</AlertDescription>
      </Alert>
      <Alert variant="success">
        <AlertTitle>All clear</AlertTitle>
        <AlertDescription>No new issues in the last 24 hours.</AlertDescription>
      </Alert>
      <Alert variant="muted">
        <AlertTitle>Tip</AlertTitle>
        <AlertDescription>Set up release tracking to correlate deploys with new issues.</AlertDescription>
      </Alert>
    </div>
  ),
}

export const NoIcon: Story = {
  render: () => (
    <Alert variant="info" showIcon={false}>
      <AlertTitle>No icon variant</AlertTitle>
      <AlertDescription>Icons can be hidden with showIcon=false.</AlertDescription>
    </Alert>
  ),
}

export const System: Story = {
  name: "System banner",
  render: () => (
    <Alert variant="warning" system>
      <AlertTitle>Scheduled maintenance</AlertTitle>
      <AlertDescription>
        Ingestion may be delayed between 02:00–03:00 UTC.
      </AlertDescription>
    </Alert>
  ),
}

export const TrailingItems: Story = {
  render: () => (
    <Alert
      variant="danger"
      trailingItems={
        <Button variant="ghost" size="sm">
          View issue
        </Button>
      }
    >
      <AlertTitle>Spike detected</AlertTitle>
      <AlertDescription>TypeError reported 2,847 times in the last hour.</AlertDescription>
    </Alert>
  ),
}

export const Expandable: Story = {
  render: () => (
    <Alert
      variant="info"
      expand={
        <p>
          The stack trace points to a null deref in <code>parseUser()</code>.
          This block is revealed when expanded.
        </p>
      }
    >
      <AlertTitle>SDK update available</AlertTitle>
      <AlertDescription>Upgrade to @sentry/nextjs 8.x for smaller bundles.</AlertDescription>
    </Alert>
  ),
}

// Interaction test kept separate from the display story above so the canvas
// doesn't auto-expand/collapse ("flash") when you're just viewing Expandable.
export const ExpandInteraction: Story = {
  tags: ["!autodocs"],
  ...Expandable,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.queryByText(/revealed when expanded/i)).toBeNull()
    await userEvent.click(canvas.getByRole("button", { name: "Expand" }))
    expect(canvas.getByText(/revealed when expanded/i)).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Collapse" }))
    expect(canvas.queryByText(/revealed when expanded/i)).toBeNull()
  },
}

export const Link: Story = {
  render: () => (
    <AlertLink variant="info" href="https://docs.sentry.io" openInNewTab>
      <AlertTitle>Read the docs</AlertTitle>
      <AlertDescription>Learn how to configure release tracking.</AlertDescription>
    </AlertLink>
  ),
}
