// @ts-expect-error The canonical API has no separate item export.
import { SegmentedControlItem } from "@/components/ui/segmented-control";
import { SegmentedControl } from "@/components/ui/segmented-control";

const emotionLike = { name: "tooltip", styles: "color: red", next: undefined };

export function SegmentedControlTypeEvidence({
  value: controlledValue,
}: {
  value: "list" | "grid";
}) {
  return (
    <SegmentedControl
      priority="secondary"
      size="sm"
      value={controlledValue}
      onChange={(value) => {
        const exactValue: "list" | "grid" = value;
        const includesGrid: typeof value = "grid";
        void exactValue;
        void includesGrid;
      }}
    >
      <SegmentedControl.Item key="list" textValue="List">
        List
      </SegmentedControl.Item>
      <SegmentedControl.Item
        key="grid"
        aria-label="Grid view"
        disabled
        icon={<svg aria-hidden="true" />}
        tooltip="Grid view"
      />
    </SegmentedControl>
  );
}

const missingValue = (
  // @ts-expect-error Canonical SegmentedControl is controlled.
  <SegmentedControl onChange={() => {}}>
    <SegmentedControl.Item key="list">List</SegmentedControl.Item>
  </SegmentedControl>
);

const defaultValue = (
  <SegmentedControl
    // @ts-expect-error Canonical SegmentedControl has no defaultValue.
    defaultValue="list"
    value="list"
    onChange={() => {}}
  >
    <SegmentedControl.Item key="list">List</SegmentedControl.Item>
  </SegmentedControl>
);

const isDisabled = (
  <SegmentedControl
    // @ts-expect-error Canonical SegmentedControl has no group-level disabled prop.
    disabled
    value="list"
    onChange={() => {}}
  >
    <SegmentedControl.Item key="list">List</SegmentedControl.Item>
  </SegmentedControl>
);

const numericValue = (
  // @ts-expect-error Canonical values must be strings.
  <SegmentedControl aria-label="View" value={1} onChange={() => {}}>
    <SegmentedControl.Item key="list">List</SegmentedControl.Item>
  </SegmentedControl>
);

const numericKey = (
  <SegmentedControl aria-label="View" value="list" onChange={() => {}}>
    {/* @ts-expect-error Canonical item keys must be strings. */}
    <SegmentedControl.Item key={1}>List</SegmentedControl.Item>
  </SegmentedControl>
);

const className = (
  <SegmentedControl
    aria-label="View"
    // @ts-expect-error Canonical SegmentedControl does not expose DOM class props.
    className="consumer-class"
    value="list"
    onChange={() => {}}
  >
    <SegmentedControl.Item key="list">List</SegmentedControl.Item>
  </SegmentedControl>
);

const style = (
  <SegmentedControl
    aria-label="View"
    // @ts-expect-error Canonical SegmentedControl does not expose DOM style props.
    style={{ width: 240 }}
    value="list"
    onChange={() => {}}
  >
    <SegmentedControl.Item key="list">List</SegmentedControl.Item>
  </SegmentedControl>
);

const onClick = (
  <SegmentedControl
    aria-label="View"
    // @ts-expect-error Canonical SegmentedControl does not expose DOM click handlers.
    onClick={() => {}}
    value="list"
    onChange={() => {}}
  >
    <SegmentedControl.Item key="list">List</SegmentedControl.Item>
  </SegmentedControl>
);

const serializedTooltipStyle = (
  <SegmentedControl aria-label="View" value="list" onChange={() => {}}>
    {/* @ts-expect-error SegmentedControl inherits the portable Tooltip overlayStyle boundary. */}
    <SegmentedControl.Item key="list" tooltipOptions={{ overlayStyle: emotionLike }}>
      List
    </SegmentedControl.Item>
  </SegmentedControl>
);

void SegmentedControlItem;
void missingValue;
void defaultValue;
void isDisabled;
void numericValue;
void numericKey;
void className;
void style;
void onClick;
void serializedTooltipStyle;
