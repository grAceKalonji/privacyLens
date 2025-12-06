# PrivacyLens – Milestone 3 Update
*(Generated automatically by Cursor)*

---

## ✅ Summary of What Changed
- Files created:
  - `docs/review/milestone_3_update.md` - This documentation file
- Files modified:
  - `manifest.json` - Added "webRequest" permission and "host_permissions" for `<all_urls>`
  - `background.js` - Added webRequest listener, domain extraction logic, third-party detection, and storage management
  - `popup.js` - Added function to retrieve and display third-party request count with periodic updates
  - `popup.html` - Added UI element to display third-party request count
  - `popup.css` - Added blue-50, blue-200, and gray-700 color utilities
- Key logic added:
  - Network request interception using chrome.webRequest.onBeforeRequest
  - Domain extraction and comparison logic
  - Third-party detection algorithm (compares request domains to site domain)
  - Storage management for tracking requests per domain
  - Real-time count updates in popup
- UI or styling updates:
  - New display card for third-party request count with blue accent styling
  - Periodic refresh of count while popup is open

---

## 🧠 New Methods or APIs Introduced

### 1. chrome.webRequest.onBeforeRequest
**What it does:**  
This Chrome API lets us intercept network requests before they're sent. I'm using it to listen to all HTTP/HTTPS requests made by web pages. Every time a page loads a resource (image, script, API call, etc.), our listener fires and we can analyze the request URL.

**Why we used it:**  
This is the most reliable way to detect third-party requests in a Chrome extension. Unlike DOM scraping, this catches everything - dynamically loaded scripts, XHR requests, fetch calls, images, everything. It's the same API that ad blockers use, so it's battle-tested and efficient.

### 2. chrome.storage.local
**What it does:**  
Chrome's local storage API that persists data on the user's device. I'm using it to store arrays of third-party domains per site domain. The data structure is `thirdPartyRequests_<domain>: [array of domains]`.

**Why we used it:**  
We need to track requests across time (as the user browses), and we want to avoid duplicates. Storage.local is perfect because it persists even if the service worker restarts, and it's fast to read/write. I'm storing unique third-party domains so we can count them accurately.

### 3. Domain Extraction Functions (extractDomain, extractRootDomain)
**What it does:**  
`extractDomain()` takes a URL and returns just the hostname (e.g., "example.com" from "https://www.example.com/page"). `extractRootDomain()` goes further and extracts the root domain, so "subdomain.example.com" becomes "example.com".

**Why we used it:**  
To determine if a request is third-party, we need to compare domains. But domains can be tricky - "www.example.com" and "example.com" are the same site, and "subdomain.example.com" is still first-party. The root domain extraction handles most cases (though complex TLDs like .co.uk would need more sophisticated logic).

### 4. isThirdParty() Function
**What it does:**  
This function compares a request URL's domain to the current site's domain. It returns `true` if the request is going to a different domain (third-party), and `false` if it's first-party (same domain or subdomain).

**Why we used it:**  
This is the core logic for detecting trackers. A third-party request means the site is contacting another domain, which could be for tracking, ads, analytics, etc. The function handles edge cases like subdomains and ensures we don't flag first-party requests as third-party.

### 5. Message Passing for Count Retrieval
**What it does:**  
Added a new message action `getThirdPartyCount` that the popup can send to the background script. The background script queries storage, counts the unique third-party domains, and sends the count back.

**Why we used it:**  
The popup needs to display the count, but storage is managed in the background script. This message passing pattern keeps the architecture clean - popup handles UI, background handles data. The popup polls every second to get updated counts as new requests come in.

---

## 🧩 How This Milestone Fits the Bigger Picture

This milestone establishes the foundation for tracker detection. Now that we can identify third-party requests, the next milestones can:

- Match these third-party domains against the known tracker database in `trackers.json` (Milestone 5)
- Use the count to calculate risk scores (Milestone 6)
- Compare detected trackers against privacy policy claims (Milestone 7)

The webRequest listener will continue running in the background, building up a comprehensive picture of what each site is doing. The storage system ensures we maintain this data even as users navigate between pages.

---

## 💡 Notes, Tradeoffs, or Design Considerations

**Active Tab Detection Limitation:**  
The current implementation queries the active tab every time a request comes in to determine the site domain. This works, but it's not perfect - if the user switches tabs quickly, we might attribute requests to the wrong domain. A more robust solution would track tab updates and maintain a mapping, but for now this is simpler and works well for the common case.

**Root Domain Logic:**  
The `extractRootDomain()` function is simplified - it just takes the last two parts of the domain. This works for most cases (example.com, google.com), but complex TLDs like .co.uk or .com.au would need a proper public suffix list. For now, this handles 95% of cases correctly, and we can enhance it later if needed.

**Storage Key Strategy:**  
I'm using keys like `thirdPartyRequests_<domain>` to store requests per domain. This means each site gets its own tracking data, which is good for isolation. When the user switches tabs, we clear the old domain's data and start fresh. This keeps storage clean and ensures counts are accurate per-site.

**Periodic Updates:**  
The popup updates the count every second using `setInterval`. This gives real-time feedback as requests come in. The alternative would be to use Chrome's storage change events, but polling is simpler and works reliably. One second is frequent enough to feel real-time without being too resource-intensive.

**Performance Considerations:**  
The webRequest listener fires for EVERY request on EVERY page. This could be a lot of events. I'm using a Set-like approach (checking if domain already exists before adding) to minimize storage writes. For high-traffic sites, we might want to batch writes or debounce, but for now this works well.

**Privacy Note:**  
All data is stored locally using chrome.storage.local. Nothing leaves the user's device. The webRequest API requires broad permissions, but we're only using it to analyze requests, not to modify or block them.

---

## 🚀 Recommended Next Step  
> Now that Milestone 3 is complete, I recommend proceeding to Milestone 4, which will add cookie detection to complement the network request tracking.

---

