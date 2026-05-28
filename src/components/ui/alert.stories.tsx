import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Alert, AlertTitle, AlertDescription } from "./alert"

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
