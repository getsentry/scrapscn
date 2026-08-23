import { createRef } from "react";

import { EmptyState } from "@/components/ui/empty-state";

const ref = createRef<HTMLDivElement>();

<EmptyState data-test-id="empty" ref={ref} title="No results" />;
<EmptyState action={<button type="button">Create</button>} description="Adjust filters" illustration={<span>□</span>} title="No results" />;

// @ts-expect-error EmptyState owns its child composition.
<EmptyState title="No results">children</EmptyState>;
// @ts-expect-error The outer container type is part of the component contract.
<EmptyState containerType="size" title="No results" />;
// @ts-expect-error EmptyState has the canonical non-polymorphic div root.
<EmptyState as="section" title="No results" />;
