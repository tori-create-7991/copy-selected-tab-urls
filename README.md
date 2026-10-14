# Copy Selected Tab URLs

![Copy all icon](icons/copy_all-128.png)

Copy the URLs of highlighted Chrome tabs, one per line and in tab-strip order.

## Features

- Preview highlighted tabs before copying.
- Copy from the popup with a visible result message.
- Copy immediately with a configurable keyboard shortcut.
- Parse the copied list locally without analytics or extension-server transfers.
- Chrome loads each opened HTTP(S) URL normally, connecting to that website.

## Requirements

Google Chrome 109 or later.

## Install from source

1. Download or clone this repository.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Choose the repository directory containing `manifest.json`.

Chrome displays the extension in the extensions menu. Pin it if you want the
popup to remain visible in the toolbar.

## Usage

### Preview and copy

1. Highlight tabs with Command-click on macOS, Ctrl-click on other platforms,
   or Shift-click for a range.
2. Open **Copy Selected Tab URLs** from the Chrome toolbar.
3. Review the ordered list and select **Copy URLs**.

The active tab is highlighted by default, so the same flow copies a single URL.
Tabs whose URL is unavailable are omitted.

### Copy with the keyboard

Highlight the tabs and press:

- macOS: `Command+Shift+L`
- Other platforms: `Ctrl+Shift+L`

The toolbar badge briefly shows the number of copied URLs. It shows `0` when no
URL is available and `!` when copying fails.

Chrome may leave a suggested shortcut unassigned when it conflicts with
another command. Open `chrome://extensions/shortcuts` to review or change the
binding.

## Permissions

| Permission | Why it is required |
|---|---|
| `tabs` | Read the titles, URLs, selection state, and order of highlighted tabs. |
| `offscreen` | Create a hidden extension document for shortcut-driven clipboard access. |
| `clipboardWrite` | Write the newline-separated URLs to the system clipboard. |
| `clipboardRead` | Read the clipboard after you select **Open copied URLs**. |
| Optional `file:///*` host permission | Let Chrome expose its **Allow access to file URLs** setting for local URL handling. |

The extension does not request required host permissions or inject content
scripts. It declares optional access to `file://` URLs for the local-file
opening feature described below.

The manifest declares `clipboardRead`, which Chrome may show in its extension
permission warning. The popup reads the clipboard only when you select **Open
copied URLs**; it does not read the clipboard in the background. Chrome labels
this permission as access to data you copy and paste.

Opening `file://` URLs requires **Allow access to file URLs** on the extension's
Details page at `chrome://extensions`. When access is off, those entries are
skipped and the popup explains how to enable it. The extension opens the file
URL as a Chrome tab; it does not read the file contents.

## Privacy

The extension does not store or analyze selected tab titles, URLs, or clipboard
contents, and does not send them to an extension server. When you open HTTP(S)
URLs, Chrome connects to the requested websites as usual. The extension does
not read local file contents.

## Development and testing

The extension uses dependency-free JavaScript and has no build step. Run the
automated contract and behavior tests with:

```sh
npm test
```

After changing Chrome integration code, reload the unpacked extension at
`chrome://extensions` and verify both the popup and keyboard flows.

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidance and
[SECURITY.md](SECURITY.md) for reporting vulnerabilities.

## Limitations

- The output format is URL-only, one URL per line.
- Tabs without an available URL are skipped.
- Only `http:`, `https:`, and permitted `file:` URLs are opened from the
  clipboard. Blank, invalid, and unsupported-scheme lines are skipped.
- Firefox is not supported.
- The extension is installed unpacked; Chrome Web Store publishing is outside
  the current project scope.

## License

Project source is [MIT](LICENSE). The `copy_all` icon assets are Apache-2.0;
see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
