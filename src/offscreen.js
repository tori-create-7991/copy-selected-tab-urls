chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (
    message.target !== "offscreen" ||
    message.type !== "copy-tab-urls"
  ) {
    return false;
  }

  navigator.clipboard.writeText(message.text).then(
    () => sendResponse({ ok: true }),
    (error) => sendResponse({ ok: false, error: error.message }),
  );

  return true;
});
