// PrivacyLens Content Script
// Extracts text content from privacy policy pages and displays risk badge

// Listen for messages from background script
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

// Extract main content from page
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
  
  // Determine color and progress percentage
  let color, progressPercent, labelText;
  
  if (riskData.level === 'low') {
    color = '#22c55e'; // Green
    progressPercent = Math.min(33, (riskData.thirdPartyCount / 3) * 33);
    labelText = 'Low';
  } else if (riskData.level === 'medium') {
    color = '#f97316'; // Orange
    progressPercent = 33 + Math.min(33, ((riskData.thirdPartyCount - 3) / 7) * 33);
    labelText = 'Med';
  } else if (riskData.level === 'high') {
    color = '#dc2626'; // Red
    progressPercent = 66 + Math.min(34, ((riskData.thirdPartyCount - 10) / 20) * 34);
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

