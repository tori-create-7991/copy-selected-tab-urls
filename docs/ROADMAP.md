# Roadmap

Backlog for the evolve loop. One unchecked item is picked per cycle, top to
bottom. See `AGENTS.md` for items explicitly excluded from scope (Markdown
copy formats, a settings page, Firefox support, analytics, Chrome Web Store
publishing) — do not add those here without updating that exclusion first.

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
- [ ] Localize the extension name and description via `_locales` (`chrome.i18n`)
  so Chrome's extension management UI shows translated text.
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
