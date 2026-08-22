import { createRef } from "react";

import { Backdrop } from "@/components/ui/backdrop";

<Backdrop
  ref={createRef<HTMLDivElement>()}
  zIndex="modal"
  data-drawer-backdrop="drawer"
  onClick={(event) => event.preventDefault()}
/>;
<Backdrop zIndex="drawer" />;
<Backdrop zIndex="widgetBuilderDrawer" />;
// @ts-expect-error Backdrop layers are fixed by the regular Scraps theme.
<Backdrop zIndex="tooltip" />;
// @ts-expect-error Backdrop does not accept consumer styles.
<Backdrop style={{ opacity: 0 }} zIndex="modal" />;
// @ts-expect-error Backdrop does not accept consumer classes.
<Backdrop className="custom" zIndex="modal" />;
// @ts-expect-error Backdrop exposes only its explicit click handler.
<Backdrop onMouseDown={() => undefined} zIndex="modal" />;

export {};
