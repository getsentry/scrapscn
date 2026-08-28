import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Fragment, useEffect, type ReactNode } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button } from "./button";
import { ModalBody, ModalFooter, GlobalModal, useModal } from "./modal";

function ModalStoryFrame({ children }: { children: ReactNode }) {
  const { closeModal } = useModal();
  useEffect(() => {
    closeModal();
    return closeModal;
  }, [closeModal]);
  return (
    <>
      {children}
      <GlobalModal />
    </>
  );
}

function BasicDemo() {
  const { openModal } = useModal();
  return (
    <Button
      onClick={() =>
        openModal(({ Header, Body, Footer, closeModal }) => (
          <Fragment>
            <Header closeButton>Example Modal</Header>
            <Body>This is the modal content.</Body>
            <Footer>
              <Button onClick={closeModal} variant="primary">
                Done
              </Button>
            </Footer>
          </Fragment>
        ))
      }
    >
      Open Modal
    </Button>
  );
}

function CloseEventsDemo() {
  const { openModal } = useModal();
  return (
    <div className="flex gap-2">
      <Button
        onClick={() =>
          openModal(
            ({ Header, Body }) => (
              <Fragment>
                <Header closeButton>Escape Only</Header>
                <Body>Clicking outside will not close this modal.</Body>
              </Fragment>
            ),
            { closeEvents: "escape-key" },
          )
        }
      >
        Escape Only
      </Button>
      <Button
        onClick={() =>
          openModal(
            ({ Header, Body, Footer, closeModal }) => (
              <Fragment>
                <Header>Manual Close Only</Header>
                <Body>This modal can only be closed with its action.</Body>
                <Footer>
                  <Button onClick={closeModal} variant="primary">
                    Close
                  </Button>
                </Footer>
              </Fragment>
            ),
            { closeEvents: "none" },
          )
        }
      >
        Manual Close Only
      </Button>
    </div>
  );
}

function HookDemo() {
  const { closeModal, isOpen, openModal } = useModal();
  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={() =>
          openModal(({ Header, Body }) => (
            <Fragment>
              <Header closeButton>Hook Demo</Header>
              <Body>Opened with useModal().</Body>
            </Fragment>
          ))
        }
      >
        Open
      </Button>
      <Button disabled={!isOpen} onClick={closeModal}>
        Close from Outside
      </Button>
    </div>
  );
}

function SubComponentsDemo() {
  return (
    <div className="grid max-w-xl gap-2 border border-[var(--scraps-theme-border-primary)] p-8">
      <ModalBody>Standalone ModalBody content.</ModalBody>
      <ModalFooter>
        <Button variant="secondary">Cancel</Button>
        <Button variant="primary">Confirm</Button>
      </ModalFooter>
    </div>
  );
}

function ModalStory({ children }: { children: ReactNode }) {
  return <ModalStoryFrame>{children}</ModalStoryFrame>;
}

const meta = {
  component: ModalStory,
  title: "Scraps/Modal",
} satisfies Meta<typeof ModalStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: { children: <BasicDemo /> },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Open Modal" }));
    const dialog = within(document.body).getByRole("dialog", { name: "Modal" });
    await waitFor(() => expect(dialog).toBeVisible());
    await waitFor(() => expect(document.activeElement).toBeInstanceOf(HTMLElement));
    if (!(document.activeElement instanceof HTMLElement)) return;
    await waitFor(() => expect(dialog).toContainElement(document.activeElement));
    await waitFor(() => expect(dialog).toHaveStyle({ opacity: "1" }));
  },
};

export const CloseEvents: Story = {
  args: { children: <CloseEventsDemo /> },
};

export const Hook: Story = {
  args: { children: <HookDemo /> },
};

export const SubComponents: Story = {
  args: { children: <SubComponentsDemo /> },
};
