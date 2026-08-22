import { slot, withSlots } from "@/components/ui/slot";

const HeaderSlot = slot(["header"] as const);

const headerConsumer = <HeaderSlot name="header">Header</HeaderSlot>;

const invalidSlotName = (
  // @ts-expect-error Slot names are limited to the const tuple passed to slot().
  <HeaderSlot name="footer">Footer</HeaderSlot>
);

function PageHeader() {
  return <header>Header</header>;
}

const PageHeaderWithSlot = withSlots(PageHeader, HeaderSlot);
const attachedSlot = <PageHeaderWithSlot.Slot name="header">Header</PageHeaderWithSlot.Slot>;

void headerConsumer;
void invalidSlotName;
void attachedSlot;
