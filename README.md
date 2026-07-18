# Copy Selected Tab URLs

Copy the URLs of Chrome tabs highlighted with Command/Ctrl-click or Shift-click.

This repository is currently in the planning stage. The approved design,
architecture decisions, and implementation plan are available in:

- `docs/design/copy-selected-tab-urls.md`
- `docs/adr/0001-use-manifest-v3-with-offscreen-clipboard.md`
- `.plans/copy-selected-tab-urls/plan.md`

## Planned behavior

- Preview highlighted tabs in a small extension popup.
- Copy URLs in tab-strip order, one URL per line.
- Copy immediately with a configurable Chrome extension shortcut.
- Keep all processing local, with no analytics or network requests.

## License

MIT
