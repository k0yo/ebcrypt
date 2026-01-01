chrome.webRequest.onCompleted.addListener(
    async (details) => {
        if (!details.url.includes('course_pc.exml')) return;

        try {
            const res = await fetch(details.url);
            const xmlText = await res.text();
            const tabId = details.tabId;
            // Ensure tabId is valid before sending a message to avoid "Value must be at least 0" errors
            if (typeof tabId === 'number' && tabId >= 0) {
                chrome.tabs.sendMessage(tabId, { type: "courseXML", xmlText }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error("Error sending message to tab:", chrome.runtime.lastError);
                    }
                });
            } else {
                // console.warn('[EBCrypt] Skipping message send: invalid tabId', tabId);
            }
        } catch (e) {
            console.error("Error fetching or sending XML:", e);
        }
    },
    { urls: ["<all_urls>"], types: ["xmlhttprequest", "other"] }
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.answerText) {
        currentAnswer = message.answerText;
        sendResponse({ status: "success" });
        chrome.runtime.sendMessage({ type: "answerUpdated", answer: currentAnswer });
        console.log("message sent");
    }

    if (message.type == "getAnswer") {
        console.log("Providing answer:", currentAnswer);
        sendResponse({ type: "answer", answer: currentAnswer });
    }
});
// The webRequest onBeforeRequest handler that attempted to modify request bodies has been removed.
// Modifying request bodies from a service worker is not supported in Manifest V3. The request modification
// is now handled by a MAIN-world content script (see `score-modifier.js`) which overrides window.fetch and XHR before
// the page sends requests.
