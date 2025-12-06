// PrivacyLens Popup Script
// Handles UI interactions and displays scan results

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('PrivacyLens popup loaded');
  
  // Request current tab URL from background script
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getCurrentTab' });
    
    if (response && response.url) {
      displayCurrentUrl(response.url);
      // Load and display third-party request count
      await loadThirdPartyCount();
      // Load and display cookie count
      await loadCookieCount();
      // Load and display tracker information
      await loadTrackers();
      // Load and display risk level
      await loadRiskLevel();
    } else {
      displayError('Unable to detect current tab');
    }
  } catch (error) {
    console.error('Error getting current tab:', error);
    displayError('Error loading tab information');
  }
  
  // Refresh count periodically while popup is open
  setInterval(async () => {
    await loadThirdPartyCount();
    await loadCookieCount();
    await loadTrackers();
    await loadRiskLevel();
  }, 1000); // Update every second
  
  // Set up analyze button
  const analyzeButton = document.getElementById('analyzePolicyButton');
  if (analyzeButton) {
    analyzeButton.addEventListener('click', analyzePrivacyPolicy);
  }
});

// Display the current URL in the popup
function displayCurrentUrl(url) {
  const urlDisplay = document.getElementById('urlDisplay');
  if (urlDisplay) {
    urlDisplay.textContent = `Scanning: ${url}`;
  }
}

// Load and display third-party request count
async function loadThirdPartyCount() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getThirdPartyCount' });
    if (response && response.count !== undefined) {
      displayThirdPartyCount(response.count);
    }
  } catch (error) {
    console.error('Error getting third-party count:', error);
  }
}

// Display third-party request count
function displayThirdPartyCount(count) {
  const countDisplay = document.getElementById('thirdPartyCount');
  if (countDisplay) {
    countDisplay.textContent = `Third-party requests: ${count}`;
  }
}

// Load and display cookie count
async function loadCookieCount() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getCookies' });
    if (response && response.count !== undefined) {
      displayCookieCount(response.count);
    }
  } catch (error) {
    console.error('Error getting cookie count:', error);
  }
}

// Display cookie count
function displayCookieCount(count) {
  const countDisplay = document.getElementById('cookieCount');
  if (countDisplay) {
    countDisplay.textContent = `Cookies: ${count}`;
  }
}

// Load and display tracker information
async function loadTrackers() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getTrackers' });
    if (response && response.trackers) {
      displayTrackers(response.trackers);
    }
  } catch (error) {
    console.error('Error getting trackers:', error);
  }
}

// Display tracker information
function displayTrackers(trackerData) {
  const trackerDisplay = document.getElementById('trackerCount');
  const trackerCategories = document.getElementById('trackerCategories');
  
  if (trackerDisplay) {
    const count = trackerData.total || 0;
    trackerDisplay.textContent = `Known trackers: ${count}`;
  }
  
  if (trackerCategories && trackerData.byCategory) {
    const categories = Object.keys(trackerData.byCategory);
    if (categories.length > 0) {
      const categoryText = categories.map(cat => {
        const count = trackerData.byCategory[cat].length;
        return `${cat} (${count})`;
      }).join(', ');
      trackerCategories.textContent = categoryText;
      trackerCategories.style.display = 'block';
    } else {
      trackerCategories.style.display = 'none';
    }
  }
}

// Load and display risk level
async function loadRiskLevel() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getRiskLevel' });
    if (response && response.riskLevel) {
      displayRiskLevel(response.riskLevel);
    }
  } catch (error) {
    console.error('Error getting risk level:', error);
  }
}

// Display risk level badge
function displayRiskLevel(riskData) {
  const riskBadge = document.getElementById('riskBadge');
  if (!riskBadge) return;
  
  // Update text
  riskBadge.textContent = riskData.label || 'Unknown';
  
  // Update color classes
  riskBadge.className = 'w-full text-center py-2 rounded-lg text-white text-lg font-semibold';
  
  // Add color based on risk level
  if (riskData.color === 'green') {
    riskBadge.classList.add('bg-green-500');
  } else if (riskData.color === 'yellow') {
    riskBadge.classList.add('bg-yellow-500');
  } else if (riskData.color === 'red') {
    riskBadge.classList.add('bg-red-600');
  } else {
    riskBadge.classList.add('bg-gray-500');
  }
}

// Analyze privacy policy
async function analyzePrivacyPolicy() {
  const analyzeButton = document.getElementById('analyzePolicyButton');
  const analysisResults = document.getElementById('analysisResults');
  const analysisLoading = document.getElementById('analysisLoading');
  const analysisError = document.getElementById('analysisError');
  
  // Show loading state
  if (analyzeButton) {
    analyzeButton.disabled = true;
    analyzeButton.textContent = 'Analyzing...';
  }
  if (analysisLoading) {
    analysisLoading.style.display = 'block';
  }
  if (analysisResults) {
    analysisResults.style.display = 'none';
  }
  if (analysisError) {
    analysisError.style.display = 'none';
  }
  
  try {
    const response = await chrome.runtime.sendMessage({ action: 'analyzePrivacyPolicy' });
    
    // Hide loading
    if (analysisLoading) {
      analysisLoading.style.display = 'none';
    }
    
    if (response.error) {
      // Show error
      if (analysisError) {
        analysisError.textContent = response.error;
        analysisError.style.display = 'block';
      }
    } else if (response.analysis) {
      // Display results
      displayAnalysisResults(response);
      if (analysisResults) {
        analysisResults.style.display = 'block';
      }
    }
  } catch (error) {
    console.error('Error analyzing privacy policy:', error);
    if (analysisError) {
      analysisError.textContent = 'Failed to analyze privacy policy. Please try again.';
      analysisError.style.display = 'block';
    }
    if (analysisLoading) {
      analysisLoading.style.display = 'none';
    }
  } finally {
    // Reset button
    if (analyzeButton) {
      analyzeButton.disabled = false;
      analyzeButton.textContent = 'Analyze Privacy Policy';
    }
  }
}

// Display analysis results
function displayAnalysisResults(response) {
  const analysis = response.analysis || {};
  
  // Data Collected
  const dataCollectedEl = document.getElementById('dataCollected');
  if (dataCollectedEl && analysis.dataCollected) {
    const items = Array.isArray(analysis.dataCollected) 
      ? analysis.dataCollected 
      : [analysis.dataCollected];
    dataCollectedEl.innerHTML = items.map(item => `<li>${item}</li>`).join('');
  }
  
  // Third-Party Sharing
  const thirdPartyEl = document.getElementById('thirdPartySharing');
  if (thirdPartyEl && analysis.thirdPartySharing) {
    const items = Array.isArray(analysis.thirdPartySharing) 
      ? analysis.thirdPartySharing 
      : [analysis.thirdPartySharing];
    thirdPartyEl.innerHTML = items.map(item => `<li>${item}</li>`).join('');
  }
  
  // User Rights
  const userRightsEl = document.getElementById('userRights');
  if (userRightsEl && analysis.userRights) {
    const items = Array.isArray(analysis.userRights) 
      ? analysis.userRights 
      : [analysis.userRights];
    userRightsEl.innerHTML = items.map(item => `<li>${item}</li>`).join('');
  }
  
  // Risky Behaviors
  const riskyBehaviorsEl = document.getElementById('riskyBehaviors');
  if (riskyBehaviorsEl && analysis.riskyBehaviors) {
    const items = Array.isArray(analysis.riskyBehaviors) 
      ? analysis.riskyBehaviors 
      : [analysis.riskyBehaviors];
    riskyBehaviorsEl.innerHTML = items.map(item => `<li class="text-red-600">${item}</li>`).join('');
  }
  
  // Show cached indicator if applicable
  if (response.cached) {
    const cachedIndicator = document.getElementById('cachedIndicator');
    if (cachedIndicator) {
      cachedIndicator.style.display = 'block';
    }
  }
}

// Display error message
function displayError(message) {
  const urlDisplay = document.getElementById('urlDisplay');
  if (urlDisplay) {
    urlDisplay.textContent = message;
    urlDisplay.classList.add('text-red-600');
  }
}

