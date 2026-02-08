async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function pingTab(tabId) {
  try {
    const res = await chrome.tabs.sendMessage(tabId, { type: "PING" });
    return res?.ok;
  } catch {
    return false;
  }
}

async function ensureInjected(tabId) {

  const alive = await pingTab(tabId);
  if (alive) return true;

  console.warn("[BG] Content script missing — reinjecting");

  await chrome.scripting.executeScript({
    target: { tabId, allFrames: false },
    files: ["content/scan.js"]
  });

  await sleep(300);

  return await pingTab(tabId);
}

chrome.runtime.onMessage.addListener(async (msg) => {

  if (msg.type === "SEND_TO_BACKEND") {

    console.log("[BG] Sending batch for tab:", msg.tabId);

    const resp = await fetch("http://localhost:3000/detect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(msg.payload)
    });

    const results = await resp.json();

    console.log("[BG] Backend returned");

    const ready = await ensureInjected(msg.tabId);

    if (!ready) {
      console.error("[BG] Could not reach content script");
      return;
    }

    await chrome.tabs.sendMessage(msg.tabId, {
      type: "RENDER_RESULTS",
      results
    });

    console.log("[BG] Results delivered");
  }
});
