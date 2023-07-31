const browser = window.msBrowser || window.browser || window.chrome;

browser.runtime.sendMessage({ func: "check" });

document.addEventListener("DOMContentLoaded", function() {
  var phishingDetectionToggle = document.getElementById("phishingDetectionToggle");
  var phishingURLToggle = document.getElementById("phishingURLToggle");
  var phishingContentToggle = document.getElementById("phishingContentToggle");
  var onlineListsToggle = document.getElementById("onlineListsToggle");

  // Load options from storage and set toggle states accordingly
  browser.storage.sync.get(["phishingDetectionToggle", "phishingURLToggle", "phishingContentToggle", "onlineListsToggle"], function(result) {
    if (result.phishingDetectionToggle !== undefined) {
      phishingDetectionToggle.checked = result.phishingDetectionToggle;
    }
    else {
      browser.storage.sync.set({ "phishingDetectionToggle": phishingDetectionToggle.checked });
    }
    if (result.phishingURLToggle !== undefined) {
      phishingURLToggle.checked = result.phishingURLToggle;
    }
    else {
      browser.storage.sync.set({ "phishingURLToggle": phishingURLToggle.checked });
    }
    if (result.phishingContentToggle !== undefined) {
      phishingContentToggle.checked = result.phishingContentToggle;
    }
    else {
      browser.storage.sync.set({ "phishingContentToggle": phishingContentToggle.checked });
    }
    if (result.onlineListsToggle !== undefined) {
      onlineListsToggle.checked = result.onlineListsToggle;
    }
    else {
      browser.storage.sync.set({ "onlineListsToggle": false});
    }
  });

  // Save options when toggles are changed
  phishingDetectionToggle.addEventListener("change", function() {
    browser.storage.sync.set({ "phishingDetectionToggle": phishingDetectionToggle.checked });
    browser.runtime.sendMessage({
      type: "phishingDetectionToggleChanged",
      value: phishingDetectionToggle.checked
    });
  });
  onlineListsToggle.addEventListener("change", function() {
    // var blacklistStatus = document.getElementById("statusPhrase");
    browser.storage.sync.set({ "onlineListsToggle": onlineListsToggle.checked });
    if (onlineListsToggle.checked === true) {
      var check = updateLists();
      check.then(function(flag){
        if (flag === true) {
          browser.runtime.sendMessage({
            type: "onlineListsToggleChanged",
            value: onlineListsToggle.checked
          });
        }
        else{
          // var whitelistStatus = document.getElementById("whitelistStatus");
          // whitelistStatus.textContent = "Failed to fetch whitelist from server! ";
          onlineListsToggle.checked = false;
          browser.storage.sync.set({ "onlineListsToggle": onlineListsToggle.checked });
        }
      });
    }
    else {
      // browser.storage.sync.set({ "onlineListsToggle": onlineListsToggle.checked });
      browser.runtime.sendMessage({
        type: "onlineListsToggleChanged",
        value: onlineListsToggle.checked
      });
    }    
  });

  phishingURLToggle.addEventListener("change", function() {
    browser.storage.sync.set({ "phishingURLToggle": phishingURLToggle.checked });
  });

  phishingContentToggle.addEventListener("change", function() {
    browser.storage.sync.set({ "phishingContentToggle": phishingContentToggle.checked });
  });

  onlineListsToggle.addEventListener("change", function() {
    browser.storage.sync.set({ "onlineListsToggle": onlineListsToggle.checked });
  });

});

function updateLists() {
  return fetch('https://ivanloh.pythonanywhere.com/whitelist')
    .then(function (response) {
      if (!response.ok) {
        var listStatus = document.getElementById("listStatus");
        listStatus.textContent = "Failed to fetch lists from server! ";
        return false;
      }
      return true;
    });
}

function displayMessage(message, type) {
  var messageElement = document.getElementById(type);
  messageElement.textContent = message;
}

