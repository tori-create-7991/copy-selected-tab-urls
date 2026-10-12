# Security Policy

## Supported versions

Security fixes are applied to the latest version on the default branch.

## Reporting a vulnerability

Do not disclose security vulnerabilities in a public issue.

Use this repository's GitHub private vulnerability reporting form and include:

- The affected version or commit.
- Reproduction steps.
- The expected and observed impact.
- Any suggested mitigation, if known.

Please allow the maintainers time to investigate and coordinate a fix before
publishing details. Non-sensitive bugs and feature requests can use the public
issue tracker.

## Extension permissions

The manifest declares Chrome's `clipboardRead` permission, which may appear in
the extension permission warning. The popup reads the clipboard only after you
choose **Open copied URLs**. It parses newline-separated entries and opens
only `http:`, `https:`, and allowed `file:` URLs in tabs. The extension does
not send clipboard contents to an extension server or read local file
contents. When an HTTP(S) URL is opened, Chrome connects to that website as
usual. Chrome must have **Allow access to file URLs** enabled for this
extension before `file://` entries can be opened; otherwise those entries are
skipped.
