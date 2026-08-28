import { Fragment, type ReactNode } from "react";

import { Button } from "./button";
import { DrawerBody, DrawerHeader, GlobalDrawer, useDrawer, type DrawerOptions } from "./drawer";

function DrawerDemo({
  header = "Drawer",
  options,
}: {
  header?: string;
  options: Omit<DrawerOptions, "ariaLabel">;
}) {
  const { openDrawer } = useDrawer();
  return (
    <Button
      onClick={() =>
        openDrawer(
          ({ closeDrawer }) => (
            <Fragment>
              <DrawerHeader>{header}</DrawerHeader>
              <DrawerBody>
                <p>Use this panel to compare Drawer states in isolation.</p>
                <Button onClick={closeDrawer}>Close from content</Button>
              </DrawerBody>
            </Fragment>
          ),
          { ...options, ariaLabel: header },
        )
      }
    >
      Open {header.toLowerCase()}
    </Button>
  );
}

function StoryFrame({ children }: { children: ReactNode }) {
  return <GlobalDrawer>{children}</GlobalDrawer>;
}

const meta = { title: "Scraps/Drawer" };
export default meta;

export function Blocking() {
  return (
    <StoryFrame>
      <DrawerDemo options={{ drawerKey: "story-blocking" }} />
    </StoryFrame>
  );
}

export function Passive() {
  return (
    <StoryFrame>
      <DrawerDemo
        header="Passive drawer"
        options={{ drawerKey: "story-passive", mode: "passive" }}
      />
    </StoryFrame>
  );
}

export function FixedWidth() {
  return (
    <StoryFrame>
      <DrawerDemo
        header="Fixed-width drawer"
        options={{ drawerWidth: "520px", resizable: false }}
      />
    </StoryFrame>
  );
}

export function MaximumWidth() {
  return (
    <StoryFrame>
      <DrawerDemo
        header="Maximum-width drawer"
        options={{ drawerKey: "story-maximum-width", drawerMaxWidth: "720px" }}
      />
    </StoryFrame>
  );
}

function HeaderDemo() {
  const { openDrawer } = useDrawer();
  return (
    <Button
      onClick={() =>
        openDrawer(
          () => (
            <Fragment>
              <DrawerHeader hideBar hideCloseButtonText>
                Icon-only close with no separator
              </DrawerHeader>
              <DrawerBody>Header options preserve the 53px frame.</DrawerBody>
            </Fragment>
          ),
          { ariaLabel: "Header variants" },
        )
      }
    >
      Open header variants
    </Button>
  );
}

export function HeaderVariants() {
  return (
    <StoryFrame>
      <HeaderDemo />
    </StoryFrame>
  );
}
