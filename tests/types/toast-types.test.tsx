import type { ComponentProps, ReactNode } from "react";

import { Toast } from "@/components/ui/toast";

const message: ReactNode = <strong>Saved</strong>;
const props = {
  indicator: {
    clearId: null,
    id: "saved",
    message,
    options: { append: true, duration: 4000, undo: () => undefined },
    type: "success" as const,
  },
  onDismiss: (indicator, event) => {
    void indicator.id;
    void event.currentTarget;
  },
} satisfies ComponentProps<typeof Toast>;
void props;

<Toast
  // @ts-expect-error The indicator type is the canonical finite union.
  indicator={{ id: "x", message: "x", options: {}, type: "warning" }}
  onDismiss={() => undefined}
/>;
<Toast
  // @ts-expect-error Indicator options are required.
  indicator={{ id: "x", message: "x", type: "success" }}
  onDismiss={() => undefined}
/>;
<Toast
  // @ts-expect-error Toast has no arbitrary native className prop.
  className="extra"
  indicator={{ id: "x", message: "x", options: {}, type: "success" }}
  onDismiss={() => undefined}
/>;
// @ts-expect-error Toast has no children API.
<Toast
  indicator={{ id: "x", message: "x", options: {}, type: "success" }}
  onDismiss={() => undefined}
>
  x
</Toast>;
