const browser = window.msBrowser || window.browser || window.chrome;
const updateButton = document.querySelector("#bookmarkBtn");

browser.runtime.sendMessage({ func: "check" });

// Function to disable the update button
function disableUpdateButton() {
  updateButton.disabled = true;
}

// Function to update the popup content
function updatePopupContent(data) {
  const popupContent = document.querySelector("#popupContent");
  popupContent.innerHTML = "";

  data.forEach(function(item) {
    const listItem = document.createElement("li");
    listItem.style.display = "flex";
    listItem.style.width = "270px";
    listItem.style.marginBottom = "10px";

    const itemText = document.createElement("a");
    itemText.textContent = item;
    itemText.style.flexGrow = 1;
    itemText.style.cursor = "pointer";
    itemText.addEventListener("click", function(event) {
      event.preventDefault();
      const urlWithoutPrefix = item.replace(/^https?:\/\//, '');
      browser.tabs.update({ url: "http://"+urlWithoutPrefix });
    });

    const removeButton = document.createElement("img");
    removeButton.setAttribute("src", "/img/delete-icon.png");
    removeButton.setAttribute("height", 20);
    removeButton.setAttribute("width", 20);
    removeButton.style.marginRight = "10px";
    removeButton.style.cursor = "pointer";
    removeButton.addEventListener("click", function() {
      removeData(item);
    });

    listItem.appendChild(removeButton);
    listItem.appendChild(itemText);
    popupContent.appendChild(listItem);
  });

  // Update the button state
  browser.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const url = tabs[0].url;
    const isDisabled = data.includes(url);
    updateButton.disabled = isDisabled;
  });
}

// Function to remove data from storage
function removeData(data) {
  browser.storage.local.get("data", function(result) {
    const existingData = result.data || []; // Use existing data or an empty array

    const filteredData = existingData.filter(function(item) {
      return item !== data;
    });

    browser.storage.local.set({ "data": filteredData }, function() {
      console.log("Data removed successfully.");
      updatePopupContent(filteredData);
    });
  });
}

// Function to fetch and store the JSON data from whitelist.json
function fetchAndStoreData() {
  fetch(browser.runtime.getURL("/assets/whitelist.json"))
    .then(response => {
      if (!response.ok) {
        throw new Error("Failed to fetch whitelist.json");
      }
      return response.json();
    })
    .then(data => {
      browser.storage.local.set({ "data": data }, function() {
        console.log("Whitelist stored successfully.");
        updatePopupContent(data);
      });
    })
    .catch(error => {
      console.error("Error fetching whitelist:", error);
    });
}

// Retrieve and display the JSON data when the popup is opened
document.addEventListener("DOMContentLoaded", function() {
  browser.storage.local.get("data", function(result) {
    const jsonData = result.data || []; // Use existing data or an empty array
    if (jsonData.length > 0) {
      updatePopupContent(jsonData);
    } else {
      fetchAndStoreData();
    }
  });
});

// Event listener for the update button
updateButton.addEventListener("click", function() {
  browser.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const url = tabs[0].url;
    browser.storage.local.get("data", function(result) {
      const existingData = result.data || [];

      if (!existingData.includes(url)) {
        existingData.push(url);
        browser.storage.local.set({ "data": existingData }, function() {
          console.log("Data updated successfully.");
          updatePopupContent(existingData);
        });
      }
    });
  });
});
