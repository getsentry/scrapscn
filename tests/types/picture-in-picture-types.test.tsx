import type { ReactNode } from "react";

import {
  PictureInPicturePortal,
  PictureInPictureProvider,
  usePictureInPicture,
} from "@/components/ui/picture-in-picture";

function Consumer() {
  const { closePipWindow, isSupported, pipWindow, requestPipWindow } = usePictureInPicture();
  void isSupported;
  void requestPipWindow({
    height: 600,
    preferInitialWindowPlacement: true,
    width: 400,
  });
  closePipWindow();
  return pipWindow ? (
    <PictureInPicturePortal pipWindow={pipWindow}>Content</PictureInPicturePortal>
  ) : null;
}

function InvalidWidthConsumer() {
  const { requestPipWindow } = usePictureInPicture();
  // @ts-expect-error Width must be numeric.
  void requestPipWindow({ width: "400" });
  return null;
}

const children: ReactNode = (
  <>
    <Consumer />
    <InvalidWidthConsumer />
  </>
);
<PictureInPictureProvider>{children}</PictureInPictureProvider>;

// @ts-expect-error The portal requires a real Window.
<PictureInPicturePortal pipWindow={{}}>Content</PictureInPicturePortal>;
