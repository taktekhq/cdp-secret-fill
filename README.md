# cdp-secret-fill

Small Node scripts for an agent (or you) driving a real Chrome over the DevTools protocol, when a
password has to go into a login form **without ever appearing in a log, a transcript or a screenshot**.

- `bw-copy-password.mjs "Item name" [username]`: opens the Bitwarden extension's popup page in that
  Chrome, finds the login by name and copies its password to the clipboard. It prints only "found" and
  whether the username matched.
- `click.mjs TARGET_ID X Y`: clicks at viewport coordinates with `Input.dispatchMouseEvent`. Unlike
  element clicks, this reaches fields inside cross-origin iframes, such as Apple's or Google's sign-in
  form embedded in another site.
- `paste.mjs TARGET_ID`: types the clipboard into the focused field with `Input.insertText`, then empties
  the clipboard.
- `bw-folder.mjs TARGET_ID CIPHER_ID FOLDER`: moves a Bitwarden item into a folder from the extension's popup
  tab, then re-opens the item and prints its name and folder so you can check it landed. Prints no
  secrets. The cipher id is in the popup URL when the item is open (`#/view-cipher?cipherId=...`).

Typical flow: copy the password, click into the password field, paste, then submit however you like.

```sh
node bw-copy-password.mjs "Apple ID" me@example.com
node click.mjs 8F3C…TARGET 560 309
node paste.mjs 8F3C…TARGET
```

## Setup

- Node 22 or newer (built-in `fetch` and `WebSocket`); no dependencies.
- Chrome started with `--remote-debugging-port=9222`. Set `CDP_URL` if yours is elsewhere.
- Target ids come from `curl $CDP_URL/json/list`.
- For the Bitwarden script, open the extension's popup as a tab
  (`chrome-extension://<id>/popup/index.html`) and unlock it. `BW_EXTENSION_ID` overrides the
  Chrome Web Store id.
- Clipboard commands are macOS's `pbcopy`/`pbpaste`.

Anyone who can reach the debugging port controls the browser, so keep it bound to localhost.

## License

MIT. See LICENSE.
