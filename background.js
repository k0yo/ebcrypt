chrome.webRequest.onCompleted.addListener(
    async (details) => {
        if (details.url.includes("course_pc.exml")) {
            const res = await fetch(details.url);
            const xmlText = await res.text();
            const tabId = details.tabId;
            chrome.tabs.sendMessage(tabId, { type: "courseXML", xmlText });
        }
    },
    { urls: ["*://*/course_pc.exml*"] }
);