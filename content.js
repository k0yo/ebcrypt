chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "courseXML") {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(request.xmlText, "text/xml");
        const seed = parseInt(xmlDoc.querySelector("course").getAttribute("seed"));

        const questions = xmlDoc.querySelectorAll("question");
        const answers = [];

        questions.forEach((qNode) => {
            const qType = qNode.getAttribute("type") || "unknown";
            const texts = qNode.querySelectorAll("text[correct]");
            texts.forEach((node, idx) => {
                const enc = node.getAttribute("correct");
                const dec = decrypt(enc, seed);
                answers.push({
                    type: qType,
                    decrypted: dec,
                    index: idx + 1
                });
            });
        });

        const display = document.createElement("div");
        display.style.position = "fixed";
        display.style.top = "0";
        display.style.right = "0";
        display.style.background = "#fff";
        display.style.border = "2px solid black";
        display.style.padding = "10px";
        display.style.zIndex = 9999;
        display.style.maxHeight = "90vh";
        display.style.overflowY = "auto";
        display.style.color = "green";
        display.style.fontFamily = "Roboto, Arial, sans-serif";
        display.style.fontSize = "16px";
        display.innerHTML = "<b>Decrypted Answers:</b><br/>";

        answers.forEach((ans, i) => {
            display.innerHTML += `[${ans.type}] ${ans.decrypted}<br/>`;
        });

        document.body.appendChild(display);
    }
});