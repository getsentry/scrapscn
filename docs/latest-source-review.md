# Latest canonical source review

The parity baseline advanced from Sentry commit `046a07857f36741bb60d070abe2191d08da76d24` to `a2db8365e2ec17c96b200bface596081c68f12c9`.

The source delta affected three regular Scraps families:

- Chat changed the public `ToolCall` content model and details layout. Scrapscn now supports input, output, duration, failure labels, and the current non-nested details presentation. Focused runtime, type, and canonical parity tests cover the change.
- Form changed an internal debounce helper. Its public exports, consumer contract, behavior, and rendered output did not change.
- Markdown added reporting for unhandled tags. Its public contract and rendered output did not change; unhandled tags still render as `null`. Scrapscn does not import the Sentry telemetry runtime.

The generated parity validator now compares future source changes from the new baseline. A later canonical change will reopen the delta queue automatically.
