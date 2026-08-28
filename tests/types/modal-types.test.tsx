import { useModal, type ModalTypes } from "@/components/ui/modal";

const options: ModalTypes["options"] = {
  backdrop: { "data-test-id": "backdrop", zIndex: "modal" },
  closeEvents: "all",
  modalCss: "w-[720px]",
  onClose: (reason) => {
    const value: "close-button" | "backdrop-click" | "escape-key" | undefined = reason;
    void value;
  },
};
void options;
const unsupportedModalObject: ModalTypes["options"] = {
  // @ts-expect-error Emotion interpolation objects are an excluded portable input.
  modalCss: { color: "red" },
};
void unsupportedModalObject;
const unsupportedModalFunction: ModalTypes["options"] = {
  // @ts-expect-error Emotion interpolation functions are an excluded portable input.
  modalCss: () => ({ color: "red" }),
};
void unsupportedModalFunction;
function Example() {
  const { openModal, closeModal, isOpen, visible } = useModal();
  openModal(({ Body, CloseButton, Footer, Header, closeModal: close }) => (
    <>
      <Header closeButton>Title</Header>
      <Body>Body</Body>
      <Footer>
        <CloseButton />
        <CloseButton
          tooltipProps={{
            title: "Close",
            // @ts-expect-error Emotion SerializedStyles is an excluded portable input.
            overlayStyle: { name: "modal", styles: "color:red;" },
          }}
        />
      </Footer>
      <button onClick={close}>Close</button>
    </>
  ));
  closeModal();
  void isOpen;
  void visible;
  return null;
}
void Example;
