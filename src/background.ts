// Opens the side panel when the toolbar icon is clicked. The click is also what grants
// activeTab, which lets the panel read that one tab's URL to get the company domain.

chrome.action.onClicked.addListener((tab) => {
  if (tab.windowId === undefined) return;
  void chrome.sidePanel.open({ windowId: tab.windowId }).then(() => {
    // Tell an already open panel to read the tab again. No receiver yet is fine.
    chrome.runtime.sendMessage({ type: "looot:tab-granted" }).catch(() => undefined);
  });
});
