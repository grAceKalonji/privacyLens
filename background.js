// PrivacyLens Background Service Worker
// Handles extension lifecycle and message passing

// Service worker initialization
console.log('PrivacyLens background service worker loaded');

// Track current tab domain for third-party detection
let currentTabDomain = null;

// Load tracker database
let trackerDatabase = null;

// Load trackers.json on startup
loadTrackerDatabase();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getCurrentTab') {
    // Get the currently active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length > 0) {
        const currentTab = tabs[0];
        const domain = extractDomain(currentTab.url);
        currentTabDomain = domain;
        
        // Clear previous requests for this domain
        clearDomainRequests(domain);
        
        sendResponse({ 
          url: currentTab.url,
          title: currentTab.title,
          domain: domain
        });
      } else {
        sendResponse({ error: 'No active tab found' });
      }
    });
    
    // Return true to indicate we will send a response asynchronously
    return true;
  } else if (request.action === 'getThirdPartyCount') {
    // Get count of third-party requests for current domain
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs && tabs.length > 0) {
        const domain = extractDomain(tabs[0].url);
        const count = await getThirdPartyCount(domain);
        sendResponse({ count: count });
      } else {
        sendResponse({ count: 0 });
      }
    });
    return true;
  } else if (request.action === 'getCookies') {
    // Get cookies for current domain
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs && tabs.length > 0) {
        const domain = extractDomain(tabs[0].url);
        const cookies = await getCookiesForDomain(domain);
        sendResponse({ cookies: cookies, count: cookies.length });
      } else {
        sendResponse({ cookies: [], count: 0 });
      }
    });
    return true;
  } else if (request.action === 'getTrackers') {
    // Get detected trackers for current domain
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs && tabs.length > 0) {
        const domain = extractDomain(tabs[0].url);
        const trackers = await getDetectedTrackers(domain);
        sendResponse({ trackers: trackers });
      } else {
        sendResponse({ trackers: [] });
      }
    });
    return true;
  } else if (request.action === 'analyzePrivacyPolicy') {
    // Analyze privacy policy using AI
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs && tabs.length > 0) {
        const result = await analyzePrivacyPolicy(tabs[0]);
        sendResponse(result);
      } else {
        sendResponse({ error: 'No active tab found' });
      }
    });
    return true;
  } else if (request.action === 'getRiskLevel') {
    // Get risk level for current domain
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs && tabs.length > 0) {
        const domain = extractDomain(tabs[0].url);
        const riskLevel = await calculateRiskLevel(domain);
        sendResponse({ riskLevel: riskLevel });
      } else {
        sendResponse({ riskLevel: { level: 'unknown', color: 'gray', label: 'Unknown' } });
      }
    });
    return true;
  } else if (request.action === 'getRiskLevelForBadge') {
    // Get risk level for content script badge (by URL)
    (async () => {
      if (request.url) {
        const domain = extractDomain(request.url);
        const riskLevel = await calculateRiskLevel(domain);
        sendResponse({ riskData: riskLevel });
      } else {
        sendResponse({ riskData: { level: 'unknown', color: 'gray', label: 'Unknown', thirdPartyCount: 0, trackerCount: 0 } });
      }
    })();
    return true;
  }
});

// Extract domain from URL
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return null;
  }
}

// Extract root domain (e.g., "example.com" from "subdomain.example.com")
function extractRootDomain(hostname) {
  if (!hostname) return null;
  
  // Handle localhost and IP addresses
  if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return hostname;
  }
  
  const parts = hostname.split('.');
  // For most cases, take last two parts (e.g., example.com)
  // For .co.uk, .com.au, etc., we'd need more logic, but keeping it simple for now
  if (parts.length >= 2) {
    return parts.slice(-2).join('.');
  }
  return hostname;
}

// Check if a request is third-party
function isThirdParty(requestUrl, siteDomain) {
  if (!requestUrl || !siteDomain) return false;
  
  try {
    const requestDomain = extractDomain(requestUrl);
    if (!requestDomain) return false;
    
    // Same domain is not third-party
    if (requestDomain === siteDomain) return false;
    
    // Check root domain (e.g., subdomain.example.com vs example.com)
    const requestRoot = extractRootDomain(requestDomain);
    const siteRoot = extractRootDomain(siteDomain);
    
    // If root domains match, it's first-party
    if (requestRoot === siteRoot) return false;
    
    // Everything else is third-party
    return true;
  } catch (e) {
    return false;
  }
}

// Store third-party request
async function storeThirdPartyRequest(domain, requestUrl) {
  const key = `thirdPartyRequests_${domain}`;
  const result = await chrome.storage.local.get([key]);
  let requests = result[key] || [];
  
  // Extract request domain
  const requestDomain = extractDomain(requestUrl);
  
  // Add to set if not already present (avoid duplicates)
  if (requestDomain && !requests.includes(requestDomain)) {
    requests.push(requestDomain);
    await chrome.storage.local.set({ [key]: requests });
  }
}

// Get count of third-party requests for a domain
async function getThirdPartyCount(domain) {
  const key = `thirdPartyRequests_${domain}`;
  const result = await chrome.storage.local.get([key]);
  const requests = result[key] || [];
  return requests.length;
}

// Clear requests for a domain (when switching tabs)
async function clearDomainRequests(domain) {
  const key = `thirdPartyRequests_${domain}`;
  await chrome.storage.local.set({ [key]: [] });
}

// Get cookies for a domain
async function getCookiesForDomain(domain) {
  if (!domain) return [];
  
  try {
    // Chrome's cookies.getAll with domain parameter matches cookies that:
    // - Have the exact domain specified
    // - Have a domain that ends with the specified domain (for subdomains)
    // So passing "example.com" will get cookies for example.com and *.example.com
    
    // Get all cookies for this domain (includes subdomains)
    const cookies = await chrome.cookies.getAll({ domain: domain });
    
    // Filter to only include cookies that belong to this domain or its subdomains
    // This ensures we don't get unrelated cookies
    const rootDomain = extractRootDomain(domain);
    const filteredCookies = cookies.filter(cookie => {
      const cookieDomain = cookie.domain.startsWith('.') 
        ? cookie.domain.slice(1) 
        : cookie.domain;
      const cookieRoot = extractRootDomain(cookieDomain);
      
      // Include if root domains match
      return cookieRoot === rootDomain || cookieDomain === domain;
    });
    
    // Store cookie metadata
    await storeCookieMetadata(domain, filteredCookies);
    
    return filteredCookies;
  } catch (error) {
    console.error('Error getting cookies:', error);
    return [];
  }
}

// Store cookie metadata
async function storeCookieMetadata(domain, cookies) {
  const key = `cookies_${domain}`;
  const metadata = cookies.map(cookie => ({
    name: cookie.name,
    domain: cookie.domain,
    path: cookie.path,
    secure: cookie.secure,
    httpOnly: cookie.httpOnly,
    sameSite: cookie.sameSite,
    expirationDate: cookie.expirationDate,
    session: cookie.session || (cookie.expirationDate === undefined)
  }));
  
  await chrome.storage.local.set({ [key]: metadata });
}

// Load tracker database from trackers.json
async function loadTrackerDatabase() {
  try {
    // Try to load trackers.json
    const url = chrome.runtime.getURL('trackers.json');
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to load trackers.json: ${response.status}`);
    }
    
    trackerDatabase = await response.json();
    console.log('Tracker database loaded:', Object.keys(trackerDatabase).length, 'trackers');
  } catch (error) {
    console.error('Error loading tracker database:', error);
    // Fallback to empty database
    trackerDatabase = {};
  }
}

// Check if a domain is a known tracker
function isKnownTracker(domain) {
  if (!trackerDatabase || !domain) return null;
  
  // Direct match
  if (trackerDatabase[domain]) {
    return {
      domain: domain,
      category: trackerDatabase[domain]
    };
  }
  
  // Check subdomain matches (e.g., www.google-analytics.com matches google-analytics.com)
  const parts = domain.split('.');
  for (let i = 0; i < parts.length; i++) {
    const subdomain = parts.slice(i).join('.');
    if (trackerDatabase[subdomain]) {
      return {
        domain: domain,
        category: trackerDatabase[subdomain],
        matchedDomain: subdomain
      };
    }
  }
  
  return null;
}

// Get detected trackers for a domain
async function getDetectedTrackers(domain) {
  if (!domain) return [];
  
  // Get third-party requests for this domain
  const key = `thirdPartyRequests_${domain}`;
  const result = await chrome.storage.local.get([key]);
  const thirdPartyDomains = result[key] || [];
  
  // Match against tracker database
  const trackers = [];
  const seen = new Set(); // Avoid duplicates
  
  for (const requestDomain of thirdPartyDomains) {
    if (seen.has(requestDomain)) continue;
    
    const trackerInfo = isKnownTracker(requestDomain);
    if (trackerInfo) {
      trackers.push({
        domain: requestDomain,
        category: trackerInfo.category
      });
      seen.add(requestDomain);
    }
  }
  
  // Group by category
  const byCategory = {};
  for (const tracker of trackers) {
    if (!byCategory[tracker.category]) {
      byCategory[tracker.category] = [];
    }
    byCategory[tracker.category].push(tracker.domain);
  }
  
  return {
    total: trackers.length,
    trackers: trackers,
    byCategory: byCategory
  };
}

// Calculate risk level based on third-party requests and trackers
async function calculateRiskLevel(domain) {
  if (!domain) {
    return { level: 'unknown', color: 'gray', label: 'Unknown' };
  }
  
  // Get third-party request count
  const thirdPartyCount = await getThirdPartyCount(domain);
  
  // Get tracker count
  const trackers = await getDetectedTrackers(domain);
  const trackerCount = trackers.total || 0;
  
  // Risk logic:
  // Low Risk (Green): < 3 third-party domains AND 0 known trackers
  // Medium Risk (Yellow): 3-10 third-party domains OR 1-3 known trackers
  // High Risk (Red): >= 10 third-party domains OR >= 3 known trackers
  
  let riskLevel, color, label;
  
  if (thirdPartyCount < 3 && trackerCount === 0) {
    // Low Risk
    riskLevel = 'low';
    color = 'green';
    label = 'Low Risk';
  } else if (thirdPartyCount >= 10 || trackerCount >= 3) {
    // High Risk
    riskLevel = 'high';
    color = 'red';
    label = 'High Risk';
  } else if ((thirdPartyCount >= 3 && thirdPartyCount < 10) || (trackerCount >= 1 && trackerCount < 3)) {
    // Medium Risk
    riskLevel = 'medium';
    color = 'yellow';
    label = 'Medium Risk';
  } else {
    // Default to medium if we can't determine
    riskLevel = 'medium';
    color = 'yellow';
    label = 'Medium Risk';
  }
  
  return {
    level: riskLevel,
    color: color,
    label: label,
    thirdPartyCount: thirdPartyCount,
    trackerCount: trackerCount
  };
}

// Listen to all network requests
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    // Only process http/https requests
    if (!details.url.startsWith('http://') && !details.url.startsWith('https://')) {
      return;
    }
    
    // Get the tab that made this request
    if (details.tabId && details.tabId > 0) {
      chrome.tabs.get(details.tabId, (tab) => {
        if (tab && tab.url) {
          const siteDomain = extractDomain(tab.url);
          if (siteDomain && isThirdParty(details.url, siteDomain)) {
            storeThirdPartyRequest(siteDomain, details.url);
          }
        }
      });
    }
  },
  { urls: ["<all_urls>"] },
  []
);

// Privacy Policy Analysis Functions

// Find privacy policy URL
async function findPrivacyPolicyUrl(tab) {
  const baseUrl = tab.url;
  const urlObj = new URL(baseUrl);
  const baseDomain = `${urlObj.protocol}//${urlObj.host}`;
  
  // Common privacy policy paths
  const commonPaths = [
    '/privacy',
    '/privacy-policy',
    '/privacy-policy.html',
    '/privacy.html',
    '/privacy-policy/',
    '/terms',
    '/terms-of-service',
    '/tos',
    '/terms.html',
    '/terms-of-service.html'
  ];
  
  // Try common paths
  for (const path of commonPaths) {
    try {
      const testUrl = baseDomain + path;
      const response = await fetch(testUrl, { method: 'HEAD' });
      if (response.ok) {
        return testUrl;
      }
    } catch (e) {
      // Continue to next path
    }
  }
  
  // Try to find privacy policy link in current page
  try {
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: findPrivacyLink
    });
    
    if (result && result[0] && result[0].result) {
      const link = result[0].result;
      if (link.startsWith('http')) {
        return link;
      } else if (link.startsWith('/')) {
        return baseDomain + link;
      } else {
        return baseDomain + '/' + link;
      }
    }
  } catch (e) {
    console.error('Error finding privacy link:', e);
  }
  
  return null;
}

// Function to find privacy policy link (runs in page context)
function findPrivacyLink() {
  const links = document.querySelectorAll('a[href*="privacy"], a[href*="Privacy"], a[href*="terms"], a[href*="Terms"]');
  for (const link of links) {
    const href = link.getAttribute('href');
    const text = link.textContent.toLowerCase();
    if (text.includes('privacy') || text.includes('terms')) {
      return href;
    }
  }
  return null;
}

// Extract text from privacy policy page
async function extractPolicyText(policyUrl, tabId) {
  try {
    // Navigate to policy page if needed (or inject script)
    const result = await chrome.tabs.sendMessage(tabId, { action: 'extractText' });
    if (result && result.text) {
      return result.text;
    }
  } catch (e) {
    console.error('Error extracting text:', e);
  }
  
  // Fallback: try fetching the page
  try {
    const response = await fetch(policyUrl);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extract text similar to content script
    const main = doc.querySelector('main, article, [role="main"], .content, #content, body');
    if (main) {
      return main.innerText || main.textContent || '';
    }
  } catch (e) {
    console.error('Error fetching policy:', e);
  }
  
  return null;
}

// Analyze privacy policy using Hugging Face API
async function analyzePrivacyPolicy(tab) {
  const domain = extractDomain(tab.url);
  const cacheKey = `policyAnalysis_${domain}`;
  
  // Check cache first
  const cached = await chrome.storage.local.get([cacheKey]);
  if (cached[cacheKey]) {
    return { ...cached[cacheKey], cached: true };
  }
  
  try {
    // Find privacy policy URL
    const policyUrl = await findPrivacyPolicyUrl(tab);
    if (!policyUrl) {
      return { error: 'Privacy policy not found. Tried common paths and page links.' };
    }
    
    // Extract text from policy page
    // First, try to navigate to the policy page or inject content script
    let policyText = null;
    
    // Try to get text from content script if we're on the policy page
    if (tab.url === policyUrl || tab.url.startsWith(policyUrl.split('?')[0])) {
      try {
        const result = await chrome.tabs.sendMessage(tab.id, { action: 'extractText' });
        policyText = result?.text;
      } catch (e) {
        // Content script might not be ready, continue to fetch
      }
    }
    
    // If we don't have text yet, try to navigate to the page and use content script
    if (!policyText) {
      try {
        // Try to inject content script into the policy page
        // First, navigate to the page if needed
        if (tab.url !== policyUrl) {
          // We can't navigate from service worker, so we'll need to ask user
          // For now, try to fetch and do basic text extraction
          const response = await fetch(policyUrl);
          const html = await response.text();
          
          // Basic text extraction using regex (no DOM in service worker)
          // Remove script and style tags
          let cleanHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
          cleanHtml = cleanHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
          cleanHtml = cleanHtml.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
          cleanHtml = cleanHtml.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
          cleanHtml = cleanHtml.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
          
          // Extract text from HTML tags
          policyText = cleanHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          
          // Limit length
          const maxLength = 16000;
          if (policyText.length > maxLength) {
            policyText = policyText.substring(0, maxLength) + '...';
          }
        } else {
          // We're already on the policy page, try content script again
          try {
            const result = await chrome.tabs.sendMessage(tab.id, { action: 'extractText' });
            policyText = result?.text;
          } catch (e) {
            // Content script might not be ready
          }
        }
      } catch (e) {
        return { error: 'Failed to fetch privacy policy page.' };
      }
    }
    
    if (!policyText || policyText.length < 100) {
      return { error: 'Could not extract sufficient text from privacy policy.' };
    }
    
    // Call Hugging Face API
    const analysis = await callHuggingFaceAPI(policyText);
    
    // Cache the result
    const result = {
      policyUrl: policyUrl,
      analysis: analysis,
      timestamp: Date.now()
    };
    await chrome.storage.local.set({ [cacheKey]: result });
    
    return result;
  } catch (error) {
    console.error('Error analyzing privacy policy:', error);
    return { error: 'Failed to analyze privacy policy: ' + error.message };
  }
}

// Call Hugging Face Inference API
async function callHuggingFaceAPI(text) {
  // Get API key from config.js or storage (config.js takes priority)
  let apiKey = null;
  
  // Try to get from config.js first (imported at top of file)
  try {
    // config.js is loaded as a module, so we access it via import
    // For service workers, we'll use a different approach
    const configResponse = await fetch(chrome.runtime.getURL('config.js'));
    const configText = await configResponse.text();
    // Extract API key from config file (simple regex extraction)
    // Handles both single and double quotes, and trims whitespace
    const keyMatch = configText.match(/HUGGING_FACE_API_KEY:\s*['"]([^'"]+)['"]/);
    if (keyMatch && keyMatch[1] && keyMatch[1].trim() !== '') {
      apiKey = keyMatch[1].trim();
    }
  } catch (e) {
    console.log('Could not load config.js, trying storage...');
  }
  
  // Fallback to storage if config.js doesn't have a key
  if (!apiKey) {
    const settings = await chrome.storage.local.get(['huggingFaceApiKey']);
    apiKey = settings.huggingFaceApiKey;
  }
  
  if (!apiKey || apiKey.trim() === '') {
    // Return fallback analysis using keyword extraction
    return {
      dataCollected: extractDataTypes(text),
      thirdPartySharing: extractThirdPartySharing(text),
      userRights: extractUserRights(text),
      riskyBehaviors: extractRiskyBehaviors(text),
      note: 'Hugging Face API key not configured. Edit config.js and add your API key for AI-powered analysis. Get your free key at: https://huggingface.co/settings/tokens'
    };
  }
  
  // Create prompt for analysis
  const prompt = `Analyze this privacy policy and identify:
1. Types of data collected (e.g., name, email, location, browsing history)
2. Third-party sharing practices (who data is shared with)
3. User rights and controls (what users can do with their data)
4. Any concerning or risky clauses (e.g., broad data sharing, limited user control)

Privacy Policy Text:
${text}

Provide a structured analysis in JSON format with these sections: dataCollected, thirdPartySharing, userRights, riskyBehaviors.`;

  try {
    // Use a text generation model for analysis
    // Using "microsoft/DialoGPT-medium" or similar - but for better results, use a model that supports instruction following
    const model = "microsoft/DialoGPT-medium"; // Fallback model
    
    // Try using a better model for text analysis - using Hugging Face Inference API
    const response = await fetch(
      `https://api-inference.huggingface.co/models/facebook/bart-large-cnn`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: text.substring(0, 1024), // BART has token limits
          parameters: {
            max_length: 200,
            min_length: 50
          }
        })
      }
    );
    
    if (!response.ok) {
      if (response.status === 503) {
        return { error: 'Hugging Face API is currently unavailable. Please try again later.' };
      } else if (response.status === 401) {
        return { error: 'Invalid API key. Please check your Hugging Face API key.' };
      } else {
        return { error: `API error: ${response.status} ${response.statusText}` };
      }
    }
    
    const data = await response.json();
    
    // For now, return a simple analysis structure
    // In a production version, you'd parse the model output more intelligently
    return {
      summary: data[0]?.summary_text || 'Analysis completed',
      dataCollected: extractDataTypes(text),
      thirdPartySharing: extractThirdPartySharing(text),
      userRights: extractUserRights(text),
      riskyBehaviors: extractRiskyBehaviors(text)
    };
  } catch (error) {
    console.error('Hugging Face API error:', error);
    return { error: 'Failed to call Hugging Face API: ' + error.message };
  }
}

// Helper functions to extract information from text (fallback if API fails)
function extractDataTypes(text) {
  const keywords = {
    'Personal Information': ['name', 'email', 'address', 'phone', 'date of birth'],
    'Browsing Data': ['cookies', 'browsing history', 'clickstream', 'page views'],
    'Location Data': ['location', 'gps', 'ip address', 'geolocation'],
    'Device Information': ['device', 'browser', 'operating system', 'hardware'],
    'Usage Data': ['usage', 'interactions', 'preferences', 'behavior']
  };
  
  const found = [];
  for (const [category, terms] of Object.entries(keywords)) {
    if (terms.some(term => text.toLowerCase().includes(term))) {
      found.push(category);
    }
  }
  return found.length > 0 ? found : ['Various data types'];
}

function extractThirdPartySharing(text) {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('third party') || lowerText.includes('third-party')) {
    return ['Data may be shared with third parties'];
  }
  return ['Not clearly specified'];
}

function extractUserRights(text) {
  const lowerText = text.toLowerCase();
  const rights = [];
  if (lowerText.includes('opt out') || lowerText.includes('opt-out')) rights.push('Opt-out available');
  if (lowerText.includes('delete') || lowerText.includes('remove')) rights.push('Data deletion');
  if (lowerText.includes('access') || lowerText.includes('request')) rights.push('Data access');
  return rights.length > 0 ? rights : ['Limited information provided'];
}

function extractRiskyBehaviors(text) {
  const lowerText = text.toLowerCase();
  const risks = [];
  if (lowerText.includes('sell') && lowerText.includes('data')) risks.push('Data may be sold');
  if (lowerText.includes('no opt') || lowerText.includes('cannot opt')) risks.push('Limited opt-out options');
  if (lowerText.includes('broad') && lowerText.includes('share')) risks.push('Broad data sharing');
  return risks.length > 0 ? risks : ['No obvious red flags detected'];
}

