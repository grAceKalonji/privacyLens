# PrivacyLens – Milestone 4 Update
*(Generated automatically by Cursor)*

---

## ✅ Summary of What Changed
- Files created:
  - `docs/review/milestone_4_update.md` - This documentation file
- Files modified:
  - `manifest.json` - Added "cookies" permission
  - `background.js` - Added cookie detection functions, cookie metadata storage, and message handler for cookie requests
  - `popup.js` - Added functions to retrieve and display cookie count with periodic updates
  - `popup.html` - Added UI element to display cookie count
  - `popup.css` - Added purple-50 and purple-200 color utilities for cookie display
- Key logic added:
  - Cookie retrieval using chrome.cookies.getAll API
  - Domain-based cookie filtering to ensure accuracy
  - Cookie metadata storage (name, domain, path, security flags, expiration)
  - Real-time cookie count display in popup
- UI or styling updates:
  - New display card for cookie count with purple accent styling
  - Periodic refresh of cookie count while popup is open

---

## 🧠 New Methods or APIs Introduced

### 1. chrome.cookies.getAll()
**What it does:**  
This Chrome API retrieves all cookies that match a given domain. When you pass `{ domain: "example.com" }`, it returns all cookies for that exact domain and any of its subdomains. The API returns an array of cookie objects with properties like name, value, domain, path, secure flag, httpOnly flag, expiration date, etc.

**Why we used it:**  
This is the standard way to access cookies in a Chrome extension. Unlike trying to read cookies from JavaScript (which is blocked by security policies), this API gives us full access to all cookies for a domain. We can see cookies that are httpOnly (not accessible via JavaScript) and get metadata about cookie security settings.

### 2. Cookie Domain Matching Logic
**What it does:**  
The `getCookiesForDomain()` function retrieves cookies and then filters them to ensure we only count cookies that actually belong to the current site. Chrome's API can sometimes return cookies from related domains, so I added filtering logic that compares root domains to ensure accuracy.

**Why we used it:**  
Cookie domains can be tricky - a cookie set for ".example.com" applies to example.com and all subdomains. When we query for "www.example.com", we might get cookies for both "www.example.com" and ".example.com". The filtering ensures we only count cookies that are actually associated with the site the user is viewing, not unrelated cookies that might match the domain pattern.

### 3. Cookie Metadata Storage
**What it does:**  
The `storeCookieMetadata()` function extracts important information from each cookie and stores it in chrome.storage.local. It stores: name, domain, path, secure flag, httpOnly flag, sameSite policy, expiration date, and whether it's a session cookie.

**Why we used it:**  
The PRD requires storing cookie metadata. This gives us a snapshot of what cookies exist for each domain, which we can use later for analysis. We store it per-domain (like `cookies_<domain>`) so each site's cookies are isolated. The metadata doesn't include cookie values (which could be sensitive), just the structural information.

### 4. Root Domain Extraction for Cookies
**What it does:**  
I'm reusing the `extractRootDomain()` function from Milestone 3, but applying it to cookie filtering. It helps determine if a cookie's domain matches the current site's domain, even if one is a subdomain.

**Why we used it:**  
Cookies can be set for different levels of a domain. A cookie for ".example.com" applies to example.com, www.example.com, and any other subdomain. When viewing "www.example.com", we want to count cookies for both "www.example.com" and ".example.com", but not cookies for "other-example.com". Root domain extraction helps us make this distinction.

---

## 🧩 How This Milestone Fits the Bigger Picture

Cookie detection complements the network request tracking from Milestone 3. Together, they give us a complete picture of what a site is doing:

- Network requests show what external domains are being contacted
- Cookies show what data is being stored locally

In future milestones:
- We can analyze cookie metadata to identify tracking cookies (Milestone 5)
- Cookie count will factor into risk score calculations (Milestone 6)
- We can compare cookie practices against privacy policy claims (Milestone 7)

The cookie metadata we're storing now will be valuable for these analyses, especially flags like httpOnly and secure, which indicate how cookies are being used.

---

## 💡 Notes, Tradeoffs, or Design Considerations

**Cookie Domain Matching Complexity:**  
Chrome's cookie API is powerful but can be confusing. When you query for "example.com", you get cookies for that domain AND cookies set for ".example.com" (which applies to all subdomains). I added filtering to ensure we only count relevant cookies, but this logic could be enhanced to handle edge cases like country-code TLDs (.co.uk) or complex domain structures.

**Privacy of Cookie Values:**  
I'm intentionally NOT storing cookie values in the metadata - only structural information (name, domain, flags, etc.). Cookie values can contain sensitive data, and there's no need to store them for our analysis. We can identify tracking behavior from cookie names and metadata alone.

**Session vs Persistent Cookies:**  
The metadata includes whether a cookie is a session cookie (deleted when browser closes) or persistent (has an expiration date). Session cookies are often used for temporary tracking, while persistent cookies can track users across sessions. This distinction could be useful for risk scoring later.

**Cookie Count Updates:**  
Like the third-party request count, the cookie count updates every second while the popup is open. This gives real-time feedback, but cookies don't change as frequently as network requests, so the updates might seem redundant. However, it ensures consistency with the request count display and handles cases where cookies are added/removed dynamically.

**Performance Considerations:**  
Querying cookies is fast, but if a site has hundreds of cookies, the filtering and storage operations could add up. For most sites, this won't be an issue, but very cookie-heavy sites might see a slight delay. The storage is per-domain, so we're not accumulating data indefinitely.

**Security Flags Analysis:**  
The metadata we're storing includes security flags (secure, httpOnly, sameSite). These flags indicate how cookies are protected:
- `secure`: Only sent over HTTPS
- `httpOnly`: Not accessible via JavaScript (protects against XSS)
- `sameSite`: Controls cross-site cookie sending

Cookies without these flags (especially without `secure` on HTTPS sites) could be a privacy/security concern, which we might highlight in future milestones.

---

## 🚀 Recommended Next Step  
> Now that Milestone 4 is complete, I recommend proceeding to Milestone 5, which will match detected third-party domains and cookies against the known tracker database in trackers.json.

---

