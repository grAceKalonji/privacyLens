Overview
PrivacyLens is a Chrome extension (Manifest V3) that analyzes a website for third-party trackers, cookies, and potential privacy risks.
It displays:
A clear risk score (low/medium/high)
A visual risk indicator
A list of trackers
Simple educational explanations
All analysis runs locally. No external servers.
This PRD is broken into small milestones that Cursor can complete one at a time without losing context.

Global Rule (Applies to ALL Milestones)
After completing ANY milestone, Cursor MUST generate a documentation Markdown file named:
docs/review/ milestone_X_update.md
Where X = milestone number.
Required Contents of Documentation File:
Cursor must include:
1. Summary of All Changes Made
New files created
Existing files modified
Deleted files (if any)
Functions added
Important logic flows
2. Method & API Explanations (Casual but Technical Tone)
Cursor must explain any new:
Chrome API it used
Helper functions it created
Utility methods
Parsing logic
Tailwind components used
Tone guidance:
Semi-technical
Easy to understand
Jargon included but explained plainly
Should feel like a helpful engineer walking you through the work
3. Why the Changes Were Necessary
Explain the reasoning behind design choices:
“I did X because Chrome MV3 requires…”
“This approach avoids context bleed into the service worker…”
“This makes popup.js cleaner by modularizing…”
4. How This Milestone Connects to Future Ones
Example:
“Now that we can detect the active tab’s hostname, the next milestone can safely compare it to third-party request domains.”
5. Next Step Recommendation
Cursor must include:
“If you'd like, we can now continue with Milestone X+1.”

6. Styling:
The goal for your styling is to create a clean, intuitive, and highly refined user experience by adhering to Apple's core design philosophy of Clarity, Deference, and Depth. This involves designing a minimalist, content-first interface that uses abundant white space, legible system typography (SF Pro), and a deliberate color palette to ensure clarity and focus. The interface should be subtle and avoid ornamentation, utilizing natural animations, precise visual hierarchy, and subtle layering effects (like translucency and soft shadows) to provide a sense of spatial awareness and depth. Crucially, the design must be consistent, using standard iOS interaction patterns and predictable behaviors to make the app feel effortless, professional, and seamlessly integrated into the Apple ecosystem. Following the Apple Developer Human Interface Guidelines will ensure a polished result.

🧩 Milestone 1 — Base Extension Setup
Goal:
Create the folder structure and minimal files needed for Chrome to load PrivacyLens.
Requirements:
Cursor must create:
/PrivacyLens
  docs/privacylens_prd.md, _milestone_template.md
  manifest.json
  popup.html
  popup.js
  background.js
  trackers.json
  /icons/icon48.png
Constraints:
Use Tailwind via CDN in popup.html
Keep popup clean and minimal
Manifest must use Manifest V3

Postcondition:
Take note of the "Global Rule (Applies to ALL Milestones)" within this document
After implementing, Cursor must produce:
docs/review/milestone_1_update.md

🧩 Milestone 2 — Detect Current Tab & Display URL

precondition: 
for any styling take note of number 6 under the "Global Rule (Applies to ALL Milestones)" found in this file 

Goal:
Popup shows the current tab’s URL.
Requirements:
popup.js requests current tab info
background.js handles the message
popup displays:
“Scanning: https://example.com”


Postcondition:

Take note of the "Global Rule (Applies to ALL Milestones)" within this document
After implementing, Cursor must produce:
docs/review/milestone_2_update.md

🧩 Milestone 3 — Capture Third-Party Network Requests

precondition: 
for any styling take note of number 6 under the "Global Rule (Applies to ALL Milestones)"

Goal:
Track all outgoing network requests and identify which ones are third-party.
Requirements:
background.js listens to chrome.webRequest.onBeforeRequest
Extract domain from request
Compare to site domain
Save results to chrome.storage.local
popup.js retrieves and displays counts

Postcondition:
Take note of the "Global Rule (Applies to ALL Milestones)" within this document
After implementing, Cursor must produce:
docs/review/milestone_3_update.md

🧩 Milestone 4 — Cookie Detection

precondition: 
for any styling take note of number 6 under the "Global Rule (Applies to ALL Milestones)"

Goal:
List cookies associated with the current domain.
Requirements:
Use chrome.cookies.getAll({ domain })
Store cookie metadata (name, domain, expiration, etc.)
Display cookie count in popup

Postcondition:
Take note of the "Global Rule (Applies to ALL Milestones)" within this document
After implementing, Cursor must produce:
docs/review/milestone_4_update.md

🧩 Milestone 5 — Basic Tracker Identification

precondition: 
for any styling take note of number 6 under the "Global Rule (Applies to ALL Milestones)"

Goal:
Match detected third-party domains against trackers.json.
Requirements:
trackers.json example:
{
  "google-analytics.com": "Analytics",
  "doubleclick.net": "Advertising",
  "facebook.com": "Social Tracking"
}
Popup must show:
Number of known trackers
Category (Analytics, Ads, Social, etc.)

Postcondition:
Take note of the "Global Rule (Applies to ALL Milestones)" within this document
After implementing, Cursor must produce:
docs/review/milestone_5_update.md

🧩 Milestone 6 — AI-Powered Privacy Policy Analysis

precondition: 
for any styling take note of number 6 under the "Global Rule (Applies to ALL Milestones)"

Goal:
Use Hugging Face AI to analyze privacy policies and terms of service, identifying what data is collected, shared, and any risky behaviors.

Requirements:
1. Privacy Policy Detection:
   - Attempt to find privacy policy/terms pages using common paths:
     /privacy, /privacy-policy, /privacy-policy.html
     /terms, /terms-of-service, /tos
   - Also search for links in page footer containing "privacy" or "terms"
   - Fallback: try current domain + common paths

2. Text Extraction:
   - Create content.js to inject into privacy policy pages
   - Extract main content text (remove navigation, headers, footers)
   - Clean and prepare text for API (limit to reasonable length, ~4000 tokens)

3. Hugging Face API Integration:
   - Use Hugging Face Inference API (free tier: https://huggingface.co/inference-api)
   - Recommended model: "facebook/bart-large-cnn" or similar for text analysis
   - Create policyAnalyzer.js utility in background script
   - API call must include:
     - Text to analyze
     - Custom prompt asking to identify:
       * Types of data collected
       * Third-party sharing practices
       * User rights and controls
       * Any concerning or risky clauses
   - Handle API errors gracefully (rate limits, network issues)

4. Display Results in Popup:
   - Add "Analyze Privacy Policy" button in popup.html
   - Show loading state while analyzing
   - Display results in expandable sections:
     * "Data Collected" - list of data types
     * "Third-Party Sharing" - who data is shared with
     * "Risky Behaviors" - concerning clauses highlighted
     * "User Rights" - what users can control
   - Show disclaimer: "Analysis powered by Hugging Face AI. Policy text is sent to external service."

5. Manifest Updates:
   - Add "host_permissions" for ["<all_urls>"] to fetch privacy policies
   - Add "content_scripts" to inject content.js into pages
   - Note: Hugging Face API requires API key (user must add their own free key)

6. Error Handling:
   - If privacy policy not found → show message
   - If API fails → show fallback message
   - If text too long → truncate intelligently
   - Cache results in chrome.storage.local to avoid repeated API calls

Postcondition:
Take note of the "Global Rule (Applies to ALL Milestones)" within this document
After implementing, Cursor must produce:
docs/review/milestone_6_update.md

🧩 Milestone 7 — Visual Risk Indicator
precondition: 
for any styling take note of number 6 under the "Global Rule (Applies to ALL Milestones)"

Goal:
Display a color-coded risk indicator using Tailwind.
Risk Logic:
Low Risk (Green)
< 3 third-party domains
0 known trackers
Medium Risk (Yellow)
3–10 third-party domains
1–3 known trackers
High Risk (Red)
10 third-party domains
3 known trackers
UI Requirements:
Popup must include a visual badge using Tailwind:
Green: bg-green-500
Yellow: bg-yellow-500
Red: bg-red-600
Example component:
<div id="riskBadge" class="w-full text-center py-2 rounded-lg text-white text-lg font-semibold"></div>

Postcondition:
Take note of the "Global Rule (Applies to ALL Milestones)" within this document
After implementing, Cursor must produce:
docs/review/milestone_7_update.md

🧩 Milestone 8 — Policy Claim Comparison (Simple Version)

precondition: 
for any styling take note of number 6 under the "Global Rule (Applies to ALL Milestones)"

Goal:
Fetch and scan the site’s privacy policy for basic claim patterns.
Requirements:
Attempt to fetch /privacy or /policy
Look for keywords:
“share”
“third party”
“analytics”
“collect”
If policy claims “no sharing” but trackers exist → show warning

Postcondition:
Take note of the "Global Rule (Applies to ALL Milestones)" within this document
After implementing, Cursor must produce:
docs/review/milestone_8_update.md

🧩 Milestone 9 — Educational Panel

precondition: 
for any styling take note of number 6 under the "Global Rule (Applies to ALL Milestones)"

Goal:
Add an expandable section in popup.html explaining:
What a tracker is
What cookies do
What a risk score means
Simple, plain-language, no more than 50–60 words each.

Postcondition:
Take note of the "Global Rule (Applies to ALL Milestones)" within this document
After implementing, Cursor must produce:
docs/review/milestone_9_update.md

🧩 Milestone 10 — Local-Only Data Storage

precondition: 
for any styling take note of number 6 under the "Global Rule (Applies to ALL Milestones)"

Goal:
Guarantee user safety by enforcing local-only analysis.
Requirements:
Cursor must confirm:
No external servers
No cloud APIs
No telemetry
Only chrome.storage.local is used
And add a small disclaimer in the popup:
“PrivacyLens analyzes your data locally. Nothing is stored or sent elsewhere.”

Postcondition:
Take note of the "Global Rule (Applies to ALL Milestones)" within this document
After implementing, Cursor must produce:
docs/review/milestone_10_update.md

🧩 Milestone 11 — Code Cleanup + Optimization

precondition: 
for any styling take note of number 6 under the "Global Rule (Applies to ALL Milestones)"

Goal:
Ensure the extension is:
Organized
Readable
Modular
Free of unused code
Cursor must:
Remove unused listeners
Consolidate utilities
Document each function with short comments

Postcondition:
Take note of the "Global Rule (Applies to ALL Milestones)" within this document
After implementing, Cursor must produce:
docs/review/milestone_11_update.md