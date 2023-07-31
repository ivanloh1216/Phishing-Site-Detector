const browser = window.msBrowser || window.browser || window.chrome;

browser.runtime.sendMessage({ func: "check" });

// Retrieve stats when stats page is loaded
document.addEventListener("DOMContentLoaded", function() {
    let totalStatsContent = document.getElementById("totalStatsContent");
    browser.storage.sync.get("totalStatsID", function(result) {
      const stats = result.totalStatsID || []; // Use existing data or an empty array
      if (stats > 0) {
        totalStatsContent.innerText = "Total URLs checked: " + stats;
      } 
      else {
        totalStatsContent.innerText = "No URLs checked yet, gotta start checking URL bro! ";
      }
    });

    let phishingStatsContent = document.getElementById("phishingStatsContent");
    browser.storage.sync.get("statsID", function(result) {
      const stats = result.statsID || []; // Use existing data or an empty array
      if (stats > 0) {
        phishingStatsContent.innerText = "Total Phishing URLs detected: " + stats;
      } 
      else {
        phishingStatsContent.innerText = "No phishing URLs detected yet, lucky! ";
      }
    });

    let safeStatsContent = document.getElementById("safeStatsContent");
    browser.storage.sync.get(["totalStatsID", "statsID"], function(result) {
      const totalStatsID = result.totalStatsID || 0;
      const statsID = result.statsID || 0;
      const safeCount = totalStatsID - statsID;
      safeStatsContent.innerText = "Total Safe URLs detected: " + safeCount;
    });

    let phishingStatsPercent = document.getElementById("phishingStatsPercent");
    browser.storage.sync.get(["totalStatsID", "statsID"], function(result) {
    const totalStatsID = result.totalStatsID || 0;
    const statsID = result.statsID || 0;
    const phishPercent = totalStatsID !== 0 ? ((statsID / totalStatsID) * 100).toFixed(2) : 0;
    phishingStatsPercent.innerText = "Phishing URLs Percentage: " + phishPercent + " %";
    });

    let safeStatsPercent = document.getElementById("safeStatsPercent");
    browser.storage.sync.get(["totalStatsID", "statsID"], function(result) {
    const totalStatsID = result.totalStatsID || 0;
    const statsID = result.statsID || 0;
    const safePercent = totalStatsID !== 0 ? (((totalStatsID - statsID) / totalStatsID) * 100).toFixed(2) : 0;
    safeStatsPercent.innerText = "Safe URLs Percentage: " + safePercent + " %";
    });

    // Bookmarked URLs
    let bookmarkStats = document.getElementById("bookmarkStats");
    browser.storage.local.get("data", function(result) {
        const jsonData = result.data || []; // Use existing data or an empty array
        if (jsonData.length > 0) {
            bookmarkStats.innerHTML = "<a href='bookmarks.html'><div id='bookmarkStats'>" + "Total bookmarked URLs: " + jsonData.length + "</div></a>";
        } 
        else {
            bookmarkStats.innerText = "No bookmarks added, boooooo!!!!!";
        }
    });

    // Reported URLs Stats
    let reportStats = document.getElementById("reportStats");
    browser.storage.sync.get("reportStats", function(result) {
      const stats = result.reportStats || []; // Use existing data or an empty array
      if (stats.length > 0) {
        reportStats.innerText = "Total URLs reported: " + stats.length;
        reportStats.addEventListener('click', function(event) {
            event.preventDefault();
            browser.tabs.create({ url: 'reportStats.html' });
        });
      } 
      else {
        reportStats.innerText = "Total URLs reported: 0, lucky or lazy??";
      }
    });
});