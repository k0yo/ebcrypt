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

// When the user clicks the extension icon, open `popup.html` in a persistent window
// instead of using the ephemeral browser action popup (which closes on blur).
chrome.action.onClicked.addListener(() => {
    const url = chrome.runtime.getURL('popup.html');
    // Check if a window/tab with this URL already exists; if so, focus it.
    chrome.tabs.query({ url }, function(tabs) {
        if (tabs && tabs.length > 0) {
            const tab = tabs[0];
            chrome.windows.update(tab.windowId, { focused: true });
            chrome.tabs.update(tab.id, { active: true });
        } else {
            chrome.windows.create({
                url,
                type: 'popup',
                width: 420,
                height: 600
            });
        }
    });
});

// Note: Removed webRequest blocking modification because Manifest V3 does not support modifying request bodies.
// The content script (`content.js`) injects an in-page interceptor that overrides fetch and XHR to modify 'commit.do' request bodies instead.
