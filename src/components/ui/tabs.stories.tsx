import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs"

const meta = {
  title: "Components/Tabs",
  component: Tabs,
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

const sampleTabs = (
  <>
    <TabsContent value="overview">Overview panel</TabsContent>
    <TabsContent value="activity">Activity panel</TabsContent>
    <TabsContent value="settings">Settings panel</TabsContent>
  </>
)

export const Flat: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-96">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      {sampleTabs}
    </Tabs>
  ),
}

export const Floating: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-96">
      <TabsList variant="floating">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      {sampleTabs}
    </Tabs>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      {(["md", "sm", "xs"] as const).map((size) => (
        <Tabs key={size} defaultValue="overview" className="w-96">
          <TabsList size={size}>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          {sampleTabs}
        </Tabs>
      ))}
    </div>
  ),
}

export const Vertical: Story = {
  render: () => (
    <Tabs defaultValue="overview" orientation="vertical" className="w-96">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      {sampleTabs}
    </Tabs>
  ),
}
