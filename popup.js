document.addEventListener('DOMContentLoaded', function() {
  const answersDiv = document.getElementById('answers');
  chrome.storage.local.get(['ebcryptAnswers'], function(result) {
    const answers = result.ebcryptAnswers;
    if (!answers || answers.length === 0) {
      answersDiv.innerHTML = '<em>No answers found for this lesson.</em>';
      return;
    }
  });

  chrome.runtime.sendMessage({ type: "getAnswer" }, (response) => {
    if (response && response.type === "answer") {
      answersDiv.innerHTML = `<p>${response.answer}</p>`;
      console.log("Answer:", response.answer);
    }
  });

  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log("nigger");
    if (message.type === "answerUpdated") {
      console.log("ok");
      chrome.runtime.sendMessage({ type: "getAnswer" }, (response) => {
        if (response && response.type === "answer") {
          answersDiv.innerHTML = `<p>${response.answer}</p>`;
          console.log("Answer:", response.answer);
          window.location.href = window.location.href;
        }
      });
    }
  });
});

document.getElementById('confirm').addEventListener('click', function() {
  var antiDetection = document.getElementById('anti-detection').value
  var automation = document.getElementById('automation').value
  chrome.storage.local.set(
    { antiDetection: antiDetection, automation: automation }, () => {
      console.log("Settings saved");
    }
  );
});

document.getElementById("popout").addEventListener("click", function() {
  chrome.windows.create({
    url: "window.html",
    type: "popup",
    width: 400,
    height: 400
  }, window => {
    winId = window.id;
  });
  window.close();
});