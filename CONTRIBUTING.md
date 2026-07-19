# Contributing

Thanks for helping improve Copy Selected Tab URLs.

## Before opening a change

- Search existing issues and pull requests for related work.
- Keep changes focused on the URL-only Chrome extension.
- Discuss substantial behavior or permission changes in an issue first.

## Development

1. Fork and clone the repository.
2. Create a focused branch.
3. Make the smallest change that solves the problem.
4. Add or update behavior-focused tests.
5. Run `npm test`.
6. Load the repository as an unpacked extension and manually verify any changed
   popup or shortcut behavior.

The project uses dependency-free JavaScript, Manifest V3, and Node.js built-in
test tooling. Do not add runtime dependencies, remote scripts, analytics, or
permissions without an approved design change.

## Pull requests

Describe the user-visible outcome, verification performed, and any permission
or privacy impact. Keep unrelated refactoring in a separate pull request.

By contributing, you agree that your contribution is licensed under the MIT
License.
