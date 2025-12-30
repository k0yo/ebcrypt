document.addEventListener('DOMContentLoaded', function() {
  const answersDiv = document.getElementById('answers');
  chrome.storage.local.get(['ebcryptAnswers'], function(result) {
    const answers = result.ebcryptAnswers;
    if (!answers || answers.length === 0) {
      answersDiv.innerHTML = '<em>No answers found for this lesson.</em>';
      return;
    }
    let html = '';
    let lastGroup = null;
    answers.forEach(ans => {
      if (ans.group !== lastGroup) {
        html += `<div class="group-title">${ans.group}</div>`;
        lastGroup = ans.group;
      }
      html += `<div class="answer">Q${ans.index}: [${ans.type}] ${ans.decrypted}</div>`;
    });
    answersDiv.innerHTML = html;
  });
});

document.getElementById('confirm').addEventListener('click', function() {
  antiDetection = document.getElementById('anti-detection').value
  automation = document.getElementById('automation').value
  chrome.storage.local.set(
    { antiDetection: antiDetection, automation: automation }, () => {
      console.log("Settings saved");
    }
  );
});