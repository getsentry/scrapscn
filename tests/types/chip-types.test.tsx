import { type ComponentProps } from "react";

import { Chip } from "@/components/ui/chip";

type ChipProps = ComponentProps<typeof Chip>;

const staticChip = { property: "browser", value: "Chrome" } satisfies ChipProps;
const dismissableChip = { onDismiss: () => {}, value: "Chrome" } satisfies ChipProps;
const readonlyChip = { readonly: true, value: "Chrome" } satisfies ChipProps;

void staticChip;
void dismissableChip;
void readonlyChip;

// @ts-expect-error Readonly chips cannot be dismissable.
const invalidReadonlyChip: ChipProps = { onDismiss: () => {}, readonly: true, value: "Chrome" };

void invalidReadonlyChip;
