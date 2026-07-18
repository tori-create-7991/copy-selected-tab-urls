# 0001. Use Manifest V3 with an offscreen clipboard document

Status: Accepted

## Context

The extension needs both a visible popup flow and a keyboard command that copies
highlighted tab URLs without opening UI. Manifest V3 service workers cannot use
DOM clipboard APIs directly. A content script would couple clipboard behavior
to the active web page and could be blocked by page restrictions.

The first release should also remain small enough to audit and maintain without
a build pipeline.

## Decision

Use a dependency-free Manifest V3 extension.

The popup will write to the clipboard directly. The keyboard command will run
in the extension service worker and delegate clipboard access to a bundled
offscreen document created with the `CLIPBOARD` reason. Shared pure JavaScript
will define tab filtering, tab-strip ordering, and newline formatting.

## Consequences

- The keyboard command can copy without opening visible UI.
- No content script or page host permission is required.
- The extension needs `tabs`, `offscreen`, and `clipboardWrite` permissions.
- Chrome 109 or later is required for the Offscreen API.
- The offscreen document adds lifecycle and messaging code that must be tested
  through contracts and manual integration checks.
- Dependency-free source keeps installation and review simple but rules out
  framework-provided UI and test utilities.
