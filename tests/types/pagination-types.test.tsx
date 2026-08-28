import type { ComponentProps } from "react";

import {
  Pagination,
  type CursorHandler,
  useGetPaginationCaption,
} from "@/components/ui/pagination";

const handler: CursorHandler = (cursor, path, query, delta) => {
  void cursor;
  void path;
  void query;
  void delta;
};
const props = {
  onCursor: handler,
  pageLinks: "",
  size: "sm",
} satisfies ComponentProps<typeof Pagination>;
void props;
// @ts-expect-error The regular Scraps component has no large button size.
<Pagination pageLinks="" size="lg" />;
// @ts-expect-error The cursor argument is string or undefined, not a number.
const invalidHandler: CursorHandler = (cursor: number) => cursor;
void invalidHandler;

function CaptionFixture() {
  const getCaption = useGetPaginationCaption();
  return getCaption({ cursor: undefined, limit: 25, pageLength: 25, total: 100 });
}
void CaptionFixture;
