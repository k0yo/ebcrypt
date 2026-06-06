document.addEventListener('DOMContentLoaded', function() {
  const answersDiv = document.getElementById('answers');

  chrome.runtime.sendMessage({ type: "getAnswer" }, (response) => {
    if (response && response.type === "answer") {
      answersDiv.innerHTML = `<p>${response.answer}</p>`;
    }
  });

  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.type === "answerUpdated") {
      chrome.runtime.sendMessage({ type: "getAnswer" }, (response) => {
        if (response && response.type === "answer") {
          answersDiv.innerHTML = `<p>${response.answer}</p>`;
        }
      });
    }
  });

  document.getElementById("copy").addEventListener("click", function() {
    const copyText = document.getElementById("answers").innerText;
    navigator.clipboard.writeText(copyText).then(() => {
      console.log("Answers copied to clipboard");
    }).catch(err => {
      console.error("Could not copy text: ", err);
    });
  });
});
