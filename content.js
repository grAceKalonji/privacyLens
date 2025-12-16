/**
 * PrivacyLens Content Script
 * 
 * Injected into web pages to:
 * - Extract text content from privacy policy pages
 * - Display in-page risk badge
 * - Monitor form submissions for hijacking
 * - Detect crypto mining scripts
 */

// Listen for messages from background script
if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage && typeof chrome.runtime.onMessage.addListener === "function") {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractText') {
      const text = extractMainContent();
      sendResponse({ text: text });
    } else if (request.action === 'updateRiskBadge') {
      updateRiskBadge(request.riskData);
      sendResponse({ success: true });
    }
    return true;
  });
}

// Crypto Mining Detection
// Monitor Web Worker creation for mining patterns
const originalWorker = window.Worker;
window.Worker = function(...args) {
  const worker = new originalWorker(...args);
  
  // Check if worker script contains mining patterns
  if (args[0] && typeof args[0] === 'string') {
    const scriptUrl = args[0].toLowerCase();
    const miningPatterns = ['coinhive', 'cryptonight', 'miner', 'mining', 'hasher', 'webassembly'];
    
    if (miningPatterns.some(pattern => scriptUrl.includes(pattern))) {
      // Notify background script
      chrome.runtime.sendMessage({
        action: 'cryptoMiningDetected',
        url: window.location.href
      });
    }
  }
  
  return worker;
};

// Monitor for known mining script patterns in page
function detectCryptoMiningScripts() {
  const scripts = document.querySelectorAll('script[src]');
  const miningPatterns = ['coinhive', 'cryptoloot', 'miner', 'mining', 'webmine'];
  
  for (const script of scripts) {
    const src = script.src.toLowerCase();
    if (miningPatterns.some(pattern => src.includes(pattern))) {
      chrome.runtime.sendMessage({
        action: 'cryptoMiningDetected',
        url: window.location.href
      });
      break;
    }
  }
}

// Run detection when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', detectCryptoMiningScripts);
} else {
  detectCryptoMiningScripts();
}

// Form Hijacking Detection

// Monitor form submissions
function monitorFormSubmissions() {
  // Get current site domain
  const siteDomain = window.location.hostname;
  
  // Intercept form submissions
  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (form.tagName === 'FORM') {
      const formAction = form.action || form.getAttribute('action') || window.location.href;
      const formMethod = (form.method || 'GET').toUpperCase();
      
      // Extract form action domain
      let actionDomain = null;
      try {
        if (formAction.startsWith('http://') || formAction.startsWith('https://')) {
          actionDomain = new URL(formAction).hostname;
        } else if (formAction.startsWith('//')) {
          actionDomain = new URL('https:' + formAction).hostname;
        } else {
          // Relative URL, use current domain
          actionDomain = siteDomain;
        }
      } catch (e) {
        actionDomain = siteDomain;
      }
      
      // Check if form submits to third-party domain
      if (actionDomain && actionDomain !== siteDomain && !actionDomain.endsWith('.' + siteDomain)) {
        // Extract root domains for comparison
        const siteRoot = extractRootDomain(siteDomain);
        const actionRoot = extractRootDomain(actionDomain);
        
        if (siteRoot !== actionRoot) {
          // Form is submitting to third party - potential hijacking
          
          // Identify sensitive fields
          const sensitiveFields = [];
          const inputs = form.querySelectorAll('input, textarea, select');
          
          for (const input of inputs) {
            const type = (input.type || '').toLowerCase();
            const name = (input.name || '').toLowerCase();
            const id = (input.id || '').toLowerCase();
            
            if (type === 'password' || name.includes('password') || id.includes('password')) {
              sensitiveFields.push('password');
            } else if (type === 'email' || name.includes('email') || id.includes('email')) {
              sensitiveFields.push('email');
            } else if (type === 'tel' || name.includes('phone') || id.includes('phone')) {
              sensitiveFields.push('phone');
            } else if (name.includes('card') || id.includes('card') || 
                       name.includes('credit') || id.includes('credit') ||
                       name.includes('cvv') || id.includes('cvv')) {
              sensitiveFields.push('credit_card');
            }
          }
          
          // Notify background script
          chrome.runtime.sendMessage({
            action: 'formHijackingDetected',
            siteDomain: siteDomain,
            formData: {
              domain: actionDomain,
              sensitiveFields: [...new Set(sensitiveFields)], // Remove duplicates
              timestamp: Date.now()
            }
          });
        }
      }
    }
  }, true); // Use capture phase to catch early
}

/**
 * Extract root domain from hostname (duplicate of background.js version)
 * Note: Content scripts run in isolated context, so we need this here
 * @param {string} hostname - Full hostname
 * @returns {string|null} - Root domain or null
 */
function extractRootDomain(hostname) {
  if (!hostname) return null;
  if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return hostname;
  }
  const parts = hostname.split('.');
  if (parts.length >= 2) {
    return parts.slice(-2).join('.');
  }
  return hostname;
}

// Initialize form monitoring
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', monitorFormSubmissions);
} else {
  monitorFormSubmissions();
}

// Also monitor dynamically added forms
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.tagName === 'FORM' || (node.querySelector && node.querySelector('form'))) {
        // Form added to page, monitoring is already set up via event delegation
      }
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

/**
 * Extract main content text from page (removes navigation, headers, footers)
 * @returns {string} - Clean text content
 */
function extractMainContent() {
  // Try to find main content area
  const mainSelectors = [
    'main',
    'article',
    '[role="main"]',
    '.main-content',
    '.content',
    '#content',
    '#main',
    'body'
  ];
  
  let mainElement = null;
  for (const selector of mainSelectors) {
    mainElement = document.querySelector(selector);
    if (mainElement) break;
  }
  
  if (!mainElement) {
    mainElement = document.body;
  }
  
  // Remove script and style elements
  const scripts = mainElement.querySelectorAll('script, style, nav, header, footer, aside');
  scripts.forEach(el => el.remove());
  
  // Get text content
  let text = mainElement.innerText || mainElement.textContent || '';
  
  // Clean up text
  text = text
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/\n\s*\n/g, '\n') // Remove empty lines
    .trim();
  
  // Limit to approximately 4000 tokens (roughly 3000 words or 16000 characters)
  // Hugging Face models typically use ~4 chars per token
  const maxLength = 16000;
  if (text.length > maxLength) {
    text = text.substring(0, maxLength) + '...';
  }
  
  return text;
}

// Risk Badge UI
let riskBadgeElement = null;
let riskBadgeTimeout = null;
let dataGatheringTimeout = null;

// Initialize risk badge after page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeRiskBadge);
} else {
  initializeRiskBadge();
}

function initializeRiskBadge() {
  // Wait 4 seconds to gather data, then show badge
  dataGatheringTimeout = setTimeout(() => {
    createRiskBadge();
    requestRiskUpdate();
    
    // Set up periodic updates
    const updateInterval = setInterval(() => {
      requestRiskUpdate();
    }, 1000);
    
    // Show badge for 5 seconds, then fade out
    riskBadgeTimeout = setTimeout(() => {
      fadeOutBadge();
      clearInterval(updateInterval);
    }, 5000);
  }, 4000);
}

function createRiskBadge() {
  // Remove existing badge if any
  if (riskBadgeElement) {
    riskBadgeElement.remove();
  }
  
  // Create badge container
  riskBadgeElement = document.createElement('div');
  riskBadgeElement.id = 'privacyLensRiskBadge';
  riskBadgeElement.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    width: 58px;
    height: 58px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 999999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 6px;
    box-sizing: border-box;
    opacity: 0;
    transition: opacity 0.3s ease-in;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;
  
  // Create progress bar container
  const progressContainer = document.createElement('div');
  progressContainer.style.cssText = `
    width: 100%;
    height: 32px;
    background: #e5e7eb;
    border-radius: 16px;
    overflow: hidden;
    position: relative;
    margin-bottom: 4px;
  `;
  
  // Create progress bar fill
  const progressFill = document.createElement('div');
  progressFill.id = 'privacyLensProgressFill';
  progressFill.style.cssText = `
    width: 0%;
    height: 100%;
    background: #6b7280;
    border-radius: 16px;
    transition: width 0.3s ease-out, background-color 0.3s ease-out;
  `;
  
  // Create label
  const label = document.createElement('div');
  label.id = 'privacyLensRiskLabel';
  label.style.cssText = `
    font-size: 9px;
    font-weight: 600;
    color: #374151;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `;
  label.textContent = '...';
  
  progressContainer.appendChild(progressFill);
  riskBadgeElement.appendChild(progressContainer);
  riskBadgeElement.appendChild(label);
  
  document.body.appendChild(riskBadgeElement);
  
  // Fade in
  setTimeout(() => {
    riskBadgeElement.style.opacity = '1';
  }, 10);
}

function requestRiskUpdate() {
  // Get current tab URL
  const currentUrl = window.location.href;
  
  // Request risk data from background script
  chrome.runtime.sendMessage({
    action: 'getRiskLevelForBadge',
    url: currentUrl
  }, (response) => {
    if (response && response.riskData) {
      updateRiskBadge(response.riskData);
    }
  });
}

function updateRiskBadge(riskData) {
  if (!riskBadgeElement) return;
  
  const progressFill = document.getElementById('privacyLensProgressFill');
  const label = document.getElementById('privacyLensRiskLabel');
  
  if (!progressFill || !label) return;
  
  // Determine color and progress percentage based on threat score
  let color, progressPercent, labelText;
  const threatScore = riskData.threatScore || 0;
  
  if (riskData.level === 'low' || threatScore <= 20) {
    color = '#22c55e'; // Green
    // 0-20 score maps to 0-33% of progress bar
    progressPercent = Math.min(33, (threatScore / 20) * 33);
    labelText = 'Low';
  } else if (riskData.level === 'medium' || (threatScore >= 21 && threatScore <= 50)) {
    color = '#f97316'; // Orange
    // 21-50 score maps to 33-66% of progress bar
    const scoreInRange = threatScore - 21; // 0-29
    progressPercent = 33 + Math.min(33, (scoreInRange / 29) * 33);
    labelText = 'Med';
  } else if (riskData.level === 'high' || threatScore >= 51) {
    color = '#dc2626'; // Red
    // 51+ score maps to 66-100% of progress bar
    // Cap at 100 for very high scores
    const scoreInRange = Math.min(threatScore - 51, 50); // Cap at 50 points above threshold
    progressPercent = 66 + Math.min(34, (scoreInRange / 50) * 34);
    labelText = 'High';
  } else {
    color = '#6b7280'; // Gray
    progressPercent = 0;
    labelText = '...';
  }
  
  // Update progress bar
  progressFill.style.width = `${Math.min(100, progressPercent)}%`;
  progressFill.style.backgroundColor = color;
  
  // Update label
  label.textContent = labelText;
  label.style.color = color;
}

function fadeOutBadge() {
  if (riskBadgeElement) {
    riskBadgeElement.style.opacity = '0';
    riskBadgeElement.style.transition = 'opacity 0.5s ease-out';
    
    setTimeout(() => {
      if (riskBadgeElement && riskBadgeElement.parentNode) {
        riskBadgeElement.remove();
        riskBadgeElement = null;
      }
    }, 500);
  }
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (dataGatheringTimeout) clearTimeout(dataGatheringTimeout);
  if (riskBadgeTimeout) clearTimeout(riskBadgeTimeout);
  if (riskBadgeElement) {
    riskBadgeElement.remove();
  }
});

