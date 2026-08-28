// @ts-expect-error The canonical barrel has no shadcn TabsTrigger export.
import { TabsTrigger } from "@/components/ui/tabs";
import {
  TabList,
  TabPanels,
  TabStateProvider,
  Tabs,
  type TabListItemProps,
} from "@/components/ui/tabs";

const item: TabListItemProps = {
  key: "activity",
  children: "Activity",
  disabled: false,
  hidden: false,
  textValue: "Activity",
  to: { pathname: "/activity", search: "?source=tabs" },
  tooltip: {
    overlayStyle: { padding: 4 },
    title: "Recent activity",
  },
};
const emotionLikeSerializedStyles = {
  name: "tab-tooltip",
  styles: "padding:4px;",
};
const invalidTabTooltip: TabListItemProps = {
  key: "invalid-tooltip",
  tooltip: {
    // @ts-expect-error SerializedStyles objects require the excluded Emotion runtime.
    overlayStyle: emotionLikeSerializedStyles,
    title: "Invalid tooltip",
  },
};
void invalidTabTooltip;

export function TabsTypeEvidence({ value }: { value: "details" | "activity" }) {
  return (
    <Tabs
      aria-label="Issue details"
      disableOverflow
      disabled={false}
      keyboardActivation="manual"
      orientation="horizontal"
      size="sm"
      value={value}
      onChange={(next) => {
        const exact: "details" | "activity" = next;
        void exact;
      }}
    >
      <TabList outerWrapStyles={{ maxWidth: 320 }} variant="floating">
        <TabList.Item key="details">Details</TabList.Item>
        <TabList.Item {...item} />
      </TabList>
      <TabPanels className="panels">
        <TabPanels.Item key="details">Details panel</TabPanels.Item>
        <TabPanels.Item key="activity">Activity panel</TabPanels.Item>
      </TabPanels>
    </Tabs>
  );
}

const provider = (
  <TabStateProvider defaultValue={1} orientation="vertical" size="xs">
    <TabList>
      <TabList.Item key={1}>One</TabList.Item>
    </TabList>
    <TabPanels>
      <TabPanels.Item key={1}>One panel</TabPanels.Item>
    </TabPanels>
  </TabStateProvider>
);

const oldTrigger = <TabsTrigger />;

void provider;
void oldTrigger;
