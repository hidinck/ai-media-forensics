// ==============================
// AI Media Forensics – popup.js
// ==============================

console.log("[AI] popup.js loaded");

document.addEventListener("DOMContentLoaded", () => {

  const scanBtn = document.getElementById("scanBtn");
  const status = document.getElementById("status");

  if (!scanBtn || !status) {
    console.error("[AI] popup elements missing");
    return;
  }

  scanBtn.addEventListener("click", async () => {

    status.innerText = "Scanning page...";

    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    if (!tab?.id) {
      status.innerText = "No active tab!";
      return;
    }

    chrome.tabs.sendMessage(tab.id, { type: "SCAN_PAGE" }, res => {

      if (chrome.runtime.lastError || !res) {
        console.error("SCAN_PAGE failed:", chrome.runtime.lastError);
        status.innerText = "Scan failed – reload page & try again";
        return;
      }

      if (!res.images || !Array.isArray(res.images)) {
        console.error("Bad scan response:", res);
        status.innerText = "No images found";
        return;
      }

      status.innerText = `Found ${res.images.length} images`;

      chrome.runtime.sendMessage({
        type: "SEND_TO_BACKEND",
        tabId: tab.id,
        payload: res
      });

    });

  });

});
