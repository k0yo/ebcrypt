chrome.webRequest.onCompleted.addListener(
    async (details) => {
        if (!details.url.includes('course_pc.exml')) return;

        try {
            const res = await fetch(details.url);
            const xmlText = await res.text();
            const tabId = details.tabId;
            chrome.tabs.sendMessage(tabId, { type: "courseXML", xmlText }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Error sending message to tab:", chrome.runtime.lastError);
                }
            });
        } catch (e) {
            console.error("Error fetching or sending XML:", e);
        }
    },
    { urls: ["<all_urls>"], types: ["xmlhttprequest", "other"] }
);

// Note: Removed webRequest blocking modification because Manifest V3 does not support modifying request bodies.
// The content script (`content.js`) injects an in-page interceptor that overrides fetch and XHR to modify 'commit.do' request bodies instead.
