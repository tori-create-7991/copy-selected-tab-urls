const clipboardBuffer = document.querySelector("#clipboard-buffer");

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (
    message.target !== "offscreen" ||
    message.type !== "copy-tab-urls"
  ) {
    return false;
  }

  clipboardBuffer.value = message.text;
  clipboardBuffer.select();

  try {
    const copied = document.execCommand("copy");
    if (!copied) {
      sendResponse({
        ok: false,
        error: "The clipboard copy command was rejected.",
      });
      return false;
    }

    sendResponse({ ok: true });
  } catch (error) {
    sendResponse({ ok: false, error: error.message });
  } finally {
    clipboardBuffer.value = "";
  }

  return false;
});
