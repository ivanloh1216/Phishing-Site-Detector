const browser = window.msBrowser || window.browser || window.chrome;

browser.runtime.sendMessage({ func: "check" });

const CHECKURLPATH = "https://ivanloh.pythonanywhere.com/check-url";
const CHECKCONTENTPATH = "https://ivanloh.pythonanywhere.com/check-js";
const REPORTURLPATH = "https://ivanloh.pythonanywhere.com/report-url";

// For localhost :-
// const CHECKURLPATH = "http://localhost:8080/check-url";
// const CHECKCONTENTPATH = "http://localhost:8080/check-js";
// const REPORTURLPATH = "http://localhost:8080/report-url";

document.addEventListener('DOMContentLoaded', function() {
  var checkPhishing = document.getElementById('checkPhishing');
  var responseContainer = document.getElementById('responseContainer');

  checkPhishing.addEventListener('click', function() {
    var phishingURLTogglePromise = new Promise(function(resolve, reject) {
      browser.storage.sync.get("phishingURLToggle", function(result) {
        if (result.phishingURLToggle !== undefined) {
          resolve(result.phishingURLToggle);
        } else {
          browser.storage.sync.set({ "phishingURLToggle": true });
          resolve(true);
        }
      });
    });
  
    var phishingContentTogglePromise = new Promise(function(resolve, reject) {
      browser.storage.sync.get("phishingContentToggle", function(result) {
        if (result.phishingContentToggle !== undefined) {
          resolve(result.phishingContentToggle);
        } else {
          browser.storage.sync.set({ "phishingContentToggle": true });
          resolve(true);
        }
      });
    });
  
    Promise.all([phishingURLTogglePromise, phishingContentTogglePromise]).then(function(values) {
      var phishingURLToggle = values[0];
      var phishingContentToggle = values[1];
  
      if (phishingURLToggle === true && phishingContentToggle === false) {
        checkURL();
      }
      else if (phishingURLToggle === false && phishingContentToggle === true) {
        checkContent();
      }
      else if (phishingURLToggle === true && phishingContentToggle === true) {
        checkBoth();
      }
      else if (phishingURLToggle === false && phishingContentToggle === false) {
        alert("Both URL and Content Detection are toggled off!");
      }
    });
  });
  
  var reportPhishing = document.getElementById('reportPhishing');
  var reportStatus = document.getElementById('reportStatus');

  reportPhishing.addEventListener('click', function() {
    browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
      var url = tabs[0].url;
      var xhr = new XMLHttpRequest();

      xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          if (xhr.status === 200) {
            reportStatus.innerText = xhr.responseText;
            reportStatus.style = "color:green";
            updateReportStats(url);
          } else {
            reportStatus.innerText = 'Error occurred while making the request.';
            reportStatus.style = "color:red";
          }
        }        
      };
      xhr.open('POST', REPORTURLPATH, true);  // Update with the appropriate URL of the Flask app
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify({url: url}));

    });
  });
});

function checkURL() {
  var phishing;

  browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var url = tabs[0].url;
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status === 200) {
          // responseContainer.innerText = xhr.responseText;
          phishing = xhr.responseText.toString();
        } else {
          responseContainer.innerText = 'Error occurred while checking URL!';
          responseContainer.style = "color:red";
        }
      }
      if (phishing == '1') {  
        browser.runtime.sendMessage({ func: "danger" });
      }
      if (phishing == '0') { 
        browser.runtime.sendMessage({ func: "safe" });
      }
    };
    xhr.open('POST', CHECKURLPATH, true);  // Update with the appropriate URL of the Flask app
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({url: url}));
  });
}

function checkContent() {
  browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var url = tabs[0].url;
    var xhr = new XMLHttpRequest();
    var phishing;
    xhr.onreadystatechange = function () {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status === 200) {
          // responseContainer.innerText = xhr.responseText;
          phishing = xhr.responseText.toString();
        } else {
          responseContainer.innerText = 'Error occurred while checking page content!';
          responseContainer.style = "color:red";
        }
      }
      if (phishing == '1') {  
        browser.runtime.sendMessage({ func: "danger" });
      }
      if (phishing == '0') { 
        browser.runtime.sendMessage({ func: "safe" });   
      }
    };
    xhr.open('POST', CHECKCONTENTPATH, true);  // Update with the appropriate URL of the Flask app
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({url: url}));
  });
}

function checkBoth() {
  var urlFlag = new Promise(function(resolve, reject) {
    browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
      var url = tabs[0].url;
      var xhr = new XMLHttpRequest();
      var phishing;
      xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          if (xhr.status === 200) {
            // responseContainer.innerText = xhr.responseText;
            phishing = xhr.responseText.toString();
          } else {
            responseContainer.innerText = 'Error occurred while checking URL!';
            responseContainer.style = "color:red";
          }
        }
        if (phishing == '1') {  
          resolve(true);
        }
        if (phishing == '0') { 
          resolve(false);
        }
      };
      xhr.open('POST', CHECKURLPATH, true);  // Update with the appropriate URL of the Flask app
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify({url: url}));
    });
  });

  var contentFlag = new Promise(function(resolve, reject) {
    browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
      var url = tabs[0].url;
      var xhr = new XMLHttpRequest();
      var phishing;
      xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          if (xhr.status === 200) {
            // responseContainer.innerText = xhr.responseText;
            phishing = xhr.responseText.toString();
          } else {
            responseContainer.innerText = 'Error occurred while checking page content!';
            responseContainer.style = "color:red";
          }
        }
        if (phishing == '1') {  
          resolve(true);
        }
        if (phishing == '0') { 
          resolve(false);
        }
      };
      xhr.open('POST', CHECKCONTENTPATH, true);  // Update with the appropriate URL of the Flask app
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify({url: url}));
    });
  });
  
  Promise.all([urlFlag, contentFlag]).then(function(values) {
    var urlResult = values[0];
    var contentResult = values[1];

    if (urlResult === true && contentResult === true) {
      browser.runtime.sendMessage({ func: "danger" }); 
    }
    else if (urlResult === true && contentResult === false) {
      browser.runtime.sendMessage({ func: "suspicious"})
    }
    else if (urlResult === false && contentResult === true) {
      browser.runtime.sendMessage({ func: "suspicious"})
    }
    else if (urlResult === false && contentResult === false) {
      browser.runtime.sendMessage({ func: "safe" }); 
    }
  });
}

function updateReportStats(url) {
  let reportStats = [];
  let reportID;

  // Retrieve the report stats from the browser storage
  browser.storage.sync.get(["reportID", "reportStats"], function(result) {
    if (result.reportID !== undefined) {
      reportID = result.reportID;
    } 
    else {
      reportID = 0;
    }
    if (result.reportStats !== undefined) {
      reportStats = result.reportStats;
    }
    // Increment the Report ID
    reportID++;

    // Get the current timestamp
    const timestamp = new Date().getTime();

    // Push the new report to the stats
    reportStats.push({ reportID: reportID, url: url, timestamp: timestamp });

    // Update the stats in the browser storage
    browser.storage.sync.set({ "reportID": reportID, "reportStats": reportStats });

    console.log("Report stats updated!");
  });
}
