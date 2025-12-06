# PrivacyLens – Milestone 6 Update
*(Generated automatically by Cursor)*

---

## ✅ Summary of What Changed
- Files created:
  - `content.js` - Content script for extracting text from privacy policy pages
  - `docs/review/milestone_6_update.md` - This documentation file
- Files modified:
  - `manifest.json` - Added content_scripts configuration to inject content.js into all pages
  - `background.js` - Added privacy policy detection, text extraction, Hugging Face API integration, and fallback keyword analysis
  - `popup.js` - Added privacy policy analysis functionality with UI state management
  - `popup.html` - Added "Analyze Privacy Policy" button, loading states, error display, and expandable results sections
  - `popup.css` - Added green, red color utilities and list styles for analysis results
- Key logic added:
  - Privacy policy URL detection using common paths and page link searching
  - Text extraction from HTML pages (both via content script and regex-based fallback)
  - Hugging Face API integration with error handling
  - Fallback keyword-based analysis when API key is not configured
  - Result caching to avoid repeated API calls
  - Expandable UI sections for displaying analysis results
- UI or styling updates:
  - New "Analyze Privacy Policy" button with green accent
  - Loading state indicator
  - Error message display area
  - Expandable details sections for each analysis category
  - Disclaimer about external AI service usage

---

## 🧠 New Methods or APIs Introduced

### 1. Content Scripts (content.js)
**What it does:**  
Content scripts are JavaScript files that run in the context of web pages. Our `content.js` is injected into every page and listens for messages from the background script. When asked to extract text, it finds the main content area (using selectors like `main`, `article`, `[role="main"]`), removes navigation/header/footer elements, and extracts clean text.

**Why we used it:**  
Privacy policies are HTML pages, and we need to extract just the meaningful text content, not the navigation, ads, or other page chrome. Content scripts have access to the page's DOM, so they can intelligently find and extract the main content. This is much better than just fetching the raw HTML and trying to parse it in the service worker (which doesn't have DOM APIs).

### 2. chrome.scripting.executeScript()
**What it does:**  
This Chrome API lets us execute JavaScript functions in the context of a web page. I'm using it to search for privacy policy links in the page's footer or navigation. The function runs in the page context, so it has access to the DOM.

**Why we used it:**  
Some sites don't use standard privacy policy URLs. Instead, they have links in the footer. By executing a script in the page context, we can search for these links and extract their URLs. This makes our privacy policy detection more robust.

### 3. Privacy Policy URL Detection (findPrivacyPolicyUrl)
**What it does:**  
This function tries multiple strategies to find a privacy policy:
1. Tries common paths like `/privacy`, `/privacy-policy`, `/terms-of-service`
2. Searches the current page for links containing "privacy" or "terms"
3. Constructs URLs by combining the base domain with common paths

**Why we used it:**  
There's no standard location for privacy policies. Different sites put them in different places. By trying multiple strategies, we maximize our chances of finding the policy. The function tries the most common paths first (fast), then falls back to searching the page (slower but more thorough).

### 4. Hugging Face Inference API Integration
**What it does:**  
The Hugging Face Inference API lets us call pre-trained AI models over HTTP. I'm using the `facebook/bart-large-cnn` model, which is designed for text summarization. We send the privacy policy text and get back an analysis.

**Why we used it:**  
Privacy policies are long, legal documents that are hard for users to parse. AI can quickly identify key information like what data is collected, who it's shared with, and what user rights exist. Hugging Face provides a free tier (1000 requests/month), making it accessible for this project.

### 5. Fallback Keyword Analysis
**What it does:**  
If the Hugging Face API key isn't configured or the API fails, we fall back to a simple keyword-based analysis. The functions `extractDataTypes()`, `extractThirdPartySharing()`, etc. search the text for relevant keywords and return structured information.

**Why we used it:**  
Not all users will want to set up a Hugging Face API key. The fallback ensures the feature still works, even if it's less sophisticated. It's better to show basic analysis than to show nothing. The keyword extraction is simple but can still identify common patterns in privacy policies.

### 6. Result Caching
**What it does:**  
Analysis results are stored in `chrome.storage.local` with a key like `policyAnalysis_<domain>`. Before analyzing, we check if we already have results for this domain. If so, we return the cached results instead of calling the API again.

**Why we used it:**  
Privacy policies don't change frequently, so there's no need to re-analyze them every time. Caching saves API calls (important for free tier limits) and provides instant results for sites the user has already analyzed. The cache is per-domain, so different sites get fresh analysis.

### 7. Expandable Details Sections
**What it does:**  
The analysis results are displayed in HTML `<details>` elements, which are native expandable/collapsible sections. Each category (Data Collected, Third-Party Sharing, etc.) is in its own details element.

**Why we used it:**  
Analysis results can be long, and users might only care about specific sections. Using details elements keeps the UI clean by default (collapsed) but allows users to expand what they're interested in. It's a native HTML feature, so no JavaScript is needed for the expand/collapse behavior.

---

## 🧩 How This Milestone Fits the Bigger Picture

Privacy policy analysis complements the technical tracking detection we've built. Now PrivacyLens provides:
- Technical detection: What trackers and cookies are actually being used (Milestones 3-5)
- Policy analysis: What the privacy policy claims (Milestone 6)

In future milestones:
- We can compare detected trackers against policy claims (Milestone 8)
- Risk scoring can factor in policy analysis results (Milestone 7)
- The educational panel can explain policy findings (Milestone 9)

The AI analysis makes privacy policies accessible to regular users who might not have the time or legal knowledge to read through lengthy documents.

---

## 💡 Notes, Tradeoffs, or Design Considerations

**API Key Management:**  
Currently, users need to manually set their Hugging Face API key in chrome.storage.local (via browser console or a settings page we haven't built yet). In a production version, we'd want a proper settings UI. For now, the fallback keyword analysis ensures the feature works without an API key.

**Text Extraction Limitations:**  
The content script tries to find main content areas, but some sites have unusual HTML structures. The regex-based fallback in the service worker is less sophisticated but works as a backup. For very complex pages, we might miss some content or include navigation text.

**Model Choice:**  
I'm using `facebook/bart-large-cnn` which is a summarization model. For better analysis, we might want to use a model specifically trained for legal document analysis or use a text generation model with a custom prompt. The current implementation is a starting point that can be improved.

**Token Limits:**  
Hugging Face models have token limits (typically 1024-4096 tokens). Privacy policies can be very long (10,000+ words). I'm truncating to ~4000 tokens (16,000 characters), which means we might miss information from longer policies. A production version might want to split long policies into chunks and analyze them separately.

**Error Handling:**  
The implementation handles several error cases:
- Privacy policy not found → Shows helpful message
- API key not configured → Falls back to keyword analysis
- API rate limits → Shows error message
- Network failures → Shows error message
- Text extraction failures → Shows error message

This ensures the feature degrades gracefully rather than breaking completely.

**Caching Strategy:**  
Results are cached indefinitely per domain. In a production version, we might want to:
- Add expiration (e.g., cache for 7 days)
- Allow users to refresh/clear cache
- Show when results were last updated

**Privacy of Policy Text:**  
The privacy policy text is sent to Hugging Face's servers for analysis. This is disclosed in the UI disclaimer. Users who are privacy-conscious might prefer the keyword-based fallback, which doesn't send data externally.

**Content Script Injection:**  
The content script is injected into all pages (`<all_urls>`). This is necessary because we don't know which pages are privacy policies until we try to analyze them. The script is lightweight and only activates when we send it a message, so it shouldn't impact page performance.

---

## 🚀 Recommended Next Step  
> Now that Milestone 6 is complete, I recommend proceeding to Milestone 7, which will add a visual risk indicator based on the tracking and analysis data we've collected.

---

