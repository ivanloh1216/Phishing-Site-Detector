const browser = window.msBrowser || window.browser || window.chrome;

browser.runtime.sendMessage({ func: "check" });