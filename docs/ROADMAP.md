# Roadmap

evolve loop backlog. Order roughly by priority. One item = one evolve cycle.
Each item becomes one branch, one PR, one merge decision.

See `AGENTS.md` and `docs/design/copy-selected-tab-urls.md` for scope
exclusions (Markdown copy formats, a settings page, Firefox support,
analytics, Chrome Web Store publishing, tab persistence). Items that touch
those exclusions are parked under "Needs scope decision" below and are never
picked by the loop.

## Backlog

- [ ] Add a GitHub Actions workflow that runs `npm test` on every push and
  pull request, so test results no longer depend on running them manually.
- [ ] Support dark mode in the popup using a `prefers-color-scheme` media
  query only (no settings page, no new permissions).
- [ ] Strengthen clipboard-write failure handling in the popup and offscreen
  document with clearer error text and a retry affordance.
- [ ] Show the reason a highlighted tab was excluded from the copy payload
  (for example, an internal `chrome://` or `about:blank` page) in the popup.
- [ ] Add a brief visual confirmation on the Copy URLs button after a
  successful copy (CSS-only, no new dependency).
- [ ] Add `default_locale` and an `_locales` structure for Japanese/English UI
  strings, including the extension name and description shown in Chrome's
  extension management UI (`chrome.i18n`).
- [ ] Improve popup keyboard handling: close the popup on Escape and review
  the tab order for the tab list and Copy URLs button.
- [ ] Improve the empty-state message and styling shown when no tabs are
  highlighted.
- [ ] Add a performance test covering formatting a large number of
  highlighted tabs (100+) to catch regressions in `tab-urls.js`.
- [ ] Add a test covering the service worker's behavior after Manifest V3
  idle/cold-start (command fires after the worker has been unloaded).
- [ ] Extend URL formatting edge-case tests: duplicate URLs across tabs,
  very long URLs, and non-ASCII URLs.
- [ ] Add a right-click context menu entry that copies the highlighted tab URLs.
- [ ] Show the last copy result (count and timestamp) the next time the popup opens.

## Needs scope decision

These conflict with the current exclusions in `AGENTS.md` / the design doc.
They are plain bullets (not checkboxes) so the loop skips them. Move one up
to "Backlog" as a checkbox only after the exclusion is lifted explicitly.

- Add an output-format toggle in the popup (URL only / Markdown link / title + URL).
  Conflicts with: no Markdown copy formats.
- Persist the chosen output format via an options page.
  Conflicts with: no settings page.
- Prepare Chrome Web Store listing assets (icons, screenshots, short/long
  description, privacy policy page). Conflicts with: no Chrome Web Store
  publishing.
- Evaluate Firefox (WebExtensions) support and document the gaps found.
  Conflicts with: no Firefox support.

## Notes for the evolve loop

- Pick the first unchecked (`- [ ]`) item in "Backlog" at the start of a cycle.
- On merge, flip it to `- [x]` in the same PR.
- If a cycle can't land (blocked review, failing tests), annotate the line
  instead of checking it, e.g. `(blocked: PR#12, see review)`.
- Anyone can add new items above; the loop never invents scope outside this file.
