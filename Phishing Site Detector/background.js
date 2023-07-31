'use strict';

const browser = window.msBrowser || window.browser || window.chrome;

const SAFE_COLOR = "#17Bf63";
const SAFE_LABEL = "Safe";
const SAFE_TITLE = "The site is legitimate!";

const UNKNOWN_COLOR = "#969696";
const UNKNOWN_LABEL = "Unknown";
const UNKNOWN_TITLE = "The site is unknown!";

const PENDING_COLOR = "#ff8000";
const PENDING_LABEL = "Reported";
const PENDING_TITLE = "This is pontentially a phishing site!";

const SUSPICIOUS_COLOR = "#e6e600"
const SUSPICIOUS_LABEL = "Suspicious";
const SUSPICIOUS_TITLE = "This is a suspicious site!";

const DANGEROUS_COLOR = "#ff0400";
const DANGEROUS_LABEL = "Dangerous";
const DANGEROUS_TITLE = "This is a phishing site!";

const tabs = {};
var blacklist, whitelist, pending;
var phishingDetectionToggle, phishingURLToggle, phishingContentToggle, onlineListsToggle;
var DOMAIN_BLACKLIST_URL;
var DOMAIN_WHITELIST_URL;
var DOMAIN_PENDING_URL;

checkOnline().then(function(){
  if (onlineListsToggle === true) {
    DOMAIN_BLACKLIST_URL  = "https://ivanloh.pythonanywhere.com/blacklist";
    DOMAIN_WHITELIST_URL  = "https://ivanloh.pythonanywhere.com/whitelist";
    DOMAIN_PENDING_URL  = "https://ivanloh.pythonanywhere.com/pending";
  }
  else {
    // For localhost :-
    DOMAIN_BLACKLIST_URL  = "/assets/blacklist.json";
    DOMAIN_WHITELIST_URL  = "/assets/whitelist.json";    
    DOMAIN_PENDING_URL  = "/assets/pending.json";
  }
  // DOMAIN_PENDING_URL  = "/assets/pending.json";
  // DOMAIN_PENDING_URL  = "https://ivanloh.pythonanywhere.com/pending";

  updateBlacklists();
  setInterval(function () {
    updateBlacklists();
  }, 5 * 60 * 1000);

  updateWhitelists();
  setInterval(function () {
    updateWhitelists();
  }, 1 * 60 * 60 * 1000);

  updatePendinglists();
  setInterval(function () {
    updatePendinglists();
  }, 1 * 60 * 60 * 1000);

  function updateBlacklists() {
    fetch(DOMAIN_BLACKLIST_URL)
      .then(async (data) => {
        if (!data.ok) {
          throw new Error('Failed to fetch blacklist JSON data');          
        }
        blacklist = await data.json();
        console.info(`Retrieved Domain Blacklist: ${blacklist.length} items.`);
      })
      .catch((error) => {
        console.error('Error updating blacklist JSON:', error);
      });
  }
  
  function updateWhitelists() {
    fetch(DOMAIN_WHITELIST_URL)
      .then(async (data) => {
        if (!data.ok) {
          throw new Error('Failed to fetch whitelist JSON data');
        }
        whitelist = await data.json();
        console.info(`Retrieved Domain Whitelist: ${whitelist.length} items.`);
      })
      .catch((error) => {
        console.error('Error updating whitelist JSON:', error);
      });
  }  

  async function updatePendinglists() {
    try {
      const response = await fetch(DOMAIN_PENDING_URL);
  
      if (!response.ok) {
        throw new Error('Failed to fetch pending JSON data');
      }
  
      const pending = await response.json();
      console.info(`Retrieved Domain Pending: ${pending.length} items.`);
      return pending;
    } catch (error) {
      console.error('Error updating pending JSON:', error);
      throw error;
    }
  }  

  browser.browserAction.setIcon({ path: "/img/tab-icon.png" });

  browser.runtime.onMessage.addListener(function(message) {
    if (message.type === "phishingDetectionToggleChanged") {
      // Handle the toggle value change here
      browser.runtime.reload();
    }
  });
  browser.runtime.onMessage.addListener(function(message) {
    if (message.type === "onlineListsToggleChanged") {
      // Handle the toggle value change here
      browser.runtime.reload();
    }
  });

  function phishingDetection() {
    browser.webRequest.onBeforeRequest.addListener(
      (request) => {
        if (request.tabId >= 0) {
          updatePendinglists();
          let domain = getDomainFromURL(request.url);
          let bookmarkFlag = false;
          checkBookmark(request.url, function(result) {
            if (result) {
              tabs[request.tabId] = { state: SAFE_LABEL };
              browser.storage.local.set({ [request.url]: "safe" });
              browser.tabs.query({ currentWindow: true, active: true }, function (tabs) {
                updateIcon(tabs[0].id);
              });
              bookmarkFlag = true;
            }
            if (bookmarkFlag == false) {
              let listFlag = false;
              if (domainInArray(domain, blacklist)) {
                tabs[request.tabId] = { state: DANGEROUS_LABEL };
                showNotification(100,"danger");
                browser.storage.local.set({ [request.url]: "danger" });
                listFlag = true;
              }
              else if (domainInArray(domain, whitelist)) {
                browser.storage.local.set({ [request.url]: "safe" });
                tabs[request.tabId] = { state: SAFE_LABEL };
                browser.tabs.query({ currentWindow: true, active: true }, function (tabs) {
                  updateIcon(tabs[0].id);
                });
                listFlag = true;
              }
              if (listFlag == false){
                checkPending(request);
              }
            }
          });
        }
      }, {
        urls: ['<all_urls>'], types: ['main_frame']
      }, ['blocking', 'requestBody']);
  }

  checkSettings().then(function() {
    if (phishingDetectionToggle === true){
      phishingDetection();
    }
  })

  browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.func) {      
      case "popup":
        browser.tabs.query({ currentWindow: true, active: true }, function (tabs) {
          updateIcon(tabs[0].id);
        });
        break;

      case "check":
        checkSettings().then(function() {
          if (phishingDetectionToggle === true){
            browser.tabs.query({ currentWindow: true, active: true }, function (tabs) {
              var tabId = tabs[0].id;
              var tabUrl = tabs[0].url;
              browser.storage.local.get(tabUrl, function(result) {
                const category = result[tabUrl];
                if (category == "safe") {
                  browser.browserAction.setIcon({ path: "/img/tab-icon-safe.png", tabId: tabId });
                  var views = browser.extension.getViews({ type: "popup" });
                  if (views.length > 0) {
                    if (views[0].document.getElementById("statusPhrase")) {
                      views[0].document.getElementById("statusPhrase").textContent = SAFE_LABEL;
                      views[0].document.getElementById("headerBar").style.backgroundColor = SAFE_COLOR;
                      views[0].document.getElementById("headerBar").title = SAFE_TITLE;
                    }
                  }
                }
                else if (category == "danger") {
                  browser.browserAction.setIcon({ path: "/img/tab-icon-dangerous.png", tabId: tabId });
                  var views = browser.extension.getViews({ type: "popup" });
                  if (views.length > 0) {
                    if (views[0].document.getElementById("statusPhrase")) {
                      views[0].document.getElementById("statusPhrase").textContent = DANGEROUS_LABEL;
                      views[0].document.getElementById("headerBar").style.backgroundColor = DANGEROUS_COLOR;
                      views[0].document.getElementById("headerBar").title = DANGEROUS_TITLE;
                    }
                  }
                }
                else if (category == "suspicious") {
                  browser.browserAction.setIcon({ path: "/img/tab-icon-suspicious.png", tabId: tabId });
                  var views = browser.extension.getViews({ type: "popup" });
                  if (views.length > 0) {
                    if (views[0].document.getElementById("statusPhrase")) {
                      views[0].document.getElementById("statusPhrase").textContent = SUSPICIOUS_LABEL;
                      views[0].document.getElementById("headerBar").style.backgroundColor = SUSPICIOUS_COLOR;
                      views[0].document.getElementById("headerBar").title = SUSPICIOUS_TITLE;
                    }
                  }
                }
                else if (category == "pending") {
                  browser.browserAction.setIcon({ path: "/img/tab-icon-pending.png", tabId: tabId });
                  var views = browser.extension.getViews({ type: "popup" });
                  if (views.length > 0) {
                    if (views[0].document.getElementById("statusPhrase")) {
                      views[0].document.getElementById("statusPhrase").textContent = PENDING_LABEL;
                      views[0].document.getElementById("headerBar").style.backgroundColor = PENDING_COLOR;
                      views[0].document.getElementById("headerBar").title = PENDING_TITLE;
                    }
                  }
                }
              });
            });
          }
        })
        
        
        break;

      case "safe":
        browser.tabs.query({ currentWindow: true, active: true }, function (tabs) {
          var tabId = tabs[0].id;
          var tabUrl = tabs[0].url;
          browser.browserAction.setIcon({ path: "/img/tab-icon-safe.png", tabId: tabId });
          var views = browser.extension.getViews({ type: "popup" });
          if (views.length > 0) {
            if (views[0].document.getElementById("statusPhrase")) {
              views[0].document.getElementById("statusPhrase").textContent = SAFE_LABEL;
              views[0].document.getElementById("headerBar").style.backgroundColor = SAFE_COLOR;
              views[0].document.getElementById("headerBar").title = SAFE_TITLE;
            }
          }
          updateTotalStats();
          browser.storage.local.set({ [tabUrl]: "safe" });
        });
        break;

      case "suspicious":
          browser.tabs.query({ currentWindow: true, active: true }, function (tabs) {
            var tabId = tabs[0].id;
            var tabUrl = tabs[0].url;
            browser.browserAction.setIcon({ path: "/img/tab-icon-suspicious.png", tabId: tabId });
            var views = browser.extension.getViews({ type: "popup" });
            if (views.length > 0) {
              if (views[0].document.getElementById("statusPhrase")) {
                views[0].document.getElementById("statusPhrase").textContent = SUSPICIOUS_LABEL;
                views[0].document.getElementById("headerBar").style.backgroundColor = SUSPICIOUS_COLOR;
                views[0].document.getElementById("headerBar").title = SUSPICIOUS_TITLE;
              }
            }
            showNotification(50,"suspicious");
            updateTotalStats();
            updatePhishingStats();
            browser.storage.local.set({ [tabUrl]: "suspicious" });
          });
          
        break;

      case "danger":
        browser.tabs.query({ currentWindow: true, active: true }, function (tabs) {
          var tabId = tabs[0].id;
          var tabUrl = tabs[0].url;
          browser.browserAction.setIcon({ path: "/img/tab-icon-dangerous.png", tabId: tabId });
          var views = browser.extension.getViews({ type: "popup" });
          if (views.length > 0) {
            if (views[0].document.getElementById("statusPhrase")) {
              views[0].document.getElementById("statusPhrase").textContent = DANGEROUS_LABEL;
              views[0].document.getElementById("headerBar").style.backgroundColor = DANGEROUS_COLOR;
              views[0].document.getElementById("headerBar").title = DANGEROUS_TITLE;
            }
          }
          browser.storage.local.set({ [tabUrl]: "danger" });
          updateTotalStats();
          updatePhishingStats();
        });
        showNotification(75,"danger");
        break;

        default:        
    }
  });

  // Function to fetch and store the JSON data from whitelist.json
  function fetchAndStoreData() {
    fetch(browser.runtime.getURL('/assets/whitelist.json')) // Fetch the whitelist.json file
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch whitelist.json');
        }
        return response.text();
      })
      .then(data => {
        const jsonData = JSON.parse(data);
        browser.storage.local.set({ "data": jsonData }, function() {
          console.log("Whitelist stored successfully.");
        });
      })
      .catch(error => {
        console.error("Error fetching whitelist:", error);
      });
  }

  // Check if the whitelist data is already stored
  browser.storage.local.get("data", function(result) {
    if (!result.data) {
      // If data is not already stored, fetch and store it
      fetchAndStoreData();
    }
  });

  function checkBookmark(url, callback) {
    browser.storage.local.get("data", function(result) {
      var jsonData = result.data || []; // Use existing data or an empty array
      if (jsonData.includes(url)){
        callback(true);
      } else {
        callback(false);
      }
    });
  }

  function checkSettings() {

    return new Promise(function(resolve) {
      browser.storage.sync.get(["phishingDetectionToggle"], function(result) {
        if (result.phishingDetectionToggle !== undefined) {
          phishingDetectionToggle = result.phishingDetectionToggle;
        }
        else {
          browser.storage.sync.set({ "phishingDetectionToggle": true });
          phishingDetectionToggle = true;
        }
        resolve();
      });
    });
  }

  function updateIcon(tabId) {

    browser.tabs.query({ currentWindow: true, active: true }, function (tabs) {    

      browser.storage.local.get(tabs[0].url, function(result) {
        
        const category = result[tabs[0].url];

        if (category === "safe") {
          tabs[tabId] = { state: SAFE_LABEL };      
        }
        else if (category === "danger") {
          tabs[tabId] = { state: DANGEROUS_LABEL };
        }
        else if (category === "suspicious") {
          tabs[tabId] = { state: SUSPICIOUS_LABEL };
        }
        else if (category === "pending") {
          tabs[tabId] = { state: PENDING_LABEL };
        }
        else if (category == null || tabs[tabId] == null) {
          tabs[tabId] = { state: UNKNOWN_LABEL };
        }
        
        if (tabs[tabId].state === UNKNOWN_LABEL) {
          browser.browserAction.setIcon({ path: "/img/tab-icon-unknown.png", tabId: tabId });
          updatePopup(UNKNOWN_LABEL, UNKNOWN_COLOR, UNKNOWN_TITLE);
        } else if (tabs[tabId].state === SAFE_LABEL) {
          browser.browserAction.setIcon({ path: "/img/tab-icon-safe.png", tabId: tabId });    
          updatePopup(SAFE_LABEL, SAFE_COLOR, SAFE_TITLE);
        } else if (tabs[tabId].state === PENDING_LABEL) {
          browser.browserAction.setIcon({ path: "/img/tab-icon-pending.png", tabId: tabId });
          updatePopup(PENDING_LABEL, PENDING_COLOR, PENDING_TITLE);
        } else if (tabs[tabId].state === DANGEROUS_LABEL) {
          browser.browserAction.setIcon({ path: "/img/tab-icon-dangerous.png", tabId: tabId });
          updatePopup(DANGEROUS_LABEL, DANGEROUS_COLOR, DANGEROUS_TITLE);
        }
      });
    });
  }

  function updatePopup(text, color, title) {    
    var views = browser.extension.getViews({ type: "popup" });
    if (views.length > 0) {
      if (views[0].document.getElementById("statusPhrase")) {
        views[0].document.getElementById("statusPhrase").textContent = text;
        views[0].document.getElementById("headerBar").style.backgroundColor = color;
        views[0].document.getElementById("headerBar").title = title;
      }
    }
  }

  function getDomainFromURL(url) {
    try {
      return (new URL(url)).hostname.replace(/^www\./, '');
    } catch (e) {
      console.warn(`Attempt to construct URL from invalid input: ${url}`);
    }
  }

  function domainInArray(currentDomain, arr) {
    try {
      return arr.some(function (domain) {
        return currentDomain === domain || currentDomain.endsWith('.' + domain);
      });
    } catch (error) {
      // List not fetched yet
      return false;
    }
  }

  async function checkPending(request) {
    const pending = await updatePendinglists();
    var count = URLInArray(request.url, pending);
    if (count > 0) {
      tabs[request.tabId] = { state: PENDING_LABEL };
      browser.storage.local.set({ [request.url]: "pending" });
      showPendingNotification(count);
    }
    else{
      // Remaining URLs are flagged as  unknown
      tabs[request.tabId] = { state: UNKNOWN_LABEL };
      browser.storage.local.set({ [request.url]: "unknown" });
    }
  }

  function URLInArray(currentURL, arr) {
    var count = 0;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === currentURL) {
        count += 1;
      }
    }
    return count;
  }

  function showNotification(percent,type) {
    var TITLE, ICON;
    if(type == "danger") {
      TITLE = "PHISHING SITE DETECTED!!!";
      ICON = "/img/tab-icon-dangerous.png";
    }
    else if (type == "suspicious"){
      TITLE = "SUSPICIOUS SITE DETECTED!!!";
      ICON = "/img/tab-icon-suspicious.png";
    }
    browser.notifications.create({

      type: "progress",
      title: TITLE,
      message: "WARNING, browse website with care!",
      iconUrl: ICON,
      progress: percent
    });
  }

  function showPendingNotification(msg) {
    var text = "";
    if (msg === 1) {
      text = "Report count: " + msg;
    }
    else {
      text = "Report counts: " + msg;
    }
    browser.notifications.create({
      type: "basic",
      title: "THIS URL HAS BEEN REPORTED!!!",
      message: text,
      iconUrl: "/img/tab-icon-pending.png"
    });
  }

  browser.tabs.onCreated.addListener(function (tab) {
    checkSettings().then(function() {
      if (phishingDetectionToggle === true){
        updateIcon(tab.id);
      }
    })
  });

  browser.tabs.onActivated.addListener(function (tab) {
    checkSettings().then(function() {
      if (phishingDetectionToggle === true){
        updateIcon(tab.id);
      }
    })
  });

  browser.tabs.onUpdated.addListener(function (tabId, changeInfo) {
    checkSettings().then(function() {
      if (phishingDetectionToggle === true){
        updateIcon(tabId);
      }
    })
  });

  function getVersion() {
    var details = browser.runtime.getManifest();
    return details.version;
  }
  
  function updatePhishingStats() {
    let statsID;
  
    // Retrieve the stored stats from the browser storage
    browser.storage.sync.get("statsID", function(result) {
      if (result.statsID !== undefined) {
        statsID = result.statsID;
      } 
      else {
        statsID = 0;
      }
  
      // Increment the Stats ID
      statsID++;
  
      // Update the stats in the browser storage
      browser.storage.sync.set({"statsID": statsID});
  
      console.log("Phishing detection stats updated!");
    });
  }
  
  function updateTotalStats() {
    let totalStatsID;
  
    // Retrieve the stored stats from the browser storage
    browser.storage.sync.get("totalStatsID", function(result) {
      if (result.totalStatsID !== undefined) {
        totalStatsID = result.totalStatsID;
      } 
      else {
        totalStatsID = 0;
      }
  
      // Increment the Stats ID
      totalStatsID++;
  
      // Update the stats in the browser storage
      browser.storage.sync.set({"totalStatsID": totalStatsID});
  
      console.log("Phishing detection stats updated!");
    });
  }
  
});

function checkOnline() {

  return new Promise(function(resolve) {
    browser.storage.sync.get(["onlineListsToggle"], function(result) {
      if (result.onlineListsToggle !== undefined) {
        onlineListsToggle = result.onlineListsToggle;
      }
      else {
        browser.storage.sync.set({ "onlineListsToggle": false });
        onlineListsToggle = false;
      }
      resolve();
    });
  });
}
