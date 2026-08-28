"use client";

import type { Location } from "history";
import { usePathname, useSearchParams } from "next/navigation";
import { Fragment, useMemo, useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { Button } from "@/components/ui/button";
import {
  DrawerBody,
  DrawerHeader,
  GlobalDrawer,
  useDrawer,
  type DrawerOptions,
} from "@/components/ui/drawer";
import { GlobalModal, useModal } from "@/components/ui/modal";

type RoutePolicy = "default" | "close" | "keep";
type State = {
  drawerKey: boolean;
  long: boolean;
  mode: "blocking" | "passive";
  maxWidth: string;
  resizable: boolean;
  routePolicy: RoutePolicy;
  width: string;
};

function parse(params: URLSearchParams): State {
  const routePolicy = params.get("drawerRoutePolicy");
  return {
    drawerKey: params.get("drawerKey") !== "false",
    long: params.get("drawerLong") === "true",
    mode: params.get("drawerMode") === "passive" ? "passive" : "blocking",
    maxWidth: params.get("drawerMaxWidth") ?? "",
    resizable: params.get("drawerResizable") !== "false",
    routePolicy: routePolicy === "close" || routePolicy === "keep" ? routePolicy : "default",
    width: params.get("drawerWidth") ?? "",
  };
}

function serialize(state: State) {
  return new URLSearchParams({
    drawerMode: state.mode,
    drawerResizable: String(state.resizable),
    drawerKey: String(state.drawerKey),
    drawerLong: String(state.long),
    drawerMaxWidth: state.maxWidth,
    drawerWidth: state.width,
    drawerRoutePolicy: state.routePolicy,
  });
}

function getLocation(pathname: string, search: string, routeRevision: number): Location {
  return {
    action: "REPLACE",
    hash: "",
    key: `${pathname}?${search}:${routeRevision}`,
    pathname,
    query: {},
    search,
    state: null,
  };
}

function DrawerModalButton() {
  const { openModal } = useModal();
  return (
    <Button
      onClick={() =>
        openModal(({ Body, Header }) => (
          <Fragment>
            <Header closeButton>Modal over drawer</Header>
            <Body>The drawer must stay open while this modal is active.</Body>
          </Fragment>
        ))
      }
    >
      Open modal over drawer
    </Button>
  );
}

function DrawerTrigger({
  onClose,
  onLocationChange,
  onOpen,
  state,
}: {
  onClose: () => void;
  onLocationChange: () => void;
  onOpen: () => void;
  state: State;
}) {
  const { openDrawer } = useDrawer();

  function open() {
    const shouldCloseOnLocationChange: DrawerOptions["shouldCloseOnLocationChange"] =
      state.routePolicy === "default" ? undefined : () => state.routePolicy === "close";

    openDrawer(
      ({ closeDrawer }) => (
        <Fragment>
          <DrawerHeader>Scraps Drawer</DrawerHeader>
          <DrawerBody>
            {state.long ? (
              <p>{"Long drawer content. ".repeat(220)}</p>
            ) : (
              <p>Test a global panel without starting the monolith.</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button onClick={closeDrawer}>Close from content</Button>
              <Button onClick={onLocationChange}>Change test location</Button>
              <DrawerModalButton />
            </div>
          </DrawerBody>
        </Fragment>
      ),
      {
        ariaLabel: "Scraps Drawer",
        drawerKey: state.drawerKey ? "playground" : undefined,
        drawerMaxWidth: state.maxWidth || undefined,
        drawerWidth: state.width || undefined,
        mode: state.mode,
        onClose,
        onOpen,
        resizable: state.resizable,
        shouldCloseOnLocationChange,
      },
    );
  }

  return <Button onClick={open}>Open drawer</Button>;
}

function DrawerPreview({
  onClose,
  onOpen,
  state,
}: {
  onClose: () => void;
  onOpen: () => void;
  state: State;
}) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [routeRevision, setRouteRevision] = useState(0);
  const [pageInteractions, setPageInteractions] = useState(0);
  const location = useMemo(
    () => getLocation(pathname, search, routeRevision),
    [pathname, routeRevision, search],
  );

  return (
    <Fragment>
      <GlobalDrawer location={location}>
        <div className="flex flex-wrap gap-2">
          <DrawerTrigger
            onClose={onClose}
            onLocationChange={() => setRouteRevision((value) => value + 1)}
            onOpen={onOpen}
            state={state}
          />
          <Button onClick={() => setPageInteractions((value) => value + 1)}>
            Interact with page
          </Button>
        </div>
      </GlobalDrawer>
      <GlobalModal routePathname={pathname} />
      <p aria-live="polite" data-testid="drawer-page-interactions">
        Page interactions: {pageInteractions}
      </p>
    </Fragment>
  );
}

export function DrawerWorkbench({ children, onSearchChange, sourceSearch }: WorkbenchProps) {
  const [state, setState] = useState(() => parse(new URLSearchParams(sourceSearch)));
  const [lastEvent, setLastEvent] = useState("None");

  function update(next: State) {
    setState(next);
    onSearchChange(serialize(next));
  }

  return children({
    breadcrumbs: ["Components", "Drawer"],
    title: "Drawer",
    description:
      "Test the regular Scraps global drawer, blocking and passive modes, route behavior, and persisted resizing.",
    controls: (
      <div className="grid gap-4">
        <label className="grid gap-1 text-sm">
          Mode
          <select
            aria-label="Drawer mode"
            onChange={(event) =>
              update({
                ...state,
                mode: event.target.value === "passive" ? "passive" : "blocking",
              })
            }
            value={state.mode}
          >
            <option value="blocking">blocking</option>
            <option value="passive">passive</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Route policy
          <select
            aria-label="Drawer route policy"
            onChange={(event) => {
              const value = event.target.value;
              update({
                ...state,
                routePolicy: value === "close" || value === "keep" ? value : "default",
              });
            }}
            value={state.routePolicy}
          >
            <option value="default">mode default</option>
            <option value="close">always close</option>
            <option value="keep">always keep open</option>
          </select>
        </label>
        <label className="flex gap-2 text-sm">
          <input
            aria-label="Drawer resizable"
            checked={state.resizable}
            onChange={(event) => update({ ...state, resizable: event.target.checked })}
            type="checkbox"
          />
          Resizable
        </label>
        <label className="flex gap-2 text-sm">
          <input
            aria-label="Drawer key"
            checked={state.drawerKey}
            onChange={(event) => update({ ...state, drawerKey: event.target.checked })}
            type="checkbox"
          />
          Persist width
        </label>
        <label className="flex gap-2 text-sm">
          <input
            aria-label="Drawer long content"
            checked={state.long}
            onChange={(event) => update({ ...state, long: event.target.checked })}
            type="checkbox"
          />
          Long content
        </label>
        <label className="grid gap-1 text-sm">
          Maximum width
          <input
            aria-label="Drawer maximum width"
            onChange={(event) => update({ ...state, maxWidth: event.target.value })}
            placeholder="e.g. 720px"
            value={state.maxWidth}
          />
        </label>
        <label className="grid gap-1 text-sm">
          Fixed width
          <input
            aria-label="Drawer width"
            onChange={(event) => update({ ...state, width: event.target.value })}
            placeholder="e.g. 520px"
            value={state.width}
          />
        </label>
      </div>
    ),
    preview: (
      <div className="min-h-96 p-8" data-testid="drawer-preview">
        <DrawerPreview
          onClose={() => setLastEvent("onClose")}
          onOpen={() => setLastEvent("onOpen")}
          state={state}
        />
        <p aria-live="polite" data-testid="drawer-last-event">
          Last event: {lastEvent}
        </p>
      </div>
    ),
    reset: () => {
      const next = parse(new URLSearchParams());
      setState(next);
      setLastEvent("None");
      return serialize(next);
    },
    serialize: () => serialize(state),
  });
}
