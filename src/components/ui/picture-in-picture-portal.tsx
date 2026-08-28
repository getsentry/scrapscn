"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { TooltipContext } from "./tooltip";

interface PictureInPicturePortalProps {
  children: ReactNode;
  pipWindow: Window;
}

function synchronizeDocuments(source: Document, target: Document) {
  const sourceRoot = source.documentElement;
  const sourceBody = source.body;
  const targetRoot = target.documentElement;
  const targetBody = target.body;
  const syncClasses = () => {
    targetRoot.className = sourceRoot.className;
    targetBody.className = sourceBody.className;
  };

  targetRoot.style.height = "100%";
  targetBody.style.height = "100%";
  targetBody.style.margin = "0";
  syncClasses();

  const observer = new MutationObserver(syncClasses);
  observer.observe(sourceRoot, {
    attributeFilter: ["class"],
    attributes: true,
  });
  observer.observe(sourceBody, {
    attributeFilter: ["class"],
    attributes: true,
  });
  return observer;
}

export function PictureInPicturePortal({ children, pipWindow }: PictureInPicturePortalProps) {
  useEffect(() => {
    const observer = synchronizeDocuments(document, pipWindow.document);
    return () => observer.disconnect();
  }, [pipWindow]);

  return createPortal(
    <TooltipContext.Provider value={{ container: pipWindow.document.body }}>
      {children}
    </TooltipContext.Provider>,
    pipWindow.document.body,
  );
}
