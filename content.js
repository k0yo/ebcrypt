chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "courseXML") {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(request.xmlText, "text/xml");
        const seed = parseInt(xmlDoc.querySelector("course").getAttribute("seed"));

        // Get all group elements (e.g., easy, challenging)
        const groups = Array.from(xmlDoc.querySelectorAll("group[name]"));
        const answers = [];

        groups.forEach(group => {
            const groupName = group.getAttribute("name");
            // Find all questions within this group
            const questions = group.querySelectorAll("question");
            let groupQuestionNumber = 1;
            questions.forEach((qNode) => {
                const qType = qNode.getAttribute("type") || "unknown";
                // For smc/mmc: <question correct="...">, decrypt and use as index for <answer>
                if (qNode.hasAttribute("correct") && (qType === "smc" || qType === "mmc")) {
                    const enc = qNode.getAttribute("correct");
                    const dec = decrypt(enc, seed);
                    const answersList = Array.from(qNode.querySelectorAll("answer"));
                    let idx = parseInt(dec, 10);
                    let correctAnswer = null;
                    if (!isNaN(idx) && idx >= 1 && idx <= answersList.length) {
                        correctAnswer = answersList[idx - 1]; // 1-based index
                    }
                    const answerText = correctAnswer ? correctAnswer.getAttribute("text") : dec;
                    answers.push({
                        group: groupName,
                        type: qType,
                        decrypted: answerText,
                        index: groupQuestionNumber
                    });
                    groupQuestionNumber++;
                }
                // Handle <text correct="..."> elements (fillin)
                const texts = qNode.querySelectorAll("text[correct]");
                texts.forEach((node, idx) => {
                    const enc = node.getAttribute("correct");
                    const dec = decrypt(enc, seed);
                    answers.push({
                        group: groupName,
                        type: qType,
                        decrypted: dec,
                        index: groupQuestionNumber
                    });
                    groupQuestionNumber++;
                });
                // Handle <answer correct="..."> elements (mmc, etc)
                const options = qNode.querySelectorAll("answer[correct]");
                options.forEach((node, idx) => {
                    const enc = node.getAttribute("correct");
                    const dec = decrypt(enc, seed);
                    answers.push({
                        group: groupName,
                        type: qType,
                        decrypted: dec,
                        index: groupQuestionNumber
                    });
                    groupQuestionNumber++;
                });
            });
        });

        // Save answers to chrome.storage.local for popup
        chrome.storage && chrome.storage.local && chrome.storage.local.set({ ebcryptAnswers: answers });
        // Inject answers under each question in the DOM based on the HTML structure
        const questionEls = document.querySelectorAll('question-smc, question-mmc, question-fillin, question-mtf, question-matching');
        let answerIdx = 0;
        answers.forEach(ans => {
            const qEl = questionEls[answerIdx];
            if (qEl) {
                const entryContainer = qEl.querySelector('.c_entry-container');
                const entryText = entryContainer ? entryContainer.querySelector('.c_entry-text') : null;
                if (entryContainer && entryText && !entryContainer.querySelector('.ebcrypt-answer')) {
                    const answerDiv = document.createElement('div');
                    answerDiv.className = 'ebcrypt-answer';
                    answerDiv.style.color = 'green';
                    answerDiv.style.fontWeight = 'bold';
                    answerDiv.style.marginTop = '8px';
                    answerDiv.textContent = `Answer: ${ans.decrypted}`;
                    entryContainer.insertBefore(answerDiv, entryText.nextSibling);
                }
            }
            answerIdx++;
        });
        // No overlay injected into the website
    }
});

// Inject a script to override fetch and XMLHttpRequest, intercepting 'commit.do' requests and modifying cmi.core.score.raw to 100.
(function injectCommitInterceptor() {
    const script = document.createElement('script');
    script.textContent = `
        (function() {
            // Intercept fetch
            const origFetch = window.fetch;
            window.fetch = async function(input, init) {
                let url = (typeof input === 'string') ? input : input.url;
                if (url && url.includes('commit.do') && init && init.method === 'POST' && init.body) {
                    try {
                        let bodyObj = JSON.parse(init.body);
                        bodyObj["cmi.core.score.raw"] = 100;
                        init.body = JSON.stringify(bodyObj);
                        console.log('[EBCrypt] Modified commit.do fetch request:', init.body);
                    } catch (e) {
                        // Not JSON, skip
                    }
                }
                return origFetch.apply(this, arguments);
            };

            // Intercept XMLHttpRequest
            const origOpen = XMLHttpRequest.prototype.open;
            const origSend = XMLHttpRequest.prototype.send;
            XMLHttpRequest.prototype.open = function(method, url) {
                this._ebcrypt_isCommit = url && url.includes('commit.do') && method === 'POST';
                return origOpen.apply(this, arguments);
            };
            XMLHttpRequest.prototype.send = function(body) {
                if (this._ebcrypt_isCommit && body) {
                    try {
                        let bodyObj = JSON.parse(body);
                        bodyObj["cmi.core.score.raw"] = 100;
                        body = JSON.stringify(bodyObj);
                        console.log('[EBCrypt] Modified commit.do XHR request:', body);
                    } catch (e) {
                        // Not JSON, skip
                    }
                }
                return origSend.call(this, body);
            };
        })();
    `;
    document.documentElement.appendChild(script);
    script.remove();
})();