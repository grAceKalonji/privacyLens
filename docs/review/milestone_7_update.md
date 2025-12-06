# PrivacyLens – Milestone 7 Update
*(Generated automatically by Cursor)*

---

## ✅ Summary of What Changed
- Files created:
  - `docs/review/milestone_7_update.md` - This documentation file
- Files modified:
  - `background.js` - Added risk level calculation function and message handler for risk level requests
  - `popup.js` - Added functions to retrieve and display risk level badge with periodic updates
  - `popup.html` - Added risk badge element at the top of the popup
  - `popup.css` - Added green-500, yellow-500, red-600, and gray-500 color utilities for risk badge
- Key logic added:
  - Risk calculation algorithm based on third-party request count and tracker count
  - Risk level determination (Low/Medium/High)
  - Dynamic color coding for risk badge
  - Real-time risk level updates
- UI or styling updates:
  - Prominent risk badge displayed at the top of popup
  - Color-coded risk indicator (Green/Yellow/Red)
  - Large, bold text for visibility
  - Periodic refresh of risk level while popup is open

---

## 🧠 New Methods or APIs Introduced

### 1. calculateRiskLevel() Function
**What it does:**  
This function calculates the privacy risk level for a given domain based on two metrics:
1. Number of third-party domains detected
2. Number of known trackers detected

It returns an object with the risk level ('low', 'medium', 'high'), color code ('green', 'yellow', 'red'), label text ('Low Risk', 'Medium Risk', 'High Risk'), and the underlying counts.

**Why we used it:**  
This is the core logic that synthesizes all the tracking data we've collected into a single, easy-to-understand risk score. Instead of users having to interpret multiple numbers (third-party requests, trackers, cookies), they get one clear indicator. The function uses the risk logic specified in the PRD to determine the appropriate level.

### 2. Risk Level Calculation Logic
**What it does:**  
The risk calculation follows these rules:
- **Low Risk (Green)**: Less than 3 third-party domains AND 0 known trackers
- **Medium Risk (Yellow)**: 3-10 third-party domains OR 1-3 known trackers
- **High Risk (Red)**: 10+ third-party domains OR 3+ known trackers

The logic uses OR conditions for medium/high risk, meaning if either condition is met, the higher risk level applies.

**Why we used it:**  
This logic balances sensitivity - we want to flag sites with many trackers or many third-party requests, but we don't want to alarm users about sites that have minimal tracking. The thresholds (3, 10 for requests; 0, 1, 3 for trackers) are reasonable starting points that can be adjusted based on user feedback.

### 3. Dynamic Risk Badge Display
**What it does:**  
The risk badge is a prominent visual element at the top of the popup that displays the current risk level. It updates its color and text based on the calculated risk level. The badge uses large, bold white text on a colored background for maximum visibility.

**Why we used it:**  
Visual indicators are much faster to process than reading numbers. A user can glance at the badge and immediately understand the privacy risk. The placement at the top ensures it's the first thing users see when they open the popup. The color coding (green/yellow/red) follows universal conventions for risk levels.

### 4. Real-Time Risk Updates
**What it does:**  
The risk level is recalculated and displayed every second while the popup is open, just like the other metrics. This ensures the risk badge reflects the current state as new third-party requests are detected.

**Why we used it:**  
Privacy risk can change as a page loads. A site might start with low risk but quickly accumulate third-party requests and trackers. By updating in real-time, users get an accurate picture of the current risk, not just what it was when they first opened the popup.

---

## 🧩 How This Milestone Fits the Bigger Picture

The risk indicator is the culmination of all the detection work we've done. It takes:
- Third-party request tracking (Milestone 3)
- Tracker identification (Milestone 5)

And synthesizes them into a single, actionable metric. This makes PrivacyLens immediately useful - users don't need to understand the technical details, they just need to see the risk level.

In future milestones:
- The risk level can be used to prioritize which sites need policy analysis (Milestone 8)
- Educational content can explain what each risk level means (Milestone 9)
- The risk calculation can be refined based on additional factors (cookie count, policy analysis results, etc.)

---

## 💡 Notes, Tradeoffs, or Design Considerations

**Risk Calculation Simplicity:**  
The current risk calculation is intentionally simple - it only considers third-party request count and tracker count. We're not factoring in:
- Cookie count (could indicate more tracking)
- Cookie types (session vs persistent)
- Policy analysis results (what the policy claims)
- Historical data (how the site behaved previously)

This simplicity makes the risk level easy to understand and calculate, but it could be enhanced in the future. For example, a site with 2 trackers but 50 cookies might be riskier than a site with 3 trackers but 5 cookies.

**Threshold Values:**  
The thresholds (3, 10 for requests; 0, 1, 3 for trackers) are somewhat arbitrary. They're based on reasonable assumptions about what constitutes low/medium/high risk, but they haven't been validated against real-world data. In a production version, we might want to:
- Make thresholds configurable
- Use machine learning to determine optimal thresholds
- Adjust based on user feedback

**OR vs AND Logic:**  
The medium and high risk levels use OR conditions, meaning if either metric exceeds the threshold, the risk level increases. This is intentionally conservative - we'd rather flag a site as risky than miss a privacy concern. However, this means a site with 10 third-party requests but 0 trackers would still be "High Risk", which might be debatable.

**Color Accessibility:**  
The risk badge uses color as the primary indicator (green/yellow/red). For colorblind users, the text label ("Low Risk", "Medium Risk", "High Risk") provides the information, but we might want to add additional visual cues (icons, patterns) in the future.

**Performance:**  
The risk calculation happens every second while the popup is open. It requires:
- Reading from storage (third-party requests)
- Matching against tracker database
- Calculating risk level

This is fast (just a few milliseconds), but if we add more complex calculations in the future, we might want to debounce or cache the risk level.

**Default State:**  
When the popup first opens, the risk badge shows "Calculating..." with a gray background. This provides immediate feedback that the extension is working, even before data is available. Once the risk level is calculated, it updates to show the actual level.

---

## 🚀 Recommended Next Step  
> Now that Milestone 7 is complete, I recommend proceeding to Milestone 8, which will add policy claim comparison to check if detected trackers match what the privacy policy claims.

---

