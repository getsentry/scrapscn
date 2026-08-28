"use client";

import Image from "next/image";

export function SentryWordmark({ className }: { className?: string }) {
  return (
    <>
      <Image
        src="/sentry-wordmark-dark.svg"
        alt="Sentry"
        width={116}
        height={34}
        className={`size-auto dark:hidden ${className ?? ""}`}
        priority
      />
      <Image
        src="/sentry-wordmark-light.svg"
        alt="Sentry"
        width={116}
        height={34}
        className={`hidden size-auto dark:block ${className ?? ""}`}
        priority
      />
    </>
  );
}

export function SentryGlyph({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <>
      <Image
        src="/sentry-glyph-dark.svg"
        alt="Sentry"
        width={size}
        height={size}
        className={`size-auto dark:hidden ${className ?? ""}`}
        priority
      />
      <Image
        src="/sentry-glyph-light.svg"
        alt="Sentry"
        width={size}
        height={size}
        className={`hidden size-auto dark:block ${className ?? ""}`}
        priority
      />
    </>
  );
}
