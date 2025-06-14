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

// Intercept 'commit.do' requests and modify 'cmi.core.score.raw' to 100
chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        if (details.method !== 'POST' || !details.url.includes('commit.do')) return;
        if (!details.requestBody || !details.requestBody.raw || !details.requestBody.raw[0]) return;
        try {
            console.log('Detected commit.do request, modifying cmi.core.score.raw to 100');
            const decoder = new TextDecoder('utf-8');
            const bodyString = decoder.decode(details.requestBody.raw[0].bytes);
            let data = JSON.parse(bodyString);
            data["cmi.core.score.raw"] = 100;
            const encoder = new TextEncoder();
            const newBody = encoder.encode(JSON.stringify(data));
            return { requestBody: { raw: [{ bytes: newBody }] } };
        } catch (e) {
            console.error('Failed to modify commit.do request:', e);
        }
    },
    { urls: ["<all_urls>"] },
    ["blocking", "requestBody"]
);