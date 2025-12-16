# PrivacyLens

A Chrome extension that helps you understand where your data actually goes when you visit a website. Instead of assuming all data collection is bad, PrivacyLens gives you clarity on what data is being collected, why it's being collected, and whether a site's actions match what it claims.

## What It Does

PrivacyLens monitors websites you visit and shows you:
- **Third-party requests** - Which domains are receiving data from the site
- **Cookies** - How many cookies the site is using
- **Known trackers** - Analytics and advertising services detected
- **Threat detection** - Malicious domains, crypto mining, form hijacking, and data exfiltration
- **Privacy policy comparison** - Whether a site's privacy policy matches its actual behavior
- **Data collection breakdown** - What types of data are being collected and where it's going

All analysis happens locally on your device. Nothing is stored or sent elsewhere.

## Prerequisites

- Google Chrome browser (or any Chromium-based browser)
- A text editor (VS Code, Sublime, etc.)
- Basic familiarity with Chrome extensions (helpful but not required)

## Installation

### Step 1: Download the Project

Clone or download this repository to your computer. If you're using git:

```bash
git clone <repository-url>
cd privacyLens
```

### Step 2: Configure API Keys (Optional)

PrivacyLens uses a few external services that require API keys. These are optional, but some features won't work without them.

1. Open the `config.js` file in the project root
2. Add your API keys:

```javascript
const CONFIG = {
  // Get your free API key at: https://huggingface.co/settings/tokens
  HUGGING_FACE_API_KEY: 'your-api-key-here'
};
```

**Note:** The `config.js` file is already in `.gitignore`, so your API keys won't be committed to version control.

**What each API key does:**
- **Hugging Face API Key**: Used for AI-powered privacy policy analysis (optional, user-initiated feature)
- **Abuse.ch URLhaus**: No API key needed - it's a free public API for malicious domain detection

### Step 3: Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
   - You can also get there via: Menu (three dots) → Extensions → Manage Extensions
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **"Load unpacked"**
4. Select the `privacyLens` folder (the one containing `manifest.json`)
5. The extension should now appear in your extensions list!

### Step 4: Pin the Extension (Recommended)

1. Click the puzzle piece icon in Chrome's toolbar
2. Find PrivacyLens in the list
3. Click the pin icon to keep it visible in your toolbar

## Usage

### Basic Usage

1. Visit any website
2. Click the PrivacyLens icon in your toolbar
3. The popup will show you:
   - Current risk level (green/orange/red)
   - Third-party requests count
   - Cookies count
   - Known trackers detected
   - Threat information
   - Data collection breakdown

### In-Page Badge

When you visit a site, a small badge appears in the top-right corner after 4 seconds:
- Shows the current risk level
- Updates in real-time as threats are detected
- Automatically fades away after 5 seconds

### Privacy Policy Analysis

1. Open the PrivacyLens popup
2. Click **"Analyze Privacy Policy"** (requires Hugging Face API key)
3. The extension will fetch and analyze the site's privacy policy
4. Results show what data is collected, third-party sharing, user rights, and risky behaviors

## Project Structure

```
privacyLens/
├── manifest.json          # Extension configuration
├── background.js          # Service worker (handles detection logic)
├── content.js             # Injected into web pages (monitors forms, displays badge)
├── popup.html             # Extension popup UI
├── popup.js               # Popup logic and data display
├── popup.css              # Styling for popup and in-page badge
├── config.js              # API keys configuration (not in git)
├── trackers.json          # Database of known tracking domains
├── icons/                 # Extension icons
└── docs/                  # Documentation (PRD, milestone updates, etc.)
```

## How It Works

PrivacyLens uses three core technologies:

1. **Chrome Message Passing API** - Different parts of the extension communicate through messages
2. **Event Listeners** - Monitors network requests, form submissions, and page activity
3. **Chrome Storage API** - Stores detected data locally on your device

Everything else is just manipulating the information gathered from these core mechanisms.

## Features

### Detection Systems

- **Third-Party Request Tracking**: Monitors all network requests to identify data sharing
- **Cookie Detection**: Counts and categorizes cookies set by the site
- **Tracker Identification**: Matches requests against a database of known trackers
- **Malicious Domain Detection**: Checks domains against Abuse.ch URLhaus database
- **Crypto Mining Detection**: Detects cryptocurrency mining scripts
- **Form Hijacking Detection**: Monitors forms submitting to third-party domains
- **Data Exfiltration Detection**: Identifies sensitive data being sent to third parties

### Threat Scoring

PrivacyLens uses a weighted scoring system:
- Malicious domain: 50 points
- Crypto mining: 40 points
- Form hijacking: 35 points
- Data exfiltration: 30 points
- Known trackers: 10 points each
- Regular third-party requests: 1 point each

Risk levels:
- **Low Risk (Green)**: 0-20 points
- **Medium Risk (Orange)**: 21-50 points
- **High Risk (Red)**: 51+ points

## Troubleshooting

### Extension Not Loading

- Make sure you're in Developer mode
- Check that you selected the correct folder (the one with `manifest.json`)
- Look at the error messages in `chrome://extensions/` for details

### API Key Not Working

- Verify your API key is correct in `config.js`
- Make sure there are no extra spaces or quotes around the key
- For Hugging Face, check that your API key has the right permissions

### Badge Not Appearing

- Wait at least 4 seconds after page load
- Check the browser console for errors (F12 → Console tab)
- Some sites may block content script injection

### Data Not Updating

- Refresh the page
- Close and reopen the popup
- Check that the extension has the necessary permissions

## Privacy & Security

PrivacyLens is designed with privacy in mind:
- All data analysis happens locally on your device
- No user data is sent to external servers (except optional threat intelligence lookups)
- API keys are stored locally and never shared
- The extension only uses legitimate Chrome APIs

## Development

### Making Changes

1. Edit the relevant files (e.g., `popup.js`, `background.js`)
2. Go to `chrome://extensions/`
3. Click the refresh icon on the PrivacyLens extension card
4. Test your changes

### Debugging

- **Popup**: Right-click the extension icon → "Inspect popup"
- **Background Script**: Go to `chrome://extensions/` → PrivacyLens → "Service worker" (click to open DevTools)
- **Content Script**: Use the regular browser DevTools (F12) on any webpage

## Contributing

Feel free to submit issues or pull requests! Some areas that could use improvement:
- Expanding the tracker database
- Improving domain extraction for edge cases
- Adding more threat detection methods
- UI/UX improvements

## License

This project is open source. Use it, modify it, learn from it!

## Support

If you run into issues or have questions:
1. Check the troubleshooting section above
2. Look at the browser console for error messages
3. Review the documentation in the `docs/` folder

---

**Remember**: PrivacyLens helps you understand what's happening with your data, but it's up to you to decide how to respond. Knowledge is power!

