chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "courseXML") {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(request.xmlText, "text/xml");
        const seed = parseInt(xmlDoc.querySelector("course").getAttribute("seed"));
        chrome.storage.local.set({ questionOrder: [] });

        // Get all group elements (e.g., easy, challenging)
        const groups = Array.from(xmlDoc.querySelectorAll("group[name]"));
        const answers = [];

        groups.forEach(group => {
            const groupName = group.getAttribute("name");
            // Find all questions within this group
            const questions = group.querySelectorAll("question");
            let groupQuestionNumber = 0;
            questions.forEach((qNode) => {
                const qType = qNode.getAttribute("type") || "unknown";
                // For smc/mmc: <question correct="...">, decrypt and use as index for <answer>
                if (qNode.hasAttribute("correct") && (qType === "smc" || qType === "mmc")) {
                    const enc = qNode.getAttribute("correct");
                    const text = qNode.getAttribute("text");
                    const dec = decrypt(enc, seed);
                    const answersList = Array.from(qNode.querySelectorAll("answer"));
                    let idx = parseInt(dec, 10);
                    let correctAnswer = null;
                    if (!isNaN(idx) && idx >= 1 && idx <= answersList.length) {
                        correctAnswer = answersList[idx - 1]; // 1-based index
                    }
                    const answerText = correctAnswer ? String.fromCharCode(idx + 64) + ", " + correctAnswer.getAttribute("text") : idx;
                    answers.push({
                        group: groupName,
                        type: qType,
                        decrypted: answerText,
                        question: text, 
                        index: groupQuestionNumber
                    });
                    console.log(answers);
                    groupQuestionNumber++;
                }
                // Handle <text correct="..."> elements (fillin)
                console.log(qNode.querySelectorAll("set text").length);
                console.log(qNode.querySelectorAll("set").length);
                if (qNode.querySelectorAll("set text").length > qNode.querySelectorAll("set").length) { // For normal fill-in-the-blank questions
                    const texts = qNode.querySelectorAll("text[correct]");
                    const textNodes = qNode.querySelectorAll("text[text]");
                    let text = "";
                    for (let i = 0; i < textNodes.length; i++) {
                        text += textNodes[i].getAttribute("text");
                    }
                    texts.forEach((node) => {
                        const enc = node.getAttribute("correct");
                        const dec = decrypt(enc, seed);
                        answers.push({
                            group: groupName,
                            type: qType,
                            decrypted: dec,
                            question: text,
                            index: groupQuestionNumber
                        });
                        groupQuestionNumber++;
                    });
                } else { // For matching fill-in-the-blank questions
                    const text = qNode.getAttribute("text");
                    const texts = qNode.querySelectorAll("text[correct]");
                    const textNodes = qNode.querySelectorAll("text[text]");
                    texts.forEach((node) => {
                        const enc = node.getAttribute("correct");
                        const dec = decrypt(enc, seed);
                        answers.push({
                            group: groupName,
                            type: qType,
                            decrypted: dec,
                            question: text,
                            index: groupQuestionNumber
                        });
                        groupQuestionNumber++;
                    });
                }
                // Handle <answer correct="..."> elements (mmc, etc), may have been discontinued in EB
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
                console.log(answers);
            });
        });

        // Save answers to chrome.storage.local for popup
        chrome.storage && chrome.storage.local && chrome.storage.local.set({ ebcryptAnswers: answers });
        // No overlay injected into the website
    }
});

function onChange(mutationsList, observer) {
    console.log('DOM changed');

    if (document.querySelectorAll("input[type='text']").length == 0) {
        var current = document.querySelectorAll('.c_entry-text.ng-star-inserted')[0].innerHTML; // For non-fill-in-the-blank questions
    } else {
        var current = document.querySelectorAll('.c_entry-text.ng-star-inserted')[1].innerHTML.replace(/&nbsp;/g, ' '); // For fill-in-the-blank questions
    }
    console.log("Current element:", current);

    chrome.storage.local.get(["ebcryptAnswers"]).then(result => {
        const answers = result.ebcryptAnswers || [];
        let displayList = [];
        let display = "";
        answers.forEach(item => {
            const questionText = item.question;
            const answerText = item.decrypted;
            const questionIndex = item.index;
            if (questionText.includes(current)){
                displayList.push(answerText);
                console.log("Question:", questionText);
                console.log("Answer:", answerText);
                chrome.storage.local.get("questionOrder").then(result => {
                    const questionOrder = result.questionOrder || [];
                    chrome.storage.local.set({ questionOrder: [...questionOrder, questionIndex] });
                    console.log([questionOrder, questionIndex]); // this function is not completely funtional yet
                });
            };
        });
        [...new Set(displayList)].forEach(ans => {
            display += ans + "; ";
        });
        console.log(display.slice(0, display.length - 2));
        chrome.runtime.sendMessage({ answerText: display.slice(0, display.length - 2) });
    });
}

const observer = new MutationObserver(onChange);

observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Interception of 'commit.do' requests is handled by `main.js` (in the MAIN world) which overrides
// `window.fetch` and `XMLHttpRequest` at document_start. That code is intentionally separated because
// MAIN-world scripts can access the page's real fetch/XHR, while the ISOLATED world (this script) needs
// `chrome.runtime` access to display answers and cannot run in MAIN.
