# Copy Selected Tab URLs Implementation Plan

> **For agent:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Build and verify a public Manifest V3 extension that copies highlighted Chrome tab URLs in tab-strip order from either a popup or a direct-copy shortcut.

**Architecture:** A dependency-free popup handles the visible preview flow, while a Manifest V3 service worker handles the Chrome command and delegates clipboard access to an offscreen document. A pure shared module owns URL filtering, ordering, and newline formatting.

**Tech Stack:** Chrome Extensions Manifest V3, JavaScript ES modules, HTML, CSS, Node.js built-in test runner.

---

## Prerequisites

- [x] Node.js 24 or later is available. Verified: `v24.17.0`.
- [x] Google Chrome 109 or later is installed. Verified:
  `Google Chrome 150.0.7871.127`.
- [ ] The repository is on a non-`main` implementation branch or Codex worktree.
- [x] The approved design and ADR have been read.
- [x] The Notion task is available at `https://app.notion.com/p/Chrome-URL-OSS-3a02f5910ab78191b6a2c537fd274a91`.

The remaining branch/worktree prerequisite must be satisfied by the dedicated
Codex implementation task. Do not implement extension code on `main`.

## Task 1: Establish the extension and test harness

**Files:**

- Create: `/Users/ryo/Repo/oss/copy-selected-tab-urls/package.json`
- Create: `/Users/ryo/Repo/oss/copy-selected-tab-urls/manifest.json`
- Create: `/Users/ryo/Repo/oss/copy-selected-tab-urls/test/manifest.test.js`

**Dependencies:** None

**Estimated scope:** S

**Steps:**

- [ ] Write a failing Node test that reads `manifest.json` and expects Manifest
  V3, the popup, module service worker, direct-copy command, platform shortcut
  suggestions, and exactly the approved permissions.
- [ ] Run `node --test test/manifest.test.js` and confirm it fails because the
  manifest or required contract is missing.
- [ ] Add the minimal `package.json` with `"type": "module"` and a
  `"test": "node --test"` script.
- [ ] Add the minimal manifest that passes the contract test.
- [ ] Run `npm test` and confirm it exits 0.
- [ ] Commit with `chore: Manifest V3の基盤を追加`.

**Acceptance criteria:**

- [ ] The manifest declares only `tabs`, `offscreen`, and `clipboardWrite`.
- [ ] The command suggests `Command+Shift+L` on macOS and `Ctrl+Shift+L`
  elsewhere.
- [ ] `npm test` exits 0.

## Task 2: Implement shared URL extraction

**Files:**

- Create: `/Users/ryo/Repo/oss/copy-selected-tab-urls/src/tab-urls.js`
- Create: `/Users/ryo/Repo/oss/copy-selected-tab-urls/test/tab-urls.test.js`

**Dependencies:** Task 1

**Estimated scope:** S

**Steps:**

- [ ] Write failing behavior tests for single-tab input, unsorted multi-tab
  input, missing URLs, empty input, and newline-separated output.
- [ ] Run `node --test test/tab-urls.test.js` and confirm the expected failures.
- [ ] Implement the smallest pure functions needed to sort by `index`, remove
  unavailable URLs, and join the remaining URLs with `\n`.
- [ ] Run `npm test` and confirm all tests exit 0.
- [ ] Refactor only if the tests remain green.
- [ ] Commit with `feat: 選択タブURLの整形処理を追加`.

**Acceptance criteria:**

- [ ] URLs are ordered by tab index.
- [ ] Only absent or empty URLs are excluded.
- [ ] Output contains exactly one URL per line with no trailing newline.

## Checkpoint 1: Foundation

- [ ] `npm test` exits 0.
- [ ] `git status --short` contains no unexpected files.
- [ ] Manifest permissions still match the approved set.

## Task 3: Add the popup preview and copy flow

**Files:**

- Create: `/Users/ryo/Repo/oss/copy-selected-tab-urls/src/popup.html`
- Create: `/Users/ryo/Repo/oss/copy-selected-tab-urls/src/popup.css`
- Create: `/Users/ryo/Repo/oss/copy-selected-tab-urls/src/popup.js`
- Create: `/Users/ryo/Repo/oss/copy-selected-tab-urls/test/popup-contract.test.js`

**Dependencies:** Task 2

**Estimated scope:** M

**Steps:**

- [ ] Write a failing contract test for the popup module script, tab-list
  container, copy button, and accessible live status region.
- [ ] Run `node --test test/popup-contract.test.js` and confirm it fails.
- [ ] Add semantic popup markup with a visible list, **Copy URLs** button, and
  `aria-live="polite"` status.
- [ ] Query `{ highlighted: true, currentWindow: true }`, render tab titles and
  URLs as text, and use the shared formatter for the copy payload.
- [ ] Use `navigator.clipboard.writeText` only after the button click.
- [ ] Show copied count, zero-result guidance, and clipboard errors as text.
- [ ] Add compact CSS with visible focus styles and no remote assets.
- [ ] Run `npm test` and confirm all tests exit 0.
- [ ] Commit with `feat: 選択タブを確認してコピーできるUIを追加`.

**Acceptance criteria:**

- [ ] The popup lists the same ordered tabs used in the payload.
- [ ] Keyboard focus and status feedback are visible.
- [ ] HTML insertion uses text-safe DOM properties, not untrusted `innerHTML`.

## Task 4: Add shortcut-driven offscreen copying

**Files:**

- Create: `/Users/ryo/Repo/oss/copy-selected-tab-urls/src/background.js`
- Create: `/Users/ryo/Repo/oss/copy-selected-tab-urls/src/offscreen.html`
- Create: `/Users/ryo/Repo/oss/copy-selected-tab-urls/src/offscreen.js`
- Create: `/Users/ryo/Repo/oss/copy-selected-tab-urls/test/background-contract.test.js`

**Dependencies:** Tasks 1 and 2

**Estimated scope:** M

**Steps:**

- [ ] Write failing contract tests for the command name, highlighted-tab query,
  offscreen `CLIPBOARD` reason, targeted runtime message, and badge clearing.
- [ ] Run `node --test test/background-contract.test.js` and confirm it fails.
- [ ] Handle only the approved direct-copy command.
- [ ] Query highlighted tabs using the command tab's `windowId`.
- [ ] Reuse the shared formatter and return `0` without creating an offscreen
  document when no URL is available.
- [ ] Ensure only one offscreen-document creation attempt can run at a time.
- [ ] Send a targeted runtime message and wait for explicit success or error.
- [ ] Show copied count, `0`, or `!` on the badge and clear it after a timeout.
- [ ] Run `npm test` and confirm all tests exit 0.
- [ ] Commit with `feat: ショートカットでURLを即時コピー`.

**Acceptance criteria:**

- [ ] The shortcut does not open visible UI.
- [ ] The popup and shortcut use the same payload format.
- [ ] Concurrent command events do not race offscreen document creation.

## Checkpoint 2: Complete user flows

- [ ] `npm test` exits 0.
- [ ] Load the unpacked extension in Chrome.
- [ ] Confirm a single selected tab copies one URL.
- [ ] Confirm Command/Ctrl-click and Shift-click selections copy in tab-strip
  order from both popup and shortcut.
- [ ] Confirm a tab without an available URL is omitted.
- [ ] Confirm the badge clears after success, zero results, and errors.

## Task 5: Prepare the public OSS documentation

**Files:**

- Modify: `/Users/ryo/Repo/oss/copy-selected-tab-urls/README.md`
- Verify: `/Users/ryo/Repo/oss/copy-selected-tab-urls/LICENSE`
- Create: `/Users/ryo/Repo/oss/copy-selected-tab-urls/CONTRIBUTING.md`
- Create: `/Users/ryo/Repo/oss/copy-selected-tab-urls/SECURITY.md`

**Dependencies:** Tasks 3 and 4

**Estimated scope:** S

**Steps:**

- [ ] Replace planning-stage README text with installation, usage, permission,
  shortcut customization, privacy, testing, and limitation sections.
- [ ] Document unpacked installation and `chrome://extensions/shortcuts`.
- [ ] Explain why each permission is required.
- [ ] Add concise contribution and vulnerability-reporting guidance.
- [ ] Verify that documentation contains no local absolute paths or private
  Notion links outside `.plans/`.
- [ ] Run `npm test` and manually follow the README installation steps.
- [ ] Commit with `docs: OSS公開用ドキュメントを整備`.

**Acceptance criteria:**

- [ ] A new user can install and use the extension from the README.
- [ ] Permission and privacy behavior are explicit.
- [ ] MIT licensing and contribution guidance are present.

## Final checkpoint

- [ ] `npm test` exits 0.
- [ ] All popup and shortcut manual checks pass.
- [ ] `git diff --check` exits 0.
- [ ] No secrets, tokens, analytics, remote scripts, or unnecessary permissions
  are present.
- [ ] The implementation branch is ready for review and a pull request.

## Risks

| Risk | Mitigation |
|---|---|
| Suggested shortcut is unavailable | Document Chrome's shortcut settings and test the active binding |
| Service worker lacks clipboard DOM access | Keep all shortcut clipboard writes in the offscreen document |
| Contract tests become implementation-detail tests | Assert observable files, permissions, messages, and user-visible states |
| New session repeats planning | Require reading `handoff.md`, this plan, design, and ADR before editing |
