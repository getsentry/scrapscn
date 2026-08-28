"use client";

import { usePathname } from "next/navigation";
import { Fragment, useState } from "react";

import type { WorkbenchProps } from "@/components/playground/workbench";
import { Button } from "@/components/ui/button";
import { CompactSelect } from "@/components/ui/compact-select";
import { GlobalModal, useModal, type ModalTypes } from "@/components/ui/modal";

type State = {
  backdrop: boolean;
  closeEvents: NonNullable<ModalTypes["options"]["closeEvents"]>;
  long: boolean;
  textOnly: boolean;
  width: string;
};
const modalWidthClasses: Record<string, string> = {
  "640px": "w-[640px]",
  "720px": "w-[720px]",
  "960px": "w-[960px]",
};
function parse(params: URLSearchParams): State {
  const closeEvents = params.get("modalCloseEvents");
  return {
    backdrop: params.get("modalBackdrop") !== "false",
    closeEvents:
      closeEvents === "none" || closeEvents === "backdrop-click" || closeEvents === "escape-key"
        ? closeEvents
        : "all",
    long: params.get("modalLong") === "true",
    textOnly: params.get("modalTextOnly") === "true",
    width: params.get("modalWidth") ?? "",
  };
}
function serialize(state: State) {
  return new URLSearchParams({
    modalBackdrop: String(state.backdrop),
    modalCloseEvents: state.closeEvents,
    modalLong: String(state.long),
    modalTextOnly: String(state.textOnly),
    modalWidth: state.width,
  });
}
function ModalPreview({ state, onClose }: { state: State; onClose: (reason: string) => void }) {
  const pathname = usePathname();
  const { openModal } = useModal();
  return (
    <>
      <Button
        onClick={() =>
          openModal(
            ({ Header, Body, Footer, closeModal }) =>
              state.textOnly ? (
                <Body>
                  <p>Text-only modal content.</p>
                </Body>
              ) : (
                <Fragment>
                  <Header closeButton>Scraps Modal</Header>
                  <Body>
                    {state.long ? (
                      <p>{"Long modal content. ".repeat(140)}</p>
                    ) : (
                      <p>Test the singleton dialog in a real page frame.</p>
                    )}
                    <CompactSelect
                      aria-label="Modal select"
                      options={[
                        { label: "One", value: "one" },
                        { label: "Two", value: "two" },
                      ]}
                      onChange={() => {}}
                      value="one"
                    />
                  </Body>
                  <Footer>
                    <Button onClick={closeModal} variant="primary">
                      Done
                    </Button>
                  </Footer>
                </Fragment>
              ),
            {
              backdrop: state.backdrop,
              closeEvents: state.closeEvents,
              modalCss: modalWidthClasses[state.width],
              onClose: (reason) => onClose(reason ?? "imperative"),
            },
          )
        }
      >
        Open modal
      </Button>
      <GlobalModal routePathname={pathname} />
    </>
  );
}
export function ModalWorkbench({ children, onSearchChange, sourceSearch }: WorkbenchProps) {
  const [state, setState] = useState(() => parse(new URLSearchParams(sourceSearch)));
  const [reason, setReason] = useState("None");
  function update(next: State) {
    setState(next);
    onSearchChange(serialize(next));
  }
  return children({
    breadcrumbs: ["Components", "Modal"],
    title: "Modal",
    description:
      "Test the regular Scraps singleton modal, dismissal modes, scroll, and nested overlays.",
    controls: (
      <div className="grid gap-4">
        <label className="flex gap-2 text-sm">
          <input
            aria-label="Modal backdrop"
            checked={state.backdrop}
            type="checkbox"
            onChange={(event) => update({ ...state, backdrop: event.target.checked })}
          />
          Backdrop
        </label>
        <label className="grid gap-1 text-sm">
          Close events
          <select
            aria-label="Modal close events"
            value={state.closeEvents}
            onChange={(event) =>
              update({ ...state, closeEvents: event.target.value as State["closeEvents"] })
            }
          >
            <option>all</option>
            <option>none</option>
            <option>backdrop-click</option>
            <option>escape-key</option>
          </select>
        </label>
        <label className="flex gap-2 text-sm">
          <input
            aria-label="Long modal content"
            checked={state.long}
            type="checkbox"
            onChange={(event) => update({ ...state, long: event.target.checked })}
          />
          Long content
        </label>
        <label className="flex gap-2 text-sm">
          <input
            aria-label="Text-only modal"
            checked={state.textOnly}
            type="checkbox"
            onChange={(event) => update({ ...state, textOnly: event.target.checked })}
          />
          Text-only content
        </label>
        <label className="grid gap-1 text-sm">
          Width
          <select
            aria-label="Modal width"
            value={state.width}
            onChange={(event) => update({ ...state, width: event.target.value })}
          >
            <option value="">Default</option>
            <option value="640px">640px</option>
            <option value="720px">720px</option>
            <option value="960px">960px</option>
          </select>
        </label>
      </div>
    ),
    preview: (
      <div className="min-h-96 p-8" data-testid="modal-preview">
        <ModalPreview state={state} onClose={setReason} />
        <p aria-live="polite" data-testid="modal-close-reason">
          Last close reason: {reason}
        </p>
      </div>
    ),
    reset: () => {
      const next = parse(new URLSearchParams());
      setState(next);
      return serialize(next);
    },
    serialize: () => serialize(state),
  });
}
