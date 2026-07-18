# Approved Design Summary

The approved design uses a dependency-free Manifest V3 extension with two
flows:

- A popup previews highlighted tabs and copies their URLs.
- A configurable command copies immediately through an offscreen clipboard
  document.

URLs are copied in tab-strip order, one per line. The initial release excludes
additional output formats, a settings page, Firefox support, analytics, and
Chrome Web Store submission.

The canonical design rationale is:

- `docs/design/copy-selected-tab-urls.md`
- `docs/adr/0001-use-manifest-v3-with-offscreen-clipboard.md`
