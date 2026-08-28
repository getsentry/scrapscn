"use client";

import { useState } from "react";

import { CopyButton } from "@/components/copy-button";

export function CodePreview({ children, code }: { children: React.ReactNode; code: string }) {
  const [view, setView] = useState<"preview" | "code">("preview");

  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-2">
        <div className="flex gap-1">
          <button
            onClick={() => setView("preview")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              view === "preview"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setView("code")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              view === "code"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Code
          </button>
        </div>
        {view === "code" && <CopyButton text={code} />}
      </div>
      {view === "preview" ? (
        <div className="flex min-h-[200px] items-center justify-center p-6">{children}</div>
      ) : (
        <div className="overflow-x-auto bg-muted/30 p-4">
          <pre className="font-mono text-sm text-muted-foreground">
            <code>{code}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
