# Roadmap

evolve loop backlog. Order roughly by priority. One item = one evolve cycle.
Each item becomes one branch, one PR, one merge decision.

- [ ] Add an output-format toggle in the popup (URL only / Markdown link / title + URL).
- [ ] Persist the chosen output format via an options page.
- [ ] Add a right-click context menu entry that copies the highlighted tab URLs.
- [ ] Show the last copy result (count and timestamp) the next time the popup opens.
- [ ] Add `default_locale` and an `_locales` structure for Japanese/English UI strings.
- [ ] Prepare Chrome Web Store listing assets (icons, screenshots, short/long description, privacy policy page).
- [ ] Evaluate Firefox (WebExtensions) support and document the gaps found.

## Notes for the evolve loop

- Pick the first unchecked (`- [ ]`) item at the start of a cycle.
- On merge, flip it to `- [x]` in the same PR.
- If a cycle can't land (blocked review, failing tests), annotate the line
  instead of checking it, e.g. `(blocked: PR#12, see review)`.
- Anyone can add new items above; the loop never invents scope outside this file.
