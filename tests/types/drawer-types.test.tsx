import {
  DrawerBody,
  DrawerHeader,
  GlobalDrawer,
  type DrawerConfig,
  type DrawerOptions,
  useDrawer,
  useDrawerContentContext,
} from "@/components/ui/drawer";

const options: DrawerOptions = {
  ariaLabel: "Drawer",
  drawerKey: "example",
  drawerMaxWidth: "720px",
  drawerWidth: "50%",
  mode: "blocking",
  onClose: () => {},
  onOpen: () => {},
  resizable: true,
  shouldCloseOnInteractOutside: (element) => element.matches("button"),
  shouldCloseOnLocationChange: (location) => location.pathname !== "/keep",
};
const config: DrawerConfig = {
  options,
  renderer: ({ closeDrawer }) => (
    <DrawerBody>
      <button onClick={closeDrawer}>Close</button>
    </DrawerBody>
  ),
};
void config;
function Example() {
  const { closeDrawer, isAnyDrawerOpen, isDrawerOpen, openDrawer, panelRef } = useDrawer();
  const context = useDrawerContentContext();
  openDrawer(
    () => (
      <>
        <DrawerHeader>Title</DrawerHeader>
        <DrawerBody>Body</DrawerBody>
      </>
    ),
    options,
  );
  closeDrawer();
  void isAnyDrawerOpen;
  void isDrawerOpen;
  void panelRef;
  void context;
  return <GlobalDrawer />;
}
void Example;
