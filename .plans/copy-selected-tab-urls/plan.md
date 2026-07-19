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
- [x] The repository is on non-`main` branch
  `codex/copy-selected-tab-urls` in a dedicated Codex worktree.
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

- [x] Write a failing Node test that reads `manifest.json` and expects Manifest
  V3, the popup, module service worker, direct-copy command, platform shortcut
  suggestions, and exactly the approved permissions.
- [x] Run `node --test test/manifest.test.js` and confirm it fails because the
  manifest or required contract is missing.
- [x] Add the minimal `package.json` with `"type": "module"` and a
  `"test": "node --test"` script.
- [x] Add the minimal manifest that passes the contract test.
- [x] Run `npm test` and confirm it exits 0.
- [x] Commit with `chore: Manifest V3の基盤を追加`.

**Acceptance criteria:**

- [x] The manifest declares only `tabs`, `offscreen`, and `clipboardWrite`.
- [x] The command suggests `Command+Shift+L` on macOS and `Ctrl+Shift+L`
  elsewhere.
- [x] `npm test` exits 0.

## Task 2: Implement shared URL extraction

**Files:**

- Create: `/Users/ryo/Repo/oss/copy-selected-tab-urls/src/tab-urls.js`
- Create: `/Users/ryo/Repo/oss/copy-selected-tab-urls/test/tab-urls.test.js`

**Dependencies:** Task 1

**Estimated scope:** S

**Steps:**

- [x] Write failing behavior tests for single-tab input, unsorted multi-tab
  input, missing URLs, empty input, and newline-separated output.
- [x] Run `node --test test/tab-urls.test.js` and confirm the expected failures.
- [x] Implement the smallest pure functions needed to sort by `index`, remove
  unavailable URLs, and join the remaining URLs with `\n`.
- [x] Run `npm test` and confirm all tests exit 0.
- [x] Refactor only if the tests remain green.
- [x] Commit with `feat: 選択タブURLの整形処理を追加`.

**Acceptance criteria:**

- [x] URLs are ordered by tab index.
- [x] Only absent or empty URLs are excluded.
- [x] Output contains exactly one URL per line with no trailing newline.

## Checkpoint 1: Foundation

- [x] `npm test` exits 0.
- [x] `git status --short` contains no unexpected files.
- [x] Manifest permissions still match the approved set.

## Task 3: Add the popup preview and copy flow

**Files:**

- Create: `/Users/ryo/Repo/oss/copy-selected-tab-urls/src/popup.html`
- Create: `/Users/ryo/Repo/oss/copy-selected-tab-urls/src/popup.css`
- Create: `/Users/ryo/Repo/oss/copy-selected-tab-urls/src/popup.js`
- Create: `/Users/ryo/Repo/oss/copy-selected-tab-urls/test/popup-contract.test.js`

**Dependencies:** Task 2

**Estimated scope:** M

**Steps:**

- [x] Write a failing contract test for the popup module script, tab-list
  container, copy button, and accessible live status region.
- [x] Run `node --test test/popup-contract.test.js` and confirm it fails.
- [x] Add semantic popup markup with a visible list, **Copy URLs** button, and
  `aria-live="polite"` status.
- [x] Query `{ highlighted: true, currentWindow: true }`, render tab titles and
  URLs as text, and use the shared formatter for the copy payload.
- [x] Use `navigator.clipboard.writeText` only after the button click.
- [x] Show copied count, zero-result guidance, and clipboard errors as text.
- [x] Add compact CSS with visible focus styles and no remote assets.
- [x] Run `npm test` and confirm all tests exit 0.
- [x] Commit with `feat: 選択タブを確認してコピーできるUIを追加`.

**Acceptance criteria:**

- [x] The popup lists the same ordered tabs used in the payload.
- [x] Keyboard focus and status feedback are visible.
- [x] HTML insertion uses text-safe DOM properties, not untrusted `innerHTML`.

## Task 4: Add shortcut-driven offscreen copying

**Files:**

- Create: `/Users/ryo/Repo/oss/copy-selected-tab-urls/src/background.js`
- Create: `/Users/ryo/Repo/oss/copy-selected-tab-urls/src/offscreen.html`
- Create: `/Users/ryo/Repo/oss/copy-selected-tab-urls/src/offscreen.js`
- Create: `/Users/ryo/Repo/oss/copy-selected-tab-urls/test/background-contract.test.js`

**Dependencies:** Tasks 1 and 2

**Estimated scope:** M

**Steps:**

- [x] Write failing contract tests for the command name, highlighted-tab query,
  offscreen `CLIPBOARD` reason, targeted runtime message, and badge clearing.
- [x] Run `node --test test/background-contract.test.js` and confirm it fails.
- [x] Handle only the approved direct-copy command.
- [x] Query highlighted tabs using the command tab's `windowId`.
- [x] Reuse the shared formatter and return `0` without creating an offscreen
  document when no URL is available.
- [x] Ensure only one offscreen-document creation attempt can run at a time.
- [x] Send a targeted runtime message and wait for explicit success or error.
- [x] Show copied count, `0`, or `!` on the badge and clear it after a timeout.
- [x] Run `npm test` and confirm all tests exit 0.
- [x] Commit with `feat: ショートカットでURLを即時コピー`.

**Acceptance criteria:**

- [x] The shortcut does not open visible UI.
- [x] The popup and shortcut use the same payload format.
- [x] Concurrent command events do not race offscreen document creation.

## Checkpoint 2: Complete user flows

- [x] `npm test` exits 0.
- [x] Load the unpacked extension in Chrome for Testing 149.
- [x] Confirm a single selected tab copies one URL from the popup document.
- [x] Confirm a multi-tab selection copies in tab-strip order from the popup
  document.
- [x] Confirm the same multi-tab selection through the physical shortcut.
  The user completed the physical Chrome check after automated key injection
  was blocked by macOS Accessibility.
- [x] Confirm a tab without an available URL is omitted.
- [x] Confirm the badge clears after success, zero results, and errors.

## Task 5: Prepare the public OSS documentation

**Files:**

- Modify: `/Users/ryo/Repo/oss/copy-selected-tab-urls/README.md`
- Verify: `/Users/ryo/Repo/oss/copy-selected-tab-urls/LICENSE`
- Create: `/Users/ryo/Repo/oss/copy-selected-tab-urls/CONTRIBUTING.md`
- Create: `/Users/ryo/Repo/oss/copy-selected-tab-urls/SECURITY.md`

**Dependencies:** Tasks 3 and 4

**Estimated scope:** S

**Steps:**

- [x] Replace planning-stage README text with installation, usage, permission,
  shortcut customization, privacy, testing, and limitation sections.
- [x] Document unpacked installation and `chrome://extensions/shortcuts`.
- [x] Explain why each permission is required.
- [x] Add concise contribution and vulnerability-reporting guidance.
- [x] Verify that documentation contains no local absolute paths or private
  Notion links outside `.plans/`.
- [x] Run `npm test`.
- [x] Manually follow the README installation steps. The user confirmed the
  native unpacked-extension installation flow.
- [x] Commit with `docs: OSS公開用ドキュメントを整備`.

**Acceptance criteria:**

- [x] A new user can install and use the extension from the README.
- [x] Permission and privacy behavior are explicit.
- [x] MIT licensing and contribution guidance are present.

## Final checkpoint

- [x] `npm test` exits 0 (21 tests, 0 failures after PR review follow-up).
- [x] All popup and shortcut manual checks pass.
- [x] `git diff --check` exits 0.
- [x] No secrets, tokens, analytics, remote scripts, or unnecessary permissions
  are present.
- [x] The implementation branch is ready for review and pull request
  https://github.com/tori-create-7991/copy-selected-tab-urls/pull/1 is open.

## Risks

| Risk | Mitigation |
|---|---|
| Suggested shortcut is unavailable | Document Chrome's shortcut settings and test the active binding |
| Service worker lacks clipboard DOM access | Keep all shortcut clipboard writes in the offscreen document |
| Contract tests become implementation-detail tests | Assert observable files, permissions, messages, and user-visible states |
| New session repeats planning | Require reading `handoff.md`, this plan, design, and ADR before editing |
