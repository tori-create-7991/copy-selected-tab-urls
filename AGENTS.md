# Agent instructions

<!-- @evolve-config
roadmap_path: docs/ROADMAP.md
notion_task_url: https://app.notion.com/p/evolve-loop-copy-selected-tab-urls-3a52f5910ab7813fafc2de766fc8889e
test_command: npm test
automerge: true
automerge_conditions: npm_test_pass, pr_code_review_no_blocking
loop_interval: 2h
-->

Before making changes, read every file in `~/.agents/rules/*.md`.

For this project:

- Read `.plans/copy-selected-tab-urls/handoff.md` before starting.
- Follow `.plans/copy-selected-tab-urls/plan.md` task by task.
- Treat `docs/design/copy-selected-tab-urls.md` and
  `docs/adr/0001-use-manifest-v3-with-offscreen-clipboard.md` as approved.
- Use Manifest V3 and dependency-free JavaScript.
- Use Node.js built-in test tooling and behavior-focused English test names.
- Use test-driven development: failing test, minimal implementation, passing
  test, then refactor.
- Do not add Markdown copy formats, a settings page, Firefox support, analytics,
  or Chrome Web Store publishing in the initial implementation.
